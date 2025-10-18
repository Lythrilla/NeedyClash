import {
  InfoOutlined,
  SettingsOutlined,
  WarningOutlined,
  AdminPanelSettingsOutlined,
  DnsOutlined,
  ExtensionOutlined,
} from "@mui/icons-material";
import {
  Box,
  Typography,
  Stack,
  Chip,
  IconButton,
  Tooltip,
} from "@mui/material";
import { check as checkUpdate } from "@tauri-apps/plugin-updater";
import { useLockFn } from "ahooks";
import { useCallback, useEffect, useMemo, useReducer } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

import { useSystemState } from "@/hooks/use-system-state";
import { useVerge } from "@/hooks/use-verge";
import { getSystemInfo } from "@/services/cmds";
import { showNotice } from "@/services/noticeService";
import { version as appVersion } from "@root/package.json";

import { EnhancedCard } from "./enhanced-card";

interface SystemState {
  osInfo: string;
  lastCheckUpdate: string;
}

type SystemStateAction =
  | { type: "set-os-info"; payload: string }
  | { type: "set-last-check-update"; payload: string };

const systemStateReducer = (
  state: SystemState,
  action: SystemStateAction,
): SystemState => {
  switch (action.type) {
    case "set-os-info":
      return { ...state, osInfo: action.payload };
    case "set-last-check-update":
      return { ...state, lastCheckUpdate: action.payload };
    default:
      return state;
  }
};

