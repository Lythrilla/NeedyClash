import { ContentCopyRounded, PaletteOutlined } from "@mui/icons-material";
import { Box, Button, Input, MenuItem } from "@mui/material";
import { open } from "@tauri-apps/plugin-dialog";
import { useCallback, useRef } from "react";
import { useTranslation } from "react-i18next";

import { DialogRef, Switch, GlassSelect } from "@/components/base";
import { TooltipIcon } from "@/components/base/base-tooltip-icon";
import { useVerge } from "@/hooks/use-verge";
import { routers } from "@/pages/_routers";
import { copyClashEnv } from "@/services/cmds";
import { supportedLanguages } from "@/services/i18n";
import { showNotice } from "@/services/noticeService";
import getSystem from "@/utils/get-system";

import { BackupViewer } from "./mods/backup-viewer";
import { ConfigViewer } from "./mods/config-viewer";
import { GuardState } from "./mods/guard-state";
import { HotkeyViewer } from "./mods/hotkey-viewer";
import { LayoutViewer } from "./mods/layout-viewer";
import { MiscViewer } from "./mods/misc-viewer";
import { SettingItem, SettingList } from "./mods/setting-comp";
import { ThemeViewer } from "./mods/theme-viewer";
import { ThemeViewerEnhanced } from "./mods/theme-viewer-enhanced";
import { UpdateViewer } from "./mods/update-viewer";

interface Props {
  onError?: (err: Error) => void;
}

const OS = getSystem();

const languageOptions = supportedLanguages.map((code) => {
  const labels: { [key: string]: string } = {
    en: "English",
    ru: "Русский",
    zh: "中文",
    fa: "فارسی",
    tt: "Татар",
    id: "Bahasa Indonesia",
    ar: "العربية",
    ko: "한국어",
    tr: "Türkçe",
    de: "Deutsch",
    es: "Español",
    jp: "日本語",
    zhtw: "繁體中文",
  };
  const label = labels[code] || code;
  return { code, label };
});

