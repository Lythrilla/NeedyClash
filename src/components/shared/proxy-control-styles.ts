import type { SxProps, Theme } from "@mui/material";
import { alpha } from "@mui/material";

/**
 * 代理控制组件样式常量
 */

/** 按钮样式生成器 */
const createButtonStyle = (
  color: "primary" | "success" | "error",
  fontSize: string = "11px",
): SxProps<Theme> => ({
  py: 0.75,
  px: 1,
  fontSize,
  fontWeight: 500,
  textTransform: "none",
  borderRadius: "var(--cv-border-radius-sm)",
  color: `${color}.main`,
  backgroundColor: (theme) => alpha(theme.palette[color].main, 0.06),
  transition: "all 0.2s",
  "&:hover": {
    backgroundColor: (theme) => alpha(theme.palette[color].main, 0.12),
  },
});

/** 服务按钮样式 */
export const SERVICE_BUTTON_STYLES = {
  install: createButtonStyle("primary"),
  reinstall: {
    ...createButtonStyle("success", "10px"),
    px: 0.75,
    "& .MuiButton-startIcon": {
      marginRight: "4px",
    },
  },
  uninstall: {
    ...createButtonStyle("error", "10px"),
    px: 0.75,
    "& .MuiButton-startIcon": {
      marginRight: "4px",
    },
  },
} as const;

/** 开关行容器样式 */
export const SWITCH_ROW_CONTAINER: SxProps<Theme> = {
  display: "flex",
  alignItems: "center",
  gap: 1.5,
  px: 0,
  py: 1,
  transition: "opacity 0.15s ease",
};

/** 标签样式 */
export const LABEL_STYLE: SxProps<Theme> = {
  fontSize: 12,
  fontWeight: 400,
  color: "text.secondary",
  flex: 1,
  minWidth: 0,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};

/** 提示文本样式 */
export const HINT_TEXT_STYLES = {
  caption: {
    fontSize: 10,
    lineHeight: 1.4,
    color: "text.disabled",
    display: "block",
    mt: 0.5,
    mb: 1,
  },
  warning: {
    fontSize: 9,
    color: "warning.main",
    lineHeight: 1.3,
  },
} as const;

/** 图标样式 */
export const ICON_STYLE: SxProps<Theme> = {
  fontSize: 14,
  opacity: 0.4,
  flexShrink: 0,
};


