import { ChevronRightRounded } from "@mui/icons-material";
import {
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
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

// 精致的设置项组件 - 极简现代设计
export const SettingItem: React.FC<ItemProps> = ({
  label,
  extra,
  children,
  secondary,
  onClick,
}) => {
  const theme = useTheme();
  const clickable = !!onClick;
  const isDark = theme.palette.mode === "dark";

  const primary = (
    <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
      <Typography
        component="span"
        sx={{
          fontSize: "13px",
          fontWeight: 500,
          color: "text.primary",
          letterSpacing: "-0.01em",
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
        mb: 0,
        borderBottom: `1px solid ${isDark ? "rgba(255, 255, 255, 0.03)" : "rgba(0, 0, 0, 0.03)"}`,
        transition: "background-color 0.15s cubic-bezier(0.4, 0, 0.2, 1)",
        "&:hover": {
          bgcolor: isDark
            ? "rgba(255, 255, 255, 0.02)"
            : "rgba(0, 0, 0, 0.015)",
        },
        "&:last-child": {
          borderBottom: "none",
        },
      }}
    >
      <ListItemButton
        onClick={handleClick}
        disabled={isLoading}
        sx={{
          py: 1.25,
          px: 2,
          minHeight: 42,
          "&:hover": {
            bgcolor: "transparent",
          },
          "&.Mui-disabled": {
            opacity: 0.5,
          },
        }}
      >
        <ListItemText
          primary={primary}
          secondary={secondary}
          secondaryTypographyProps={{
            sx: {
              fontSize: "11px",
              mt: 0.5,
              color: "text.secondary",
              opacity: 0.7,
            },
          }}
        />
        {isLoading ? (
          <CircularProgress
            color="inherit"
            size={16}
            sx={{
              ml: 1,
              opacity: 0.6,
              "& svg circle": {
                strokeLinecap: "round",
              },
            }}
          />
        ) : (
          <ChevronRightRounded
            sx={{
              color: "text.secondary",
              opacity: 0.3,
              fontSize: 18,
              transition: "all 0.15s cubic-bezier(0.4, 0, 0.2, 1)",
              ".MuiListItemButton-root:hover &": {
                opacity: 0.5,
                transform: "translateX(2px)",
              },
            }}
          />
        )}
      </ListItemButton>
    </ListItem>
  ) : (
    <ListItem
      sx={{
        py: 1.25,
        px: 2,
        mb: 0,
        minHeight: 42,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        borderBottom: `1px solid ${isDark ? "rgba(255, 255, 255, 0.03)" : "rgba(0, 0, 0, 0.03)"}`,
        transition: "background-color 0.15s cubic-bezier(0.4, 0, 0.2, 1)",
        "&:hover": {
          bgcolor: isDark
            ? "rgba(255, 255, 255, 0.015)"
            : "rgba(0, 0, 0, 0.01)",
        },
        "&:last-child": {
          borderBottom: "none",
        },
      }}
    >
      <ListItemText
        primary={primary}
        secondary={secondary}
        sx={{ flex: "1 1 auto", my: 0 }}
        secondaryTypographyProps={{
          sx: {
            fontSize: "11px",
            mt: 0.5,
            color: "text.secondary",
            opacity: 0.7,
          },
        }}
      />
      <Box
        sx={{
          ml: 2.5,
          display: "flex",
          alignItems: "center",
          "& .MuiSelect-root, & .MuiInputBase-root": {
            transition: "all 0.15s cubic-bezier(0.4, 0, 0.2, 1)",
          },
        }}
      >
        {children}
      </Box>
    </ListItem>
  );
};

// 精致的设置列表组件 - 优雅的分组设计
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
  const isDark = theme.palette.mode === "dark";

  return (
    <Box sx={{ mb: 0 }}>
      {/* 设置分组标题 - 精致简洁 */}
      <Box
        sx={{
          mb: 2,
          pb: 1.25,
          borderBottom: `1px solid ${isDark ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.05)"}`,
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1.25,
            mb: description ? 0.75 : 0,
          }}
        >
          {icon && (
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 20,
                height: 20,
                bgcolor: isDark
                  ? "rgba(255, 255, 255, 0.04)"
                  : "rgba(0, 0, 0, 0.04)",
                color: "text.secondary",
                "& svg": {
                  fontSize: 14,
                  opacity: 0.8,
                },
              }}
            >
              {icon}
            </Box>
          )}
          <Typography
            sx={{
              fontSize: "13.5px",
              fontWeight: 600,
              color: "text.primary",
              letterSpacing: "-0.02em",
            }}
          >
            {title}
          </Typography>
        </Box>
        {description && (
          <Typography
            sx={{
              fontSize: "11px",
              color: "text.secondary",
              opacity: 0.65,
              mt: 0.5,
              ml: icon ? 4.5 : 0,
              lineHeight: 1.4,
            }}
          >
            {description}
          </Typography>
        )}
      </Box>

      {/* 设置项列表 */}
      <Box>
        <List
          sx={{
            p: 0,
            "& .MuiListItem-root:first-of-type": {
              borderTop: `1px solid ${isDark ? "rgba(255, 255, 255, 0.03)" : "rgba(0, 0, 0, 0.03)"}`,
            },
          }}
        >
          {children}
        </List>
      </Box>
    </Box>
  );
};
