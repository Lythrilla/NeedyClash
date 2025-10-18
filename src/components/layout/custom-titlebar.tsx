import { Close, CropSquare, FilterNone, Minimize } from "@mui/icons-material";
import { Box, IconButton, alpha, useTheme } from "@mui/material";
import { FC } from "react";

import { useWindowControls } from "@/hooks/use-window";
import { useThemeMode } from "@/services/states";
import getSystem from "@/utils/get-system";

export const CustomTitlebar: FC = () => {
  const theme = useTheme();
  const mode = useThemeMode();
  const isDark = mode !== "light";
  const OS = getSystem();

  const { maximized, minimize, close, toggleMaximize } = useWindowControls();

  // 只在 Windows 上显示自定义标题栏
  if (OS !== "windows") {
    return null;
  }

  return (
    <Box
      data-tauri-drag-region
      sx={{
        height: "36px",
        display: "flex",
        alignItems: "center",
        justifyContent: "flex-end",
        backgroundColor: "transparent",
        pl: 1,
        pr: 0,
        WebkitAppRegion: "drag",
        userSelect: "none",
      }}
    >
      {/* 窗口控制按钮 - 轻量圆润风格 */}
      <Box
        sx={{
          display: "flex",
          gap: 0.5,
          alignItems: "center",
          WebkitAppRegion: "no-drag",
        }}
      >
        <IconButton
          size="small"
          onClick={minimize}
          sx={{
            width: "32px",
            height: "32px",
            borderRadius: "var(--cv-border-radius-sm)",
            fontSize: "18px",
            color: isDark ? "rgba(255, 255, 255, 0.5)" : "rgba(0, 0, 0, 0.5)",
            transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
            "&:hover": {
              backgroundColor: isDark
                ? alpha(theme.palette.common.white, 0.06)
                : alpha(theme.palette.common.black, 0.04),
              color: isDark
                ? "rgba(255, 255, 255, 0.85)"
                : "rgba(0, 0, 0, 0.85)",
              transform: "scale(1.05)",
            },
            "&:active": {
              transform: "scale(0.95)",
            },
          }}
        >
          <Minimize
            sx={{
              fontSize: "16px",
              strokeWidth: 0.5,
              transform: "translateY(-3px)",
            }}
          />
        </IconButton>
        <IconButton
          size="small"
          onClick={toggleMaximize}
          sx={{
            width: "32px",
            height: "32px",
            borderRadius: "var(--cv-border-radius-sm)",
            fontSize: "16px",
            color: isDark ? "rgba(255, 255, 255, 0.5)" : "rgba(0, 0, 0, 0.5)",
            transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
            "&:hover": {
              backgroundColor: isDark
                ? alpha(theme.palette.common.white, 0.06)
                : alpha(theme.palette.common.black, 0.04),
              color: isDark
                ? "rgba(255, 255, 255, 0.85)"
                : "rgba(0, 0, 0, 0.85)",
              transform: "scale(1.05)",
            },
            "&:active": {
              transform: "scale(0.95)",
            },
          }}
        >
          {maximized ? (
            <FilterNone sx={{ fontSize: "13px" }} />
          ) : (
            <CropSquare sx={{ fontSize: "13px" }} />
          )}
        </IconButton>
        <IconButton
          size="small"
          onClick={close}
          sx={{
            width: "32px",
            height: "32px",
            borderRadius: "var(--cv-border-radius-sm)",
            fontSize: "18px",
            color: isDark ? "rgba(255, 255, 255, 0.5)" : "rgba(0, 0, 0, 0.5)",
            transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
            "&:hover": {
              backgroundColor: alpha("#FF5555", 0.15),
              color: "#FF5555",
              transform: "scale(1.05)",
            },
            "&:active": {
              transform: "scale(0.95)",
              backgroundColor: alpha("#FF5555", 0.25),
            },
          }}
        >
          <Close sx={{ fontSize: "16px" }} />
        </IconButton>
      </Box>
    </Box>
  );
};
