import { InputAdornment, MenuItem, Select, TextField } from "@mui/material";
import { useLockFn } from "ahooks";
import { forwardRef, useImperativeHandle, useState } from "react";
import { useTranslation } from "react-i18next";

import { BaseDialog, DialogRef, Switch } from "@/components/base";
import { TooltipIcon } from "@/components/base/base-tooltip-icon";
import { useVerge } from "@/hooks/use-verge";
import { showNotice } from "@/services/noticeService";

import {
  EnhancedDialogTitle,
  EnhancedFormItem,
  EnhancedFormGroup,
} from "./enhanced-dialog-components";

export const MiscViewer = forwardRef<DialogRef>((props, ref) => {
  const { t } = useTranslation();
  const { verge, patchVerge } = useVerge();

  const [open, setOpen] = useState(false);
  const [values, setValues] = useState({
    appLogLevel: "warn",
    appLogMaxSize: 8,
    appLogMaxCount: 12,
    autoCloseConnection: true,
    autoCheckUpdate: true,
    enableBuiltinEnhanced: true,
    proxyLayoutColumn: 6,
    enableAutoDelayDetection: false,
    defaultLatencyTest: "",
    autoLogClean: 2,
    defaultLatencyTimeout: 10000,
  });

  useImperativeHandle(ref, () => ({
    open: () => {
      setOpen(true);
      setValues({
        appLogLevel: verge?.app_log_level ?? "warn",
        appLogMaxSize: verge?.app_log_max_size ?? 128,
        appLogMaxCount: verge?.app_log_max_count ?? 8,
        autoCloseConnection: verge?.auto_close_connection ?? true,
        autoCheckUpdate: verge?.auto_check_update ?? true,
        enableBuiltinEnhanced: verge?.enable_builtin_enhanced ?? true,
        proxyLayoutColumn: verge?.proxy_layout_column || 6,
        enableAutoDelayDetection: verge?.enable_auto_delay_detection ?? false,
        defaultLatencyTest: verge?.default_latency_test || "",
        autoLogClean: verge?.auto_log_clean || 0,
        defaultLatencyTimeout: verge?.default_latency_timeout || 10000,
      });
    },
    close: () => setOpen(false),
  }));

  const onSave = useLockFn(async () => {
    try {
      await patchVerge({
        app_log_level: values.appLogLevel,
        auto_close_connection: values.autoCloseConnection,
        auto_check_update: values.autoCheckUpdate,
        enable_builtin_enhanced: values.enableBuiltinEnhanced,
        proxy_layout_column: values.proxyLayoutColumn,
        enable_auto_delay_detection: values.enableAutoDelayDetection,
        default_latency_test: values.defaultLatencyTest,
        default_latency_timeout: values.defaultLatencyTimeout,
        auto_log_clean: values.autoLogClean as any,
      });
      setOpen(false);
    } catch (err: any) {
      showNotice("error", err.toString());
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
      <EnhancedDialogTitle title={t("Miscellaneous")} />

      <EnhancedFormGroup title={t("Application Settings")}>
        <EnhancedFormItem label={t("App Log Level")}>
          <Select
            size="small"
            sx={{ width: 140 }}
            value={values.appLogLevel}
            onChange={(e) =>
              setValues((v) => ({
                ...v,
                appLogLevel: e.target.value as string,
              }))
            }
          >
            {["trace", "debug", "info", "warn", "error", "silent"].map((i) => (
              <MenuItem value={i} key={i}>
                {i[0].toUpperCase() + i.slice(1).toLowerCase()}
              </MenuItem>
            ))}
          </Select>
        </EnhancedFormItem>

        <EnhancedFormItem label={t("App Log Max Size")}>
          <TextField
            autoComplete="new-password"
            size="small"
            type="number"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck="false"
            sx={{ width: 140 }}
            value={values.appLogMaxSize}
            onChange={(e) =>
              setValues((v) => ({
                ...v,
                appLogMaxSize: Math.max(1, parseInt(e.target.value) || 128),
              }))
            }
            slotProps={{
              input: {
                endAdornment: (
                  <InputAdornment position="end">{t("KB")}</InputAdornment>
                ),
              },
            }}
          />
        </EnhancedFormItem>

        <EnhancedFormItem label={t("App Log Max Count")}>
          <TextField
            autoComplete="new-password"
            size="small"
            type="number"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck="false"
            sx={{ width: 140 }}
            value={values.appLogMaxCount}
            onChange={(e) =>
              setValues((v) => ({
                ...v,
                appLogMaxCount: Math.max(1, parseInt(e.target.value) || 1),
              }))
            }
            slotProps={{
              input: {
                endAdornment: (
                  <InputAdornment position="end">{t("Files")}</InputAdornment>
                ),
              },
            }}
          />
        </EnhancedFormItem>

        <EnhancedFormItem label={t("Auto Log Clean")}>
          <Select
            size="small"
            sx={{ width: 160 }}
            value={values.autoLogClean}
            onChange={(e) =>
              setValues((v) => ({
                ...v,
                autoLogClean: e.target.value as number,
              }))
            }
          >
            {[
              { key: t("Never Clean"), value: 0 },
              { key: t("Retain _n Days", { n: 1 }), value: 1 },
              { key: t("Retain _n Days", { n: 7 }), value: 2 },
              { key: t("Retain _n Days", { n: 30 }), value: 3 },
              { key: t("Retain _n Days", { n: 90 }), value: 4 },
            ].map((i) => (
              <MenuItem key={i.value} value={i.value}>
                {i.key}
              </MenuItem>
            ))}
          </Select>
        </EnhancedFormItem>

        <EnhancedFormItem
          label={
            <>
              {t("Auto Close Connections")}
              <TooltipIcon
                title={t("Auto Close Connections Info")}
                sx={{ opacity: "0.7", ml: 0.5 }}
              />
            </>
          }
        >
          <Switch
            edge="end"
            checked={values.autoCloseConnection}
            onChange={(_, c) =>
              setValues((v) => ({ ...v, autoCloseConnection: c }))
            }
          />
        </EnhancedFormItem>

        <EnhancedFormItem label={t("Auto Check Update")}>
          <Switch
            edge="end"
            checked={values.autoCheckUpdate}
            onChange={(_, c) =>
              setValues((v) => ({ ...v, autoCheckUpdate: c }))
            }
          />
        </EnhancedFormItem>

        <EnhancedFormItem
          label={
            <>
              {t("Enable Builtin Enhanced")}
              <TooltipIcon
                title={t("Enable Builtin Enhanced Info")}
                sx={{ opacity: "0.7", ml: 0.5 }}
              />
            </>
          }
        >
          <Switch
            edge="end"
            checked={values.enableBuiltinEnhanced}
            onChange={(_, c) =>
              setValues((v) => ({ ...v, enableBuiltinEnhanced: c }))
            }
          />
        </EnhancedFormItem>
      </EnhancedFormGroup>

      <EnhancedFormGroup title={t("Proxy Settings")}>
        <EnhancedFormItem label={t("Proxy Layout Columns")}>
          <Select
            size="small"
            sx={{ width: 160 }}
            value={values.proxyLayoutColumn}
            onChange={(e) =>
              setValues((v) => ({
                ...v,
                proxyLayoutColumn: e.target.value as number,
              }))
            }
          >
            <MenuItem value={6} key={6}>
              {t("Auto Columns")}
            </MenuItem>
            {[1, 2, 3, 4, 5].map((i) => (
              <MenuItem value={i} key={i}>
                {i}
              </MenuItem>
            ))}
          </Select>
        </EnhancedFormItem>

        <EnhancedFormItem
          label={
            <>
              {t("Auto Delay Detection")}
              <TooltipIcon
                title={t("Auto Delay Detection Info")}
                sx={{ opacity: "0.7", ml: 0.5 }}
              />
            </>
          }
        >
          <Switch
            edge="end"
            checked={values.enableAutoDelayDetection}
            onChange={(_, c) =>
              setValues((v) => ({ ...v, enableAutoDelayDetection: c }))
            }
          />
        </EnhancedFormItem>

        <EnhancedFormItem
          label={
            <>
              {t("Default Latency Test")}
              <TooltipIcon
                title={t("Default Latency Test Info")}
                sx={{ opacity: "0.7", ml: 0.5 }}
              />
            </>
          }
          fullWidth
        >
          <TextField
            autoComplete="new-password"
            size="small"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck="false"
            fullWidth
            value={values.defaultLatencyTest}
            placeholder="https://cp.cloudflare.com/generate_204"
            onChange={(e) =>
              setValues((v) => ({ ...v, defaultLatencyTest: e.target.value }))
            }
          />
        </EnhancedFormItem>

        <EnhancedFormItem label={t("Default Latency Timeout")}>
          <TextField
            autoComplete="new-password"
            size="small"
            type="number"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck="false"
            sx={{ width: 140 }}
            value={values.defaultLatencyTimeout}
            placeholder="10000"
            onChange={(e) =>
              setValues((v) => ({
                ...v,
                defaultLatencyTimeout: parseInt(e.target.value),
              }))
            }
            slotProps={{
              input: {
                endAdornment: (
                  <InputAdornment position="end">{t("millis")}</InputAdornment>
                ),
              },
            }}
          />
        </EnhancedFormItem>
      </EnhancedFormGroup>
    </BaseDialog>
  );
});
