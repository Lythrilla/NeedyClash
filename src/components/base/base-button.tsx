import {
  Box,
  IconButton,
  Tooltip,
  Typography,
  type IconButtonProps,
} from "@mui/material";
import { ReactNode } from "react";

import { getIconButtonStyles } from "./theme-tokens";

interface BaseIconButtonProps extends Omit<IconButtonProps, "size"> {
  icon: ReactNode;
  tooltip?: string;
  size?: "small" | "medium";
}

/**
 * 统一的图标按钮组件
 */
export const BaseIconButton = ({
  icon,
  tooltip,
  size = "small",
  sx,
  ...props
}: BaseIconButtonProps) => {
  const button = (
    <IconButton
      {...props}
      size={size}
      sx={{
        ...getIconButtonStyles(size),
        ...sx,
      }}
    >
      {icon}
    </IconButton>
  );

  if (tooltip) {
    return (
      <Tooltip title={tooltip} arrow>
        {button}
      </Tooltip>
    );
  }

  return button;
};

interface ToolbarButtonGroupProps {
  label?: string;
  children: ReactNode;
}

/**
 * 工具栏按钮组 - 使用 MUI 组件确保样式一致
 */
export const ToolbarButtonGroup = ({
  label,
  children,
}: ToolbarButtonGroupProps) => {
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
      {label && (
        <Typography
          sx={{
            fontSize: 11,
            fontWeight: 600,
            color: "text.disabled",
            textTransform: "uppercase",
            letterSpacing: "0.5px",
          }}
        >
          {label}
        </Typography>
      )}
      <Box sx={{ display: "flex", gap: 0.75 }}>{children}</Box>
    </Box>
  );
};
