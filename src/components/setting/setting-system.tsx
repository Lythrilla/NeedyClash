import {
  ComputerOutlined,
  BuildRounded,
  DeleteOutlined,
  RefreshRounded,
} from "@mui/icons-material";
import {
  Button,
  Box,
  Stack,
  Typography,
  CircularProgress,
} from "@mui/material";
import { useLockFn } from "ahooks";
import React, { useRef } from "react";
import { useTranslation } from "react-i18next";
import { mutate } from "swr";

import { DialogRef, Switch } from "@/components/base";
import { TooltipIcon } from "@/components/base/base-tooltip-icon";
import { useServiceManager } from "@/hooks/use-service-manager";
import { useSystemProxyState } from "@/hooks/use-system-proxy-state";
import { useSystemState } from "@/hooks/use-system-state";
import { useTunMode } from "@/hooks/use-tun-mode";
import { useVerge } from "@/hooks/use-verge";
import { showNotice } from "@/services/noticeService";

import { GuardState } from "./mods/guard-state";
import { SettingList, SettingItem } from "./mods/setting-comp";
import { SysproxyViewer } from "./mods/sysproxy-viewer";
import { TunViewer } from "./mods/tun-viewer";
import {
  installButtonStyles,
  reinstallButtonStyles,
  uninstallButtonStyles,
  warningTextStyles,
  serviceContainerStyles,
} from "./setting-system-styles";

interface Props {
  onError?: (err: Error) => void;
}

const SettingSystem = ({ onError }: Props) => {
  const { t } = useTranslation();

  const { verge, mutateVerge, patchVerge } = useVerge();
  const {
    installServiceAndRestartCore,
    reinstallServiceAndRestartCore,
    uninstallServiceAndRestartCore,
    isInstalling,
    isReinstalling,
    isUninstalling,
  } = useServiceManager();
  const { actualState: systemProxyActualState, toggleSystemProxy } =
    useSystemProxyState();
  const { isAdminMode, isServiceMode, isTunModeAvailable } = useSystemState();
  const {
    enableTunMode,
    isToggling: isTunToggling,
    toggleTunMode,
  } = useTunMode();

  const { enable_auto_launch, enable_silent_start } = verge ?? {};

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
    const result = await toggleTunMode(value);
    if (!result.success) {
      throw new Error(result.error || "Failed to toggle TUN mode");
    }
  };

  const onInstallService = useLockFn(async () => {
    try {
      await installServiceAndRestartCore();
    } catch (err) {
      // 错误已经在 hook 中处理
      console.error("[SettingSystem] 安装服务失败:", err);
    }
  });

  const onReinstallService = useLockFn(async () => {
    try {
      await reinstallServiceAndRestartCore();
    } catch (err) {
      // 错误已经在 hook 中处理
      console.error("[SettingSystem] 重装服务失败:", err);
    }
  });

  const onUninstallService = useLockFn(async () => {
    try {
      await uninstallServiceAndRestartCore();
    } catch (err) {
      // 错误已经在 hook 中处理
      console.error("[SettingSystem] 卸载服务失败:", err);
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
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            {isTunToggling && (
              <CircularProgress size={16} sx={{ color: "text.secondary" }} />
            )}
            <TooltipIcon
              title={t("Tun Mode Info")}
              icon={ComputerOutlined}
              onClick={() => tunRef.current?.open()}
              sx={{ opacity: "0.7", cursor: "pointer" }}
            />
          </Box>
        }
      >
        <GuardState
          value={enableTunMode}
          valueProps="checked"
          onCatch={onError}
          onFormat={onSwitchFormat}
          onGuard={handleTunToggle}
        >
          <Switch edge="end" disabled={!isTunModeAvailable || isTunToggling} />
        </GuardState>
      </SettingItem>

      {/* 服务管理按钮区域 */}
      <Box sx={serviceContainerStyles}>
        {!isServiceMode ? (
          <Stack spacing={1}>
            {/* 提示文本 */}
            {!isAdminMode && (
              <Typography variant="caption" sx={warningTextStyles}>
                {t("Service Installation Requires Administrator")}
              </Typography>
            )}
            {/* 安装服务按钮 */}
            <Button
              variant="text"
              size="small"
              startIcon={
                isInstalling ? (
                  <CircularProgress size={14} sx={{ color: "inherit" }} />
                ) : (
                  <BuildRounded sx={{ fontSize: "14px" }} />
                )
              }
              onClick={onInstallService}
              disabled={isInstalling}
              sx={installButtonStyles}
            >
              {isInstalling ? t("Installing...") : t("Install Service")}
            </Button>
          </Stack>
        ) : (
          <Stack spacing={1}>
            {/* 提示文本 */}
            {!isAdminMode && (
              <Typography variant="caption" sx={warningTextStyles}>
                {t("Service Management Requires Administrator")}
              </Typography>
            )}
            {/* 重装和卸载按钮 */}
            <Stack direction="row" spacing={1}>
              <Button
                variant="text"
                size="small"
                startIcon={
                  isReinstalling ? (
                    <CircularProgress size={14} sx={{ color: "inherit" }} />
                  ) : (
                    <RefreshRounded sx={{ fontSize: "14px" }} />
                  )
                }
                onClick={onReinstallService}
                disabled={isReinstalling || isUninstalling}
                sx={{ ...reinstallButtonStyles, flex: 1 }}
              >
                {isReinstalling ? t("Reinstalling...") : t("Reinstall Service")}
              </Button>
              <Button
                variant="text"
                size="small"
                startIcon={
                  isUninstalling ? (
                    <CircularProgress size={14} sx={{ color: "inherit" }} />
                  ) : (
                    <DeleteOutlined sx={{ fontSize: "14px" }} />
                  )
                }
                onClick={onUninstallService}
                disabled={isUninstalling || isReinstalling}
                sx={{ ...uninstallButtonStyles, flex: 1 }}
              >
                {isUninstalling ? t("Uninstalling...") : t("Uninstall Service")}
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
