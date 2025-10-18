import {
  Menu,
  type MenuProps,
  Select,
  type SelectProps,
  type Theme,
} from "@mui/material";
import { ReactNode } from "react";

import { getGlassMenuStyles } from "./theme-tokens";

/**
 * 统一的毛玻璃菜单组件
 */
export const GlassMenu = ({ children, ...props }: MenuProps) => {
  return (
    <Menu
      {...props}
      PaperProps={{
        ...props.PaperProps,
        sx: [
          (theme: Theme) => getGlassMenuStyles(theme),
          props.PaperProps?.sx,
        ] as any,
      }}
      MenuListProps={{
        sx: { py: 0.5, ...props.MenuListProps?.sx },
      }}
    >
      {children}
    </Menu>
  );
};

interface GlassSelectProps extends Omit<SelectProps, "MenuProps"> {
  children: ReactNode;
}

/**
 * 统一的毛玻璃下拉选择框
 */
export const GlassSelect = ({ children, ...props }: GlassSelectProps) => {
  return (
    <Select
      {...props}
      variant="outlined"
      className="custom-select"
      size="small"
      sx={{
        width: 140,
        fontSize: "13px",
        "& .MuiOutlinedInput-notchedOutline": {
          borderColor: (theme) =>
            theme.palette.mode === "light"
              ? "#E2E8F0"
              : "rgba(255, 255, 255, 0.12)",
        },
        "&:hover .MuiOutlinedInput-notchedOutline": {
          borderColor: (theme) =>
            theme.palette.mode === "light"
              ? "#CBD5E1"
              : "rgba(255, 255, 255, 0.2)",
        },
        "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
          borderColor: "primary.main",
          borderWidth: "2px",
        },
        ...props.sx,
      }}
      MenuProps={{
        anchorOrigin: { vertical: "bottom", horizontal: "left" },
        transformOrigin: { vertical: "top", horizontal: "left" },
        PaperProps: {
          sx: (theme) => getGlassMenuStyles(theme),
        },
      }}
    >
      {children}
    </Select>
  );
};

/**
 * 获取统一的右键菜单配置
 */
export const getContextMenuProps = (
  anchorEl: HTMLElement | null,
  position: { left: number; top: number },
  onClose: () => void,
): Partial<MenuProps> => ({
  open: !!anchorEl,
  anchorEl,
  onClose,
  anchorPosition: position,
  anchorReference: "anchorPosition",
  transitionDuration: 225,
  PaperProps: {
    sx: (theme) => getGlassMenuStyles(theme),
  },
  MenuListProps: { sx: { py: 0.5 } },
  onContextMenu: (e) => {
    onClose();
    e.preventDefault();
  },
});
