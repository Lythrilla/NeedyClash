import {
  AccessTimeRounded,
  ChevronRight,
  NetworkCheckRounded,
  WifiOff as SignalError,
  SignalWifi3Bar as SignalGood,
  SignalWifi2Bar as SignalMedium,
  SignalWifi0Bar as SignalNone,
  SignalWifi4Bar as SignalStrong,
  SignalWifi1Bar as SignalWeak,
  SortByAlphaRounded,
  SortRounded,
} from "@mui/icons-material";
import {
  Box,
  Chip,
  IconButton,
  MenuItem,
  Select,
  SelectChangeEvent,
  Tooltip,
  Typography,
  alpha,
  useTheme,
} from "@mui/material";
import { useLockFn } from "ahooks";
import React from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { delayGroup, healthcheckProxyProvider } from "tauri-plugin-mihomo-api";

import { EnhancedCard } from "@/components/home/enhanced-card";
import { useProxySelection } from "@/hooks/use-proxy-selection";
import { useVerge } from "@/hooks/use-verge";
import { useAppData } from "@/providers/app-data-context";
import delayManager from "@/services/delay";

// 本地存储的键名
const STORAGE_KEY_GROUP = "needyclash-selected-proxy-group";
const STORAGE_KEY_PROXY = "needyclash-selected-proxy";
const STORAGE_KEY_SORT_TYPE = "needyclash-proxy-sort-type";

const AUTO_CHECK_INITIAL_DELAY_MS = 1500;
const AUTO_CHECK_INTERVAL_MS = 5 * 60 * 1000;

// 代理节点信息接口
interface ProxyOption {
  name: string;
}

// 排序类型: 默认 | 按延迟 | 按字母
type ProxySortType = 0 | 1 | 2;

function convertDelayColor(
  delayValue: number,
): "success" | "warning" | "error" | "primary" | "default" {
  const colorStr = delayManager.formatDelayColor(delayValue);
  if (!colorStr) return "default";

  const mainColor = colorStr.split(".")[0];

  switch (mainColor) {
    case "success":
      return "success";
    case "warning":
      return "warning";
    case "error":
      return "error";
    case "primary":
      return "primary";
    default:
      return "default";
  }
}

function getSignalIcon(delay: number): {
  icon: React.ReactElement;
  text: string;
  color: string;
} {
  if (delay < 0)
    return { icon: <SignalNone />, text: "未测试", color: "text.secondary" };
  if (delay >= 10000)
    return { icon: <SignalError />, text: "超时", color: "error.main" };
  if (delay >= 500)
    return { icon: <SignalWeak />, text: "延迟较高", color: "error.main" };
  if (delay >= 300)
    return { icon: <SignalMedium />, text: "延迟中等", color: "warning.main" };
  if (delay >= 200)
    return { icon: <SignalGood />, text: "延迟良好", color: "info.main" };
  return { icon: <SignalStrong />, text: "延迟极佳", color: "success.main" };
}

