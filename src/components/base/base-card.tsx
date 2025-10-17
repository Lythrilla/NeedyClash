import { Box, Typography, type SxProps, type Theme } from "@mui/material";
import { ReactNode } from "react";

import { getCardStyles, getSectionTitleStyles } from "./theme-tokens";

interface BaseCardProps {
  title?: string;
  icon?: ReactNode;
  iconColor?: "primary" | "secondary" | "success" | "error" | "info" | "warning";
  action?: ReactNode;
  children: ReactNode;
  sx?: SxProps<Theme>;
  contentSx?: SxProps<Theme>;
  onClick?: () => void;
  hover?: boolean;
}

/**
 * 统一的卡片组件
 * 用于保持整个应用卡片样式的一致性
 */
export const BaseCard = ({
  title,
  icon,
  iconColor = "primary",
  action,
  children,
  sx,
  contentSx,
  onClick,
  hover = false,
}: BaseCardProps) => {
  return (
    <Box
      onClick={onClick}
      sx={[
        (theme) => ({
          ...getCardStyles(theme),
          p: 2,
          cursor: onClick ? "pointer" : "default",
          ...(hover && {
            "&:hover": {
              transform: "translateY(-2px)",
              boxShadow: theme.shadows[4],
            },
          }),
        }),
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    >
      {/* 标题栏 */}
      {(title || action) && (
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            mb: title ? 2 : 0,
          }}
        >
          {title && (
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              {icon && (
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    color: `${iconColor}.main`,
                    fontSize: 18,
                  }}
                >
                  {icon}
                </Box>
              )}
              <Typography
                variant="h6"
                sx={{
                  fontSize: "14px",
                  fontWeight: 600,
                  color: "text.primary",
                }}
              >
                {title}
              </Typography>
            </Box>
          )}
          {action && <Box>{action}</Box>}
        </Box>
      )}

      {/* 内容区 */}
      <Box sx={contentSx}>{children}</Box>
    </Box>
  );
};

interface BaseSectionProps {
  title?: string;
  variant?: "primary" | "secondary";
  children: ReactNode;
  sx?: SxProps<Theme>;
}

/**
 * 统一的分区组件
 * 用于页面内的内容分区
 */
export const BaseSection = ({
  title,
  variant = "primary",
  children,
  sx,
}: BaseSectionProps) => {
  return (
    <Box sx={sx}>
      {title && (
        <Typography sx={getSectionTitleStyles(variant)}>{title}</Typography>
      )}
      {children}
    </Box>
  );
};


