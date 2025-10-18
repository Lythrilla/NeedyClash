import {
  ArrowDownwardRounded,
  ArrowUpwardRounded,
  CloudDownloadRounded,
  CloudUploadRounded,
  LinkRounded,
  MemoryRounded,
} from "@mui/icons-material";
import { Box, Grid, PaletteColor, Typography, useTheme } from "@mui/material";
import { useRef, memo, useMemo } from "react";
import { ReactNode } from "react";
import { useTranslation } from "react-i18next";

import { TrafficErrorBoundary } from "@/components/common/traffic-error-boundary";
import { useConnectionData } from "@/hooks/use-connection-data";
import { useMemoryData } from "@/hooks/use-memory-data";
import { useTrafficData } from "@/hooks/use-traffic-data";
import { useVerge } from "@/hooks/use-verge";
import { useVisibility } from "@/hooks/use-visibility";
import parseTraffic from "@/utils/parse-traffic";

import {
  EnhancedCanvasTrafficGraph,
  type EnhancedCanvasTrafficGraphRef,
} from "./enhanced-canvas-traffic-graph";

interface StatCardProps {
  icon: ReactNode;
  title: string;
  value: string | number;
  unit: string;
  color: "primary" | "secondary" | "error" | "warning" | "info" | "success";
  onClick?: () => void;
}

// 全局变量类型定义
declare global {
  interface Window {
    animationFrameId?: number;
    lastTrafficData?: {
      up: number;
      down: number;
    };
  }
}

// 统计卡片组件 - 使用memo提升性能
const CompactStatCard = memo(
  ({ icon, title, value, unit, color, onClick }: StatCardProps) => {
    const theme = useTheme();

    // 获取调色板颜色 - 使用useMemo避免重复计算
    const colorValue = useMemo(() => {
      const palette = theme.palette;
      if (
        color in palette &&
        palette[color as keyof typeof palette] &&
        "main" in (palette[color as keyof typeof palette] as PaletteColor)
      ) {
        return (palette[color as keyof typeof palette] as PaletteColor).main;
      }
      return palette.primary.main;
    }, [theme.palette, color]);

    return (
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          padding: "8px 0",
          borderBottom: "1px solid",
          borderColor: "divider",
          transition: "all 0.15s ease",
          cursor: onClick ? "pointer" : "default",
          "&:hover": onClick
            ? {
                borderColor: colorValue,
              }
            : {},
          "&:last-child": {
            borderBottom: "none",
          },
        }}
        onClick={onClick}
      >
        {/* 图标 - 极简 */}
        <Box
          sx={{
            mr: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: colorValue,
            opacity: 0.7,
            "& svg": {
              fontSize: "16px",
            },
          }}
        >
          {icon}
        </Box>

        {/* 文本内容 */}
        <Box sx={{ flexGrow: 1, minWidth: 0 }}>
          <Typography
            variant="caption"
            fontSize="9px"
            color="text.disabled"
            sx={{
              opacity: 0.5,
              textTransform: "uppercase",
              letterSpacing: "0.5px",
            }}
            noWrap
          >
            {title}
          </Typography>
          <Box sx={{ display: "flex", alignItems: "baseline", mt: 0.25 }}>
            <Typography
              variant="body2"
              fontSize="13px"
              fontWeight="500"
              noWrap
              sx={{ mr: 0.5 }}
            >
              {value}
            </Typography>
            <Typography
              variant="caption"
              fontSize="9px"
              color="text.secondary"
              sx={{ opacity: 0.6 }}
            >
              {unit}
            </Typography>
          </Box>
        </Box>
      </Box>
    );
  },
);

// 添加显示名称
CompactStatCard.displayName = "CompactStatCard";

