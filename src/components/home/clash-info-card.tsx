import { DeveloperBoardOutlined } from "@mui/icons-material";
import { Box, Stack, Typography } from "@mui/material";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";

import { useClash } from "@/hooks/use-clash";
import { useAppData } from "@/providers/app-data-context";

import { EnhancedCard } from "./enhanced-card";

// 将毫秒转换为时:分:秒格式的函数
const formatUptime = (uptimeMs: number) => {
  const hours = Math.floor(uptimeMs / 3600000);
  const minutes = Math.floor((uptimeMs % 3600000) / 60000);
  const seconds = Math.floor((uptimeMs % 60000) / 1000);
  return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
};

export const ClashInfoCard = () => {
  const { t } = useTranslation();
  const { version: clashVersion } = useClash();
  const { clashConfig, rules, uptime, systemProxyAddress } = useAppData();

  // 使用useMemo缓存格式化后的uptime，避免频繁计算
  const formattedUptime = useMemo(() => formatUptime(uptime), [uptime]);

  // 使用备忘录组件内容，减少重新渲染
  const cardContent = useMemo(() => {
    if (!clashConfig) return null;

    return (
      <Stack spacing={0}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            py: 0.75,
            borderBottom: "1px solid",
            borderColor: "divider",
          }}
        >
          <Typography
            variant="body2"
            sx={{
              fontSize: "10px",
              color: "text.disabled",
              opacity: 0.6,
              textTransform: "uppercase",
              letterSpacing: "0.5px",
            }}
          >
            {t("Core Version")}
          </Typography>
          <Typography
            variant="body2"
            sx={{ fontSize: "11px", fontWeight: 500 }}
          >
            {clashVersion || "-"}
          </Typography>
        </Box>

        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            py: 0.75,
            borderBottom: "1px solid",
            borderColor: "divider",
          }}
        >
          <Typography
            variant="body2"
            sx={{
              fontSize: "10px",
              color: "text.disabled",
              opacity: 0.6,
              textTransform: "uppercase",
              letterSpacing: "0.5px",
            }}
          >
            {t("Mixed Port")}
          </Typography>
          <Typography
            variant="body2"
            sx={{ fontSize: "11px", fontWeight: 500 }}
          >
            {clashConfig.mixedPort || "-"}
          </Typography>
        </Box>

        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            py: 0.75,
            borderBottom: "1px solid",
            borderColor: "divider",
          }}
        >
          <Typography
            variant="body2"
            sx={{
              fontSize: "10px",
              color: "text.disabled",
              opacity: 0.6,
              textTransform: "uppercase",
              letterSpacing: "0.5px",
            }}
          >
            {t("Uptime")}
          </Typography>
          <Typography
            variant="body2"
            sx={{
              fontSize: "11px",
              fontWeight: 500,
              fontFamily: "monospace",
            }}
          >
            {formattedUptime}
          </Typography>
        </Box>

        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            py: 0.75,
          }}
        >
          <Typography
            variant="body2"
            sx={{
              fontSize: "10px",
              color: "text.disabled",
              opacity: 0.6,
              textTransform: "uppercase",
              letterSpacing: "0.5px",
            }}
          >
            {t("Rules")}
          </Typography>
          <Typography
            variant="body2"
            sx={{ fontSize: "11px", fontWeight: 500 }}
          >
            {rules.length}
          </Typography>
        </Box>
      </Stack>
    );
  }, [
    clashConfig,
    clashVersion,
    t,
    formattedUptime,
    rules.length,
    systemProxyAddress,
  ]);

  return (
    <EnhancedCard
      title={t("Clash Info")}
      icon={<DeveloperBoardOutlined />}
      iconColor="warning"
      action={null}
    >
      {cardContent}
    </EnhancedCard>
  );
};
