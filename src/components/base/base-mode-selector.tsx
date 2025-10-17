import { Box, Typography, alpha, useTheme } from "@mui/material";
import { ReactNode } from "react";

import { getButtonStyles } from "./theme-tokens";

interface ModeOption<T = string> {
  value: T;
  label: string;
  icon?: ReactNode;
  description?: string;
}

interface BaseModeSelectorProps<T = string> {
  value: T;
  options: ModeOption<T>[];
  onChange: (value: T) => void;
  label?: string;
  size?: "small" | "medium";
  fullWidth?: boolean;
}

/**
 * 统一的模式选择器组件
 * 用于各种模式切换场景（代理模式、主题模式等）
 */
export const BaseModeSelector = <T extends string = string>({
  value,
  options,
  onChange,
  label,
  size = "small",
  fullWidth = false,
}: BaseModeSelectorProps<T>) => {
  const theme = useTheme();

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
      <Box
        sx={{
          display: "flex",
          gap: 0.75,
          ...(fullWidth && { flex: 1 }),
        }}
      >
        {options.map((option) => {
          const isActive = option.value === value;
          return (
            <Box
              key={option.value}
              onClick={() => onChange(option.value)}
              title={option.description}
              sx={{
                ...getButtonStyles(isActive, theme),
                borderRadius: "var(--cv-border-radius-sm)",
                ...(fullWidth && { flex: 1, justifyContent: "center" }),
                ...(size === "medium" && {
                  px: 1.5,
                  py: 0.75,
                }),
              }}
            >
              {option.icon && (
                <Box
                  sx={{
                    color: isActive ? "primary.main" : "text.secondary",
                    display: "flex",
                    alignItems: "center",
                    fontSize: size === "small" ? 16 : 18,
                  }}
                >
                  {option.icon}
                </Box>
              )}
              <Typography
                sx={{
                  fontSize: size === "small" ? 12 : 13,
                  fontWeight: isActive ? 600 : 500,
                  color: isActive ? "primary.main" : "text.secondary",
                  textTransform: "capitalize",
                }}
              >
                {option.label}
              </Typography>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
};

interface CompactModeSelectorProps<T = string> {
  value: T;
  options: ModeOption<T>[];
  onChange: (value: T) => void;
}

/**
 * 紧凑的模式选择器（只显示图标）
 */
export const CompactModeSelector = <T extends string = string>({
  value,
  options,
  onChange,
}: CompactModeSelectorProps<T>) => {
  const theme = useTheme();

  return (
    <Box sx={{ display: "flex", gap: 0.75 }}>
      {options.map((option) => {
        const isActive = option.value === value;
        return (
          <Box
            key={option.value}
            onClick={() => onChange(option.value)}
            title={option.description || option.label}
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 32,
              height: 32,
              cursor: "pointer",
              borderRadius: "var(--cv-border-radius-sm)",
              border: "1px solid",
              borderColor: isActive ? "primary.main" : "divider",
              backgroundColor: isActive
                ? alpha(theme.palette.primary.main, 0.08)
                : "transparent",
              transition: "all 0.2s ease",
              "&:hover": {
                borderColor: "primary.main",
                backgroundColor: isActive
                  ? alpha(theme.palette.primary.main, 0.12)
                  : alpha(theme.palette.primary.main, 0.04),
              },
            }}
          >
            <Box
              sx={{
                color: isActive ? "primary.main" : "text.secondary",
                display: "flex",
                alignItems: "center",
                fontSize: 16,
              }}
            >
              {option.icon}
            </Box>
          </Box>
        );
      })}
    </Box>
  );
};