export const CurrentProxyCard = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const theme = useTheme();
  const { proxies, clashConfig, refreshProxy } = useAppData();
  const { verge } = useVerge();
  const autoDelayEnabled = verge?.enable_auto_delay_detection ?? false;

  // 统一代理选择器
  const { handleSelectChange } = useProxySelection({
    onSuccess: () => {
      refreshProxy();
    },
    onError: (error) => {
      console.error("代理切换失败", error);
      refreshProxy();
    },
  });

  // 判断模式
  const mode = clashConfig?.mode?.toLowerCase() || "rule";
  const isGlobalMode = mode === "global";
  const isDirectMode = mode === "direct";

  // 添加排序类型状态
  const [sortType, setSortType] = useState<ProxySortType>(() => {
    const savedSortType = localStorage.getItem(STORAGE_KEY_SORT_TYPE);
    return savedSortType ? (Number(savedSortType) as ProxySortType) : 0;
  });
  const [delaySortRefresh, setDelaySortRefresh] = useState(0);

  // 定义状态类型
  type ProxyState = {
    proxyData: {
      groups: { name: string; now: string; all: string[] }[];
      records: Record<string, any>;
    };
    selection: {
      group: string;
      proxy: string;
    };
    displayProxy: IProxyItem | null;
  };

  const [state, setState] = useState<ProxyState>({
    proxyData: {
      groups: [],
      records: {},
    },
    selection: {
      group: "",
      proxy: "",
    },
    displayProxy: null,
  });

  const autoCheckInProgressRef = useRef(false);
  const latestTimeoutRef = useRef<number>(
    verge?.default_latency_timeout || 10000,
  );
  const latestProxyRecordRef = useRef<any | null>(null);

  useEffect(() => {
    latestTimeoutRef.current = verge?.default_latency_timeout || 10000;
  }, [verge?.default_latency_timeout]);

  useEffect(() => {
    if (!state.selection.proxy) {
      latestProxyRecordRef.current = null;
      return;
    }
    latestProxyRecordRef.current =
      state.proxyData.records?.[state.selection.proxy] || null;
  }, [state.selection.proxy, state.proxyData.records]);

  // 初始化选择的组
  useEffect(() => {
    if (!proxies) return;

    const getPrimaryGroupName = () => {
      if (!proxies?.groups?.length) return "";

      const primaryKeywords = [
        "auto",
        "select",
        "proxy",
        "节点选择",
        "自动选择",
      ];
      const primaryGroup =
        proxies.groups.find((group: { name: string }) =>
          primaryKeywords.some((keyword) =>
            group.name.toLowerCase().includes(keyword.toLowerCase()),
          ),
        ) ||
        proxies.groups.filter((g: { name: string }) => g.name !== "GLOBAL")[0];

      return primaryGroup?.name || "";
    };

    const primaryGroupName = getPrimaryGroupName();

    // 根据模式确定初始组
    if (isGlobalMode) {
      // eslint-disable-next-line @eslint-react/hooks-extra/no-direct-set-state-in-use-effect
      setState((prev) => ({
        ...prev,
        selection: {
          ...prev.selection,
          group: "GLOBAL",
        },
      }));
    } else if (isDirectMode) {
      // eslint-disable-next-line @eslint-react/hooks-extra/no-direct-set-state-in-use-effect
      setState((prev) => ({
        ...prev,
        selection: {
          ...prev.selection,
          group: "DIRECT",
        },
      }));
    } else {
      const savedGroup = localStorage.getItem(STORAGE_KEY_GROUP);
      // eslint-disable-next-line @eslint-react/hooks-extra/no-direct-set-state-in-use-effect
      setState((prev) => ({
        ...prev,
        selection: {
          ...prev.selection,
          group: savedGroup || primaryGroupName || "",
        },
      }));
    }
  }, [isGlobalMode, isDirectMode, proxies]);

  // 监听代理数据变化，更新状态
  useEffect(() => {
    if (!proxies) return;

    // eslint-disable-next-line @eslint-react/hooks-extra/no-direct-set-state-in-use-effect
    setState((prev) => {
      // 只保留 Selector 类型的组用于选择
      const filteredGroups = proxies.groups
        .filter((g: { name: string; type?: string }) => g.type === "Selector")
        .map(
          (g: { name: string; now: string; all: Array<{ name: string }> }) => ({
            name: g.name,
            now: g.now || "",
            all: g.all.map((p: { name: string }) => p.name),
          }),
        );

      let newProxy = "";
      let newDisplayProxy = null;
      let newGroup = prev.selection.group;

      // 根据模式确定新代理
      if (isDirectMode) {
        newGroup = "DIRECT";
        newProxy = "DIRECT";
        newDisplayProxy = proxies.records?.DIRECT || { name: "DIRECT" }; // 确保非空
      } else if (isGlobalMode && proxies.global) {
        newGroup = "GLOBAL";
        newProxy = proxies.global.now || "";
        newDisplayProxy = proxies.records?.[newProxy] || null;
      } else {
        const currentGroup = filteredGroups.find(
          (g: { name: string }) => g.name === prev.selection.group,
        );

        // 如果当前组不存在或为空，自动选择第一个 selector 类型的组
        if (!currentGroup && filteredGroups.length > 0) {
          const selectorGroup = filteredGroups[0];
          if (selectorGroup) {
            newGroup = selectorGroup.name;
            newProxy = selectorGroup.now || selectorGroup.all[0] || "";
            newDisplayProxy = proxies.records?.[newProxy] || null;

            if (!isGlobalMode && !isDirectMode) {
              localStorage.setItem(STORAGE_KEY_GROUP, newGroup);
              if (newProxy) {
                localStorage.setItem(STORAGE_KEY_PROXY, newProxy);
              }
            }
          }
        } else if (currentGroup) {
          newProxy = currentGroup.now || currentGroup.all[0] || "";
          newDisplayProxy = proxies.records?.[newProxy] || null;
        }
      }

      // 返回新状态
      return {
        proxyData: {
          groups: filteredGroups,
          records: proxies.records || {},
        },
        selection: {
          group: newGroup,
          proxy: newProxy,
        },
        displayProxy: newDisplayProxy,
      };
    });
  }, [proxies, isGlobalMode, isDirectMode]);

  // 使用防抖包装状态更新
  const timeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const debouncedSetState = useCallback(
    (updateFn: (prev: ProxyState) => ProxyState) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => {
        setState(updateFn);
      }, 300);
    },
    [setState],
  );

  // 处理代理组变更
  const handleGroupChange = useCallback(
    (event: SelectChangeEvent<string>) => {
      if (isGlobalMode || isDirectMode) return;

      const newGroup = event.target.value;

      localStorage.setItem(STORAGE_KEY_GROUP, newGroup);

      setState((prev) => {
        const group = prev.proxyData.groups.find(
          (g: { name: string }) => g.name === newGroup,
        );
        if (group) {
          return {
            ...prev,
            selection: {
              group: newGroup,
              proxy: group.now,
            },
            displayProxy: prev.proxyData.records[group.now] || null,
          };
        }
        return {
          ...prev,
          selection: {
            ...prev.selection,
            group: newGroup,
          },
        };
      });
    },
    [isGlobalMode, isDirectMode],
  );

  // 处理代理节点变更
  const handleProxyChange = useCallback(
    (event: SelectChangeEvent<string>) => {
      if (isDirectMode) return;

      const newProxy = event.target.value;
      const currentGroup = state.selection.group;
      const previousProxy = state.selection.proxy;

      debouncedSetState((prev: ProxyState) => ({
        ...prev,
        selection: {
          ...prev.selection,
          proxy: newProxy,
        },
        displayProxy: prev.proxyData.records[newProxy] || null,
      }));

      if (!isGlobalMode && !isDirectMode) {
        localStorage.setItem(STORAGE_KEY_PROXY, newProxy);
      }

      const skipConfigSave = isGlobalMode || isDirectMode;
      handleSelectChange(currentGroup, previousProxy, skipConfigSave)(event);
    },
    [
      isDirectMode,
      isGlobalMode,
      state.selection,
      debouncedSetState,
      handleSelectChange,
    ],
  );

  // 导航到代理页面
  const goToProxies = useCallback(() => {
    navigate("/");
  }, [navigate]);

  // 获取要显示的代理节点
  const currentProxy = useMemo(() => {
    return state.displayProxy;
  }, [state.displayProxy]);

  // 获取当前节点的延迟（增加非空校验）
  const currentDelay =
    currentProxy && state.selection.group
      ? delayManager.getDelayFix(currentProxy, state.selection.group)
      : -1;

  // 信号图标（增加非空校验）
  const signalInfo =
    currentProxy && state.selection.group
      ? getSignalIcon(currentDelay)
      : { icon: <SignalNone />, text: "未初始化", color: "text.secondary" };

  const checkCurrentProxyDelay = useCallback(async () => {
    if (autoCheckInProgressRef.current) return;
    if (isDirectMode) return;

    const groupName = state.selection.group;
    const proxyName = state.selection.proxy;

    if (!groupName || !proxyName) return;

    const proxyRecord = latestProxyRecordRef.current;
    if (!proxyRecord) {
      console.log(
        `[CurrentProxyCard] 自动延迟检测跳过，组: ${groupName}, 节点: ${proxyName} 未找到`,
      );
      return;
    }

    autoCheckInProgressRef.current = true;

    const timeout = latestTimeoutRef.current || 10000;

    try {
      console.log(
        `[CurrentProxyCard] 自动检测当前节点延迟，组: ${groupName}, 节点: ${proxyName}`,
      );
      if (proxyRecord.provider) {
        await healthcheckProxyProvider(proxyRecord.provider);
      } else {
        await delayManager.checkDelay(proxyName, groupName, timeout);
      }
    } catch (error) {
      console.error(
        `[CurrentProxyCard] 自动检测当前节点延迟失败，组: ${groupName}, 节点: ${proxyName}`,
        error,
      );
    } finally {
      autoCheckInProgressRef.current = false;
      refreshProxy();
      if (sortType === 1) {
        setDelaySortRefresh((prev) => prev + 1);
      }
    }
  }, [
    isDirectMode,
    refreshProxy,
    state.selection.group,
    state.selection.proxy,
    sortType,
    setDelaySortRefresh,
  ]);

  useEffect(() => {
    if (isDirectMode) return;
    if (!autoDelayEnabled) return;
    if (!state.selection.group || !state.selection.proxy) return;

    let disposed = false;
    let intervalTimer: ReturnType<typeof setTimeout> | null = null;
    let initialTimer: ReturnType<typeof setTimeout> | null = null;

    const runAndSchedule = async () => {
      if (disposed) return;
      await checkCurrentProxyDelay();
      if (disposed) return;
      intervalTimer = setTimeout(runAndSchedule, AUTO_CHECK_INTERVAL_MS);
    };

    initialTimer = setTimeout(async () => {
      await checkCurrentProxyDelay();
      if (disposed) return;
      intervalTimer = setTimeout(runAndSchedule, AUTO_CHECK_INTERVAL_MS);
    }, AUTO_CHECK_INITIAL_DELAY_MS);

    return () => {
      disposed = true;
      if (initialTimer) clearTimeout(initialTimer);
      if (intervalTimer) clearTimeout(intervalTimer);
    };
  }, [
    checkCurrentProxyDelay,
    isDirectMode,
    state.selection.group,
    state.selection.proxy,
    autoDelayEnabled,
  ]);

  // 自定义渲染选择框中的值
  const renderProxyValue = (selected: string) => {
    if (!selected || !state.proxyData.records[selected]) return selected;

    const delayValue = delayManager.getDelayFix(
      state.proxyData.records[selected],
      state.selection.group,
    );

    return (
      <Box sx={{ display: "flex", justifyContent: "space-between" }}>
        <Typography noWrap>{selected}</Typography>
        <Chip
          size="small"
          label={delayManager.formatDelay(delayValue)}
          color={convertDelayColor(delayValue)}
        />
      </Box>
    );
  };

  // 排序类型变更
  const handleSortTypeChange = useCallback(() => {
    const newSortType = ((sortType + 1) % 3) as ProxySortType;
    setSortType(newSortType);
    localStorage.setItem(STORAGE_KEY_SORT_TYPE, newSortType.toString());
  }, [sortType]);

  // Latency test handler
  const handleCheckDelay = useLockFn(async () => {
    const groupName = state.selection.group;
    if (!groupName || isDirectMode) return;

    console.log(`[CurrentProxyCard] 开始测试所有延迟，组: ${groupName}`);

    const timeout = verge?.default_latency_timeout || 10000;

    // 获取当前组的所有代理
    const proxyNames: string[] = [];
    const providers: Set<string> = new Set();

    if (isGlobalMode && proxies?.global) {
      // 全局模式
      const allProxies = proxies.global.all
        .filter((p: string | { name: string }) => {
          const name = typeof p === "string" ? p : p.name;
          return name !== "DIRECT" && name !== "REJECT";
        })
        .map((p: string | { name: string }) =>
          typeof p === "string" ? p : p.name,
        );

      allProxies.forEach((name: string) => {
        const proxy = state.proxyData.records[name];
        if (proxy?.provider) {
          providers.add(proxy.provider);
        } else {
          proxyNames.push(name);
        }
      });
    } else {
      // 规则模式
      const group = state.proxyData.groups.find((g) => g.name === groupName);
      if (group) {
        group.all.forEach((name: string) => {
          const proxy = state.proxyData.records[name];
          if (proxy?.provider) {
            providers.add(proxy.provider);
          } else {
            proxyNames.push(name);
          }
        });
      }
    }

    console.log(
      `[CurrentProxyCard] 找到代理数量: ${proxyNames.length}, 提供者数量: ${providers.size}`,
    );

    // Test provider proxies
    if (providers.size > 0) {
      console.log(`[CurrentProxyCard] 开始测试提供者节点`);
      await Promise.allSettled(
        [...providers].map((p) => healthcheckProxyProvider(p)),
      );
    }

    // Test non-provider proxies
    if (proxyNames.length > 0) {
      const url = delayManager.getUrl(groupName);
      console.log(`[CurrentProxyCard] 测试URL: ${url}, 超时: ${timeout}ms`);

      try {
        await Promise.race([
          delayManager.checkListDelay(proxyNames, groupName, timeout),
          delayGroup(groupName, url, timeout),
        ]);
        console.log(`[CurrentProxyCard] 延迟测试完成，组: ${groupName}`);
      } catch (error) {
        console.error(
          `[CurrentProxyCard] 延迟测试出错，组: ${groupName}`,
          error,
        );
      }
    }

    refreshProxy();
    if (sortType === 1) {
      setDelaySortRefresh((prev) => prev + 1);
    }
  });

  // 计算要显示的代理选项（增加非空校验）
  const proxyOptions = useMemo(() => {
    const sortWithLatency = (proxiesToSort: ProxyOption[]) => {
      if (!proxiesToSort || sortType === 0) return proxiesToSort;

      if (!state.proxyData.records || !state.selection.group) {
        return proxiesToSort;
      }

      const list = [...proxiesToSort];

      if (sortType === 1) {
        const refreshTick = delaySortRefresh;
        list.sort((a, b) => {
          const recordA = state.proxyData.records[a.name];
          const recordB = state.proxyData.records[b.name];

          if (!recordA) return 1;
          if (!recordB) return -1;

          const ad = delayManager.getDelayFix(recordA, state.selection.group);
          const bd = delayManager.getDelayFix(recordB, state.selection.group);

          if (ad === -1 || ad === -2) return 1;
          if (bd === -1 || bd === -2) return -1;

          if (ad !== bd) return ad - bd;
          return refreshTick >= 0 ? a.name.localeCompare(b.name) : 0;
        });
      } else {
        list.sort((a, b) => a.name.localeCompare(b.name));
      }

      return list;
    };

    if (isDirectMode) {
      return [{ name: "DIRECT" }];
    }
    if (isGlobalMode && proxies?.global) {
      const options = proxies.global.all
        .filter((p: string | { name: string }) => {
          const name = typeof p === "string" ? p : p.name;
          return name !== "DIRECT" && name !== "REJECT";
        })
        .map((p: string | { name: string }) => ({
          name: typeof p === "string" ? p : p.name,
        }));

      return sortWithLatency(options);
    }

    // 规则模式
    const group = state.selection.group
      ? state.proxyData.groups.find((g) => g.name === state.selection.group)
      : null;

    if (group) {
      const options = group.all.map((name) => ({ name }));
      return sortWithLatency(options);
    }

    return [];
  }, [
    isDirectMode,
    isGlobalMode,
    proxies,
    state.proxyData,
    state.selection.group,
    sortType,
    delaySortRefresh,
  ]);

  // 获取排序图标
  const getSortIcon = (): React.ReactElement => {
    switch (sortType) {
      case 1:
        return <AccessTimeRounded fontSize="small" />;
      case 2:
        return <SortByAlphaRounded fontSize="small" />;
      default:
        return <SortRounded fontSize="small" />;
    }
  };

  // 获取排序提示文本
  const getSortTooltip = (): string => {
    switch (sortType) {
      case 0:
        return t("Sort by default");
      case 1:
        return t("Sort by delay");
      case 2:
        return t("Sort by name");
      default:
        return "";
    }
  };

  return (
    <EnhancedCard
      title={t("Current Node")}
      icon={
        <Tooltip
          title={
            currentProxy
              ? `${signalInfo.text}: ${delayManager.formatDelay(currentDelay)}`
              : "无代理节点"
          }
          arrow
          placement="top"
        >
          <Box sx={{ color: signalInfo.color, display: "flex" }}>
            {currentProxy ? signalInfo.icon : <SignalNone color="disabled" />}
          </Box>
        </Tooltip>
      }
      iconColor={currentProxy ? "primary" : undefined}
      action={
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
          <Tooltip title={t("Delay check")} arrow placement="top">
            <span>
              <IconButton
                size="small"
                color="inherit"
                onClick={handleCheckDelay}
                disabled={isDirectMode}
                sx={{
                  width: 32,
                  height: 32,
                  "&:hover": { bgcolor: "action.hover" },
                }}
              >
                <NetworkCheckRounded sx={{ fontSize: 18 }} />
              </IconButton>
            </span>
          </Tooltip>
          <Tooltip title={getSortTooltip()} arrow placement="top">
            <IconButton
              size="small"
              color="inherit"
              onClick={handleSortTypeChange}
              sx={{
                width: 32,
                height: 32,
                "&:hover": { bgcolor: "action.hover" },
              }}
            >
              {getSortIcon()}
            </IconButton>
          </Tooltip>
          <Tooltip title={t("Go to proxies page")} arrow placement="top">
            <IconButton
              size="small"
              color="inherit"
              onClick={goToProxies}
              sx={{
                width: 32,
                height: 32,
                "&:hover": { bgcolor: "action.hover" },
              }}
            >
              <ChevronRight sx={{ fontSize: 18 }} />
            </IconButton>
          </Tooltip>
        </Box>
      }
    >
      {currentProxy ? (
        <Box>
          {/* 当前节点概览 */}
          <Box
            sx={{
              display: "flex",
              alignItems: "flex-start",
              gap: { xs: 1, sm: 1.5, md: 2 },
              pb: { xs: 1.5, sm: 2 },
              mb: { xs: 1.5, sm: 2 },
              borderBottom: "1px solid",
              borderColor: "divider",
              flexWrap: { xs: "wrap", sm: "nowrap" },
            }}
          >
            <Box
              sx={{ flex: 1, minWidth: 0, width: { xs: "100%", sm: "auto" } }}
            >
              <Typography
                variant="body1"
                sx={{
                  fontSize: { xs: 13, sm: 14 },
                  fontWeight: 600,
                  mb: 0.5,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {currentProxy.name}
              </Typography>

              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: { xs: 0.5, sm: 0.75 },
                  flexWrap: "wrap",
                }}
              >
                <Typography
                  variant="caption"
                  sx={{
                    fontSize: { xs: 10, sm: 11 },
                    color: "text.secondary",
                    px: { xs: 0.5, sm: 0.75 },
                    py: 0.25,
                    bgcolor: "action.hover",
                  }}
                >
                  {currentProxy.type}
                </Typography>

                {isGlobalMode && (
                  <Typography
                    variant="caption"
                    sx={{
                      fontSize: 11,
                      color: "primary.main",
                      px: 0.75,
                      py: 0.25,
                      bgcolor: (theme) =>
                        alpha(theme.palette.primary.main, 0.1),
                    }}
                  >
                    {t("Global Mode")}
                  </Typography>
                )}
                {isDirectMode && (
                  <Typography
                    variant="caption"
                    sx={{
                      fontSize: 11,
                      color: "success.main",
                      px: 0.75,
                      py: 0.25,
                      bgcolor: (theme) =>
                        alpha(theme.palette.success.main, 0.1),
                    }}
                  >
                    {t("Direct Mode")}
                  </Typography>
                )}

                {/* 节点特性 - 更简洁 */}
                {currentProxy.udp && (
                  <Typography
                    variant="caption"
                    sx={{
                      fontSize: 10,
                      color: "text.disabled",
                      px: 0.5,
                      py: 0.25,
                      border: "1px solid",
                      borderColor: "divider",
                    }}
                  >
                    UDP
                  </Typography>
                )}
                {currentProxy.tfo && (
                  <Typography
                    variant="caption"
                    sx={{
                      fontSize: 10,
                      color: "text.disabled",
                      px: 0.5,
                      py: 0.25,
                      border: "1px solid",
                      borderColor: "divider",
                    }}
                  >
                    TFO
                  </Typography>
                )}
              </Box>
            </Box>

            {/* 延迟显示 - 更醒目 */}
            {currentProxy && !isDirectMode && (
              <Box
                sx={{
                  display: "flex",
                  flexDirection: { xs: "row", sm: "column" },
                  alignItems: { xs: "center", sm: "flex-end" },
                  gap: { xs: 1, sm: 0.25 },
                  width: { xs: "100%", sm: "auto" },
                  justifyContent: { xs: "space-between", sm: "flex-start" },
                }}
              >
                <Typography
                  variant="caption"
                  sx={{
                    fontSize: { xs: 10, sm: 10 },
                    color: "text.disabled",
                    order: { xs: 1, sm: 2 },
                  }}
                >
                  {signalInfo.text}
                </Typography>
                <Typography
                  variant="h6"
                  sx={{
                    fontSize: { xs: 16, sm: 18 },
                    fontWeight: 600,
                    color: signalInfo.color,
                    lineHeight: 1,
                    order: { xs: 2, sm: 1 },
                  }}
                >
                  {delayManager.formatDelay(currentDelay)}
                </Typography>
              </Box>
            )}
          </Box>

          {/* 选择器 - 更简洁 */}
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              gap: { xs: 1.25, sm: 1.5 },
            }}
          >
            {/* 代理组 */}
            <Box>
              <Typography
                variant="caption"
                sx={{
                  fontSize: { xs: 10, sm: 11 },
                  color: "text.secondary",
                  mb: 0.75,
                  display: "block",
                }}
              >
                {t("Group")}
              </Typography>
              <Select
                value={state.selection.group}
                onChange={handleGroupChange}
                disabled={isGlobalMode || isDirectMode}
                size="small"
                fullWidth
                sx={{
                  fontSize: { xs: 12, sm: 13 },
                  "& .MuiSelect-select": {
                    py: { xs: 0.75, sm: 1 },
                  },
                }}
              >
                {state.proxyData.groups.map((group) => (
                  <MenuItem
                    key={group.name}
                    value={group.name}
                    sx={{ fontSize: 13 }}
                  >
                    {group.name}
                  </MenuItem>
                ))}
              </Select>
            </Box>

            {/* 代理节点 */}
            <Box>
              <Typography
                variant="caption"
                sx={{
                  fontSize: 11,
                  color: "text.secondary",
                  mb: 0.75,
                  display: "block",
                }}
              >
                {t("Proxy")}
              </Typography>
              <Select
                value={state.selection.proxy}
                onChange={handleProxyChange}
                disabled={isDirectMode}
                size="small"
                fullWidth
                renderValue={(selected) => (
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <Typography sx={{ fontSize: 13 }} noWrap>
                      {selected}
                    </Typography>
                    {!isDirectMode && state.proxyData.records[selected] && (
                      <Typography
                        sx={{
                          fontSize: 11,
                          ml: 1,
                          px: 0.75,
                          py: 0.25,
                          color: signalInfo.color,
                          bgcolor: (theme) =>
                            alpha(
                              signalInfo.color === "success.main"
                                ? theme.palette.success.main
                                : signalInfo.color === "warning.main"
                                  ? theme.palette.warning.main
                                  : signalInfo.color === "error.main"
                                    ? theme.palette.error.main
                                    : theme.palette.grey[500],
                              0.1,
                            ),
                        }}
                      >
                        {delayManager.formatDelay(
                          delayManager.getDelayFix(
                            state.proxyData.records[selected],
                            state.selection.group,
                          ),
                        )}
                      </Typography>
                    )}
                  </Box>
                )}
                sx={{
                  fontSize: 13,
                  "& .MuiSelect-select": {
                    py: 1,
                  },
                }}
                MenuProps={{
                  PaperProps: {
                    style: {
                      maxHeight: 400,
                    },
                  },
                }}
              >
                {isDirectMode
                  ? null
                  : proxyOptions.map((proxy) => {
                      const delayValue =
                        state.proxyData.records[proxy.name] &&
                        state.selection.group
                          ? delayManager.getDelayFix(
                              state.proxyData.records[proxy.name],
                              state.selection.group,
                            )
                          : -1;
                      const color = convertDelayColor(delayValue);
                      return (
                        <MenuItem
                          key={proxy.name}
                          value={proxy.name}
                          sx={{
                            fontSize: 13,
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            py: 1,
                          }}
                        >
                          <Typography sx={{ fontSize: 13 }} noWrap>
                            {proxy.name}
                          </Typography>
                          <Typography
                            sx={{
                              fontSize: 11,
                              ml: 2,
                              px: 0.75,
                              py: 0.25,
                              color: `${color}.main`,
                              bgcolor: (theme) =>
                                alpha(
                                  color === "success"
                                    ? theme.palette.success.main
                                    : color === "warning"
                                      ? theme.palette.warning.main
                                      : color === "error"
                                        ? theme.palette.error.main
                                        : theme.palette.grey[500],
                                  0.1,
                                ),
                            }}
                          >
                            {delayManager.formatDelay(delayValue)}
                          </Typography>
                        </MenuItem>
                      );
                    })}
              </Select>
            </Box>
          </Box>
        </Box>
      ) : (
        <Box sx={{ textAlign: "center", py: 4 }}>
          <Typography variant="body2" color="text.secondary">
            {t("No active proxy node")}
          </Typography>
        </Box>
      )}
    </EnhancedCard>
  );
};
