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
import { useImperativeHandle, useState, useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";

import { BaseDialog, DialogRef, Switch } from "@/components/base";
import { EditorViewer } from "@/components/profile/editor-viewer";
import { useVerge } from "@/hooks/use-verge";
import { defaultDarkTheme, defaultTheme } from "@/pages/_theme";
import { showNotice } from "@/services/noticeService";
import debounce from "@/utils/debounce";
import { safeGetStorage, safeSetStorage } from "@/utils/safe-storage";

import { ThemePresetCard } from "./theme-preset-card";
import THEME_PRESETS from "./theme-presets.json";
import type { ThemePreset, ThemeMode, ThemeSetting, CustomThemes, IComponentStyle, ComponentKey } from "./theme-types";
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
    return safeGetStorage({
      key: CUSTOM_THEMES_KEY,
      defaultValue: { light: [], dark: [] },
      onError: (error) => {
        showNotice("error", t("Failed to load custom themes"));
      },
    });
  });
  
  // 批量设置 state
  const [batchBlur, setBatchBlur] = useState(0);
  const [batchOpacity, setBatchOpacity] = useState(1);

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

  // 使用 useCallback 优化性能
  const handleBackgroundChange = useCallback((field: keyof ThemeSetting, value: any) => {
    const newTheme = { ...theme, [field]: value };
    setTheme(newTheme);
    // 实时预览：立即应用到verge
    patchVerge({ theme_setting: newTheme });
  }, [theme, patchVerge]);

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
  const applyBatchSettings = useLockFn(async () => {
    const newTheme = {
      ...theme,
      sidebar_blur: batchBlur,
      sidebar_opacity: batchOpacity,
      header_blur: batchBlur,
      header_opacity: batchOpacity,
      connection_table_blur: batchBlur,
      connection_table_opacity: batchOpacity,
    };
    setTheme(newTheme);
    await patchVerge({ theme_setting: newTheme });
    showNotice("success", t("Batch settings applied successfully"), 1500);
  });

  // 组件样式管理函数
  const componentStyles = theme.component_styles || {};
  const globalStyle = componentStyles.global || {};

  // 使用防抖优化实时更新
  const debouncedPatchVerge = useMemo(() => {
    return debounce((theme: ThemeSetting) => {
      patchVerge({ theme_setting: theme });
    }, 300);
  }, [patchVerge]);

  const updateComponentStyle = useCallback((key: ComponentKey, style: Partial<IComponentStyle>) => {
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
    // 使用防抖的实时更新
    debouncedPatchVerge(newTheme);
  }, [theme, componentStyles, debouncedPatchVerge]);

  const resetComponentStyle = async (key: ComponentKey) => {
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


  // 渲染组件样式控制器
  const renderComponentStyleControls = (key: ComponentKey) => {
    const style = componentStyles[key] || {};
    const defaultBgColor = currentTheme.palette.mode === "dark" ? "#1a1a1a" : "#ffffff";
    const bgColor = style.background_color || defaultBgColor;
    const blur = style.blur ?? 25;
    const opacity = style.opacity ?? 0.7;

    return (
      <Stack spacing={2}>
        <Box>
          <Typography variant="body2" gutterBottom>
            {t("Background Color")}
          </Typography>
          <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
            <input
              type="color"
              value={bgColor}
              onChange={(e) => updateComponentStyle(key, { background_color: e.target.value })}
              style={{ width: 50, height: 40, border: "1px solid rgba(0, 0, 0, 0.23)", borderRadius: "var(--cv-border-radius-xs)", cursor: "pointer" }}
            />
            <TextField
              size="small"
              value={style.background_color || ""}
              onChange={(e) => updateComponentStyle(key, { background_color: e.target.value })}
              placeholder={defaultBgColor}
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
            placeholder="25"
            InputProps={{
              endAdornment: <InputAdornment position="end">px</InputAdornment>,
            }}
            fullWidth
          />
        </Box>

        <Box>
          <Typography variant="body2" gutterBottom>
            {t("Opacity")}: {Math.round(opacity * 100)}%
          </Typography>
          <Slider
            value={style.opacity ?? 0.7}
            onChange={(_, value) => updateComponentStyle(key, { opacity: value as number })}
            min={0}
            max={1}
            step={0.01}
            size="small"
          />
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
    
    const success = safeSetStorage(CUSTOM_THEMES_KEY, updated, (error) => {
      showNotice("error", t("Failed to save theme"));
    });
    
    if (success) {
      setCustomThemes(updated);
      setSaveDialogOpen(false);
      setThemeName("");
      showNotice("success", t("Theme saved successfully"), 1000);
    }
  });

  const deleteCustomTheme = useLockFn(async (preset: ThemePreset) => {
    const updated = { ...customThemes };
    updated[presetFilter] = updated[presetFilter].filter((p) => p.name !== preset.name);
    
    const success = safeSetStorage(CUSTOM_THEMES_KEY, updated, (error) => {
      showNotice("error", t("Failed to delete theme"));
    });
    
    if (success) {
      setCustomThemes(updated);
      showNotice("success", t("Theme deleted"), 1000);
    }
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
        
        <Box sx={{ p: 2.5 }}>
          {tabValue === 0 && (
            <Stack spacing={2.5}>
              {/* 顶部控制栏 - 更简洁 */}
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                <ToggleButtonGroup
                  value={presetFilter}
                  exclusive
                  onChange={(_, value) => value && setPresetFilter(value)}
                  size="small"
                  sx={{
                    "& .MuiToggleButton-root": {
                      px: 2,
                      py: 0.75,
                      fontSize: 12.5,
                      fontWeight: 500,
                      textTransform: "none",
                      borderRadius: "var(--cv-border-radius-sm)",
                      "&.Mui-selected": {
                        backgroundColor: "primary.main",
                        color: "#fff",
                        "&:hover": {
                          backgroundColor: "primary.dark",
                        },
                      },
                    },
                  }}
                >
                  <ToggleButton value="light">
                    <Brightness7Rounded sx={{ fontSize: 15, mr: 0.75 }} />
                    {t("Light")}
                  </ToggleButton>
                  <ToggleButton value="dark">
                    <Brightness4Rounded sx={{ fontSize: 15, mr: 0.75 }} />
                    {t("Dark")}
                  </ToggleButton>
                </ToggleButtonGroup>
                <Box sx={{ flex: 1 }} />
                <Button 
                  size="small" 
                  onClick={resetToDefault} 
                  startIcon={<RefreshRounded sx={{ fontSize: 16 }} />}
                  sx={{
                    textTransform: "none",
                    fontSize: 12.5,
                    fontWeight: 500,
                    px: 2,
                  }}
                >
                  {t("Reset")}
                </Button>
              </Box>

              {/* 主题网格 */}
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
                  gap: 2,
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
                    style={{ width: 50, height: 40, border: "1px solid rgba(0, 0, 0, 0.23)", borderRadius: "var(--cv-border-radius-xs)", cursor: "pointer" }}
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
                        size="small"
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
                        size="small"
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
                      size="small"
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
              {/* 批量设置区域 */}
              <Accordion defaultExpanded sx={{ mb: 2 }}>
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <Box>
                    <Typography variant="subtitle2" fontWeight={600}>
                      {t("Batch Settings")}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {t("Batch apply blur and opacity to all layout elements")}
                    </Typography>
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  <Stack spacing={2}>
                    <Box>
                      <Typography variant="body2" gutterBottom>
                        {t("Blur")}: {batchBlur}px
                      </Typography>
                      <TextField
                        size="small"
                        type="number"
                        value={batchBlur}
                        onChange={(e) => {
                          const value = parseInt(e.target.value) || 0;
                          setBatchBlur(Math.max(0, Math.min(100, value)));
                        }}
                        InputProps={{
                          endAdornment: <InputAdornment position="end">px</InputAdornment>,
                        }}
                        fullWidth
                      />
                    </Box>
                    <Box>
                      <Typography variant="body2" gutterBottom>
                        {t("Opacity")}: {Math.round(batchOpacity * 100)}%
                      </Typography>
                      <Slider
                        value={batchOpacity}
                        onChange={(_, value) => setBatchOpacity(value as number)}
                        min={0}
                        max={1}
                        step={0.01}
                        size="small"
                      />
                    </Box>
                    <Button
                      variant="contained"
                      fullWidth
                      onClick={applyBatchSettings}
                    >
                      {t("Apply to All")}
                    </Button>
                    <Typography variant="caption" color="text.secondary" sx={{ textAlign: "center" }}>
                      {t("Apply blur and opacity to all elements below")}
                    </Typography>
                  </Stack>
                </AccordionDetails>
              </Accordion>

              <Divider sx={{ my: 2 }} />
              <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 2 }}>
                {t("Layout Elements Style")}
              </Typography>

              {/* Sidebar、Header、连接表格设置 */}
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
                          style={{ width: 50, height: 40, border: "1px solid rgba(0, 0, 0, 0.23)", borderRadius: "var(--cv-border-radius-xs)", cursor: "pointer" }}
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
                          style={{ width: 50, height: 40, border: "1px solid rgba(0, 0, 0, 0.23)", borderRadius: "var(--cv-border-radius-xs)", cursor: "pointer" }}
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

              <Accordion>
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <Box>
                    <Typography variant="subtitle2" fontWeight={600}>
                      {t("Connection Table Style")}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {t("Connection table view style")}
                    </Typography>
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  <Stack spacing={2}>
                    <Box>
                      <Typography variant="body2" gutterBottom>{t("Opacity")}: {Math.round((theme.connection_table_opacity ?? 1) * 100)}%</Typography>
                      <Slider
                        value={theme.connection_table_opacity ?? 1}
                        onChange={(_, value) => handleBackgroundChange("connection_table_opacity", value)}
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
                        value={theme.connection_table_blur ?? 0}
                        onChange={(e) => {
                          const value = parseInt(e.target.value) || 0;
                          handleBackgroundChange("connection_table_blur", Math.max(0, Math.min(100, value)));
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

              <Divider sx={{ my: 2 }} />

              {/* 组件样式设置 */}
              <Box sx={{ mb: 2, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Typography variant="subtitle2" fontWeight={600}>
                  {t("Component Styles")}
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
