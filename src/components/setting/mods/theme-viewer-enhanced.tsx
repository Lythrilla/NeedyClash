import {
  ColorLensRounded,
  RefreshRounded,
  Brightness7Rounded,
  Brightness4Rounded,
  SaveRounded,
  DeleteRounded,
  UploadFileRounded,
  LinkRounded,
  ExpandMore,
  RestartAlt,
} from "@mui/icons-material";
import {
  Box,
  Button,
  TextField,
  Typography,
  useTheme,
  ToggleButtonGroup,
  ToggleButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tabs,
  Tab,
  Slider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper,
  Stack,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  InputAdornment,
} from "@mui/material";
import { open as openDialog } from "@tauri-apps/plugin-dialog";
import { convertFileSrc } from "@tauri-apps/api/core";
import { useLockFn } from "ahooks";
import { useImperativeHandle, useState } from "react";
import { useTranslation } from "react-i18next";

import { BaseDialog, DialogRef, Switch } from "@/components/base";
import { EditorViewer } from "@/components/profile/editor-viewer";
import { useVerge } from "@/hooks/use-verge";
import { defaultDarkTheme, defaultTheme } from "@/pages/_theme";
import { showNotice } from "@/services/noticeService";

import { ThemePresetCard } from "./theme-preset-card";
import THEME_PRESETS from "./theme-presets.json";
import type { ThemePreset, ThemeMode, ThemeSetting, CustomThemes } from "./theme-types";
import {
  CUSTOM_THEMES_KEY,
  isThemeActive,
  createThemeFromPreset,
  createPresetFromTheme,
} from "./theme-utils";

