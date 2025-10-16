import { MenuProps } from "@mui/material";

/**
 * 标准的 Select MenuProps 配置，确保下拉菜单正确浮动显示
 */
export const getSelectMenuProps = (maxHeight?: number): Partial<MenuProps> => ({
  anchorOrigin: {
    vertical: 'bottom',
    horizontal: 'left',
  },
  transformOrigin: {
    vertical: 'top',
    horizontal: 'left',
  },
  PaperProps: {
    sx: {
      position: 'fixed',
      backgroundColor: (theme) =>
        theme.palette.mode === "light" ? "rgba(255, 255, 255, 0.95)" : "rgba(50, 50, 50, 0.95)",
      backdropFilter: "blur(20px) saturate(180%)",
      WebkitBackdropFilter: "blur(20px) saturate(180%)",
      border: (theme) =>
        `1px solid ${theme.palette.mode === "light" ? "#E2E8F0" : "rgba(255, 255, 255, 0.1)"}`,
      borderRadius: "8px",
      maxHeight: maxHeight || 300,
      zIndex: 1400,
      '& .MuiList-root': {
        padding: '4px',
      },
    },
  },
});