export const EnhancedTrafficStats = () => {
  const { t } = useTranslation();
  const theme = useTheme();
  const { verge } = useVerge();
  const trafficRef = useRef<EnhancedCanvasTrafficGraphRef>(null);
  const pageVisible = useVisibility();

  const {
    response: { data: traffic },
  } = useTrafficData();

  const {
    response: { data: memory },
  } = useMemoryData();

  const {
    response: { data: connections },
  } = useConnectionData();

  // 是否显示流量图表
  const trafficGraph = verge?.traffic_graph ?? true;

  // Canvas组件现在直接从全局Hook获取数据，无需手动添加数据点

  // 使用useMemo计算解析后的流量数据
  const parsedData = useMemo(() => {
    const [up, upUnit] = parseTraffic(traffic?.up || 0);
    const [down, downUnit] = parseTraffic(traffic?.down || 0);
    const [inuse, inuseUnit] = parseTraffic(memory?.inuse || 0);
    const [uploadTotal, uploadTotalUnit] = parseTraffic(
      connections?.uploadTotal,
    );
    const [downloadTotal, downloadTotalUnit] = parseTraffic(
      connections?.downloadTotal,
    );

    return {
      up,
      upUnit,
      down,
      downUnit,
      inuse,
      inuseUnit,
      uploadTotal,
      uploadTotalUnit,
      downloadTotal,
      downloadTotalUnit,
      connectionsCount: connections?.connections.length,
    };
  }, [traffic, memory, connections]);

  // 渲染流量图表 - 极简轻量设计
  const trafficGraphComponent = useMemo(() => {
    if (!trafficGraph || !pageVisible) return null;

    return (
      <Box
        sx={{
          height: 100,
          cursor: "pointer",
          border: "1px solid",
          borderColor: "divider",
          overflow: "hidden",
          backgroundColor: "transparent",
          transition: "border-color 0.15s",
          "&:hover": {
            borderColor: "primary.main",
          },
        }}
        onClick={() => trafficRef.current?.toggleStyle()}
      >
        <div style={{ height: "100%", position: "relative" }}>
          <EnhancedCanvasTrafficGraph ref={trafficRef} />
        </div>
      </Box>
    );
  }, [trafficGraph, pageVisible]);

  // 使用useMemo计算统计卡片配置
  const statCards = useMemo(
    () => [
      {
        icon: <ArrowUpwardRounded fontSize="small" />,
        title: t("Upload Speed"),
        value: parsedData.up,
        unit: `${parsedData.upUnit}/s`,
        color: "secondary" as const,
      },
      {
        icon: <ArrowDownwardRounded fontSize="small" />,
        title: t("Download Speed"),
        value: parsedData.down,
        unit: `${parsedData.downUnit}/s`,
        color: "primary" as const,
      },
      {
        icon: <LinkRounded fontSize="small" />,
        title: t("Active Connections"),
        value: parsedData.connectionsCount,
        unit: "",
        color: "success" as const,
      },
      {
        icon: <CloudUploadRounded fontSize="small" />,
        title: t("Uploaded"),
        value: parsedData.uploadTotal,
        unit: parsedData.uploadTotalUnit,
        color: "secondary" as const,
      },
      {
        icon: <CloudDownloadRounded fontSize="small" />,
        title: t("Downloaded"),
        value: parsedData.downloadTotal,
        unit: parsedData.downloadTotalUnit,
        color: "primary" as const,
      },
      {
        icon: <MemoryRounded fontSize="small" />,
        title: t("Memory Usage"),
        value: parsedData.inuse,
        unit: parsedData.inuseUnit,
        color: "error" as const,
        onClick: undefined,
      },
    ],
    [t, parsedData],
  );

  return (
    <TrafficErrorBoundary
      onError={(error, errorInfo) => {
        console.error("[EnhancedTrafficStats] 组件错误:", error, errorInfo);
      }}
    >
      <Grid container spacing={1} columns={{ xs: 8, sm: 8, md: 12 }}>
        {trafficGraph && (
          <Grid size={12}>
            {/* 流量图表区域 */}
            {trafficGraphComponent}
          </Grid>
        )}
        {/* 统计卡片区域 */}
        {statCards.map((card) => (
          <Grid key={card.title} size={4}>
            <CompactStatCard {...(card as StatCardProps)} />
          </Grid>
        ))}
      </Grid>
    </TrafficErrorBoundary>
  );
};
