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

  // 统一的标题截断样式
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
        borderRadius: "10px",
        backgroundColor: isDark ? "#1E293B" : "#FFFFFF",
        border: `1px solid ${isDark ? "#334155" : "#E2E8F0"}`,
        overflow: "hidden",
        transition: "border-color 0.2s ease",
        "&:hover": {
          borderColor: isDark ? "#475569" : theme.palette[iconColor].main,
        },
      }}
    >
      {/* 卡片头部 - 轻量设计 */}
      <Box
        sx={{
          px: 2,
          py: 1.5,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: `1px solid ${isDark ? "#334155" : "#F1F5F9"}`,
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            minWidth: 0,
            flex: 1,
            overflow: "hidden",
            gap: 1.5,
          }}
        >
          {/* 图标 - 小巧简洁 */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              color: theme.palette[iconColor].main,
              fontSize: "22px",
            }}
          >
            {icon}
          </Box>
          <Box sx={{ minWidth: 0, flex: 1 }}>
            {typeof title === "string" ? (
              <Typography
                variant="h6"
                fontWeight="600"
                fontSize={15}
                sx={titleTruncateStyle}
                title={title}
              >
                {title}
              </Typography>
            ) : (
              <Box sx={titleTruncateStyle}>{title}</Box>
            )}
          </Box>
        </Box>
        {action && <Box sx={{ ml: 2, flexShrink: 0 }}>{action}</Box>}
      </Box>
      {/* 卡片内容区 */}
      <Box
        sx={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          p: noContentPadding ? 0 : 2,
          ...(minHeight && { minHeight }),
        }}
      >
        {children}
      </Box>
    </Box>
  );
};
