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

// 扁平化现代设计的设置项
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
    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
      <Typography
        component="span"
        sx={{
          fontSize: "13.5px",
          fontWeight: 400,
          color: "text.primary",
          letterSpacing: "-0.005em",
        }}
      >
        {label}
      </Typography>
      {extra}
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
        borderBottom: `1px solid ${alpha(
          theme.palette.mode === "dark" ? "#fff" : "#000",
          0.05,
        )}`,
        "&:last-child": {
          borderBottom: "none",
        },
      }}
    >
      <ListItemButton
        onClick={handleClick}
        disabled={isLoading}
        sx={{
          py: 1.75,
          px: 0,
          minHeight: 52,
          transition: "background-color 0.2s ease",
          "&:hover": {
            bgcolor: alpha(theme.palette.primary.main, 0.04),
          },
          "&.Mui-disabled": {
            opacity: 0.5,
          },
        }}
      >
        <ListItemText
          primary={primary}
          secondary={secondary}
          sx={{ my: 0 }}
          secondaryTypographyProps={{
            sx: {
              fontSize: "11.5px",
              mt: 0.5,
              color: "text.secondary",
            },
          }}
        />
        {isLoading ? (
          <CircularProgress
            size={16}
            sx={{ ml: 2, color: "text.secondary" }}
          />
        ) : (
          <ChevronRightRounded
            sx={{
              color: "text.secondary",
              opacity: 0.3,
              fontSize: 20,
              ml: 2,
            }}
          />
        )}
      </ListItemButton>
    </ListItem>
  ) : (
    <ListItem
      sx={{
        py: 1.75,
        px: 0,
        minHeight: 52,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        borderBottom: `1px solid ${alpha(
          theme.palette.mode === "dark" ? "#fff" : "#000",
          0.05,
        )}`,
        "&:last-child": {
          borderBottom: "none",
        },
        transition: "background-color 0.2s ease",
        "&:hover": {
          bgcolor: alpha(theme.palette.primary.main, 0.02),
        },
      }}
    >
      <ListItemText
        primary={primary}
        secondary={secondary}
        sx={{ flex: "1 1 auto", my: 0, mr: 3 }}
        secondaryTypographyProps={{
          sx: {
            fontSize: "11.5px",
            mt: 0.5,
            color: "text.secondary",
          },
        }}
      />
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          flexShrink: 0,
        }}
      >
        {children}
      </Box>
    </ListItem>
  );
};

// 精致优化的设置列表组件
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
      {/* 设置分组标题 - 精致风格 */}
      <Box
        sx={{
          display: "flex",
          alignItems: "flex-start",
          gap: 1.25,
          mb: 2,
          pb: 1.5,
          borderBottom: `1px solid ${alpha(
            theme.palette.mode === "dark" ? "#fff" : "#000",
            0.06,
          )}`,
        }}
      >
        {icon && (
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "primary.main",
              bgcolor: alpha(theme.palette.primary.main, 0.08),
              borderRadius: "8px",
              p: 0.75,
              mt: 0.25,
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
            sx={{
              fontSize: "14px",
              fontWeight: 600,
              color: "text.primary",
              letterSpacing: "-0.02em",
              lineHeight: 1.3,
              mb: description ? 0.5 : 0,
            }}
          >
            {title}
          </Typography>
          {description && (
            <Typography
              sx={{
                fontSize: "11.5px",
                color: "text.secondary",
                lineHeight: 1.5,
                opacity: 0.8,
              }}
            >
              {description}
            </Typography>
          )}
        </Box>
      </Box>

      {/* 设置项列表 */}
      <Box>
        <List sx={{ p: 0 }}>{children}</List>
      </Box>
    </Box>
  );
};
