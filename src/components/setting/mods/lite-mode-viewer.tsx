import { Button, InputAdornment, TextField, Typography } from "@mui/material";
import { useLockFn } from "ahooks";
import type { Ref } from "react";
import { useImperativeHandle, useState } from "react";
import { useTranslation } from "react-i18next";

import { BaseDialog, DialogRef, Switch } from "@/components/base";
import { TooltipIcon } from "@/components/base/base-tooltip-icon";
import { useVerge } from "@/hooks/use-verge";
import { entry_lightweight_mode } from "@/services/cmds";
import { showNotice } from "@/services/noticeService";

import {
  EnhancedDialogTitle,
  EnhancedFormItem,
  EnhancedFormGroup,
} from "./enhanced-dialog-components";

export function LiteModeViewer({ ref }: { ref?: Ref<DialogRef> }) {
  const { t } = useTranslation();
  const { verge, patchVerge } = useVerge();

  const [open, setOpen] = useState(false);
  const [values, setValues] = useState({
    autoEnterLiteMode: false,
    autoEnterLiteModeDelay: 10, // 默认10分钟
  });

  useImperativeHandle(ref, () => ({
    open: () => {
      setOpen(true);
      setValues({
        autoEnterLiteMode: verge?.enable_auto_light_weight_mode ?? false,
        autoEnterLiteModeDelay: verge?.auto_light_weight_minutes ?? 10,
      });
    },
    close: () => setOpen(false),
  }));

  const onSave = useLockFn(async () => {
    try {
      await patchVerge({
        enable_auto_light_weight_mode: values.autoEnterLiteMode,
        auto_light_weight_minutes: values.autoEnterLiteModeDelay,
      });
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
      <EnhancedDialogTitle title={t("LightWeight Mode Settings")} />

      <EnhancedFormGroup>
        <EnhancedFormItem label={t("Enter LightWeight Mode Now")}>
          <Button
            variant="outlined"
            size="small"
            onClick={async () => await entry_lightweight_mode()}
          >
            {t("Enable")}
          </Button>
        </EnhancedFormItem>

        <EnhancedFormItem
          label={
            <>
              {t("Auto Enter LightWeight Mode")}
              <TooltipIcon
                title={t("Auto Enter LightWeight Mode Info")}
                sx={{ opacity: "0.7", ml: 0.5 }}
              />
            </>
          }
        >
          <Switch
            edge="end"
            checked={values.autoEnterLiteMode}
            onChange={(_, c) =>
              setValues((v) => ({ ...v, autoEnterLiteMode: c }))
            }
          />
        </EnhancedFormItem>

        {values.autoEnterLiteMode && (
          <>
            <EnhancedFormItem label={t("Auto Enter LightWeight Mode Delay")}>
              <TextField
                autoComplete="off"
                size="small"
                type="number"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck="false"
                sx={{ width: 140 }}
                value={values.autoEnterLiteModeDelay}
                onChange={(e) =>
                  setValues((v) => ({
                    ...v,
                    autoEnterLiteModeDelay: parseInt(e.target.value) || 1,
                  }))
                }
                slotProps={{
                  input: {
                    endAdornment: (
                      <InputAdornment position="end">
                        {t("mins")}
                      </InputAdornment>
                    ),
                  },
                }}
              />
            </EnhancedFormItem>

            <EnhancedFormItem label="" fullWidth>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ fontStyle: "italic", fontSize: "12px" }}
              >
                {t(
                  "When closing the window, LightWeight Mode will be automatically activated after _n minutes",
                  { n: values.autoEnterLiteModeDelay },
                )}
              </Typography>
            </EnhancedFormItem>
          </>
        )}
      </EnhancedFormGroup>
    </BaseDialog>
  );
}
