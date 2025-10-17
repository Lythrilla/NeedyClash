import {
  DirectionsRounded,
  LanguageRounded,
  MultipleStopRounded,
} from "@mui/icons-material";
import { Box, Typography } from "@mui/material";
import { useLockFn } from "ahooks";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { closeAllConnections } from "tauri-plugin-mihomo-api";

import { BaseModeSelector } from "@/components/base";
import { useVerge } from "@/hooks/use-verge";
import { useAppData } from "@/providers/app-data-context";
import { patchClashMode } from "@/services/cmds";

export const ClashModeCard = () => {
  const { t } = useTranslation();
  const { verge } = useVerge();
  const { clashConfig, refreshClashConfig } = useAppData();

  const currentMode = clashConfig?.mode?.toLowerCase() || "rule";

  const modeDescription = useMemo(() => {
    if (typeof currentMode === "string" && currentMode.length > 0) {
      return t(
        `${currentMode[0].toLocaleUpperCase()}${currentMode.slice(1)} Mode Description`,
      );
    }
    return t("Core communication error");
  }, [currentMode, t]);

  // 使用统一的模式选项配置
  const modeOptions = useMemo(
    () => [
      {
        value: "rule",
        label: t("rule"),
        icon: <MultipleStopRounded fontSize="small" />,
        description: t("Rule Mode Description"),
      },
      {
        value: "global",
        label: t("global"),
        icon: <LanguageRounded fontSize="small" />,
        description: t("Global Mode Description"),
      },
      {
        value: "direct",
        label: t("direct"),
        icon: <DirectionsRounded fontSize="small" />,
        description: t("Direct Mode Description"),
      },
    ],
    [t],
  );

  const onChangeMode = useLockFn(async (mode: string) => {
    if (mode === currentMode) return;
    if (verge?.auto_close_connection) {
      closeAllConnections();
    }

    try {
      await patchClashMode(mode);
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
      {/* 使用统一的模式选择器 */}
      <BaseModeSelector
        value={currentMode}
        options={modeOptions}
        onChange={onChangeMode}
        size="medium"
        fullWidth
      />

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
