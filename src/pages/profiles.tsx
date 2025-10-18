import {
  closestCenter,
  DndContext,
  DragEndEvent,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";
import {
  AddRounded,
  ClearRounded,
  ContentPasteRounded,
  LocalFireDepartmentRounded,
  RefreshRounded,
  TextSnippetOutlined,
  CheckBoxOutlineBlankRounded,
  CheckBoxRounded,
  IndeterminateCheckBoxRounded,
  DeleteRounded,
} from "@mui/icons-material";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  TextField,
  Tooltip,
  Typography,
  alpha,
} from "@mui/material";
import { listen, TauriEvent } from "@tauri-apps/api/event";
import { readText } from "@tauri-apps/plugin-clipboard-manager";
import { readTextFile } from "@tauri-apps/plugin-fs";
import { useLockFn } from "ahooks";
import { throttle } from "lodash-es";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useLocation } from "react-router-dom";
import useSWR, { mutate } from "swr";
import { closeAllConnections } from "tauri-plugin-mihomo-api";

import { BasePage, DialogRef } from "@/components/base";
import { ProfileItem } from "@/components/profile/profile-item";
import { ProfileMore } from "@/components/profile/profile-more";
import {
  ProfileViewer,
  ProfileViewerRef,
} from "@/components/profile/profile-viewer";
import { ProfileGroupManager } from "@/components/profile/profile-group-manager";
import { ConfigViewer } from "@/components/setting/mods/config-viewer";
import { useListen } from "@/hooks/use-listen";
import { useProfiles } from "@/hooks/use-profiles";
import {
  createProfile,
  deleteProfile,
  enhanceProfiles,
  //restartCore,
  getRuntimeLogs,
  importProfile,
  reorderProfile,
  updateProfile,
} from "@/services/cmds";
import { showNotice } from "@/services/noticeService";
import { useSetLoadingCache } from "@/services/states";

// 记录profile切换状态
const debugProfileSwitch = (action: string, profile: string, extra?: unknown) => {
  const timestamp = new Date().toISOString().substring(11, 23);
  console.log(
    `[Profile-Debug][${timestamp}] ${action}: ${profile}`,
    extra || "",
  );
};

// 检查请求是否已过期
const isRequestOutdated = (
  currentSequence: number,
  requestSequenceRef: React.MutableRefObject<number>,
  profile: string,
) => {
  if (currentSequence !== requestSequenceRef.current) {
    debugProfileSwitch(
      "REQUEST_OUTDATED",
      profile,
      `当前序列号: ${currentSequence}, 最新序列号: ${requestSequenceRef.current}`,
    );
    return true;
  }
  return false;
};

// 检查是否被中断
const isOperationAborted = (
  abortController: AbortController,
  profile: string,
) => {
  if (abortController.signal.aborted) {
    debugProfileSwitch("OPERATION_ABORTED", profile);
    return true;
  }
  return false;
};

const normalizeProfileUrl = (value?: string) => {
  if (!value) return "";
  const trimmed = value.trim();

  try {
    const url = new URL(trimmed);
    const auth =
      url.username || url.password
        ? `${url.username}${url.password ? `:${url.password}` : ""}@`
        : "";
    const normalized =
      `${url.protocol.toLowerCase()}//${auth}${url.hostname.toLowerCase()}` +
      `${url.port ? `:${url.port}` : ""}${url.pathname}${url.search}${url.hash}`;

    return normalized.replace(/\/+$/, "");
  } catch {
    const schemeNormalized = trimmed.replace(
      /^([a-z]+):\/\//i,
      (match, scheme: string) => `${scheme.toLowerCase()}://`,
    );
    return schemeNormalized.replace(/\/+$/, "");
  }
};

const getProfileSignature = (profile?: IProfileItem | null) => {
  if (!profile) return "";
  const { extra, selected, option, name, desc } = profile;
  return JSON.stringify({
    extra: extra ?? null,
    selected: selected ?? null,
    option: option ?? null,
    name: name ?? null,
    desc: desc ?? null,
  });
};

type ImportLandingVerifier = {
  baselineCount: number;
  hasLanding: (config?: IProfilesConfig | null) => boolean;
};

