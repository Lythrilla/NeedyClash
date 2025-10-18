/**
 * 统一的主题 tokens 和样式变量
 * 用于保持整个应用的设计一致性
 */

import { alpha, type Theme } from "@mui/material";

// 间距系统
export const spacing = {
  xs: 0.5,
  sm: 1,
  md: 1.5,
  lg: 2,
  xl: 3,
} as const;

// 圆角系统 - 与 CSS 变量保持一致
export const borderRadius = {
  xs: "var(--cv-border-radius-xs)",
  sm: "var(--cv-border-radius-sm)",
  md: "var(--cv-border-radius-md)",
  lg: "var(--cv-border-radius-lg)",
  xl: "var(--cv-border-radius-xl)",
  full: "var(--cv-border-radius-full)",
} as const;

// 字体大小系统
export const fontSize = {
  xs: "10px",
  sm: "11px",
  md: "12px",
  base: "13px",
  lg: "14px",
  xl: "15px",
  "2xl": "16px",
  "3xl": "18px",
  "4xl": "20px",
} as const;

// 字重系统
export const fontWeight = {
  normal: 400,
  medium: 500,
  semibold: 600,
  bold: 700,
} as const;

// 阴影系统
export const shadows = {
  sm: "0 1px 2px rgba(0, 0, 0, 0.05)",
  md: "0 4px 6px rgba(0, 0, 0, 0.1)",
  lg: "0 10px 15px rgba(0, 0, 0, 0.1)",
  xl: "0 20px 25px rgba(0, 0, 0, 0.15)",
} as const;

// 过渡动画
export const transitions = {
  fast: "all 0.15s ease",
  normal: "all 0.2s ease",
  slow: "all 0.3s ease",
} as const;

// 获取分隔线颜色
export const getDividerColor = (theme: Theme) =>
  theme.palette.mode === "dark"
    ? "rgba(255, 255, 255, 0.04)"
    : "rgba(0, 0, 0, 0.04)";

// 获取背景色
export const getBackgroundColor = (theme: Theme, transparent = false) =>
  transparent
    ? "transparent"
    : theme.palette.mode === "dark"
      ? "#282828"
      : "#F8FAFC";

// 获取卡片样式
export const getCardStyles = (theme: Theme) => ({
  border: `1px solid ${getDividerColor(theme)}`,
  backgroundColor:
    theme.palette.mode === "dark"
      ? "rgba(255, 255, 255, 0.02)"
      : "rgba(255, 255, 255, 0.8)",
  transition: transitions.normal,
  "&:hover": {
    borderColor:
      theme.palette.mode === "dark"
        ? "rgba(255, 255, 255, 0.08)"
        : "rgba(0, 0, 0, 0.08)",
  },
});

// 获取毛玻璃菜单样式
export const getGlassMenuStyles = (theme: Theme) => ({
  position: "fixed" as const,
  backgroundColor:
    theme.palette.mode === "light"
      ? "rgba(255, 255, 255, 0.95)"
      : "rgba(50, 50, 50, 0.95)",
  backdropFilter: "blur(20px) saturate(180%)",
  WebkitBackdropFilter: "blur(20px) saturate(180%)",
  border: `1px solid ${
    theme.palette.mode === "light" ? "#E2E8F0" : "rgba(255, 255, 255, 0.1)"
  }`,
  zIndex: 1400,
});

// 获取按钮样式（激活状态）
export const getButtonStyles = (isActive: boolean, theme: Theme) => ({
  display: "flex",
  alignItems: "center",
  gap: spacing.sm,
  px: 1.25,
  py: 0.5,
  cursor: "pointer",
  border: "1px solid",
  borderColor: isActive ? "primary.main" : "divider",
  backgroundColor: isActive
    ? alpha(theme.palette.primary.main, 0.08)
    : "transparent",
  transition: transitions.normal,
  "&:hover": {
    borderColor: "primary.main",
    backgroundColor: isActive
      ? alpha(theme.palette.primary.main, 0.12)
      : alpha(theme.palette.primary.main, 0.04),
  },
});

// 获取图标按钮样式
export const getIconButtonStyles = (size: "small" | "medium" = "small") => ({
  width: size === "small" ? 28 : 36,
  height: size === "small" ? 28 : 36,
  "&:hover": { bgcolor: "action.hover" },
});

// 获取标题样式
export const getSectionTitleStyles = (
  variant: "primary" | "secondary" = "primary",
) => ({
  display: "block",
  mb: 2.5,
  fontWeight: variant === "primary" ? fontWeight.bold : fontWeight.normal,
  fontSize: variant === "primary" ? fontSize.xs : fontSize.xs,
  letterSpacing: variant === "primary" ? "1.2px" : "0.8px",
  textTransform: "uppercase" as const,
  color: variant === "primary" ? "text.secondary" : "text.disabled",
  opacity: variant === "primary" ? 0.7 : 0.5,
});
