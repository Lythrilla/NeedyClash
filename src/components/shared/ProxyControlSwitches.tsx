import {
  SettingsRounded,
  BuildRounded,
} from "@mui/icons-material";
import { Box, Typography, alpha, Button } from "@mui/material";
import { useLockFn } from "ahooks";
import React, { useRef, useCallback } from "react";
import { useTranslation } from "react-i18next";

import { DialogRef, Switch } from "@/components/base";
import { TooltipIcon } from "@/components/base/base-tooltip-icon";
import { GuardState } from "@/components/setting/mods/guard-state";
import { SysproxyViewer } from "@/components/setting/mods/sysproxy-viewer";
import { TunViewer } from "@/components/setting/mods/tun-viewer";
import { useSystemProxyState } from "@/hooks/use-system-proxy-state";
import { useSystemState } from "@/hooks/use-system-state";
import { useVerge } from "@/hooks/use-verge";
import { useServiceInstaller } from "@/hooks/useServiceInstaller";
import { showNotice } from "@/services/noticeService";

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

/**
 * 极简轻量开关 UI - 最小化设计
 */
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
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 1.5,
        px: 0,
        py: 1,
        opacity: disabled ? 0.4 : 1,
        transition: "opacity 0.15s ease",
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          flex: 1,
          gap: 1,
          minWidth: 0,
        }}
      >
        <Typography
          sx={{
            fontSize: 12,
            fontWeight: 400,
            color: "text.secondary",
            flex: 1,
            minWidth: 0,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {label}
        </Typography>
        {infoTitle && (
          <TooltipIcon
            title={infoTitle}
            icon={SettingsRounded}
            onClick={onInfoClick}
            sx={{ fontSize: 14, opacity: 0.4, flexShrink: 0 }}
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
  const { installServiceAndRestartCore } = useServiceInstaller();
  const { actualState: systemProxyActualState, toggleSystemProxy } =
    useSystemProxyState();
  const {
    isServiceMode,
    isTunModeAvailable,
    mutateRunningMode,
    mutateServiceOk,
  } = useSystemState();

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

  const onInstallService = useLockFn(async () => {
    try {
      await installServiceAndRestartCore();
      await mutateRunningMode();
      await mutateServiceOk();
    } catch (err) {
      showNotice("error", (err as Error).message || String(err));
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
          
          {/* 状态提示 - 极简设计 */}
          {!isTunModeAvailable && (
            <Typography
              variant="caption"
              sx={{
                fontSize: 10,
                lineHeight: 1.4,
                color: "text.disabled",
                display: "block",
                mt: 0.5,
                mb: 1,
              }}
            >
              {t("TUN requires Service Mode or Admin Mode")}
            </Typography>
          )}
          
          {/* 服务安装/卸载按钮 - 更轻量 */}
          {!isServiceMode && (
            <Box sx={{ mt: 1 }}>
              <Button
                variant="text"
                size="small"
                startIcon={<BuildRounded sx={{ fontSize: "14px" }} />}
                onClick={onInstallService}
                sx={{
                  width: "100%",
                  py: 0.75,
                  px: 1,
                  fontSize: "11px",
                  fontWeight: 500,
                  textTransform: "none",
                  color: "primary.main",
                  backgroundColor: (theme) => alpha(theme.palette.primary.main, 0.06),
                  transition: "all 0.2s",
                  "&:hover": {
                    backgroundColor: (theme) => alpha(theme.palette.primary.main, 0.12),
                  },
                  "& .MuiButton-startIcon": {
                    marginRight: "6px",
                  },
                }}
              >
                {t("Install Service")}
              </Button>
            </Box>
          )}
        </>
      )}

      <SysproxyViewer ref={sysproxyRef} />
      <TunViewer ref={tunRef} />
    </Box>
  );
};

export default ProxyControlSwitches;
