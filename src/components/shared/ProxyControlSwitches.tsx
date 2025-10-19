import {
  SettingsRounded,
  BuildRounded,
  RefreshRounded,
  DeleteOutlined,
} from "@mui/icons-material";
import { Box, Typography, Button, Stack } from "@mui/material";
import { useLockFn } from "ahooks";
import React, { useRef, useCallback } from "react";
import { useTranslation } from "react-i18next";

import { DialogRef, Switch } from "@/components/base";
import { TooltipIcon } from "@/components/base/base-tooltip-icon";
import { GuardState } from "@/components/setting/mods/guard-state";
import { SysproxyViewer } from "@/components/setting/mods/sysproxy-viewer";
import { TunViewer } from "@/components/setting/mods/tun-viewer";
import { useServiceManager } from "@/hooks/use-service-manager";
import { useSystemProxyState } from "@/hooks/use-system-proxy-state";
import { useSystemState } from "@/hooks/use-system-state";
import { useVerge } from "@/hooks/use-verge";
import { showNotice } from "@/services/noticeService";

import {
  SWITCH_ROW_CONTAINER,
  LABEL_STYLE,
  HINT_TEXT_STYLES,
  ICON_STYLE,
  SERVICE_BUTTON_STYLES,
} from "./proxy-control-styles";

interface ProxySwitchProps {
  label?: string;
  onError?: (err: Error) => void;
  noRightPadding?: boolean;
}

interface SwitchRowProps {
  label: string;
  active: boolean;
  disabled?: boolean;
  infoTitle: string;
  onInfoClick?: () => void;
  extraIcons?: React.ReactNode;
  onToggle: (value: boolean) => Promise<void>;
  onError?: (err: Error) => void;
  highlight?: boolean;
}

const SwitchRow = ({
  label,
  active,
  disabled,
  infoTitle,
  onInfoClick,
  extraIcons,
  onToggle,
  onError,
  highlight,
}: SwitchRowProps) => {
  return (
    <Box sx={{ ...SWITCH_ROW_CONTAINER, opacity: disabled ? 0.4 : 1 }}>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          flex: 1,
          gap: 1,
          minWidth: 0,
        }}
      >
        <Typography sx={LABEL_STYLE}>{label}</Typography>
        {infoTitle && (
          <TooltipIcon
            title={infoTitle}
            icon={SettingsRounded}
            onClick={onInfoClick}
            sx={ICON_STYLE}
          />
        )}
        {extraIcons}
      </Box>

      <GuardState
        value={active}
        valueProps="checked"
        onCatch={onError}
        onFormat={(_, v) => v}
        onGuard={onToggle}
      >
        <Switch edge="end" disabled={disabled} size="small" />
      </GuardState>
    </Box>
  );
};