const createImportLandingVerifier = (
  items: IProfileItem[] | undefined,
  url: string,
): ImportLandingVerifier => {
  const normalizedUrl = normalizeProfileUrl(url);
  const baselineCount = items?.length ?? 0;
  const baselineProfile = normalizedUrl
    ? items?.find((item) => normalizeProfileUrl(item?.url) === normalizedUrl)
    : undefined;
  const baselineSignature = getProfileSignature(baselineProfile);
  const baselineUpdated = baselineProfile?.updated ?? 0;
  const hadBaselineProfile = Boolean(baselineProfile);

  const hasLanding = (config?: IProfilesConfig | null) => {
    const currentItems = config?.items ?? [];
    const currentCount = currentItems.length;

    if (currentCount > baselineCount) {
      console.log(
        `[导入验证] 配置数量已增加: ${baselineCount} -> ${currentCount}`,
      );
      return true;
    }

    if (!normalizedUrl) {
      return false;
    }

    const matchingProfile = currentItems.find(
      (item) => normalizeProfileUrl(item?.url) === normalizedUrl,
    );

    if (!matchingProfile) {
      return false;
    }

    if (!hadBaselineProfile) {
      console.log("[导入验证] 检测到新的订阅记录，判定为导入成功");
      return true;
    }

    const currentSignature = getProfileSignature(matchingProfile);
    const currentUpdated = matchingProfile.updated ?? 0;

    if (currentUpdated > baselineUpdated) {
      console.log(
        `[导入验证] 订阅更新时间已更新 ${baselineUpdated} -> ${currentUpdated}`,
      );
      return true;
    }

    if (currentSignature !== baselineSignature) {
      console.log("[导入验证] 订阅详情发生变化，判定为导入成功");
      return true;
    }

    return false;
  };

  return {
    baselineCount,
    hasLanding,
  };
};

