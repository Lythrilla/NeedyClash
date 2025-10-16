import { MenuProps } from "@mui/material";

/**
 * 标准的 Select MenuProps 配置，确保下拉菜单正确浮动显示
 */
export const getSelectMenuProps = (maxHeight?: number): Partial<MenuProps> => ({
  disablePortal: true,
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
      maxHeight: maxHeight || 300,
      '& .MuiList-root': {
        padding: '4px',
      },
    },
  },
});

