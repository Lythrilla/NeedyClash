import { IconButton, Tooltip, type IconButtonProps } from "@mui/material";
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
 * 工具栏按钮组
 */
export const ToolbarButtonGroup = ({
  label,
  children,
}: ToolbarButtonGroupProps) => {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
      {label && (
        <span
          style={{
            fontSize: "11px",
            fontWeight: 600,
            color: "var(--text-disabled)",
            textTransform: "uppercase",
            letterSpacing: "0.5px",
          }}
        >
          {label}
        </span>
      )}
      <div style={{ display: "flex", gap: "6px" }}>{children}</div>
    </div>
  );
};


