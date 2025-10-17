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
        height: "28px",
        display: "flex",
        alignItems: "center",
        justifyContent: "flex-end",
        backgroundColor: "transparent",
        px: 0,
        WebkitAppRegion: "drag",
        userSelect: "none",
      }}
    >
      {/* 窗口控制按钮 - 极简风格 */}
      <Box
        sx={{
          display: "flex",
          gap: 0,
          alignItems: "center",
          WebkitAppRegion: "no-drag",
        }}
      >
        <IconButton
          size="small"
          onClick={minimize}
          sx={{
            width: "40px",
            height: "28px",
            fontSize: "11px",
            color: "text.disabled",
            opacity: 0.6,
            "&:hover": {
              backgroundColor: "transparent",
              opacity: 1,
            },
          }}
        >
          <Minimize fontSize="inherit" />
        </IconButton>
        <IconButton
          size="small"
          onClick={toggleMaximize}
          sx={{
            width: "40px",
            height: "28px",
            fontSize: "11px",
            color: "text.disabled",
            opacity: 0.6,
            "&:hover": {
              backgroundColor: "transparent",
              opacity: 1,
            },
          }}
        >
          {maximized ? (
            <FilterNone fontSize="inherit" />
          ) : (
            <CropSquare fontSize="inherit" />
          )}
        </IconButton>
        <IconButton
          size="small"
          onClick={close}
          sx={{
            width: "40px",
            height: "28px",
            fontSize: "11px",
            color: "text.disabled",
            opacity: 0.6,
            "&:hover": {
              backgroundColor: "transparent",
              color: "#E81123",
              opacity: 1,
            },
          }}
        >
          <Close fontSize="inherit" />
        </IconButton>
      </Box>
    </Box>
  );
};

