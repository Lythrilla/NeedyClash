import { ComputerOutlined, BuildRounded, DeleteOutlined, RefreshRounded } from "@mui/icons-material";
import { Button, alpha, Box, Stack, Typography } from "@mui/material";
import { useLockFn } from "ahooks";
import React, { useRef } from "react";
import { useTranslation } from "react-i18next";
import { mutate } from "swr";

import { DialogRef, Switch } from "@/components/base";
import { TooltipIcon } from "@/components/base/base-tooltip-icon";
import { useSystemProxyState } from "@/hooks/use-system-proxy-state";
import { useSystemState } from "@/hooks/use-system-state";
import { useVerge } from "@/hooks/use-verge";
import { useServiceInstaller } from "@/hooks/useServiceInstaller";
import { useServiceUninstaller } from "@/hooks/useServiceUninstaller";
import { showNotice } from "@/services/noticeService";

import { GuardState } from "./mods/guard-state";
import { SettingList, SettingItem } from "./mods/setting-comp";
import { SysproxyViewer } from "./mods/sysproxy-viewer";
import { TunViewer } from "./mods/tun-viewer";

interface Props {
  onError?: (err: Error) => void;
}

const SettingSystem = ({ onError }: Props) => {
  const { t } = useTranslation();

  const { verge, mutateVerge, patchVerge } = useVerge();
  const { installServiceAndRestartCore, reinstallServiceAndRestartCore } = useServiceInstaller();
  const { uninstallServiceAndRestartCore } = useServiceUninstaller();
  const { actualState: systemProxyActualState, toggleSystemProxy } = useSystemProxyState();
  const { 
    isAdminMode, 
    isServiceMode,
    isTunModeAvailable,
    mutateRunningMode,
    mutateServiceOk,
  } = useSystemState();

  const { enable_auto_launch, enable_silent_start, enable_tun_mode, enable_system_proxy } = verge ?? {};

  const sysproxyRef = useRef<DialogRef>(null);
  const tunRef = useRef<DialogRef>(null);

  const onSwitchFormat = (
    _e: React.ChangeEvent<HTMLInputElement>,
    value: boolean,
  ) => value;
  const onChangeData = (patch: Partial<IVergeConfig>) => {
    mutateVerge({ ...verge, ...patch }, false);
  };

  const handleTunToggle = async (value: boolean) => {
    if (!isTunModeAvailable) {
      const msg = "TUN requires Service Mode or Admin Mode";
      showNotice("error", t(msg));
      throw new Error(t(msg));
    }
    mutateVerge({ ...verge, enable_tun_mode: value }, false);
    await patchVerge({ enable_tun_mode: value });
  };

  const onInstallService = useLockFn(async () => {
    try {
      await installServiceAndRestartCore();
      // 等待服务状态更新
      await new Promise(resolve => setTimeout(resolve, 500));
      await mutateRunningMode();
      await mutateServiceOk();
    } catch (err) {
      showNotice("error", (err as Error).message || String(err));
    }
  });

  const onReinstallService = useLockFn(async () => {
    try {
      await reinstallServiceAndRestartCore();
      // 等待服务状态更新
      await new Promise(resolve => setTimeout(resolve, 500));
      await mutateRunningMode();
      await mutateServiceOk();
    } catch (err) {
      showNotice("error", (err as Error).message || String(err));
    }
  });

  const onUninstallService = useLockFn(async () => {
    try {
      await uninstallServiceAndRestartCore();
      // 等待服务状态更新
      await new Promise(resolve => setTimeout(resolve, 500));
      await mutateRunningMode();
      await mutateServiceOk();
    } catch (err) {
      showNotice("error", (err as Error).message || String(err));
    }
  });

  return (
    <SettingList
      title={t("System Setting")}
      icon={<ComputerOutlined />}
      description={t("System proxy, TUN mode and startup settings")}
    >
      <SysproxyViewer ref={sysproxyRef} />
      <TunViewer ref={tunRef} />

      <SettingItem
        label={t("System Proxy")}
        extra={
          <TooltipIcon
            title={t("System Proxy Info")}
            icon={ComputerOutlined}
            onClick={() => sysproxyRef.current?.open()}
            sx={{ opacity: "0.7", cursor: "pointer" }}
          />
        }
      >
        <GuardState
          value={systemProxyActualState}
          valueProps="checked"
          onCatch={onError}
          onFormat={onSwitchFormat}
          onGuard={(e) => toggleSystemProxy(e)}
        >
          <Switch edge="end" />
        </GuardState>
      </SettingItem>

      <SettingItem
        label={t("Tun Mode")}
        extra={
          <TooltipIcon
            title={t("Tun Mode Info")}
            icon={ComputerOutlined}
            onClick={() => tunRef.current?.open()}
            sx={{ opacity: "0.7", cursor: "pointer" }}
          />
        }
      >
        <GuardState
          value={enable_tun_mode ?? false}
          valueProps="checked"
          onCatch={onError}
          onFormat={onSwitchFormat}
          onGuard={handleTunToggle}
        >
          <Switch edge="end" disabled={!isTunModeAvailable} />
        </GuardState>
      </SettingItem>

      {/* 服务管理按钮区域 */}
      <Box
        sx={{
          py: 1.25,
          px: 2,
          mb: 0,
          borderBottom: (theme) =>
            `1px solid ${theme.palette.mode === "dark" ? "rgba(255, 255, 255, 0.03)" : "rgba(0, 0, 0, 0.03)"}`,
        }}
      >
        {!isServiceMode ? (
          <Stack spacing={1}>
            {/* 提示文本 */}
            {!isAdminMode && (
              <Typography
                variant="caption"
                sx={{
                  fontSize: "10px",
                  color: "warning.main",
                  display: "flex",
                  alignItems: "center",
                  gap: 0.5,
                }}
              >
                {t("Service Installation Requires Administrator")}
              </Typography>
            )}
            {/* 安装服务按钮 */}
            <Button
              variant="text"
              size="small"
              startIcon={<BuildRounded sx={{ fontSize: "14px" }} />}
              onClick={onInstallService}
              sx={{
                width: "100%",
                py: 0.75,
                px: 1.5,
                fontSize: "12px",
                fontWeight: 500,
                textTransform: "none",
                color: "primary.main",
                backgroundColor: (theme) => alpha(theme.palette.primary.main, 0.08),
                transition: "all 0.2s",
                "&:hover": {
                  backgroundColor: (theme) => alpha(theme.palette.primary.main, 0.15),
                },
                "& .MuiButton-startIcon": {
                  marginRight: "8px",
                },
              }}
            >
              {t("Install Service")}
            </Button>
          </Stack>
        ) : (
          <Stack spacing={1}>
            {/* 提示文本 */}
            {!isAdminMode && (
              <Typography
                variant="caption"
                sx={{
                  fontSize: "10px",
                  color: "warning.main",
                  display: "flex",
                  alignItems: "center",
                  gap: 0.5,
                }}
              >
                {t("Service Management Requires Administrator")}
              </Typography>
            )}
            {/* 重装和卸载按钮 */}
            <Stack direction="row" spacing={1}>
              <Button
                variant="text"
                size="small"
                startIcon={<RefreshRounded sx={{ fontSize: "14px" }} />}
                onClick={onReinstallService}
                sx={{
                  flex: 1,
                  py: 0.75,
                  px: 1.5,
                  fontSize: "12px",
                  fontWeight: 500,
                  textTransform: "none",
                  color: "success.main",
                  backgroundColor: (theme) => alpha(theme.palette.success.main, 0.08),
                  transition: "all 0.2s",
                  "&:hover": {
                    backgroundColor: (theme) => alpha(theme.palette.success.main, 0.15),
                  },
                  "& .MuiButton-startIcon": {
                    marginRight: "6px",
                  },
                }}
              >
                {t("Reinstall Service")}
              </Button>
              <Button
                variant="text"
                size="small"
                startIcon={<DeleteOutlined sx={{ fontSize: "14px" }} />}
                onClick={onUninstallService}
                sx={{
                  flex: 1,
                  py: 0.75,
                  px: 1.5,
                  fontSize: "12px",
                  fontWeight: 500,
                  textTransform: "none",
                  color: "error.main",
                  backgroundColor: (theme) => alpha(theme.palette.error.main, 0.08),
                  transition: "all 0.2s",
                  "&:hover": {
                    backgroundColor: (theme) => alpha(theme.palette.error.main, 0.15),
                  },
                  "& .MuiButton-startIcon": {
                    marginRight: "6px",
                  },
                }}
              >
                {t("Uninstall Service")}
              </Button>
            </Stack>
          </Stack>
        )}
      </Box>

      <SettingItem
        label={t("Auto Launch")}
        extra={
          isAdminMode && (
            <TooltipIcon
              title={t("Administrator mode may not support auto launch")}
              sx={{ opacity: "0.7" }}
            />
          )
        }
      >
        <GuardState
          value={enable_auto_launch ?? false}
          valueProps="checked"
          onCatch={onError}
          onFormat={onSwitchFormat}
          onChange={(e) => {
            // 管理员模式检查
            onChangeData({ enable_auto_launch: e });
          }}
          onGuard={async (e) => {
            if (isAdminMode) {
              showNotice(
                "info",
                t("Administrator mode may not support auto launch"),
              );
            }

            try {
              // 立即UI反馈
              onChangeData({ enable_auto_launch: e });
              await patchVerge({ enable_auto_launch: e });
              await mutate("getAutoLaunchStatus");
              return Promise.resolve();
            } catch (error) {
              // 如果出错，恢复原始状态
              onChangeData({ enable_auto_launch: !e });
              return Promise.reject(error);
            }
          }}
        >
          <Switch edge="end" />
        </GuardState>
      </SettingItem>

      <SettingItem
        label={t("Silent Start")}
        extra={
          <TooltipIcon title={t("Silent Start Info")} sx={{ opacity: "0.7" }} />
        }
      >
        <GuardState
          value={enable_silent_start ?? false}
          valueProps="checked"
          onCatch={onError}
          onFormat={onSwitchFormat}
          onChange={(e) => onChangeData({ enable_silent_start: e })}
          onGuard={(e) => patchVerge({ enable_silent_start: e })}
        >
          <Switch edge="end" />
        </GuardState>
      </SettingItem>
    </SettingList>
  );
};

export default SettingSystem;
