import {
  DirectionsRounded,
  LanguageRounded,
  MultipleStopRounded,
} from "@mui/icons-material";
import { Box, Typography, alpha } from "@mui/material";
import { useLockFn } from "ahooks";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { closeAllConnections } from "tauri-plugin-mihomo-api";

import { useVerge } from "@/hooks/use-verge";
import { useAppData } from "@/providers/app-data-context";
import { patchClashMode } from "@/services/cmds";

export const ClashModeCard = () => {
  const { t } = useTranslation();
  const { verge } = useVerge();
  const { clashConfig, refreshClashConfig } = useAppData();

  // 支持的模式列表
  const modeList = useMemo(() => ["rule", "global", "direct"] as const, []);

  // 直接使用API返回的模式，不维护本地状态
  const currentMode = clashConfig?.mode?.toLowerCase();

  const modeDescription = useMemo(() => {
    if (typeof currentMode === "string" && currentMode.length > 0) {
      return t(
        `${currentMode[0].toLocaleUpperCase()}${currentMode.slice(1)} Mode Description`,
      );
    }
    return t("Core communication error");
  }, [currentMode, t]);

  // 模式图标映射
  const modeIcons = useMemo(
    () => ({
      rule: <MultipleStopRounded fontSize="small" />,
      global: <LanguageRounded fontSize="small" />,
      direct: <DirectionsRounded fontSize="small" />,
    }),
    [],
  );

  // 切换模式的处理函数
  const onChangeMode = useLockFn(async (mode: string) => {
    if (mode === currentMode) return;
    if (verge?.auto_close_connection) {
      closeAllConnections();
    }

    try {
      await patchClashMode(mode);
      // 使用共享的刷新方法
      refreshClashConfig();
    } catch (error) {
      console.error("Failed to change mode:", error);
    }
  });

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        gap: 0,
        width: "100%",
        flex: 1,
      }}
    >
      {/* 模式按钮组 - 横向排列 */}
      <Box
        sx={{
          display: "flex",
          gap: { xs: 0.75, sm: 1 },
          width: "100%",
          flexWrap: { xs: "nowrap", sm: "nowrap" },
        }}
      >
        {modeList.map((mode) => {
          const isActive = mode === currentMode;

          return (
            <Box
              key={mode}
              onClick={() => onChangeMode(mode)}
              sx={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: { xs: 0.5, sm: 0.75 },
                px: { xs: 1, sm: 1.5, md: 2 },
                py: { xs: 1, sm: 1.25, md: 1.5 },
                cursor: "pointer",
                borderRadius: "6px",
                minWidth: 0,
                border: "1px solid",
                borderColor: isActive ? "primary.main" : "divider",
                backgroundColor: isActive
                  ? (theme) => alpha(theme.palette.primary.main, 0.08)
                  : "transparent",
                transition: "all 0.2s ease",
                "&:hover": {
                  borderColor: "primary.main",
                  backgroundColor: isActive
                    ? (theme) => alpha(theme.palette.primary.main, 0.12)
                    : (theme) => alpha(theme.palette.primary.main, 0.04),
                },
              }}
            >
              <Box
                sx={{
                  fontSize: { xs: 16, sm: 18, md: 20 },
                  color: isActive ? "primary.main" : "text.secondary",
                  display: "flex",
                  alignItems: "center",
                  transition: "color 0.2s ease",
                }}
              >
                {modeIcons[mode]}
              </Box>
              <Typography
                sx={{
                  fontSize: { xs: 10, sm: 11, md: 12 },
                  fontWeight: isActive ? 600 : 500,
                  color: isActive ? "primary.main" : "text.secondary",
                  textTransform: "capitalize",
                  transition: "all 0.2s ease",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {t(mode)}
              </Typography>
            </Box>
          );
        })}
      </Box>

      {/* 当前模式描述 */}
      {modeDescription && (
        <Typography
          variant="caption"
          sx={{
            fontSize: { xs: 10, sm: 11 },
            lineHeight: 1.6,
            color: "text.secondary",
            textAlign: "center",
            px: { xs: 0.5, sm: 0 },
            mt: 1.25,
            mb: 0,
          }}
        >
          {modeDescription}
        </Typography>
      )}
    </Box>
  );
};
