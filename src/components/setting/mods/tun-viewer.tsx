import { RestartAltOutlined } from "@mui/icons-material";
import { Box, Button, TextField } from "@mui/material";
import { useLockFn } from "ahooks";
import type { Ref } from "react";
import { useImperativeHandle, useState } from "react";
import { useTranslation } from "react-i18next";

import { BaseDialog, DialogRef, Switch } from "@/components/base";
import { useClash } from "@/hooks/use-clash";
import { enhanceProfiles } from "@/services/cmds";
import { showNotice } from "@/services/noticeService";
import getSystem from "@/utils/get-system";

import { StackModeSwitch } from "./stack-mode-switch";
import {
  EnhancedDialogTitle,
  EnhancedFormItem,
  EnhancedFormGroup,
} from "./enhanced-dialog-components";

const OS = getSystem();

export function TunViewer({ ref }: { ref?: Ref<DialogRef> }) {
  const { t } = useTranslation();

  const { clash, mutateClash, patchClash } = useClash();

  const [open, setOpen] = useState(false);
  const [values, setValues] = useState({
    stack: "mixed",
    device: OS === "macos" ? "utun1024" : "Mihomo",
    autoRoute: true,
    autoDetectInterface: true,
    dnsHijack: ["any:53"],
    strictRoute: false,
    mtu: 1500,
  });

  useImperativeHandle(ref, () => ({
    open: () => {
      setOpen(true);
      setValues({
        stack: clash?.tun.stack ?? "gvisor",
        device: clash?.tun.device ?? (OS === "macos" ? "utun1024" : "Mihomo"),
        autoRoute: clash?.tun["auto-route"] ?? true,
        autoDetectInterface: clash?.tun["auto-detect-interface"] ?? true,
        dnsHijack: clash?.tun["dns-hijack"] ?? ["any:53"],
        strictRoute: clash?.tun["strict-route"] ?? false,
        mtu: clash?.tun.mtu ?? 1500,
      });
    },
    close: () => setOpen(false),
  }));

  const onSave = useLockFn(async () => {
    try {
      const tun = {
        stack: values.stack,
        device:
          values.device === ""
            ? OS === "macos"
              ? "utun1024"
              : "Mihomo"
            : values.device,
        "auto-route": values.autoRoute,
        "auto-detect-interface": values.autoDetectInterface,
        "dns-hijack": values.dnsHijack[0] === "" ? [] : values.dnsHijack,
        "strict-route": values.strictRoute,
        mtu: values.mtu ?? 1500,
      };
      await patchClash({ tun });
      await mutateClash(
        (old) => ({
          ...old!,
          tun,
        }),
        false,
      );
      try {
        await enhanceProfiles();
        showNotice("success", t("Settings Applied"));
      } catch (err: any) {
        showNotice("error", err.message || err.toString());
      }
      setOpen(false);
    } catch (err: any) {
      showNotice("error", err.message || err.toString());
    }
  });

  return (
    <BaseDialog
      open={open}
      title=""
      contentSx={{ width: 520, maxHeight: 680, px: 3, py: 3 }}
      okBtn={t("Save")}
      cancelBtn={t("Cancel")}
      onClose={() => setOpen(false)}
      onCancel={() => setOpen(false)}
      onOk={onSave}
    >
      {/* 标题 */}
      <EnhancedDialogTitle
        title={t("Tun Mode")}
        action={
          <Button
            variant="outlined"
            size="small"
            startIcon={<RestartAltOutlined />}
            onClick={async () => {
              const tun = {
                stack: "gvisor",
                device: OS === "macos" ? "utun1024" : "Mihomo",
                "auto-route": true,
                "auto-detect-interface": true,
                "dns-hijack": ["any:53"],
                "strict-route": false,
                mtu: 1500,
              };
              setValues({
                stack: "gvisor",
                device: OS === "macos" ? "utun1024" : "Mihomo",
                autoRoute: true,
                autoDetectInterface: true,
                dnsHijack: ["any:53"],
                strictRoute: false,
                mtu: 1500,
              });
              await patchClash({ tun });
              await mutateClash(
                (old) => ({
                  ...old!,
                  tun,
                }),
                false,
              );
            }}
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
            placeholder="Mihomo"
            onChange={(e) =>
              setValues((v) => ({ ...v, device: e.target.value }))
            }
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
                mtu: parseInt(e.target.value),
              }))
            }
          />
        </EnhancedFormItem>
      </EnhancedFormGroup>
    </BaseDialog>
  );
}
