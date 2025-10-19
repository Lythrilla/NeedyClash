import { Box, Typography, alpha, useTheme } from "@mui/material";
import { ReactNode } from "react";

// 自定义卡片组件接口
interface EnhancedCardProps {
  title: ReactNode;
  icon: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  iconColor?:
    | "primary"
    | "secondary"
    | "error"
    | "warning"
    | "info"
    | "success";
  minHeight?: number | string;
  noContentPadding?: boolean;
}

// 自定义卡片组件
export const EnhancedCard = ({
  title,
  icon,
  action,
  children,
  iconColor = "primary",
  minHeight,
  noContentPadding = false,
}: EnhancedCardProps) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  // 标题截断样式
  const titleTruncateStyle = {
    minWidth: 0,
    maxWidth: "100%",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    display: "block",
  };

  return (
    <Box
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* 标题栏 */}
      {(title || action) && (
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            mb: 1.5,
            pb: 1,
            borderBottom: `1px solid ${alpha(theme.palette[iconColor].main, 0.2)}`,
          }}
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
              minWidth: 0,
              flex: 1,
            }}
          >
            {icon && (
              <Box
                sx={{
                  display: "flex",
                  color: theme.palette[iconColor].main,
                  opacity: 0.7,
                  "& svg": {
                    fontSize: "14px",
                  },
                }}
              >
                {icon}
              </Box>
            )}
            {typeof title === "string" ? (
              <Typography
                variant="subtitle2"
                sx={{
                  ...titleTruncateStyle,
                  fontSize: "10px",
                  fontWeight: 600,
                  letterSpacing: "0.8px",
                  textTransform: "uppercase",
                  color: "text.secondary",
                  opacity: 0.7,
                }}
                title={title}
              >
                {title}
              </Typography>
            ) : (
              <Box sx={titleTruncateStyle}>{title}</Box>
            )}
          </Box>
          {action && <Box sx={{ ml: 1, flexShrink: 0 }}>{action}</Box>}
        </Box>
      )}
      {/* 内容区 - 无装饰 */}
      <Box
        sx={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          p: noContentPadding ? 0 : 0,
          ...(minHeight && { minHeight }),
        }}
      >
        {children}
      </Box>
    </Box>
  );
};
