import { ChevronRightRounded } from "@mui/icons-material";
import {
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  alpha,
  useTheme,
  Typography,
} from "@mui/material";
import CircularProgress from "@mui/material/CircularProgress";
import React, { ReactNode, useState } from "react";

import isAsyncFunction from "@/utils/is-async-function";

interface ItemProps {
  label: ReactNode;
  extra?: ReactNode;
  children?: ReactNode;
  secondary?: ReactNode;
  onClick?: () => void | Promise<any>;
}

// 增强型设置项组件 - 更现代的设计
export const SettingItem: React.FC<ItemProps> = ({
  label,
  extra,
  children,
  secondary,
  onClick,
}) => {
  const theme = useTheme();
  const clickable = !!onClick;

  const primary = (
    <Box sx={{ display: "flex", alignItems: "center" }}>
      <Typography
        component="span"
        sx={{
          fontSize: "13px",
          fontWeight: 500,
          color: "text.primary",
        }}
      >
        {label}
      </Typography>
      {extra ? extra : null}
    </Box>
  );

  const [isLoading, setIsLoading] = useState(false);
  const handleClick = () => {
    if (onClick) {
      if (isAsyncFunction(onClick)) {
        setIsLoading(true);
        onClick()!.finally(() => setIsLoading(false));
      } else {
        onClick();
      }
    }
  };

  return clickable ? (
    <ListItem
      disablePadding
      sx={{
        mb: 0.5,
        borderRadius: 1.5,
        overflow: "hidden",
        transition: "all 0.2s ease",
        "&:hover": {
          bgcolor: alpha(theme.palette.primary.main, 0.04),
        },
      }}
    >
      <ListItemButton
        onClick={handleClick}
        disabled={isLoading}
        sx={{
          py: 1.5,
          px: 2,
          borderRadius: 1.5,
          minHeight: 48,
          "&:hover": {
            bgcolor: "transparent",
          },
        }}
      >
        <ListItemText
          primary={primary}
          secondary={secondary}
          secondaryTypographyProps={{
            sx: { fontSize: "11px", mt: 0.5 },
          }}
        />
        {isLoading ? (
          <CircularProgress color="inherit" size={18} sx={{ ml: 1 }} />
        ) : (
          <ChevronRightRounded
            sx={{
              color: "text.secondary",
              opacity: 0.5,
              fontSize: 20,
            }}
          />
        )}
      </ListItemButton>
    </ListItem>
  ) : (
    <ListItem
      sx={{
        py: 1.5,
        px: 2,
        mb: 0.5,
        borderRadius: 1.5,
        minHeight: 48,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        transition: "background-color 0.2s ease",
        "&:hover": {
          bgcolor: alpha(theme.palette.primary.main, 0.02),
        },
      }}
    >
      <ListItemText
        primary={primary}
        secondary={secondary}
        sx={{ flex: "1 1 auto", my: 0 }}
        secondaryTypographyProps={{
          sx: { fontSize: "11px", mt: 0.5 },
        }}
      />
      <Box sx={{ ml: 2, display: "flex", alignItems: "center" }}>
        {children}
      </Box>
    </ListItem>
  );
};

// 增强型设置列表组件 - 带图标和描述
interface SettingListProps {
  title: string;
  icon?: ReactNode;
  description?: string;
  children: ReactNode;
}

export const SettingList: React.FC<SettingListProps> = ({
  title,
  icon,
  description,
  children,
}) => {
  const theme = useTheme();

  return (
    <Box sx={{ mb: 0 }}>
      {/* 设置分组标题 */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1.5,
          mb: 2,
          px: 1,
        }}
      >
        {icon && (
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 32,
              height: 32,
              borderRadius: 2,
              bgcolor: alpha(theme.palette.primary.main, 0.08),
              color: "primary.main",
              "& svg": {
                fontSize: 18,
              },
            }}
          >
            {icon}
          </Box>
        )}
        <Box sx={{ flex: 1 }}>
          <Typography
            variant="h6"
            sx={{
              fontSize: "15px",
              fontWeight: 700,
              letterSpacing: "-0.2px",
              color: "text.primary",
              mb: description ? 0.25 : 0,
            }}
          >
            {title}
          </Typography>
          {description && (
            <Typography
              variant="caption"
              sx={{
                fontSize: "11px",
                color: "text.secondary",
                opacity: 0.7,
                lineHeight: 1.4,
              }}
            >
              {description}
            </Typography>
          )}
        </Box>
      </Box>

      {/* 设置项列表 - 带卡片背景 */}
      <Box
        sx={{
          bgcolor: alpha(theme.palette.background.paper, 0.6),
          backdropFilter: "blur(10px)",
          borderRadius: 2.5,
          border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
          overflow: "hidden",
          boxShadow: `0 1px 3px ${alpha(theme.palette.common.black, 0.02)}`,
        }}
      >
        <List sx={{ p: 1 }}>{children}</List>
      </Box>
    </Box>
  );
};