const SettingVergeBasic = ({ onError }: Props) => {
  const { t } = useTranslation();

  const { verge, patchVerge, mutateVerge } = useVerge();
  const {
    theme_mode,
    language,
    tray_event,
    env_type,
    startup_script,
    start_page,
    traffic_quota_reminder,
  } = verge ?? {};

  const reminderEnabled = traffic_quota_reminder?.enabled ?? false;
  const reminderThreshold = traffic_quota_reminder?.threshold ?? 80;
  const configRef = useRef<DialogRef>(null);
  const hotkeyRef = useRef<DialogRef>(null);
  const miscRef = useRef<DialogRef>(null);
  const themeRef = useRef<DialogRef>(null);
  const themeEnhancedRef = useRef<DialogRef>(null);
  const layoutRef = useRef<DialogRef>(null);
  const updateRef = useRef<DialogRef>(null);
  const backupRef = useRef<DialogRef>(null);

  const onSwitchFormat = (_e: any, value: boolean) => value;
  const onChangeData = (patch: any) => {
    mutateVerge({ ...verge, ...patch }, false);
  };

  const onCopyClashEnv = useCallback(async () => {
    await copyClashEnv();
    showNotice("success", t("Copy Success"), 1000);
  }, [t]);

  return (
    <SettingList
      title={t("Verge Basic Setting")}
      icon={<PaletteOutlined />}
      description={t("Language, theme, tray and interface settings")}
    >
      <ThemeViewer ref={themeRef} />
      <ThemeViewerEnhanced ref={themeEnhancedRef} />
      <ConfigViewer ref={configRef} />
      <HotkeyViewer ref={hotkeyRef} />
      <MiscViewer ref={miscRef} />
      <LayoutViewer ref={layoutRef} />
      <UpdateViewer ref={updateRef} />
      <BackupViewer ref={backupRef} />

      <SettingItem label={t("Language")}>
        <GuardState
          value={language ?? "en"}
          onCatch={onError}
          onFormat={(e: any) => e.target.value}
          onChange={(e) => onChangeData({ language: e })}
          onGuard={(e) => patchVerge({ language: e })}
        >
          <GlassSelect>
            {languageOptions.map(({ code, label }) => (
              <MenuItem key={code} value={code}>
                {label}
              </MenuItem>
            ))}
          </GlassSelect>
        </GuardState>
      </SettingItem>

      {OS !== "linux" && (
        <SettingItem label={t("Tray Click Event")}>
          <GuardState
            value={tray_event ?? "main_window"}
            onCatch={onError}
            onFormat={(e: any) => e.target.value}
            onChange={(e) => onChangeData({ tray_event: e })}
            onGuard={(e) => patchVerge({ tray_event: e })}
          >
            <GlassSelect>
              <MenuItem value="main_window">{t("Show Main Window")}</MenuItem>
              <MenuItem value="tray_menu">{t("Show Tray Menu")}</MenuItem>
              <MenuItem value="system_proxy">{t("System Proxy")}</MenuItem>
              <MenuItem value="tun_mode">{t("Tun Mode")}</MenuItem>
              <MenuItem value="disable">{t("Disable")}</MenuItem>
            </GlassSelect>
          </GuardState>
        </SettingItem>
      )}

      <SettingItem
        label={t("Copy Env Type")}
        extra={
          <TooltipIcon icon={ContentCopyRounded} onClick={onCopyClashEnv} />
        }
      >
        <GuardState
          value={env_type ?? (OS === "windows" ? "powershell" : "bash")}
          onCatch={onError}
          onFormat={(e: any) => e.target.value}
          onChange={(e) => onChangeData({ env_type: e })}
          onGuard={(e) => patchVerge({ env_type: e })}
        >
          <GlassSelect>
            <MenuItem value="bash">Bash</MenuItem>
            <MenuItem value="fish">Fish</MenuItem>
            <MenuItem value="nushell">Nushell</MenuItem>
            <MenuItem value="cmd">CMD</MenuItem>
            <MenuItem value="powershell">PowerShell</MenuItem>
          </GlassSelect>
        </GuardState>
      </SettingItem>

      <SettingItem label={t("Start Page")}>
        <GuardState
          value={start_page ?? "/"}
          onCatch={onError}
          onFormat={(e: any) => e.target.value}
          onChange={(e) => onChangeData({ start_page: e })}
          onGuard={(e) => patchVerge({ start_page: e })}
        >
          <GlassSelect>
            {routers.map((page: { label: string; path: string }) => {
              return (
                <MenuItem key={page.path} value={page.path}>
                  {t(page.label)}
                </MenuItem>
              );
            })}
          </GlassSelect>
        </GuardState>
      </SettingItem>

      <SettingItem label={t("Startup Script")}>
        <GuardState
          value={startup_script ?? ""}
          onCatch={onError}
          onFormat={(e: any) => e.target.value}
          onChange={(e) => onChangeData({ startup_script: e })}
          onGuard={(e) => patchVerge({ startup_script: e })}
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 0.5,
              flexWrap: "nowrap",
            }}
          >
            <Input
              value={startup_script}
              disabled
              disableUnderline
              sx={{
                minWidth: 80,
                maxWidth: 180,
                fontSize: "13px",
              }}
            />
            <Button
              size="small"
              sx={{ minWidth: "auto", px: 1, fontSize: "12px" }}
              onClick={async () => {
                const selected = await open({
                  directory: false,
                  multiple: false,
                  filters: [
                    {
                      name: "Shell Script",
                      extensions: ["sh", "bat", "ps1"],
                    },
                  ],
                });
                if (selected) {
                  onChangeData({ startup_script: `${selected}` });
                  patchVerge({ startup_script: `${selected}` });
                }
              }}
            >
              {t("Browse")}
            </Button>
            {startup_script && (
              <Button
                size="small"
                sx={{ minWidth: "auto", px: 1, fontSize: "12px" }}
                onClick={async () => {
                  onChangeData({ startup_script: "" });
                  patchVerge({ startup_script: "" });
                }}
              >
                {t("Clear")}
              </Button>
            )}
          </Box>
        </GuardState>
      </SettingItem>

      <SettingItem
        onClick={() => themeEnhancedRef.current?.open()}
        label={t("Theme Customization")}
        secondary={t(
          "Customize colors, apply preset themes, and set window background",
        )}
      />

      <SettingItem
        onClick={() => layoutRef.current?.open()}
        label={t("Layout Setting")}
      />

      <SettingItem
        onClick={() => miscRef.current?.open()}
        label={t("Miscellaneous")}
      />

      <SettingItem
        onClick={() => hotkeyRef.current?.open()}
        label={t("Hotkey Setting")}
      />

      <SettingItem
        label={t("Enable Traffic Quota Reminder")}
        secondary={t(
          "Get notified when subscription traffic usage reaches threshold",
        )}
      >
        <GuardState
          value={reminderEnabled}
          valueProps="checked"
          onCatch={onError}
          onFormat={onSwitchFormat}
          onChange={(e) =>
            onChangeData({
              traffic_quota_reminder: {
                ...traffic_quota_reminder,
                enabled: e,
                last_reminder: 0,
              },
            })
          }
          onGuard={(e) =>
            patchVerge({
              traffic_quota_reminder: {
                ...traffic_quota_reminder,
                enabled: e,
                last_reminder: 0,
              },
            })
          }
        >
          <Switch edge="end" />
        </GuardState>
      </SettingItem>

      {reminderEnabled && (
        <SettingItem label={t("Reminder Threshold")}>
          <GuardState
            value={reminderThreshold}
            onCatch={onError}
            onFormat={(e: any) => Number(e.target.value)}
            onChange={(e) =>
              onChangeData({
                traffic_quota_reminder: {
                  ...traffic_quota_reminder,
                  threshold: e,
                },
              })
            }
            onGuard={(e) =>
              patchVerge({
                traffic_quota_reminder: {
                  ...traffic_quota_reminder,
                  threshold: e,
                },
              })
            }
          >
            <GlassSelect sx={{ width: 85 }}>
              <MenuItem value={70}>70%</MenuItem>
              <MenuItem value={80}>80%</MenuItem>
              <MenuItem value={90}>90%</MenuItem>
              <MenuItem value={95}>95%</MenuItem>
            </GlassSelect>
          </GuardState>
        </SettingItem>
      )}
    </SettingList>
  );
};

export default SettingVergeBasic;