export const SystemInfoCard = () => {
  const { t } = useTranslation();
  const { verge, patchVerge } = useVerge();
  const navigate = useNavigate();
  const { isAdminMode, isSidecarMode } = useSystemState();

  // 系统信息状态
  const [systemState, dispatchSystemState] = useReducer(systemStateReducer, {
    osInfo: "",
    lastCheckUpdate: "-",
  });

  // 初始化系统信息
  useEffect(() => {
    let timeoutId: number | undefined;

    getSystemInfo()
      .then((info) => {
        const lines = info.split("\n");
        if (lines.length > 0) {
          const sysName = lines[0].split(": ")[1] || "";
          let sysVersion = lines[1].split(": ")[1] || "";

          if (
            sysName &&
            sysVersion.toLowerCase().startsWith(sysName.toLowerCase())
          ) {
            sysVersion = sysVersion.substring(sysName.length).trim();
          }

          dispatchSystemState({
            type: "set-os-info",
            payload: `${sysName} ${sysVersion}`,
          });
        }
      })
      .catch((error) => {
        console.error("[SystemInfo] Failed to get system info:", error);
      });

    // 自动更新检查功能已禁用
    // 获取最后检查更新时间（仅用于显示）
    const lastCheck = localStorage.getItem("last_check_update");
    if (lastCheck) {
      try {
        const timestamp = parseInt(lastCheck, 10);
        if (!isNaN(timestamp)) {
          dispatchSystemState({
            type: "set-last-check-update",
            payload: new Date(timestamp).toLocaleString(),
          });
        }
      } catch (e) {
        console.error("Error parsing last check update time", e);
      }
    }
    return () => {
      if (timeoutId !== undefined) {
        window.clearTimeout(timeoutId);
      }
    };
  }, [dispatchSystemState]);

  // 自动检查更新逻辑已禁用
  // useSWR(...);

  // 导航到设置页面
  const goToSettings = useCallback(() => {
    navigate("/settings");
  }, [navigate]);

  // 切换自启动状态
  const toggleAutoLaunch = useCallback(async () => {
    if (!verge) return;
    try {
      await patchVerge({ enable_auto_launch: !verge.enable_auto_launch });
    } catch (err) {
      console.error("切换开机自启动状态失败:", err);
    }
  }, [verge, patchVerge]);

  // 检查更新
  const onCheckUpdate = useLockFn(async () => {
    try {
      const info = await checkUpdate();
      if (!info?.available) {
        showNotice("success", t("Currently on the Latest Version"));
      } else {
        showNotice("info", t("Update Available"), 2000);
        goToSettings();
      }
    } catch (err: any) {
      showNotice("error", err.message || err.toString());
    }
  });

  // 是否启用自启动
  const autoLaunchEnabled = useMemo(
    () => verge?.enable_auto_launch || false,
    [verge],
  );

  // 运行模式样式
  const runningModeStyle = useMemo(
    () => ({
      // Sidecar或纯管理员模式允许安装服务
      cursor:
        isSidecarMode || (isAdminMode && isSidecarMode) ? "pointer" : "default",
      textDecoration:
        isSidecarMode || (isAdminMode && isSidecarMode) ? "underline" : "none",
      display: "flex",
      alignItems: "center",
      gap: 0.5,
      "&:hover": {
        opacity: isSidecarMode || (isAdminMode && isSidecarMode) ? 0.7 : 1,
      },
    }),
    [isSidecarMode, isAdminMode],
  );

  // 获取模式图标和文本
  const getModeIcon = () => {
    if (isAdminMode) {
      // 判断是否为组合模式（管理员+服务）
      if (!isSidecarMode) {
        return (
          <>
            <AdminPanelSettingsOutlined
              sx={{ color: "primary.main", fontSize: 16 }}
              titleAccess={t("Administrator Mode")}
            />
            <DnsOutlined
              sx={{ color: "success.main", fontSize: 16, ml: 0.5 }}
              titleAccess={t("Service Mode")}
            />
          </>
        );
      }
      return (
        <AdminPanelSettingsOutlined
          sx={{ color: "primary.main", fontSize: 16 }}
          titleAccess={t("Administrator Mode")}
        />
      );
    } else if (isSidecarMode) {
      return (
        <ExtensionOutlined
          sx={{ color: "info.main", fontSize: 16 }}
          titleAccess={t("Sidecar Mode")}
        />
      );
    } else {
      return (
        <DnsOutlined
          sx={{ color: "success.main", fontSize: 16 }}
          titleAccess={t("Service Mode")}
        />
      );
    }
  };

  // 获取模式文本
  const getModeText = () => {
    if (isAdminMode) {
      // 判断是否同时处于服务模式
      if (!isSidecarMode) {
        return t("Administrator + Service Mode");
      }
      return t("Administrator Mode");
    } else if (isSidecarMode) {
      return t("Sidecar Mode");
    } else {
      return t("Service Mode");
    }
  };

  // 只有当verge存在时才渲染内容
  if (!verge) return null;

  return (
    <EnhancedCard
      title={t("System Info")}
      icon={<InfoOutlined />}
      iconColor="error"
      action={
        <IconButton
          size="small"
          onClick={goToSettings}
          title={t("Settings")}
          sx={{
            width: "24px",
            height: "24px",
            "& svg": { fontSize: "16px" },
          }}
        >
          <SettingsOutlined />
        </IconButton>
      }
    >
      <Stack spacing={0}>
        {/* OS Info */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            py: 0.75,
            borderBottom: "1px solid",
            borderColor: "divider",
          }}
        >
          <Typography
            variant="body2"
            sx={{
              fontSize: "10px",
              color: "text.disabled",
              opacity: 0.6,
              textTransform: "uppercase",
              letterSpacing: "0.5px",
            }}
          >
            {t("OS Info")}
          </Typography>
          <Typography
            variant="body2"
            sx={{
              fontSize: "11px",
              fontWeight: 500,
              maxWidth: "60%",
              textAlign: "right",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {systemState.osInfo}
          </Typography>
        </Box>

        {/* Auto Launch */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            py: 0.75,
            borderBottom: "1px solid",
            borderColor: "divider",
          }}
        >
          <Typography
            variant="body2"
            sx={{
              fontSize: "10px",
              color: "text.disabled",
              opacity: 0.6,
              textTransform: "uppercase",
              letterSpacing: "0.5px",
            }}
          >
            {t("Auto Launch")}
          </Typography>
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
            {isAdminMode && (
              <Tooltip
                title={t("Administrator mode may not support auto launch")}
              >
                <WarningOutlined
                  sx={{ color: "warning.main", fontSize: "14px" }}
                />
              </Tooltip>
            )}
            <Chip
              size="small"
              label={autoLaunchEnabled ? t("On") : t("Off")}
              color={autoLaunchEnabled ? "success" : "default"}
              variant="outlined"
              onClick={toggleAutoLaunch}
              sx={{
                cursor: "pointer",
                height: "20px",
                fontSize: "9px",
                "& .MuiChip-label": {
                  px: 1,
                },
              }}
            />
          </Box>
        </Box>

        {/* Version */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            py: 0.75,
          }}
        >
          <Typography
            variant="body2"
            sx={{
              fontSize: "10px",
              color: "text.disabled",
              opacity: 0.6,
              textTransform: "uppercase",
              letterSpacing: "0.5px",
            }}
          >
            {t("Version")}
          </Typography>
          <Typography
            variant="body2"
            sx={{ fontSize: "11px", fontWeight: 500 }}
          >
            v{appVersion}
          </Typography>
        </Box>
      </Stack>
    </EnhancedCard>
  );
};
