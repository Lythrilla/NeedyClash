import type { ThemePreset, ThemeSetting } from "./theme-types";

// 自定义主题本地存储key
export const CUSTOM_THEMES_KEY = "custom_themes";

// 检查主题是否完全匹配（所有颜色字段）
export const isThemeActive = (
  theme: ThemeSetting,
  preset: ThemePreset,
): boolean => {
  return (
    theme.primary_color === preset.primary_color &&
    theme.secondary_color === preset.secondary_color &&
    theme.info_color === preset.info_color &&
    theme.success_color === preset.success_color &&
    theme.warning_color === preset.warning_color &&
    theme.error_color === preset.error_color &&
    theme.primary_text === preset.primary_text &&
    theme.secondary_text === preset.secondary_text
  );
};

// 从预制主题创建主题设置
export const createThemeFromPreset = (
  currentTheme: ThemeSetting,
  preset: ThemePreset,
): ThemeSetting => {
  return {
    ...currentTheme,
    primary_color: preset.primary_color,
    secondary_color: preset.secondary_color,
    info_color: preset.info_color,
    success_color: preset.success_color,
    warning_color: preset.warning_color,
    error_color: preset.error_color,
    primary_text: preset.primary_text,
    secondary_text: preset.secondary_text,
  };
};

// 从当前主题设置创建预制主题
export const createPresetFromTheme = (
  name: string,
  theme: ThemeSetting,
): ThemePreset => {
  return {
    name,
    primary_color: theme.primary_color || "",
    secondary_color: theme.secondary_color || "",
    info_color: theme.info_color || "",
    success_color: theme.success_color || "",
    warning_color: theme.warning_color || "",
    error_color: theme.error_color || "",
    primary_text: theme.primary_text || "",
    secondary_text: theme.secondary_text || "",
    isCustom: true,
  };
};