export function ThemeViewerEnhanced(props: { ref?: React.Ref<DialogRef> }) {
  const { ref } = props;
  const { t } = useTranslation();
  const currentTheme = useTheme();

  const [open, setOpen] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [themeName, setThemeName] = useState("");
  const [presetFilter, setPresetFilter] = useState<ThemeMode>("light");
  const [tabValue, setTabValue] = useState(0);
  const { verge, patchVerge } = useVerge();
  const { theme_setting } = verge ?? {};
  const [theme, setTheme] = useState<ThemeSetting>(theme_setting || {});
  const [customThemes, setCustomThemes] = useState<CustomThemes>(() => {
    const saved = localStorage.getItem(CUSTOM_THEMES_KEY);
    return saved ? JSON.parse(saved) : { light: [], dark: [] };
  });

  useImperativeHandle(ref, () => ({
    open: () => {
      setOpen(true);
      setTheme({ ...theme_setting });
      const mode = verge?.theme_mode || "light";
      setPresetFilter(mode === "dark" ? "dark" : "light");
      setTabValue(0);
    },
    close: () => setOpen(false),
  }));

  const handleChange = (field: keyof ThemeSetting) => (e: any) => {
    setTheme((t) => ({ ...t, [field]: e.target.value }));
  };

  const handleColorChange = (field: keyof ThemeSetting) => (e: any) => {
    const newTheme = { ...theme, [field]: e.target.value };
    setTheme(newTheme);
  };

  const handleBackgroundChange = (field: keyof ThemeSetting, value: any) => {
    const newTheme = { ...theme, [field]: value };
    setTheme(newTheme);
    // 实时预览：立即应用到verge
    patchVerge({ theme_setting: newTheme });
  };

  const handleSelectImage = useLockFn(async () => {
    try {
      const selected = await openDialog({
        directory: false,
        multiple: false,
        filters: [{ name: "Images", extensions: ["png", "jpg", "jpeg", "gif", "webp", "svg", "bmp"] }],
      });
      if (selected) {
        const assetUrl = convertFileSrc(selected as string);
        const newTheme = {
          ...theme,
          background_type: "image" as const,
          background_image: assetUrl,
        };
        setTheme(newTheme);
        showNotice("success", t("Image selected successfully"));
      }
    } catch (err: any) {
      showNotice("error", err.message || err.toString());
    }
  });

  const handleSelectVideo = useLockFn(async () => {
    try {
      const selected = await openDialog({
        directory: false,
        multiple: false,
        filters: [{ name: "Videos", extensions: ["mp4", "webm", "ogg", "mov"] }],
      });
      if (selected) {
        const assetUrl = convertFileSrc(selected as string);
        const newTheme = {
          ...theme,
          background_type: "video" as const,
          background_video: assetUrl,
        };
        setTheme(newTheme);
        showNotice("success", t("Video selected successfully"));
      }
    } catch (err: any) {
      showNotice("error", err.message || err.toString());
    }
  });

  const resetBackground = () => {
    const newTheme: ThemeSetting = {
      ...theme,
      background_type: "none" as const,
      background_color: "#000000",
      background_image: "",
      background_video: "",
      background_opacity: 1,
      background_blur: 0,
      background_brightness: 100,
      background_blend_mode: "normal",
      background_size: "cover",
      background_position: "center",
      background_repeat: "no-repeat",
      background_scale: 1.0,
    };
    setTheme(newTheme);
    showNotice("success", t("Background settings reset"));
  };

  // 组件样式管理函数
  const componentStyles = theme.component_styles || {};
  const globalStyle = componentStyles.global || {};

  const updateComponentStyle = (key: ComponentKey | "global", style: Partial<IComponentStyle>) => {
    const newComponentStyles = {
      ...componentStyles,
      [key]: {
        ...(componentStyles[key] || {}),
        ...style,
      },
    };
    const newTheme = {
      ...theme,
      component_styles: newComponentStyles,
    };
    setTheme(newTheme);
    // 实时更新，但不显示提示
    patchVerge({ theme_setting: newTheme });
  };

  const resetComponentStyle = async (key: ComponentKey | "global") => {
    const newComponentStyles = { ...componentStyles };
    delete newComponentStyles[key];
    const newTheme = {
      ...theme,
      component_styles: newComponentStyles,
    };
    setTheme(newTheme);
    await patchVerge({ theme_setting: newTheme });
    showNotice("success", t("Component style reset"));
  };

  const resetAllComponentStyles = async () => {
    const newTheme = {
      ...theme,
      component_styles: {},
    };
    setTheme(newTheme);
    await patchVerge({ theme_setting: newTheme });
    showNotice("success", t("All component styles reset"));
  };

  // 获取组件的实际样式值（考虑全局默认值）
  const getComponentActualStyle = (key: ComponentKey | "global") => {
    const style = key === "global" ? globalStyle : (componentStyles[key] || {});
    
    if (key === "global") {
      return {
        background_color: style.background_color || (currentTheme.palette.mode === "dark" ? "#1a1a1a" : "#ffffff"),
        blur: style.blur ?? 25,
        opacity: style.opacity ?? 0.7,
      };
    }
    
    // 非全局组件：使用组件自己的值，如果没有则使用全局默认值
    return {
      background_color: style.background_color || globalStyle.background_color || (currentTheme.palette.mode === "dark" ? "#1a1a1a" : "#ffffff"),
      blur: style.blur ?? globalStyle.blur ?? 25,
      opacity: style.opacity ?? globalStyle.opacity ?? 0.7,
    };
  };

  // 渲染组件样式控制器
  const renderComponentStyleControls = (key: ComponentKey | "global") => {
    const style = key === "global" ? globalStyle : (componentStyles[key] || {});
    const isEnabled = style.enabled ?? (key === "global" ? true : false);
    const actualStyle = getComponentActualStyle(key);

    return (
      <Stack spacing={2}>
        {key !== "global" && (
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <Typography variant="body2">{t("Enable Custom Style")}</Typography>
            <Switch
              edge="end"
              checked={isEnabled}
              onChange={(e) => updateComponentStyle(key, { enabled: e.target.checked })}
            />
          </Box>
        )}

        {(key === "global" || isEnabled) && (
          <>
            <Box>
              <Typography variant="body2" gutterBottom>
                {t("Background Color")}
              </Typography>
              <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                <input
                  type="color"
                  value={actualStyle.background_color}
                  onChange={(e) => updateComponentStyle(key, { background_color: e.target.value })}
                  style={{ width: 50, height: 40, border: "none", borderRadius: 4, cursor: "pointer" }}
                />
                <TextField
                  size="small"
                  value={style.background_color || ""}
                  onChange={(e) => updateComponentStyle(key, { background_color: e.target.value })}
                  placeholder={actualStyle.background_color}
                  fullWidth
                />
              </Box>
            </Box>

            <Box>
              <Typography variant="body2" gutterBottom>
                {t("Blur")}
              </Typography>
              <TextField
                size="small"
                type="number"
                value={style.blur ?? ""}
                onChange={(e) => {
                  const value = parseInt(e.target.value) || 0;
                  updateComponentStyle(key, { blur: Math.max(0, Math.min(100, value)) });
                }}
                placeholder={String(actualStyle.blur)}
                InputProps={{
                  endAdornment: <InputAdornment position="end">px</InputAdornment>,
                }}
                fullWidth
              />
              {key !== "global" && !style.blur && (
                <Typography variant="caption" color="text.secondary">
                  {t("Using global default")}: {actualStyle.blur}px
                </Typography>
              )}
            </Box>

            <Box>
              <Typography variant="body2" gutterBottom>
                {t("Opacity")}: {Math.round(actualStyle.opacity * 100)}%
              </Typography>
              <Slider
                value={style.opacity ?? (key === "global" ? 0.7 : null) ?? actualStyle.opacity}
                onChange={(_, value) => updateComponentStyle(key, { opacity: value as number })}
                min={0}
                max={1}
                step={0.01}
                size="small"
              />
              {key !== "global" && style.opacity === undefined && (
                <Typography variant="caption" color="text.secondary">
                  {t("Using global default")}: {Math.round(actualStyle.opacity * 100)}%
                </Typography>
              )}
            </Box>

            <Button
              variant="outlined"
              color="warning"
              size="small"
              startIcon={<RestartAlt />}
              onClick={() => resetComponentStyle(key)}
              fullWidth
            >
              {t("Reset to Default")}
            </Button>
          </>
        )}
      </Stack>
    );
  };

  const applyPreset = useLockFn(async (preset: ThemePreset) => {
    const newTheme = createThemeFromPreset(theme, preset);
    setTheme(newTheme);
    await patchVerge({ 
      theme_setting: newTheme,
      theme_mode: presetFilter,
    });
  });

  const resetToDefault = useLockFn(async () => {
    const dt = presetFilter === "light" ? defaultTheme : defaultDarkTheme;
    const newTheme: ThemeSetting = {
      primary_color: dt.primary_color,
      secondary_color: dt.secondary_color,
      info_color: dt.info_color,
      error_color: dt.error_color,
      warning_color: dt.warning_color,
      success_color: dt.success_color,
      primary_text: dt.primary_text,
      secondary_text: dt.secondary_text,
    };
    setTheme(newTheme);
    await patchVerge({ theme_setting: newTheme });
    showNotice("success", t("Reset to Default"), 1000);
  });

  const saveCustomTheme = useLockFn(async () => {
    if (!themeName.trim()) {
      showNotice("error", t("Please enter theme name"));
      return;
    }

    const newCustomTheme = createPresetFromTheme(themeName, theme);
    const updated = { ...customThemes };
    updated[presetFilter] = [...updated[presetFilter], newCustomTheme];
    setCustomThemes(updated);
    localStorage.setItem(CUSTOM_THEMES_KEY, JSON.stringify(updated));
    
    setSaveDialogOpen(false);
    setThemeName("");
    showNotice("success", t("Theme saved successfully"), 1000);
  });

  const deleteCustomTheme = useLockFn(async (preset: ThemePreset) => {
    const updated = { ...customThemes };
    updated[presetFilter] = updated[presetFilter].filter((p) => p.name !== preset.name);
    setCustomThemes(updated);
    localStorage.setItem(CUSTOM_THEMES_KEY, JSON.stringify(updated));
    showNotice("success", t("Theme deleted"), 1000);
  });

  const onSave = useLockFn(async () => {
    try {
      await patchVerge({ theme_setting: theme });
      setOpen(false);
      showNotice("success", t("Theme Saved Successfully"), 1000);
    } catch (err: any) {
      showNotice("error", err.toString());
    }
  });

  const dt = presetFilter === "light" ? defaultTheme : defaultDarkTheme;
  const presets: ThemePreset[] = (THEME_PRESETS as any)[presetFilter];
  const customPresets = customThemes[presetFilter] || [];
  const backgroundType = (theme.background_type as string) || "none";
  const blendModes = ["normal", "multiply", "screen", "overlay", "darken", "lighten", "color-dodge", "color-burn", "hard-light", "soft-light", "difference", "exclusion"];

  // 组件样式配置类型
  type ComponentKey = "select" | "profile_card" | "proxy_card" | "textfield" | "analytics_chart" | "analytics_header" | "dialog";

  interface ComponentConfig {
    key: ComponentKey;
    label: string;
    description: string;
  }

  const componentConfigs: ComponentConfig[] = [
    { key: "select", label: "Select Dropdown", description: "Dropdown menu style" },
    { key: "profile_card", label: "Profile Card", description: "Subscription profile card" },
    { key: "proxy_card", label: "Proxy Card", description: "Proxy node card" },
    { key: "textfield", label: "Text Field", description: "Input field style" },
    { key: "analytics_chart", label: "Analytics Chart", description: "Traffic trend chart" },
    { key: "analytics_header", label: "Analytics Header", description: "Top domains & processes header" },
    { key: "dialog", label: "Dialog", description: "Settings dialog window" },
  ];

  type ThemeKey = keyof ThemeSetting & keyof typeof defaultTheme;

  const renderColorItem = (label: string, key: ThemeKey) => {
    const currentColor = (theme[key] || dt[key]) as string;
    return (
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1.5,
          py: 1,
        }}
      >
        <Box
          sx={{
            width: 36,
            height: 36,
            borderRadius: 1,
            background: currentColor,
            cursor: "pointer",
            position: "relative",
            flexShrink: 0,
            border: "1px solid",
            borderColor: "divider",
          }}
        >
          <input
            type="color"
            value={currentColor}
            onChange={handleColorChange(key)}
            style={{
              opacity: 0,
              position: "absolute",
              width: "100%",
              height: "100%",
              cursor: "pointer",
            }}
          />
        </Box>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography sx={{ fontSize: 13, fontWeight: 500 }}>
            {label}
          </Typography>
          <Typography 
            sx={{ 
              fontSize: 11, 
              color: "text.secondary",
              fontFamily: "monospace",
            }}
          >
            {currentColor}
          </Typography>
        </Box>
      </Box>
    );
  };

  return (
    <>
      <BaseDialog
        open={open}
        title={t("Theme Settings")}
        okBtn={t("Save")}
        cancelBtn={t("Cancel")}
        contentSx={{ 
          width: 640,
          maxHeight: "80vh", 
          p: 0,
          overflowY: "auto",
          "&::-webkit-scrollbar": {
            width: "6px",
          },
          "&::-webkit-scrollbar-track": {
            background: "transparent",
          },
          "&::-webkit-scrollbar-thumb": {
            background: "rgba(128, 128, 128, 0.2)",
            borderRadius: "3px",
          },
        }}
        onClose={() => setOpen(false)}
        onCancel={() => setOpen(false)}
        onOk={onSave}
      >
        <Tabs 
          value={tabValue} 
          onChange={(_, v) => setTabValue(v)} 
          sx={{ 
            px: 2,
            pt: 2,
            borderBottom: 1,
            borderColor: "divider",
            "& .MuiTab-root": {
              minHeight: 42,
              fontSize: 13,
              fontWeight: 500,
              textTransform: "none",
            },
          }}
        >
          <Tab label={t("Presets")} />
          <Tab label={t("Colors")} />
          <Tab label={t("Background")} />
          <Tab label={t("Layout")} />
        </Tabs>
        
        <Box sx={{ p: 2 }}>
          {tabValue === 0 && (
            <Stack spacing={2}>
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <ToggleButtonGroup
                  value={presetFilter}
                  exclusive
                  onChange={(_, value) => value && setPresetFilter(value)}
                  size="small"
                >
                  <ToggleButton value="light">
                    <Brightness7Rounded sx={{ fontSize: 16, mr: 0.5 }} />
                    {t("Light")}
                  </ToggleButton>
                  <ToggleButton value="dark">
                    <Brightness4Rounded sx={{ fontSize: 16, mr: 0.5 }} />
                    {t("Dark")}
                  </ToggleButton>
                </ToggleButtonGroup>
                <Button size="small" onClick={resetToDefault} startIcon={<RefreshRounded />}>
                  {t("Reset")}
                </Button>
              </Box>

              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(100px, 1fr))",
                  gap: 1.5,
                  maxHeight: 420,
                  overflowY: "auto",
                  pr: 1,
                }}
              >
                {[...presets, ...customPresets].map((preset, index) => (
                  <ThemePresetCard
                    key={preset.name + index}
                    preset={preset}
                    isActive={isThemeActive(theme, preset)}
                    onApply={applyPreset}
                    onDelete={preset.isCustom ? deleteCustomTheme : undefined}
                  />
                ))}
              </Box>
            </Stack>
          )}

          {tabValue === 1 && (
            <Stack spacing={2}>
              <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
                {renderColorItem(t("Primary"), "primary_color")}
                {renderColorItem(t("Secondary"), "secondary_color")}
                {renderColorItem(t("Info"), "info_color")}
                {renderColorItem(t("Success"), "success_color")}
                {renderColorItem(t("Warning"), "warning_color")}
                {renderColorItem(t("Error"), "error_color")}
                {renderColorItem(t("Primary Text"), "primary_text")}
                {renderColorItem(t("Secondary Text"), "secondary_text")}
              </Box>
              
              <Divider />

              <Button
                size="small"
                variant="outlined"
                startIcon={<SaveRounded />}
                onClick={() => setSaveDialogOpen(true)}
              >
                {t("Save as Custom")}
              </Button>
              
              <TextField
                size="small"
                label={t("Font Family")}
                value={theme.font_family ?? ""}
                placeholder={dt.font_family}
                onChange={handleChange("font_family")}
                fullWidth
              />
              <Button
                variant="outlined"
                size="small"
                onClick={() => setEditorOpen(true)}
              >
                {t("Edit CSS")}
              </Button>
            </Stack>
          )}

          {tabValue === 2 && (
            <Stack spacing={2}>
              <ToggleButtonGroup
                value={backgroundType}
                exclusive
                onChange={(_, value) => {
                  if (value !== null) handleBackgroundChange("background_type", value);
                }}
                fullWidth
                size="small"
              >
                <ToggleButton value="none">{t("None")}</ToggleButton>
                <ToggleButton value="color">{t("Solid Color")}</ToggleButton>
                <ToggleButton value="image">{t("Image")}</ToggleButton>
                <ToggleButton value="video">{t("Video")}</ToggleButton>
              </ToggleButtonGroup>

              {backgroundType === "color" && (
                <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                  <input
                    type="color"
                    value={theme.background_color || "#000000"}
                    onChange={(e) => handleBackgroundChange("background_color", e.target.value)}
                    style={{ width: 50, height: 40, border: "none", borderRadius: 4, cursor: "pointer" }}
                  />
                  <TextField
                    size="small"
                    value={theme.background_color || "#000000"}
                    onChange={(e) => handleBackgroundChange("background_color", e.target.value)}
                    fullWidth
                  />
                </Box>
              )}

              {backgroundType === "image" && (
                <>
                  <Button variant="outlined" startIcon={<UploadFileRounded />} onClick={handleSelectImage} fullWidth>
                    {t("Select Local Image")}
                  </Button>
                  <TextField
                    size="small"
                    fullWidth
                    value={theme.background_image || ""}
                    onChange={(e) => handleBackgroundChange("background_image", e.target.value)}
                    placeholder={t("Or enter image URL")}
                    InputProps={{ startAdornment: <LinkRounded sx={{ mr: 1, opacity: 0.5, fontSize: 18 }} /> }}
                  />
                  <Box sx={{ display: "flex", gap: 1 }}>
                    <FormControl size="small" fullWidth>
                      <InputLabel>{t("Size")}</InputLabel>
                      <Select
                        value={theme.background_size || "cover"}
                        label={t("Size")}
                        onChange={(e) => handleBackgroundChange("background_size", e.target.value)}
                      >
                        <MenuItem value="cover">{t("Cover")}</MenuItem>
                        <MenuItem value="contain">{t("Contain")}</MenuItem>
                        <MenuItem value="auto">{t("Auto")}</MenuItem>
                      </Select>
                    </FormControl>
                    <FormControl size="small" fullWidth>
                      <InputLabel>{t("Position")}</InputLabel>
                      <Select
                        value={theme.background_position || "center"}
                        label={t("Position")}
                        onChange={(e) => handleBackgroundChange("background_position", e.target.value)}
                      >
                        <MenuItem value="center">{t("Center")}</MenuItem>
                        <MenuItem value="top">{t("Top")}</MenuItem>
                        <MenuItem value="bottom">{t("Bottom")}</MenuItem>
                      </Select>
                    </FormControl>
                  </Box>
                </>
              )}

              {backgroundType === "video" && (
                <>
                  <Button variant="outlined" startIcon={<UploadFileRounded />} onClick={handleSelectVideo} fullWidth>
                    {t("Select Local Video")}
                  </Button>
                  <TextField
                    size="small"
                    fullWidth
                    value={theme.background_video || ""}
                    onChange={(e) => handleBackgroundChange("background_video", e.target.value)}
                    placeholder={t("Or enter video URL")}
                    InputProps={{ startAdornment: <LinkRounded sx={{ mr: 1, opacity: 0.5, fontSize: 18 }} /> }}
                  />
                </>
              )}

              {backgroundType !== "none" && (
                <>
                  <Divider />
                  <Box>
                    <Typography variant="body2" gutterBottom>{t("Opacity")}: {Math.round((theme.background_opacity ?? 1) * 100)}%</Typography>
                    <Slider
                      value={theme.background_opacity ?? 1}
                      onChange={(_, value) => handleBackgroundChange("background_opacity", value)}
                      min={0} max={1} step={0.01}
                      size="small"
                    />
                  </Box>
                  <Box>
                    <Typography variant="body2" gutterBottom>{t("Blur")}: {theme.background_blur ?? 0}px</Typography>
                    <Slider
                      value={theme.background_blur ?? 0}
                      onChange={(_, value) => handleBackgroundChange("background_blur", value)}
                      min={0} max={50} step={1}
                      size="small"
                    />
                  </Box>
                  <Box>
                    <Typography variant="body2" gutterBottom>{t("Brightness")}: {theme.background_brightness ?? 100}%</Typography>
                    <Slider
                      value={theme.background_brightness ?? 100}
                      onChange={(_, value) => handleBackgroundChange("background_brightness", value)}
                      min={0} max={200} step={1}
                      size="small"
                    />
                  </Box>
                  <Box>
                    <Typography variant="body2" gutterBottom>
                      {t("Scale")}: {(theme.background_scale ?? 1.0).toFixed(2)}x
                    </Typography>
                    <Slider
                      value={theme.background_scale ?? 1.0}
                      onChange={(_, value) => handleBackgroundChange("background_scale", value)}
                      min={1.0} max={1.5} step={0.01}
                      size="small"
                    />
                    <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.5 }}>
                      {t("Increase scale to eliminate white edges when blur is enabled")}
                    </Typography>
                  </Box>
                  <FormControl size="small" fullWidth>
                    <InputLabel>{t("Blend Mode")}</InputLabel>
                    <Select
                      value={theme.background_blend_mode || "normal"}
                      label={t("Blend Mode")}
                      onChange={(e) => handleBackgroundChange("background_blend_mode", e.target.value)}
                    >
                      {blendModes.map((mode) => (
                        <MenuItem key={mode} value={mode}>{mode}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </>
              )}

              <Button variant="outlined" color="error" startIcon={<DeleteRounded />} onClick={resetBackground} fullWidth>
                {t("Reset to Default")}
              </Button>
            </Stack>
          )}

          {tabValue === 3 && (
            <Box>
              <Box sx={{ mb: 2, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Typography variant="subtitle2" color="text.secondary">
                  {t("Fine-tune component blur and colors")}
                </Typography>
                <Button
                  variant="outlined"
                  color="error"
                  size="small"
                  startIcon={<RestartAlt />}
                  onClick={resetAllComponentStyles}
                >
                  {t("Reset All")}
                </Button>
              </Box>

              {/* 全局设置 */}
              <Accordion defaultExpanded>
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <Box>
                    <Typography variant="subtitle2" fontWeight={600}>
                      {t("Global Default")}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {t("Default style for all components")}
                    </Typography>
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  {renderComponentStyleControls("global")}
                </AccordionDetails>
              </Accordion>

              {/* 各个组件的独立设置 */}
              {componentConfigs.map((config) => (
                <Accordion key={config.key}>
                  <AccordionSummary expandIcon={<ExpandMore />}>
                    <Box>
                      <Typography variant="subtitle2" fontWeight={600}>
                        {t(config.label)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {t(config.description)}
                      </Typography>
                    </Box>
                  </AccordionSummary>
                  <AccordionDetails>
                    {renderComponentStyleControls(config.key)}
                  </AccordionDetails>
                </Accordion>
              ))}

              <Divider sx={{ my: 2 }} />

              {/* Sidebar 和 Header 设置保留 */}
              <Accordion>
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <Box>
                    <Typography variant="subtitle2" fontWeight={600}>
                      {t("Sidebar Style")}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {t("Left navigation bar style")}
                    </Typography>
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  <Stack spacing={2}>
                    <Box>
                      <Typography variant="body2" gutterBottom>
                        {t("Background Color")}
                      </Typography>
                      <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                        <input
                          type="color"
                          value={theme.sidebar_background_color || (currentTheme.palette.mode === "dark" ? "#1a1a1a" : "#ffffff")}
                          onChange={(e) => handleBackgroundChange("sidebar_background_color", e.target.value)}
                          style={{ width: 50, height: 40, border: "none", borderRadius: 4, cursor: "pointer" }}
                        />
                        <TextField
                          size="small"
                          value={theme.sidebar_background_color || ""}
                          onChange={(e) => handleBackgroundChange("sidebar_background_color", e.target.value)}
                          placeholder={t("Background Color")}
                          fullWidth
                        />
                      </Box>
                    </Box>
                    <Box>
                      <Typography variant="body2" gutterBottom>{t("Opacity")}: {Math.round((theme.sidebar_opacity ?? 1) * 100)}%</Typography>
                      <Slider
                        value={theme.sidebar_opacity ?? 1}
                        onChange={(_, value) => handleBackgroundChange("sidebar_opacity", value)}
                        min={0} max={1} step={0.01}
                        size="small"
                      />
                    </Box>
                    <Box>
                      <Typography variant="body2" gutterBottom>
                        {t("Blur")}
                      </Typography>
                      <TextField
                        size="small"
                        type="number"
                        value={theme.sidebar_blur ?? 0}
                        onChange={(e) => {
                          const value = parseInt(e.target.value) || 0;
                          handleBackgroundChange("sidebar_blur", Math.max(0, Math.min(100, value)));
                        }}
                        InputProps={{
                          endAdornment: <InputAdornment position="end">px</InputAdornment>,
                        }}
                        fullWidth
                      />
                    </Box>
                  </Stack>
                </AccordionDetails>
              </Accordion>

              <Accordion>
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <Box>
                    <Typography variant="subtitle2" fontWeight={600}>
                      {t("Header Style")}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {t("Top header bar style")}
                    </Typography>
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  <Stack spacing={2}>
                    <Box>
                      <Typography variant="body2" gutterBottom>
                        {t("Background Color")}
                      </Typography>
                      <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                        <input
                          type="color"
                          value={theme.header_background_color || (currentTheme.palette.mode === "dark" ? "#1a1a1a" : "#ffffff")}
                          onChange={(e) => handleBackgroundChange("header_background_color", e.target.value)}
                          style={{ width: 50, height: 40, border: "none", borderRadius: 4, cursor: "pointer" }}
                        />
                        <TextField
                          size="small"
                          value={theme.header_background_color || ""}
                          onChange={(e) => handleBackgroundChange("header_background_color", e.target.value)}
                          placeholder={t("Background Color")}
                          fullWidth
                        />
                      </Box>
                    </Box>
                    <Box>
                      <Typography variant="body2" gutterBottom>{t("Opacity")}: {Math.round((theme.header_opacity ?? 1) * 100)}%</Typography>
                      <Slider
                        value={theme.header_opacity ?? 1}
                        onChange={(_, value) => handleBackgroundChange("header_opacity", value)}
                        min={0} max={1} step={0.01}
                        size="small"
                      />
                    </Box>
                    <Box>
                      <Typography variant="body2" gutterBottom>
                        {t("Blur")}
                      </Typography>
                      <TextField
                        size="small"
                        type="number"
                        value={theme.header_blur ?? 0}
                        onChange={(e) => {
                          const value = parseInt(e.target.value) || 0;
                          handleBackgroundChange("header_blur", Math.max(0, Math.min(100, value)));
                        }}
                        InputProps={{
                          endAdornment: <InputAdornment position="end">px</InputAdornment>,
                        }}
                        fullWidth
                      />
                    </Box>
                  </Stack>
                </AccordionDetails>
              </Accordion>
            </Box>
          )}
        </Box>

        {editorOpen && (
          <EditorViewer
            open={true}
            title={`${t("Edit")} CSS`}
            initialData={Promise.resolve(theme.css_injection ?? "")}
            language="css"
            onSave={(_prev, curr) => {
              setTheme((t) => ({ ...t, css_injection: curr }));
            }}
            onClose={() => setEditorOpen(false)}
          />
        )}
      </BaseDialog>

      <Dialog open={saveDialogOpen} onClose={() => setSaveDialogOpen(false)}>
        <DialogTitle>{t("Save Custom Theme")}</DialogTitle>
        <DialogContent sx={{ width: 360, pt: 2 }}>
          <TextField
            fullWidth
            size="small"
            label={t("Theme Name")}
            value={themeName}
            onChange={(e) => setThemeName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && saveCustomTheme()}
            placeholder={t("Enter theme name")}
            autoFocus
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSaveDialogOpen(false)}>{t("Cancel")}</Button>
          <Button onClick={saveCustomTheme} variant="contained">
            {t("Save")}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
