import { Shuffle } from "@mui/icons-material";
import {
  Box,
  CircularProgress,
  IconButton,
  Stack,
  TextField,
} from "@mui/material";
import { useLockFn, useRequest } from "ahooks";
import { forwardRef, useImperativeHandle, useState } from "react";
import { useTranslation } from "react-i18next";

import { BaseDialog, Switch } from "@/components/base";
import { useClashInfo } from "@/hooks/use-clash";
import { useVerge } from "@/hooks/use-verge";
import { showNotice } from "@/services/noticeService";
import getSystem from "@/utils/get-system";
import {
  validatePort,
  detectPortConflicts,
  PORT_RANGE,
} from "@/utils/port-validator";

import {
  EnhancedDialogTitle,
  EnhancedFormItem,
  EnhancedFormGroup,
} from "./enhanced-dialog-components";

const OS = getSystem();

interface ClashPortViewerRef {
  open: () => void;
  close: () => void;
}

const generateRandomPort = () =>
  Math.floor(Math.random() * (PORT_RANGE.MAX - 1025 + 1)) + 1025;

export const ClashPortViewer = forwardRef<ClashPortViewerRef>((_, ref) => {
  const { t } = useTranslation();
  const { clashInfo, patchInfo } = useClashInfo();
  const { verge, patchVerge } = useVerge();
  const [open, setOpen] = useState(false);

  // Mixed Port
  const [mixedPort, setMixedPort] = useState(
    verge?.verge_mixed_port ?? clashInfo?.mixed_port ?? 7897,
  );

  // 其他端口状态
  const [socksPort, setSocksPort] = useState(verge?.verge_socks_port ?? 7898);
  const [socksEnabled, setSocksEnabled] = useState(
    verge?.verge_socks_enabled ?? false,
  );
  const [httpPort, setHttpPort] = useState(verge?.verge_port ?? 7899);
  const [httpEnabled, setHttpEnabled] = useState(
    verge?.verge_http_enabled ?? false,
  );
  const [redirPort, setRedirPort] = useState(verge?.verge_redir_port ?? 7895);
  const [redirEnabled, setRedirEnabled] = useState(
    verge?.verge_redir_enabled ?? false,
  );
  const [tproxyPort, setTproxyPort] = useState(
    verge?.verge_tproxy_port ?? 7896,
  );
  const [tproxyEnabled, setTproxyEnabled] = useState(
    verge?.verge_tproxy_enabled ?? false,
  );

  const { loading, run: saveSettings } = useRequest(
    async (params: { clashConfig: any; vergeConfig: any }) => {
      const { clashConfig, vergeConfig } = params;
      await Promise.all([patchInfo(clashConfig), patchVerge(vergeConfig)]);
    },
    {
      manual: true,
      onSuccess: () => {
        setOpen(false);
        showNotice("success", t("Port settings saved"));
      },
      onError: () => {
        showNotice("error", t("Failed to save port settings"));
      },
    },
  );

  useImperativeHandle(ref, () => ({
    open: () => {
      setMixedPort(verge?.verge_mixed_port ?? clashInfo?.mixed_port ?? 7897);
      setSocksPort(verge?.verge_socks_port ?? 7898);
      setSocksEnabled(verge?.verge_socks_enabled ?? false);
      setHttpPort(verge?.verge_port ?? 7899);
      setHttpEnabled(verge?.verge_http_enabled ?? false);
      setRedirPort(verge?.verge_redir_port ?? 7895);
      setRedirEnabled(verge?.verge_redir_enabled ?? false);
      setTproxyPort(verge?.verge_tproxy_port ?? 7896);
      setTproxyEnabled(verge?.verge_tproxy_enabled ?? false);
      setOpen(true);
    },
    close: () => setOpen(false),
  }));

  const onSave = useLockFn(async () => {
    // 端口冲突检测
    const activePorts = [
      mixedPort,
      socksEnabled ? socksPort : undefined,
      httpEnabled ? httpPort : undefined,
      redirEnabled ? redirPort : undefined,
      tproxyEnabled ? tproxyPort : undefined,
    ];

    if (detectPortConflicts(activePorts)) {
      showNotice("error", t("Port conflict detected"));
      return;
    }

    // 验证端口范围
    const portsToValidate = activePorts.filter((p) => p != null) as number[];
    if (!portsToValidate.every(validatePort)) {
      showNotice(
        "error",
        t(`Port must be between ${PORT_RANGE.MIN} and ${PORT_RANGE.MAX}`),
      );
      return;
    }

    // 准备配置数据
    const clashConfig = {
      "mixed-port": mixedPort,
      "socks-port": socksPort,
      port: httpPort,
      "redir-port": redirPort,
      "tproxy-port": tproxyPort,
    };

    const vergeConfig = {
      verge_mixed_port: mixedPort,
      verge_socks_port: socksPort,
      verge_socks_enabled: socksEnabled,
      verge_port: httpPort,
      verge_http_enabled: httpEnabled,
      verge_redir_port: redirPort,
      verge_redir_enabled: redirEnabled,
      verge_tproxy_port: tproxyPort,
      verge_tproxy_enabled: tproxyEnabled,
    };

    // 提交保存请求
    await saveSettings({ clashConfig, vergeConfig });
  });

  return (
    <BaseDialog
      open={open}
      title=""
      contentSx={{ width: 520, maxHeight: 680, px: 3, py: 3 }}
      okBtn={
        loading ? (
          <Stack direction="row" alignItems="center" spacing={1}>
            <CircularProgress
              size={20}
              sx={{
                "& svg circle": {
                  strokeLinecap: "round",
                },
              }}
            />
            {t("Saving...")}
          </Stack>
        ) : (
          t("Save")
        )
      }
      cancelBtn={t("Cancel")}
      onClose={() => setOpen(false)}
      onCancel={() => setOpen(false)}
      onOk={onSave}
    >
      <EnhancedDialogTitle title={t("Port Config")} />

      <EnhancedFormGroup title={t("Port Settings")}>
        <EnhancedFormItem label={t("Mixed Port")}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
            <TextField
              size="small"
              sx={{ width: 80 }}
              value={mixedPort}
              onChange={(e) =>
                setMixedPort(+e.target.value?.replace(/\D+/, "").slice(0, 5))
              }
            />
            <IconButton
              size="small"
              onClick={() => setMixedPort(generateRandomPort())}
              title={t("Random Port")}
            >
              <Shuffle fontSize="small" />
            </IconButton>
            <Switch
              size="small"
              checked={true}
              disabled={true}
              sx={{ opacity: 0.7 }}
            />
          </Box>
        </EnhancedFormItem>

        <EnhancedFormItem label={t("Socks Port")}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
            <TextField
              size="small"
              sx={{ width: 80 }}
              value={socksPort}
              onChange={(e) =>
                setSocksPort(+e.target.value?.replace(/\D+/, "").slice(0, 5))
              }
              disabled={!socksEnabled}
            />
            <IconButton
              size="small"
              onClick={() => setSocksPort(generateRandomPort())}
              title={t("Random Port")}
              disabled={!socksEnabled}
            >
              <Shuffle fontSize="small" />
            </IconButton>
            <Switch
              size="small"
              checked={socksEnabled}
              onChange={(_, c) => setSocksEnabled(c)}
            />
          </Box>
        </EnhancedFormItem>

        <EnhancedFormItem label={t("Http Port")}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
            <TextField
              size="small"
              sx={{ width: 80 }}
              value={httpPort}
              onChange={(e) =>
                setHttpPort(+e.target.value?.replace(/\D+/, "").slice(0, 5))
              }
              disabled={!httpEnabled}
            />
            <IconButton
              size="small"
              onClick={() => setHttpPort(generateRandomPort())}
              title={t("Random Port")}
              disabled={!httpEnabled}
            >
              <Shuffle fontSize="small" />
            </IconButton>
            <Switch
              size="small"
              checked={httpEnabled}
              onChange={(_, c) => setHttpEnabled(c)}
            />
          </Box>
        </EnhancedFormItem>

        {OS !== "windows" && (
          <EnhancedFormItem label={t("Redir Port")}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
              <TextField
                size="small"
                sx={{ width: 80 }}
                value={redirPort}
                onChange={(e) =>
                  setRedirPort(+e.target.value?.replace(/\D+/, "").slice(0, 5))
                }
                disabled={!redirEnabled}
              />
              <IconButton
                size="small"
                onClick={() => setRedirPort(generateRandomPort())}
                title={t("Random Port")}
                disabled={!redirEnabled}
              >
                <Shuffle fontSize="small" />
              </IconButton>
              <Switch
                size="small"
                checked={redirEnabled}
                onChange={(_, c) => setRedirEnabled(c)}
              />
            </Box>
          </EnhancedFormItem>
        )}

        {OS === "linux" && (
          <EnhancedFormItem label={t("Tproxy Port")}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
              <TextField
                size="small"
                sx={{ width: 80 }}
                value={tproxyPort}
                onChange={(e) =>
                  setTproxyPort(+e.target.value?.replace(/\D+/, "").slice(0, 5))
                }
                disabled={!tproxyEnabled}
              />
              <IconButton
                size="small"
                onClick={() => setTproxyPort(generateRandomPort())}
                title={t("Random Port")}
                disabled={!tproxyEnabled}
              >
                <Shuffle fontSize="small" />
              </IconButton>
              <Switch
                size="small"
                checked={tproxyEnabled}
                onChange={(_, c) => setTproxyEnabled(c)}
              />
            </Box>
          </EnhancedFormItem>
        )}
      </EnhancedFormGroup>
    </BaseDialog>
  );
});