const ProfilePage = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const { addListener } = useListen();
  const [activatings, setActivatings] = useState<string[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);

  // Import state
  const [importUrl, setImportUrl] = useState("");
  const [importLoading, setImportLoading] = useState(false);

  // Batch selection states
  const [batchMode, setBatchMode] = useState(false);
  const [selectedProfiles, setSelectedProfiles] = useState<Set<string>>(
    () => new Set(),
  );

  // 防止重复切换
  const switchingProfileRef = useRef<string | null>(null);

  // 支持中断当前切换操作
  const abortControllerRef = useRef<AbortController | null>(null);

  // 只处理最新的切换请求
  const requestSequenceRef = useRef<number>(0);

  // 待处理请求跟踪，取消排队的请求
  const pendingRequestRef = useRef<Promise<any> | null>(null);

  // 处理profile切换中断
  const handleProfileInterrupt = useCallback(
    (previousSwitching: string, newProfile: string) => {
      debugProfileSwitch(
        "INTERRUPT_PREVIOUS",
        previousSwitching,
        `被 ${newProfile} 中断`,
      );

      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        debugProfileSwitch("ABORT_CONTROLLER_TRIGGERED", previousSwitching);
      }

      if (pendingRequestRef.current) {
        debugProfileSwitch("CANCEL_PENDING_REQUEST", previousSwitching);
      }

      setActivatings((prev) => prev.filter((id) => id !== previousSwitching));
      showNotice(
        "info",
        `${t("Profile switch interrupted by new selection")}: ${previousSwitching} → ${newProfile}`,
        3000,
      );
    },
    [t],
  );

  // 清理切换状态
  const cleanupSwitchState = useCallback(
    (profile: string, sequence: number) => {
      setActivatings((prev) => prev.filter((id) => id !== profile));
      switchingProfileRef.current = null;
      abortControllerRef.current = null;
      pendingRequestRef.current = null;
      debugProfileSwitch("SWITCH_END", profile, `序列号: ${sequence}`);
    },
    [],
  );
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );
  const { current } = location.state || {};

  const {
    profiles = {},
    activateSelected,
    patchProfiles,
    mutateProfiles,
    error,
    isStale,
  } = useProfiles();

  useEffect(() => {
    const handleFileDrop = async () => {
      const unlisten = await addListener(
        TauriEvent.DRAG_DROP,
        async (event: { payload: { paths: string[] } }) => {
          const paths = event.payload.paths;

          for (const file of paths) {
            if (!file.endsWith(".yaml") && !file.endsWith(".yml")) {
              showNotice("error", t("Only YAML Files Supported"));
              continue;
            }
            const item = {
              type: "local",
              name: file.split(/\/|\\/).pop() ?? "New Profile",
              desc: "",
              url: "",
              option: {
                with_proxy: false,
                self_proxy: false,
              },
            } as IProfileItem;
            const data = await readTextFile(file);
            await createProfile(item, data);
            await mutateProfiles();
          }
        },
      );

      return unlisten;
    };

    const unsubscribe = handleFileDrop();

    return () => {
      unsubscribe.then((cleanup) => cleanup());
    };
  }, [addListener, mutateProfiles, t]);

  // 添加紧急恢复功能
  const onEmergencyRefresh = useLockFn(async () => {
    console.log("[紧急刷新] 开始强制刷新所有数据");

    try {
      // 清除所有SWR缓存
      await mutate(() => true, undefined, { revalidate: false });

      // 强制重新获取配置数据
      await mutateProfiles(undefined, {
        revalidate: true,
        rollbackOnError: false,
      });

      // 等待状态稳定后增强配置
      await new Promise((resolve) => setTimeout(resolve, 500));
      await onEnhance(false);

      showNotice("success", "数据已强制刷新", 2000);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error("[紧急刷新] 失败:", error);
      showNotice("error", `紧急刷新失败: ${errorMessage}`, 4000);
    }
  });

  const { data: chainLogs = {}, mutate: mutateLogs } = useSWR(
    "getRuntimeLogs",
    getRuntimeLogs,
  );

  const viewerRef = useRef<ProfileViewerRef>(null);
  const configRef = useRef<DialogRef>(null);

  // distinguish type
  const profileItems = useMemo(() => {
    const items = profiles.items || [];

    const type1 = ["local", "remote"];

    return items.filter((i) => {
      if (!i || !type1.includes(i.type!)) return false;
      if (selectedGroupId === null) return true;
      return i.group_id === selectedGroupId;
    });
  }, [profiles, selectedGroupId]);

  const currentActivatings = () => {
    return [...new Set([profiles.current ?? ""])].filter(Boolean);
  };

  // Import profile function
  const handleImport = useLockFn(async () => {
    if (!importUrl) return;

    // 校验url是否为http/https
    if (!/^https?:\/\//i.test(importUrl)) {
      showNotice("error", t("Invalid Profile URL"));
      return;
    }

    setImportLoading(true);

    try {
      // 尝试正常导入
      await importProfile(importUrl);
      showNotice("success", t("Profile Imported Successfully"));
      setImportUrl("");
      await mutateProfiles();
    } catch (initialErr) {
      console.warn("[订阅导入] 首次导入失败:", initialErr);

      // 首次导入失败，尝试使用自身代理
      showNotice("info", t("Import failed, retrying with Clash proxy..."));
      try {
        await importProfile(importUrl, {
          with_proxy: false,
          self_proxy: true,
        });
        showNotice("success", t("Profile Imported with Clash proxy"));
        setImportUrl("");
        await mutateProfiles();
      } catch (retryErr: any) {
        const retryErrmsg = retryErr?.message || retryErr.toString();
        showNotice(
          "error",
          `${t("Import failed even with Clash proxy")}: ${retryErrmsg}`,
        );
      }
    } finally {
      setImportLoading(false);
    }
  });

  const handlePasteUrl = useLockFn(async () => {
    const text = await readText();
    if (text) setImportUrl(text);
  });

  const onDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (over) {
      if (active.id !== over.id) {
        await reorderProfile(active.id.toString(), over.id.toString());
        mutateProfiles();
      }
    }
  };

  const executeBackgroundTasks = useCallback(
    async (
      profile: string,
      sequence: number,
      abortController: AbortController,
    ) => {
      try {
        if (
          sequence === requestSequenceRef.current &&
          switchingProfileRef.current === profile &&
          !abortController.signal.aborted
        ) {
          await activateSelected();
          console.log(`[Profile] 后台处理完成，序列号: ${sequence}`);
        } else {
          debugProfileSwitch(
            "BACKGROUND_TASK_SKIPPED",
            profile,
            `序列号过期或被中断: ${sequence} vs ${requestSequenceRef.current}`,
          );
        }
      } catch (err: any) {
        console.warn("Failed to activate selected proxies:", err);
      }
    },
    [activateSelected],
  );

  const activateProfile = useCallback(
    async (profile: string, notifySuccess: boolean) => {
      if (profiles.current === profile && !notifySuccess) {
        console.log(
          `[Profile] 目标profile ${profile} 已经是当前配置，跳过切换`,
        );
        return;
      }

      const currentSequence = ++requestSequenceRef.current;
      debugProfileSwitch("NEW_REQUEST", profile, `序列号: ${currentSequence}`);

      // 处理中断逻辑
      const previousSwitching = switchingProfileRef.current;
      if (previousSwitching && previousSwitching !== profile) {
        handleProfileInterrupt(previousSwitching, profile);
      }

      // 防止重复切换同一个profile
      if (switchingProfileRef.current === profile) {
        debugProfileSwitch("DUPLICATE_SWITCH_BLOCKED", profile);
        return;
      }

      // 初始化切换状态
      switchingProfileRef.current = profile;
      debugProfileSwitch("SWITCH_START", profile, `序列号: ${currentSequence}`);

      const currentAbortController = new AbortController();
      abortControllerRef.current = currentAbortController;

      setActivatings((prev) => {
        if (prev.includes(profile)) return prev;
        return [...prev, profile];
      });

      try {
        console.log(
          `[Profile] 开始切换到: ${profile}，序列号: ${currentSequence}`,
        );

        // 检查请求有效性
        if (
          isRequestOutdated(currentSequence, requestSequenceRef, profile) ||
          isOperationAborted(currentAbortController, profile)
        ) {
          return;
        }

        // 执行切换请求
        const requestPromise = patchProfiles(
          { current: profile },
          currentAbortController.signal,
        );
        pendingRequestRef.current = requestPromise;

        const success = await requestPromise;

        if (pendingRequestRef.current === requestPromise) {
          pendingRequestRef.current = null;
        }

        // 再次检查有效性
        if (
          isRequestOutdated(currentSequence, requestSequenceRef, profile) ||
          isOperationAborted(currentAbortController, profile)
        ) {
          return;
        }

        // 完成切换
        await mutateLogs();
        closeAllConnections();

        if (notifySuccess && success) {
          showNotice("success", t("Profile Switched"), 1000);
        }

        console.log(
          `[Profile] 切换到 ${profile} 完成，序列号: ${currentSequence}，开始后台处理`,
        );

        // 延迟执行后台任务
        setTimeout(
          () =>
            executeBackgroundTasks(
              profile,
              currentSequence,
              currentAbortController,
            ),
          50,
        );
      } catch (err: any) {
        if (pendingRequestRef.current) {
          pendingRequestRef.current = null;
        }

        // 检查是否因为中断或过期而出错
        if (
          isOperationAborted(currentAbortController, profile) ||
          isRequestOutdated(currentSequence, requestSequenceRef, profile)
        ) {
          return;
        }

        console.error(`[Profile] 切换失败:`, err);
        showNotice("error", err?.message || err.toString(), 4000);
      } finally {
        // 只有当前profile仍然是正在切换的profile且序列号匹配时才清理状态
        if (
          switchingProfileRef.current === profile &&
          currentSequence === requestSequenceRef.current
        ) {
          cleanupSwitchState(profile, currentSequence);
        } else {
          debugProfileSwitch(
            "CLEANUP_SKIPPED",
            profile,
            `序列号不匹配或已被接管: ${currentSequence} vs ${requestSequenceRef.current}`,
          );
        }
      }
    },
    [
      profiles,
      patchProfiles,
      mutateLogs,
      t,
      executeBackgroundTasks,
      handleProfileInterrupt,
      cleanupSwitchState,
    ],
  );
  const onSelect = async (current: string, force: boolean) => {
    // 阻止重复点击或已激活的profile
    if (switchingProfileRef.current === current) {
      debugProfileSwitch("DUPLICATE_CLICK_IGNORED", current);
      return;
    }

    if (!force && current === profiles.current) {
      debugProfileSwitch("ALREADY_CURRENT_IGNORED", current);
      return;
    }

    await activateProfile(current, true);
  };

  useEffect(() => {
    (async () => {
      if (current) {
        mutateProfiles();
        await activateProfile(current, false);
      }
    })();
  }, [current, activateProfile, mutateProfiles]);

  const onEnhance = useLockFn(async (notifySuccess: boolean) => {
    if (switchingProfileRef.current) {
      console.log(
        `[Profile] 有profile正在切换中(${switchingProfileRef.current})，跳过enhance操作`,
      );
      return;
    }

    const currentProfiles = currentActivatings();
    setActivatings((prev) => [...new Set([...prev, ...currentProfiles])]);

    try {
      await enhanceProfiles();
      mutateLogs();
      if (notifySuccess) {
        showNotice("success", t("Profile Reactivated"), 1000);
      }
    } catch (err: any) {
      showNotice("error", err.message || err.toString(), 3000);
    } finally {
      // 保留正在切换的profile，清除其他状态
      setActivatings((prev) =>
        prev.filter((id) => id === switchingProfileRef.current),
      );
    }
  });

  const onDelete = useLockFn(async (uid: string) => {
    const current = profiles.current === uid;
    try {
      setActivatings([...(current ? currentActivatings() : []), uid]);
      await deleteProfile(uid);
      mutateProfiles();
      mutateLogs();
      if (current) {
        await onEnhance(false);
      }
    } catch (err: any) {
      showNotice("error", err?.message || err.toString());
    } finally {
      setActivatings([]);
    }
  });

  // 更新所有订阅
  const setLoadingCache = useSetLoadingCache();
  const onUpdateAll = useLockFn(async () => {
    const throttleMutate = throttle(mutateProfiles, 2000, {
      trailing: true,
    });
    const updateOne = async (uid: string) => {
      try {
        await updateProfile(uid);
        throttleMutate();
      } catch (err: any) {
        console.error(`更新订阅 ${uid} 失败:`, err);
      } finally {
        setLoadingCache((cache) => ({ ...cache, [uid]: false }));
      }
    };

    return new Promise((resolve) => {
      setLoadingCache((cache) => {
        // 获取没有正在更新的订阅
        const items = profileItems.filter(
          (e) => e.type === "remote" && !cache[e.uid],
        );
        const change = Object.fromEntries(items.map((e) => [e.uid, true]));

        Promise.allSettled(items.map((e) => updateOne(e.uid))).then(resolve);
        return { ...cache, ...change };
      });
    });
  });

  // Batch selection functions
  const [lastSelectedIndex, setLastSelectedIndex] = useState<number>(-1);

  const toggleBatchMode = () => {
    setBatchMode(!batchMode);
    if (!batchMode) {
      // Entering batch mode - clear previous selections
      setSelectedProfiles(new Set());
      setLastSelectedIndex(-1);
    }
  };

  const toggleProfileSelection = (uid: string, event?: React.MouseEvent) => {
    const currentIndex = profileItems.findIndex((item) => item.uid === uid);
    
    // Shift 键范围多选
    if (event?.shiftKey && lastSelectedIndex !== -1 && currentIndex !== -1) {
      const start = Math.min(lastSelectedIndex, currentIndex);
      const end = Math.max(lastSelectedIndex, currentIndex);
      const rangeUids = profileItems.slice(start, end + 1).map((item) => item.uid);
      
      setSelectedProfiles((prev) => {
        const newSet = new Set(prev);
        rangeUids.forEach((id) => newSet.add(id));
        return newSet;
      });
    } 
    // Ctrl/Cmd 键单个切换
    else if (event?.ctrlKey || event?.metaKey) {
      setSelectedProfiles((prev) => {
        const newSet = new Set(prev);
        if (newSet.has(uid)) {
          newSet.delete(uid);
        } else {
          newSet.add(uid);
        }
        return newSet;
      });
    }
    // 普通点击：切换单个
    else {
      setSelectedProfiles((prev) => {
        const newSet = new Set(prev);
        if (newSet.has(uid)) {
          newSet.delete(uid);
        } else {
          newSet.add(uid);
        }
        return newSet;
      });
    }
    
    setLastSelectedIndex(currentIndex);
  };

  const selectAllProfiles = () => {
    setSelectedProfiles(new Set(profileItems.map((item) => item.uid)));
  };

  const clearAllSelections = () => {
    setSelectedProfiles(new Set());
  };

  const isAllSelected = () => {
    return (
      profileItems.length > 0 && profileItems.length === selectedProfiles.size
    );
  };

  const getSelectionState = () => {
    if (selectedProfiles.size === 0) {
      return "none"; // 无选择
    } else if (selectedProfiles.size === profileItems.length) {
      return "all"; // 全选
    } else {
      return "partial"; // 部分选择
    }
  };

  const deleteSelectedProfiles = useLockFn(async () => {
    if (selectedProfiles.size === 0) return;

    try {
      // Get all currently activating profiles
      const currentActivating =
        profiles.current && selectedProfiles.has(profiles.current)
          ? [profiles.current]
          : [];

      setActivatings((prev) => [...new Set([...prev, ...currentActivating])]);

      // Delete all selected profiles
      for (const uid of selectedProfiles) {
        await deleteProfile(uid);
      }

      await mutateProfiles();
      await mutateLogs();

      // If any deleted profile was current, enhance profiles
      if (currentActivating.length > 0) {
        await onEnhance(false);
      }

      // Clear selections and exit batch mode
      setSelectedProfiles(new Set());
      setBatchMode(false);

      showNotice("success", t("Selected profiles deleted successfully"));
    } catch (err: any) {
      showNotice("error", err?.message || err.toString());
    } finally {
      setActivatings([]);
    }
  });

  // 监听后端配置变更
  useEffect(() => {
    let unlistenPromise: Promise<() => void> | undefined;
    let lastProfileId: string | null = null;
    let lastUpdateTime = 0;
    const debounceDelay = 200;

    let refreshTimer: number | null = null;

    const setupListener = async () => {
      unlistenPromise = listen<string>("profile-changed", (event) => {
        const newProfileId = event.payload;
        const now = Date.now();

        console.log(`[Profile] 收到配置变更事件: ${newProfileId}`);

        if (
          lastProfileId === newProfileId &&
          now - lastUpdateTime < debounceDelay
        ) {
          console.log(`[Profile] 重复事件被防抖，跳过`);
          return;
        }

        lastProfileId = newProfileId;
        lastUpdateTime = now;

        console.log(`[Profile] 执行配置数据刷新`);

        if (refreshTimer !== null) {
          window.clearTimeout(refreshTimer);
        }

        // 使用异步调度避免阻塞事件处理
        refreshTimer = window.setTimeout(() => {
          mutateProfiles().catch((error) => {
            console.error("[Profile] 配置数据刷新失败:", error);
          });
          refreshTimer = null;
        }, 0);
      });
    };

    setupListener();

    return () => {
      if (refreshTimer !== null) {
        window.clearTimeout(refreshTimer);
      }
      unlistenPromise
        ?.then((unlisten) => unlisten())
        .catch((error) => {
          console.error("[Profile] Failed to unlisten profile change event:", error);
        });
    };
  }, [mutateProfiles]);

  // 组件卸载时清理中断控制器
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        debugProfileSwitch("COMPONENT_UNMOUNT_CLEANUP", "all");
      }
    };
  }, []);

  return (
    <BasePage
      full
      title={t("Profiles")}
      contentStyle={{ height: "100%", padding: 0 }}
      header={
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          {!batchMode ? (
            <>
              {/* 操作按钮组 - 统一风格 */}
              <Typography
                sx={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: "text.disabled",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                }}
              >
                ACTIONS
              </Typography>

              <Box sx={{ display: "flex", gap: 0.75 }}>
                <Tooltip title={t("New")} arrow>
                  <IconButton
                    size="small"
                    onClick={() => viewerRef.current?.create()}
                    sx={{
                      width: 28,
                      height: 28,
                      "&:hover": { bgcolor: "action.hover" },
                    }}
                  >
                    <TextSnippetOutlined sx={{ fontSize: 18 }} />
                  </IconButton>
                </Tooltip>

                <Tooltip title={t("Batch Operations")} arrow>
                  <IconButton
                    size="small"
                    onClick={toggleBatchMode}
                    sx={{
                      width: 28,
                      height: 28,
                      "&:hover": { bgcolor: "action.hover" },
                    }}
                  >
                    <CheckBoxOutlineBlankRounded sx={{ fontSize: 18 }} />
                  </IconButton>
                </Tooltip>

                <Tooltip title={t("Update All Profiles")} arrow>
                  <IconButton
                    size="small"
                    onClick={onUpdateAll}
                    sx={{
                      width: 28,
                      height: 28,
                      "&:hover": { bgcolor: "action.hover" },
                    }}
                  >
                    <RefreshRounded sx={{ fontSize: 18 }} />
                  </IconButton>
                </Tooltip>

                <Tooltip title={t("View Runtime Config")} arrow>
                  <IconButton
                    size="small"
                    onClick={() => configRef.current?.open()}
                    sx={{
                      width: 28,
                      height: 28,
                      "&:hover": { bgcolor: "action.hover" },
                    }}
                  >
                    <TextSnippetOutlined sx={{ fontSize: 18 }} />
                  </IconButton>
                </Tooltip>

                <Tooltip title={t("Reactivate Profiles")} arrow>
                  <IconButton
                    size="small"
                    color="primary"
                    onClick={() => onEnhance(true)}
                    sx={{
                      width: 28,
                      height: 28,
                      "&:hover": { bgcolor: "action.hover" },
                    }}
                  >
                    <LocalFireDepartmentRounded sx={{ fontSize: 18 }} />
                  </IconButton>
                </Tooltip>

                {/* 故障检测和紧急恢复按钮 */}
                {(error || isStale) && (
                  <Tooltip title="数据异常，点击强制刷新" arrow>
                    <IconButton
                      size="small"
                      color="warning"
                      onClick={onEmergencyRefresh}
                      sx={{
                        width: 28,
                        height: 28,
                        animation: "pulse 2s infinite",
                        "@keyframes pulse": {
                          "0%": { opacity: 1 },
                          "50%": { opacity: 0.5 },
                          "100%": { opacity: 1 },
                        },
                        "&:hover": { bgcolor: "action.hover" },
                      }}
                    >
                      <ClearRounded sx={{ fontSize: 18 }} />
                    </IconButton>
                  </Tooltip>
                )}
              </Box>
            </>
          ) : (
            // Batch mode header
            <Box
              sx={{ display: "flex", alignItems: "center", gap: 1.5, flex: 1 }}
            >
              <Typography
                sx={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: "text.disabled",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                }}
              >
                BATCH
              </Typography>

              <Box sx={{ display: "flex", gap: 0.75, alignItems: "center" }}>
                <Tooltip
                  title={isAllSelected() ? t("Deselect All") : t("Select All")}
                  arrow
                >
                  <IconButton
                    size="small"
                    onClick={
                      isAllSelected() ? clearAllSelections : selectAllProfiles
                    }
                    sx={{
                      width: 28,
                      height: 28,
                      "&:hover": { bgcolor: "action.hover" },
                    }}
                  >
                    {getSelectionState() === "all" ? (
                      <CheckBoxRounded sx={{ fontSize: 18 }} />
                    ) : getSelectionState() === "partial" ? (
                      <IndeterminateCheckBoxRounded sx={{ fontSize: 18 }} />
                    ) : (
                      <CheckBoxOutlineBlankRounded sx={{ fontSize: 18 }} />
                    )}
                  </IconButton>
                </Tooltip>
                <Tooltip title={t("Delete Selected Profiles")} arrow>
                  <IconButton
                    size="small"
                    color="error"
                    onClick={deleteSelectedProfiles}
                    disabled={selectedProfiles.size === 0}
                    sx={{
                      width: 28,
                      height: 28,
                      "&:hover": { bgcolor: "action.hover" },
                    }}
                  >
                    <DeleteRounded sx={{ fontSize: 18 }} />
                  </IconButton>
                </Tooltip>
                <Box
                  onClick={toggleBatchMode}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    px: 1.25,
                    py: 0.5,
                    cursor: "pointer",
                    border: "1px solid",
                    borderColor: "divider",
                    borderRadius: "var(--cv-border-radius-sm)",
                    transition: "all 0.2s ease",
                    "&:hover": {
                      borderColor: "primary.main",
                      backgroundColor: (theme) =>
                        alpha(theme.palette.primary.main, 0.04),
                    },
                  }}
                >
                  <Typography
                    sx={{
                      fontSize: 12,
                      fontWeight: 500,
                      color: "text.secondary",
                    }}
                  >
                    {t("Done")}
                  </Typography>
                </Box>
              </Box>

              <Typography
                sx={{
                  ml: "auto",
                  color: "text.secondary",
                  fontSize: 12,
                  fontWeight: 500,
                }}
              >
                {t("Selected")} {selectedProfiles.size} {t("items")}
              </Typography>
            </Box>
          )}
        </Box>
      }
    >
      {/* 配置列表区域 */}
      <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={onDragEnd}
        >
          {/* 顶部工具栏区域 - 横向布局 */}
          <Box
            sx={{
              borderBottom: (theme) => `1px solid ${theme.palette.divider}`,
              display: "flex",
              flexDirection: { xs: "column", md: "row" },
              alignItems: { xs: "stretch", md: "center" },
              gap: { xs: 1.5, md: 2 },
              p: 2,
            }}
          >
            {/* 导入订阅 */}
            <Box sx={{ display: "flex", gap: 1, alignItems: "center", flex: 1 }}>
              <TextField
                fullWidth
                size="small"
                value={importUrl}
                onChange={(e) => setImportUrl(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && importUrl && !importLoading) {
                    handleImport();
                  }
                }}
                placeholder={t("Enter subscription URL...")}
                disabled={importLoading}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    height: 32,
                    fontSize: "13px",
                  },
                }}
                slotProps={{
                  input: {
                    endAdornment: (
                      <Tooltip title={t("Paste")} arrow>
                        <IconButton
                          size="small"
                          onClick={handlePasteUrl}
                          disabled={importLoading}
                          sx={{ width: 24, height: 24 }}
                        >
                          <ContentPasteRounded sx={{ fontSize: 16 }} />
                        </IconButton>
                      </Tooltip>
                    ),
                  },
                }}
              />
              <Button
                variant="contained"
                onClick={handleImport}
                disabled={!importUrl || importLoading}
                sx={{
                  height: 32,
                  minWidth: 70,
                  px: 2,
                  fontSize: "13px",
                }}
              >
                {importLoading ? t("Importing...") : t("Import")}
              </Button>
            </Box>

            {/* 分组筛选 */}
            <Box sx={{ minWidth: { md: 200 } }}>
              <ProfileGroupManager onGroupChange={setSelectedGroupId} />
            </Box>
          </Box>

          {profileItems.length > 0 ? (
            <Box sx={{ flex: 1, overflow: "auto", minWidth: 0, width: "100%" }}>
              <Box sx={{ p: 2, minWidth: 0, width: "100%", boxSizing: "border-box" }}>
                {/* Subscriptions */}
                <Box sx={{ mb: 3 }}>
                  <Typography
                    variant="caption"
                    sx={{
                      display: "block",
                      mb: 1.5,
                      fontWeight: 600,
                      fontSize: "11px",
                      letterSpacing: "0.5px",
                      textTransform: "uppercase",
                      color: "text.secondary",
                    }}
                  >
                    {t("Subscriptions")}
                  </Typography>
                  <Box
                    sx={{
                      display: "grid",
                      gridTemplateColumns: {
                        xs: "1fr",
                        sm: "repeat(2, 1fr)",
                        md: "repeat(3, 1fr)",
                        lg: "repeat(3, 1fr)",
                        xl: "repeat(4, 1fr)",
                      },
                      gap: { xs: 1.5, sm: 2, md: 2 },
                    }}
                  >
                    <SortableContext items={profileItems.map((x) => x.uid)}>
                      {profileItems.map((item) => (
                        <ProfileItem
                          key={item.uid}
                          id={item.uid}
                          selected={profiles.current === item.uid}
                          activating={activatings.includes(item.uid)}
                          itemData={item}
                          onSelect={(f) => onSelect(item.uid, f)}
                          onEdit={() => viewerRef.current?.edit(item)}
                          onSave={async (prev, curr) => {
                            if (prev !== curr && profiles.current === item.uid) {
                              await onEnhance(false);
                            }
                          }}
                          onDelete={() => {
                            if (batchMode) {
                              toggleProfileSelection(item.uid);
                            } else {
                              onDelete(item.uid);
                            }
                          }}
                          batchMode={batchMode}
                          isSelected={selectedProfiles.has(item.uid)}
                          onSelectionChange={(e: React.MouseEvent) =>
                            toggleProfileSelection(item.uid, e)
                          }
                        />
                      ))}
                    </SortableContext>
                  </Box>
                </Box>

                {/* Enhanced */}
                <Box>
                  <Typography
                    variant="caption"
                    sx={{
                      display: "block",
                      mb: 1.5,
                      fontWeight: 600,
                      fontSize: "11px",
                      letterSpacing: "0.5px",
                      textTransform: "uppercase",
                      color: "text.secondary",
                    }}
                  >
                    {t("Enhanced")}
                  </Typography>
                  <Box
                    sx={{
                      display: "grid",
                      gridTemplateColumns: {
                        xs: "1fr",
                        sm: "repeat(2, 1fr)",
                        md: "repeat(3, 1fr)",
                        lg: "repeat(3, 1fr)",
                        xl: "repeat(4, 1fr)",
                      },
                      gap: { xs: 1.5, sm: 2, md: 2 },
                    }}
                  >
                    <ProfileMore
                      id="Merge"
                      onSave={async (prev, curr) => {
                        if (prev !== curr) {
                          await onEnhance(false);
                        }
                      }}
                    />
                    <ProfileMore
                      id="Script"
                      logInfo={chainLogs["Script"]}
                      onSave={async (prev, curr) => {
                        if (prev !== curr) {
                          await onEnhance(false);
                        }
                      }}
                    />
                  </Box>
                </Box>
              </Box>
            </Box>
          ) : (
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                flex: 1,
              }}
            >
              <TextSnippetOutlined sx={{ fontSize: 64, color: "text.disabled", mb: 2 }} />
              <Typography variant="h6" sx={{ mb: 1, color: "text.secondary" }}>
                {t("No Profiles")}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {t("Import a subscription or create a new profile to get started")}
              </Typography>
            </Box>
          )}
          <DragOverlay />
        </DndContext>
      </Box>

      <ProfileViewer
        ref={viewerRef}
        onChange={async (isActivating) => {
          mutateProfiles();
          // 只有更改当前激活的配置时才触发全局重新加载
          if (isActivating) {
            await onEnhance(false);
          }
        }}
      />
      <ConfigViewer ref={configRef} />
    </BasePage>
  );
};

export default ProfilePage;
