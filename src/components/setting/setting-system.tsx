import { ComputerOutlined, BuildRounded } from "@mui/icons-material";
import { Button, alpha, Box } from "@mui/material";
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
  const { installServiceAndRestartCore } = useServiceInstaller();
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

      {!isServiceMode && (
        <Box
          sx={{
            py: 1.25,
            px: 2,
            mb: 0,
            borderBottom: (theme) =>
              `1px solid ${theme.palette.mode === "dark" ? "rgba(255, 255, 255, 0.03)" : "rgba(0, 0, 0, 0.03)"}`,
          }}
        >
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
              borderRadius: "6px",
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
        </Box>
      )}

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
            // 移除管理员模式检查提示
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
              // 先触发UI更新立即看到反馈
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