const ProxyControlSwitches = ({
  label,
  onError,
  noRightPadding = false,
}: ProxySwitchProps) => {
  const { t } = useTranslation();
  const { verge, mutateVerge, patchVerge } = useVerge();
  const {
    installServiceAndRestartCore,
    reinstallServiceAndRestartCore,
    uninstallServiceAndRestartCore,
  } = useServiceManager();
  const { actualState: systemProxyActualState, toggleSystemProxy } =
    useSystemProxyState();
  const { isAdminMode, isServiceMode, isServiceOk, isTunModeAvailable } =
    useSystemState();

  const sysproxyRef = useRef<DialogRef>(null);
  const tunRef = useRef<DialogRef>(null);

  const { enable_tun_mode, enable_system_proxy } = verge ?? {};

  const showErrorNotice = useCallback(
    (msg: string) => showNotice("error", t(msg)),
    [t],
  );

  const handleTunToggle = async (value: boolean) => {
    if (!isTunModeAvailable) {
      const msg = "TUN requires Service Mode or Admin Mode";
      showErrorNotice(msg);
      throw new Error(t(msg));
    }
    mutateVerge({ ...verge, enable_tun_mode: value }, false);
    await patchVerge({ enable_tun_mode: value });
  };

  // 服务操作已经包含状态更新逻辑，无需额外处理
  const onInstallService = useLockFn(async () => {
    try {
      await installServiceAndRestartCore();
    } catch (err) {
      // 错误已在 Hook 中处理，这里只记录日志
      console.error("[ProxyControlSwitches] 安装服务失败:", err);
    }
  });

  const onReinstallService = useLockFn(async () => {
    try {
      await reinstallServiceAndRestartCore();
    } catch (err) {
      console.error("[ProxyControlSwitches] 重装服务失败:", err);
    }
  });

  const onUninstallService = useLockFn(async () => {
    try {
      await uninstallServiceAndRestartCore();
    } catch (err) {
      console.error("[ProxyControlSwitches] 卸载服务失败:", err);
    }
  });

  const isSystemProxyMode = label === t("System Proxy") || !label;
  const isTunMode = label === t("Tun Mode");

  return (
    <Box sx={{ width: "100%", pr: noRightPadding ? 1 : 2 }}>
      {isSystemProxyMode && (
        <SwitchRow
          label={t("System Proxy")}
          active={systemProxyActualState}
          infoTitle={t("System Proxy Info")}
          onInfoClick={() => sysproxyRef.current?.open()}
          onToggle={(value) => toggleSystemProxy(value)}
          onError={onError}
          highlight={enable_system_proxy}
        />
      )}

      {isTunMode && (
        <>
          <SwitchRow
            label={t("Tun Mode")}
            active={!!enable_tun_mode}
            infoTitle={t("Tun Mode Info")}
            onInfoClick={() => tunRef.current?.open()}
            onToggle={handleTunToggle}
            onError={onError}
            disabled={!isTunModeAvailable}
            highlight={!!enable_tun_mode}
          />

          {/* 状态提示 */}
          {!isTunModeAvailable && (
            <Typography variant="caption" sx={HINT_TEXT_STYLES.caption}>
              {t("TUN requires Service Mode or Admin Mode")}
            </Typography>
          )}

          {/* 服务管理按钮 */}
          <Box sx={{ mt: 1 }}>
            {!isServiceOk ? (
              <Stack spacing={0.75}>
                {/* 提示文本 */}
                {!isAdminMode && (
                  <Typography variant="caption" sx={HINT_TEXT_STYLES.warning}>
                    {t("Service Installation Requires Administrator")}
                  </Typography>
                )}
                {/* 安装服务按钮 */}
                <Button
                  variant="text"
                  size="small"
                  startIcon={<BuildRounded sx={{ fontSize: "14px" }} />}
                  onClick={onInstallService}
                  sx={{ width: "100%", ...SERVICE_BUTTON_STYLES.install }}
                >
                  {t("Install Service")}
                </Button>
              </Stack>
            ) : (
              <Stack spacing={0.75}>
                {/* 提示文本 */}
                {!isAdminMode && (
                  <Typography variant="caption" sx={HINT_TEXT_STYLES.warning}>
                    {t("Service Management Requires Administrator")}
                  </Typography>
                )}
                {/* 重装和卸载按钮 */}
                <Stack direction="row" spacing={0.75}>
                  <Button
                    variant="text"
                    size="small"
                    startIcon={<RefreshRounded sx={{ fontSize: "13px" }} />}
                    onClick={onReinstallService}
                    sx={{ flex: 1, ...SERVICE_BUTTON_STYLES.reinstall }}
                  >
                    {t("Reinstall Service")}
                  </Button>
                  <Button
                    variant="text"
                    size="small"
                    startIcon={<DeleteOutlined sx={{ fontSize: "13px" }} />}
                    onClick={onUninstallService}
                    sx={{ flex: 1, ...SERVICE_BUTTON_STYLES.uninstall }}
                  >
                    {t("Uninstall Service")}
                  </Button>
                </Stack>
              </Stack>
            )}
          </Box>
        </>
      )}

      <SysproxyViewer ref={sysproxyRef} />
      <TunViewer ref={tunRef} />
    </Box>
  );
};

export default ProxyControlSwitches;
