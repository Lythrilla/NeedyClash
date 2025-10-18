import { alpha, type SxProps, type Theme } from "@mui/material";

/**
 * 服务按钮的公共样式配置
 */
export const serviceButtonBaseStyles: SxProps<Theme> = {
  width: "100%",
  py: 0.75,
  px: 1.5,
  fontSize: "12px",
  fontWeight: 500,
  textTransform: "none",
  transition: "all 0.2s",
  "& .MuiButton-startIcon": {
    marginRight: "8px",
  },
};

/**
 * 生成按钮样式的辅助函数
 */
export const createButtonStyles = (
  color: "primary" | "success" | "error",
): SxProps<Theme> => ({
  ...serviceButtonBaseStyles,
  color: `${color}.main`,
  backgroundColor: (theme) => alpha(theme.palette[color].main, 0.08),
  "&:hover": {
    backgroundColor: (theme) => alpha(theme.palette[color].main, 0.15),
  },
  "&:disabled": {
    color: "text.disabled",
    backgroundColor: (theme) => alpha(theme.palette.action.disabled, 0.08),
  },
});

/**
 * 安装按钮样式
 */
export const installButtonStyles = createButtonStyles("primary");

/**
 * 重装按钮样式
 */
export const reinstallButtonStyles = createButtonStyles("success");

/**
 * 卸载按钮样式
 */
export const uninstallButtonStyles = createButtonStyles("error");

/**
 * 警告提示文本样式
 */
export const warningTextStyles: SxProps<Theme> = {
  fontSize: "10px",
  color: "warning.main",
  display: "flex",
  alignItems: "center",
  gap: 0.5,
};

/**
 * 服务管理容器样式
 */
export const serviceContainerStyles: SxProps<Theme> = {
  py: 1.25,
  px: 2,
  mb: 0,
  borderBottom: (theme) =>
    `1px solid ${theme.palette.mode === "dark" ? "rgba(255, 255, 255, 0.03)" : "rgba(0, 0, 0, 0.03)"}`,
};
