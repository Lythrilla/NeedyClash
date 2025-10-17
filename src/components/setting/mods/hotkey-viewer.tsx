import { useLockFn } from "ahooks";
import { forwardRef, useImperativeHandle, useState } from "react";
import { useTranslation } from "react-i18next";

import { BaseDialog, DialogRef, Switch } from "@/components/base";
import { useVerge } from "@/hooks/use-verge";
import { showNotice } from "@/services/noticeService";

import {
  EnhancedDialogTitle,
  EnhancedFormItem,
  EnhancedFormGroup,
} from "./enhanced-dialog-components";
import { HotkeyInput } from "./hotkey-input";

const HOTKEY_FUNC = [
  "open_or_close_dashboard",
  "clash_mode_rule",
  "clash_mode_global",
  "clash_mode_direct",
  "toggle_system_proxy",
  "toggle_tun_mode",
  "entry_lightweight_mode",
];

export const HotkeyViewer = forwardRef<DialogRef>((props, ref) => {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  const { verge, patchVerge } = useVerge();

  const [hotkeyMap, setHotkeyMap] = useState<Record<string, string[]>>({});
  const [enableGlobalHotkey, setEnableGlobalHotkey] = useState(
    verge?.enable_global_hotkey ?? true,
  );

  useImperativeHandle(ref, () => ({
    open: () => {
      setOpen(true);

      const map = {} as typeof hotkeyMap;

      verge?.hotkeys?.forEach((text) => {
        const [func, key] = text.split(",").map((e) => e.trim());

        if (!func || !key) return;

        map[func] = key
          .split("+")
          .map((e) => e.trim())
          .map((k) => (k === "PLUS" ? "+" : k));
      });

      setHotkeyMap(map);
    },
    close: () => setOpen(false),
  }));

  const onSave = useLockFn(async () => {
    const hotkeys = Object.entries(hotkeyMap)
      .map(([func, keys]) => {
        if (!func || !keys?.length) return "";

        const key = keys
          .map((k) => k.trim())
          .filter(Boolean)
          .map((k) => (k === "+" ? "PLUS" : k))
          .join("+");

        if (!key) return "";
        return `${func},${key}`;
      })
      .filter(Boolean);

    try {
      await patchVerge({
        hotkeys,
        enable_global_hotkey: enableGlobalHotkey,
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
      <EnhancedDialogTitle title={t("Hotkey Setting")} />

      <EnhancedFormGroup>
        <EnhancedFormItem label={t("Enable Global Hotkey")}>
          <Switch
            edge="end"
            checked={enableGlobalHotkey}
            onChange={(e) => setEnableGlobalHotkey(e.target.checked)}
          />
        </EnhancedFormItem>
      </EnhancedFormGroup>

      <EnhancedFormGroup title={t("Hotkey Bindings")}>
        {HOTKEY_FUNC.map((func) => (
          <EnhancedFormItem key={func} label={t(func)}>
            <HotkeyInput
              value={hotkeyMap[func] ?? []}
              onChange={(v) => setHotkeyMap((m) => ({ ...m, [func]: v }))}
            />
          </EnhancedFormItem>
        ))}
      </EnhancedFormGroup>
    </BaseDialog>
  );
});
