import { RestartAltOutlined } from "@mui/icons-material";
import { Box, Button, TextField, CircularProgress } from "@mui/material";
import { useLockFn } from "ahooks";
import type { Ref } from "react";
import { useImperativeHandle, useState } from "react";
import { useTranslation } from "react-i18next";

import { BaseDialog, DialogRef, Switch } from "@/components/base";
import { useClash } from "@/hooks/use-clash";
import { useTunMode } from "@/hooks/use-tun-mode";
import { enhanceProfiles } from "@/services/cmds";
import { showNotice } from "@/services/noticeService";
import getSystem from "@/utils/get-system";

import {
  EnhancedDialogTitle,
  EnhancedFormItem,
  EnhancedFormGroup,
} from "./enhanced-dialog-components";
import { StackModeSwitch } from "./stack-mode-switch";

const OS = getSystem();

const DEFAULT_TUN_CONFIG = {
  stack: "gvisor",
  device: OS === "macos" ? "utun1024" : "Mihomo",
  autoRoute: true,
  autoDetectInterface: true,
  dnsHijack: ["any:53"],
  strictRoute: false,
  mtu: 1500,
};

export function TunViewer({ ref }: { ref?: Ref<DialogRef> }) {
  const { t } = useTranslation();

  const { clash, mutateClash, patchClash } = useClash();
  const { reapplyTunConfig } = useTunMode();

  const [open, setOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [values, setValues] = useState(DEFAULT_TUN_CONFIG);

  useImperativeHandle(ref, () => ({
    open: () => {
      setOpen(true);
      // 从 Clash 配置加载当前 TUN 设置
      const tunConfig: Partial<IConfigData["tun"]> = clash?.tun || {};
      setValues({
        stack: tunConfig.stack ?? DEFAULT_TUN_CONFIG.stack,
        device: tunConfig.device ?? DEFAULT_TUN_CONFIG.device,
        autoRoute: tunConfig["auto-route"] ?? DEFAULT_TUN_CONFIG.autoRoute,
        autoDetectInterface:
          tunConfig["auto-detect-interface"] ??
          DEFAULT_TUN_CONFIG.autoDetectInterface,
        dnsHijack: tunConfig["dns-hijack"] ?? DEFAULT_TUN_CONFIG.dnsHijack,
        strictRoute:
          tunConfig["strict-route"] ?? DEFAULT_TUN_CONFIG.strictRoute,
        mtu: tunConfig.mtu ?? DEFAULT_TUN_CONFIG.mtu,
      });
    },
    close: () => setOpen(false),
  }));

  const onSave = useLockFn(async () => {
    setIsSaving(true);

    try {
      // 验证配置
      if (!values.device || values.device.trim() === "") {
        showNotice("error", t("Device name cannot be empty"));
        return;
      }

      if (values.mtu < 500 || values.mtu > 9000) {
        showNotice("error", t("MTU must be between 500 and 9000"));
        return;
      }

      // 构建 TUN 配置
      const tun = {
        stack: values.stack,
        device: values.device.trim(),
        "auto-route": values.autoRoute,
        "auto-detect-interface": values.autoDetectInterface,
        "dns-hijack":
          values.dnsHijack[0] === ""
            ? []
            : values.dnsHijack.map((h) => h.trim()).filter((h) => h !== ""),
        "strict-route": values.strictRoute,
        mtu: values.mtu,
      };

      // 先更新本地缓存
      await mutateClash(
        (old) => ({
          ...old!,
          tun,
        }),
        false,
      );

      // 发送配置到后端
      await patchClash({ tun });

      // 等待配置生效
      await new Promise((resolve) => setTimeout(resolve, 300));

      // 增强配置文件
      try {
        await enhanceProfiles();
      } catch (err: any) {
        console.warn("[TunViewer] 增强配置失败:", err);
        showNotice(
          "info",
          t("Configuration saved, but profile enhancement failed"),
        );
      }

      // 重新应用 TUN 配置以确保生效
      const result = await reapplyTunConfig();
      if (!result.success) {
        console.warn("[TunViewer] 重新应用 TUN 配置失败:", result.error);
      }

      // 最终同步配置
      await mutateClash();

      showNotice("success", t("TUN settings saved successfully"));
      setOpen(false);
    } catch (err: any) {
      const errorMsg = err.message || err.toString();
      console.error("[TunViewer] 保存配置失败:", errorMsg);
      showNotice("error", errorMsg);

      // 恢复原始配置
      await mutateClash();
    } finally {
      setIsSaving(false);
    }
  });

  const onReset = useLockFn(async () => {
    try {
      setValues(DEFAULT_TUN_CONFIG);

      // 构建默认 TUN 配置
      const tun = {
        stack: DEFAULT_TUN_CONFIG.stack,
        device: DEFAULT_TUN_CONFIG.device,
        "auto-route": DEFAULT_TUN_CONFIG.autoRoute,
        "auto-detect-interface": DEFAULT_TUN_CONFIG.autoDetectInterface,
        "dns-hijack": DEFAULT_TUN_CONFIG.dnsHijack,
        "strict-route": DEFAULT_TUN_CONFIG.strictRoute,
        mtu: DEFAULT_TUN_CONFIG.mtu,
      };

      await patchClash({ tun });
      await mutateClash(
        (old) => ({
          ...old!,
          tun,
        }),
        false,
      );

      showNotice("success", t("TUN settings reset to default"));
    } catch (err: any) {
      const errorMsg = err.message || err.toString();
      console.error("[TunViewer] 重置配置失败:", errorMsg);
      showNotice("error", errorMsg);
    }
  });

  return (
    <BaseDialog
      open={open}
      title=""
      contentSx={{ width: 520, maxHeight: 680, px: 3, py: 3 }}
      okBtn={
        isSaving ? (
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <CircularProgress size={16} />
            {t("Saving...")}
          </Box>
        ) : (
          t("Save")
        )
      }
      cancelBtn={t("Cancel")}
      onClose={() => setOpen(false)}
      onCancel={() => setOpen(false)}
      onOk={onSave}
      disableOk={isSaving}
    >
      {/* 标题 */}
      <EnhancedDialogTitle
        title={t("Tun Mode")}
        action={
          <Button
            variant="outlined"
            size="small"
            startIcon={<RestartAltOutlined />}
            onClick={onReset}
            disabled={isSaving}
          >
            {t("Reset to Default")}
          </Button>
        }
      />

      {/* 网络配置 */}
      <EnhancedFormGroup title={t("Network Configuration")}>
        <EnhancedFormItem
          label={t("Stack")}
          description={t("The network stack to use for TUN mode")}
        >
          <StackModeSwitch
            value={values.stack}
            onChange={(value) => {
              setValues((v) => ({
                ...v,
                stack: value,
              }));
            }}
          />
        </EnhancedFormItem>

        <EnhancedFormItem
          label={t("Device")}
          description={t("Virtual network interface name")}
        >
          <TextField
            autoComplete="new-password"
            size="small"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck="false"
            sx={{ width: 200 }}
            value={values.device}
            placeholder={DEFAULT_TUN_CONFIG.device}
            onChange={(e) =>
              setValues((v) => ({ ...v, device: e.target.value }))
            }
            disabled={isSaving}
          />
        </EnhancedFormItem>

        <EnhancedFormItem
          label={t("Auto Route")}
          description={t("Automatically configure system routing")}
        >
          <Switch
            edge="end"
            checked={values.autoRoute}
            onChange={(_, c) => setValues((v) => ({ ...v, autoRoute: c }))}
            disabled={isSaving}
          />
        </EnhancedFormItem>

        <EnhancedFormItem
          label={t("Strict Route")}
          description={t("Enable strict route mode")}
        >
          <Switch
            edge="end"
            checked={values.strictRoute}
            onChange={(_, c) => setValues((v) => ({ ...v, strictRoute: c }))}
            disabled={isSaving}
          />
        </EnhancedFormItem>

        <EnhancedFormItem
          label={t("Auto Detect Interface")}
          description={t("Automatically detect outbound interface")}
        >
          <Switch
            edge="end"
            checked={values.autoDetectInterface}
            onChange={(_, c) =>
              setValues((v) => ({ ...v, autoDetectInterface: c }))
            }
            disabled={isSaving}
          />
        </EnhancedFormItem>
      </EnhancedFormGroup>

      {/* DNS 配置 */}
      <EnhancedFormGroup title={t("DNS Configuration")}>
        <EnhancedFormItem
          label={t("DNS Hijack")}
          description={t("Hijack DNS queries")}
          fullWidth
        >
          <TextField
            autoComplete="new-password"
            size="small"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck="false"
            fullWidth
            value={values.dnsHijack.join(",")}
            placeholder="any:53"
            onChange={(e) =>
              setValues((v) => ({ ...v, dnsHijack: e.target.value.split(",") }))
            }
            disabled={isSaving}
          />
        </EnhancedFormItem>
      </EnhancedFormGroup>

      {/* 性能设置 */}
      <EnhancedFormGroup title={t("Performance Settings")}>
        <EnhancedFormItem
          label={t("MTU")}
          description={t("Maximum transmission unit")}
        >
          <TextField
            autoComplete="new-password"
            size="small"
            type="number"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck="false"
            sx={{ width: 120 }}
            value={values.mtu}
            placeholder="1500"
            onChange={(e) =>
              setValues((v) => ({
                ...v,
                mtu: parseInt(e.target.value) || DEFAULT_TUN_CONFIG.mtu,
              }))
            }
            disabled={isSaving}
          />
        </EnhancedFormItem>
      </EnhancedFormGroup>
    </BaseDialog>
  );
}
