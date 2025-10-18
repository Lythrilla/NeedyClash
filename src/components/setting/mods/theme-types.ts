// 主题预设接口
export interface ThemePreset {
  name: string;
  primary_color: string;
  secondary_color: string;
  info_color: string;
  success_color: string;
  warning_color: string;
  error_color: string;
  primary_text: string;
  secondary_text: string;
  isCustom?: boolean;
}

// 主题模式
export type ThemeMode = "light" | "dark";

// 主题设置
export interface ThemeSetting {
  primary_color?: string;
  secondary_color?: string;
  info_color?: string;
  success_color?: string;
  warning_color?: string;
  error_color?: string;
  primary_text?: string;
  secondary_text?: string;
  font_family?: string;
  css_injection?: string;
  // 窗口背景设置
  background_type?: "color" | "image" | "video" | "none";
  background_color?: string;
  background_image?: string;
  background_video?: string;
  background_opacity?: number;
  background_blur?: number;
  background_brightness?: number;
  background_blend_mode?: string;
  background_size?: string;
  background_position?: string;
  background_repeat?: string;
  background_scale?: number;
  // 导航栏样式设置
  sidebar_background_color?: string;
  sidebar_opacity?: number;
  sidebar_blur?: number;
  // Header样式设置
  header_background_color?: string;
  header_opacity?: number;
  header_blur?: number;
  // 设置页面样式
  settings_background_blur?: boolean;
  settings_background_opacity?: number;
  // 连接表格样式设置
  connection_table_blur?: number;
  connection_table_opacity?: number;
  // 组件微调设置
  component_styles?: {
    global?: IComponentStyle;
    select?: IComponentStyle;
    profile_card?: IComponentStyle;
    proxy_card?: IComponentStyle;
    textfield?: IComponentStyle;
    analytics_chart?: IComponentStyle;
    analytics_header?: IComponentStyle;
    dialog?: IComponentStyle;
  };
}

// 组件样式接口
export interface IComponentStyle {
  background_color?: string;
  blur?: number;
  opacity?: number;
}

// 组件键类型
export type ComponentKey = "select" | "profile_card" | "proxy_card" | "textfield" | "analytics_chart" | "analytics_header" | "dialog";

// 自定义主题集合
export interface CustomThemes {
  light: ThemePreset[];
  dark: ThemePreset[];
}

