import {
  DeleteOutlineRounded,
  FileDownloadRounded,
  RefreshRounded,
  LanguageRounded,
  AppsRounded,
} from "@mui/icons-material";
import {
  Box,
  IconButton,
  Tooltip,
  Typography,
  alpha,
} from "@mui/material";
import { useLockFn } from "ahooks";
import dayjs from "dayjs";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from "recharts";

import { BasePage } from "@/components/base";
import { useConnectionData } from "@/hooks/use-connection-data";
import parseTraffic from "@/utils/parse-traffic";

interface DomainStats {
  domain: string;
  upload: number;
  download: number;
  total: number;
  count: number;
}

interface ProcessStats {
  process: string;
  upload: number;
  download: number;
  total: number;
  count: number;
}

interface HistoryData {
  timestamp: number;
  upload: number;
  download: number;
}

const TrafficAnalyticsPage = () => {
  const { t } = useTranslation();
  const {
    response: { data: connections },
  } = useConnectionData();

  const [historyData, setHistoryData] = useState<HistoryData[]>([]);

  useEffect(() => {
    if (connections) {
      setHistoryData((prev) => {
        const newData = [
          ...prev,
          {
            timestamp: Date.now(),
            upload: connections.uploadTotal,
            download: connections.downloadTotal,
          },
        ];
        return newData.slice(-360);
      });
    }
  }, [connections]);

  const domainStats = useMemo(() => {
    const stats = new Map<string, DomainStats>();
    connections?.connections?.forEach((conn) => {
      const domain = conn.metadata?.host || conn.metadata?.destinationIP || "";
      if (!domain) return;

      const existing = stats.get(domain) || {
        domain,
        upload: 0,
        download: 0,
        total: 0,
        count: 0,
      };
      stats.set(domain, {
        domain,
        upload: existing.upload + (conn.upload || 0),
        download: existing.download + (conn.download || 0),
        total: existing.total + (conn.upload || 0) + (conn.download || 0),
        count: existing.count + 1,
      });
    });
    return Array.from(stats.values()).sort((a, b) => b.total - a.total);
  }, [connections]);

  const processStats = useMemo(() => {
    const stats = new Map<string, ProcessStats>();
    connections?.connections?.forEach((conn) => {
      const process = conn.metadata?.process || conn.metadata?.processPath || "";
      if (!process) return;

      const processName = process.split(/[/\\]/).pop() || process;

      const existing = stats.get(processName) || {
        process: processName,
        upload: 0,
        download: 0,
        total: 0,
        count: 0,
      };
      stats.set(processName, {
        process: processName,
        upload: existing.upload + (conn.upload || 0),
        download: existing.download + (conn.download || 0),
        total: existing.total + (conn.upload || 0) + (conn.download || 0),
        count: existing.count + 1,
      });
    });
    return Array.from(stats.values()).sort((a, b) => b.total - a.total);
  }, [connections]);

  const totalTraffic = useMemo(
    () => ({
      upload: connections?.uploadTotal || 0,
      download: connections?.downloadTotal || 0,
      total: (connections?.uploadTotal || 0) + (connections?.downloadTotal || 0),
    }),
    [connections],
  );

  const chartData = useMemo(() => {
    return historyData.map((item) => ({
      time: dayjs(item.timestamp).format("HH:mm:ss"),
      upload: (item.upload / 1024 / 1024).toFixed(2),
      download: (item.download / 1024 / 1024).toFixed(2),
    }));
  }, [historyData]);

  const clearHistory = useLockFn(async () => {
    setHistoryData([]);
  });

  const exportData = useLockFn(async () => {
    const data = {
      timestamp: Date.now(),
      totalTraffic,
      domainStats,
      processStats,
      historyData,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `analytics-${dayjs().format("YYYY-MM-DD-HHmmss")}.json`;
    a.click();
    URL.revokeObjectURL(url);
  });

  const maxDomainTraffic = Math.max(...domainStats.map((d) => d.total), 1);
  const maxProcessTraffic = Math.max(...processStats.map((p) => p.total), 1);

  const renderStatCard = (
    item: DomainStats | ProcessStats,
    index: number,
    maxTraffic: number,
  ) => {
    const name = "domain" in item ? item.domain : item.process;
    const percentage = (item.total / maxTraffic) * 100;

    return (
      <Box
        key={name}
        sx={{
          p: 1.5,
          border: "1px solid",
          borderColor: "divider",
          backgroundColor: "transparent",
          borderRadius: "var(--cv-border-radius-sm)",
          transition: "all 0.2s ease",
          "&:hover": {
            borderColor: "primary.main",
            backgroundColor: (theme) => alpha(theme.palette.primary.main, 0.02),
          },
        }}
      >
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
          <Typography
            sx={{
              fontSize: "12px",
              fontWeight: 500,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              maxWidth: "65%",
            }}
          >
            {name}
          </Typography>
          <Typography
            sx={{
              fontSize: "12px",
              fontWeight: 600,
              color: "primary.main",
            }}
          >
            {parseTraffic(item.total)}
          </Typography>
        </Box>

        <Box
          sx={{
            position: "relative",
            height: 4,
            bgcolor: (theme) =>
              theme.palette.mode === "dark"
                ? "rgba(255, 255, 255, 0.05)"
                : "rgba(0, 0, 0, 0.05)",
            overflow: "hidden",
            mb: 1,
          }}
        >
          <Box
            sx={{
              position: "absolute",
              left: 0,
              top: 0,
              height: "100%",
              width: `${percentage}%`,
              bgcolor: "primary.main",
              transition: "width 0.3s ease",
            }}
          />
        </Box>

        <Box sx={{ display: "flex", gap: 1.5 }}>
          <Typography
            variant="caption"
            sx={{ fontSize: "10px", color: "success.main", opacity: 0.8 }}
          >
            ↓ {parseTraffic(item.download)}
          </Typography>
          <Typography
            variant="caption"
            sx={{ fontSize: "10px", color: "info.main", opacity: 0.8 }}
          >
            ↑ {parseTraffic(item.upload)}
          </Typography>
          <Typography
            variant="caption"
            sx={{ fontSize: "10px", color: "text.secondary", opacity: 0.5 }}
          >
            {item.count} {t("conn")}
          </Typography>
        </Box>
      </Box>
    );
  };

  return (
    <BasePage
      full
      title={t("Analytics")}
      contentStyle={{ height: "100%", padding: 0 }}
      header={
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Typography
            sx={{
              fontSize: 11,
              fontWeight: 600,
              color: "text.disabled",
              textTransform: "uppercase",
              letterSpacing: "0.5px",
            }}
          >
            TRAFFIC
          </Typography>

          <Box sx={{ display: "flex", gap: 1, alignItems: "center", fontSize: "12px" }}>
            <Box sx={{ color: "success.main", fontWeight: 600 }}>
              ↓ {parseTraffic(totalTraffic.download)}
            </Box>
            <Box sx={{ color: "info.main", fontWeight: 600 }}>
              ↑ {parseTraffic(totalTraffic.upload)}
            </Box>
            <Box sx={{ color: "text.secondary", fontWeight: 600 }}>
              Σ {parseTraffic(totalTraffic.total)}
            </Box>
          </Box>

          <Box sx={{ flex: 1 }} />

          <Typography
            sx={{
              fontSize: 11,
              fontWeight: 600,
              color: "text.disabled",
              textTransform: "uppercase",
              letterSpacing: "0.5px",
            }}
          >
            ACTIONS
          </Typography>

          <Box sx={{ display: "flex", gap: 0.75 }}>
            <Tooltip title={t("Export Data")} arrow>
              <IconButton
                size="small"
                onClick={exportData}
                sx={{
                  width: 28,
                  height: 28,
                  "&:hover": { bgcolor: "action.hover" },
                }}
              >
                <FileDownloadRounded sx={{ fontSize: 18 }} />
              </IconButton>
            </Tooltip>

            <Tooltip title={t("Clear History")} arrow>
              <IconButton
                size="small"
                onClick={clearHistory}
                sx={{
                  width: 28,
                  height: 28,
                  "&:hover": { bgcolor: "action.hover" },
                }}
              >
                <DeleteOutlineRounded sx={{ fontSize: 18 }} />
              </IconButton>
            </Tooltip>

            <Tooltip title={t("Refresh")} arrow>
              <IconButton
                size="small"
                onClick={() => setHistoryData([])}
                sx={{
                  width: 28,
                  height: 28,
                  "&:hover": { bgcolor: "action.hover" },
                }}
              >
                <RefreshRounded sx={{ fontSize: 18 }} />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
      }
    >
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          height: "100%",
        }}
      >
        {/* 流量趋势图 */}
        <Box
          sx={{
            borderBottom: (theme) =>
              `1px solid ${
                theme.palette.mode === "dark"
                  ? "rgba(255, 255, 255, 0.04)"
                  : "rgba(0, 0, 0, 0.04)"
              }`,
            px: { xs: 1.5, sm: 2 },
            py: { xs: 1.5, sm: 2 },
          }}
        >
          <Typography
            variant="caption"
            sx={{
              display: "block",
              mb: 1.5,
              fontWeight: 700,
              fontSize: { xs: "9px", sm: "10px" },
              letterSpacing: "1.2px",
              textTransform: "uppercase",
              color: "text.secondary",
              opacity: 0.7,
            }}
          >
            {t("Traffic Trend")}
          </Typography>

          {chartData.length > 0 ? (
            <Box
              sx={{
                border: "1px solid",
                borderColor: "divider",
                overflow: "hidden",
              }}
            >
              <ResponsiveContainer width="100%" height={160}>
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorDownload" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorUpload" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(128, 128, 128, 0.1)" />
                  <XAxis
                    dataKey="time"
                    stroke="rgba(128, 128, 128, 0.5)"
                    style={{ fontSize: "10px" }}
                    tick={{ fill: "currentColor" }}
                  />
                  <YAxis
                    stroke="rgba(128, 128, 128, 0.5)"
                    style={{ fontSize: "10px" }}
                    tick={{ fill: "currentColor" }}
                    label={{
                      value: "MB",
                      angle: -90,
                      position: "insideLeft",
                      style: { fontSize: "9px", fill: "currentColor" },
                    }}
                  />
                  <RechartsTooltip
                    contentStyle={{
                      backgroundColor: "rgba(0, 0, 0, 0.8)",
                      border: "none",
                      fontSize: "11px",
                    }}
                    labelStyle={{ color: "#fff" }}
                  />
                  <Area
                    type="monotone"
                    dataKey="download"
                    stroke="#10B981"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorDownload)"
                    name={t("Download") + " (MB)"}
                  />
                  <Area
                    type="monotone"
                    dataKey="upload"
                    stroke="#3B82F6"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorUpload)"
                    name={t("Upload") + " (MB)"}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </Box>
          ) : (
            <Box
              sx={{
                border: "1px solid",
                borderColor: "divider",
                py: 5,
                textAlign: "center",
              }}
            >
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: "11px" }}>
                {t("No data")}
              </Typography>
            </Box>
          )}
        </Box>

        {/* 统计区域 */}
        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", md: "row" },
            flex: 1,
            overflow: "hidden",
          }}
        >
          {/* 域名统计 */}
          <Box
            sx={{
              width: { xs: "100%", md: "50%" },
              overflow: "auto",
              borderRight: {
                xs: "none",
                md: (theme) =>
                  `1px solid ${
                    theme.palette.mode === "dark"
                      ? "rgba(255, 255, 255, 0.04)"
                      : "rgba(0, 0, 0, 0.04)"
                  }`,
              },
              pr: { xs: 0, md: 1.5, sm: 2 },
              pl: { xs: 1.5, sm: 2 },
              py: { xs: 1.5, sm: 2 },
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
              <LanguageRounded sx={{ fontSize: 14, color: "success.main", opacity: 0.7 }} />
              <Typography
                variant="caption"
                sx={{
                  fontWeight: 700,
                  fontSize: { xs: "9px", sm: "10px" },
                  letterSpacing: "1.2px",
                  textTransform: "uppercase",
                  color: "text.secondary",
                  opacity: 0.7,
                }}
              >
                {t("Top Domains")} ({domainStats.length})
              </Typography>
            </Box>

            {domainStats.length === 0 ? (
              <Box sx={{ py: 4, textAlign: "center" }}>
                <Typography variant="caption" color="text.secondary">
                  {t("No data")}
                </Typography>
              </Box>
            ) : (
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                {domainStats.slice(0, 20).map((stat, index) =>
                  renderStatCard(stat, index, maxDomainTraffic),
                )}
              </Box>
            )}
          </Box>

          {/* 进程统计 */}
          <Box
            sx={{
              width: { xs: "100%", md: "50%" },
              overflow: "auto",
              pl: { xs: 1.5, md: 1.5, sm: 2 },
              pr: { xs: 1.5, sm: 2 },
              py: { xs: 1.5, sm: 2 },
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
              <AppsRounded sx={{ fontSize: 14, color: "info.main", opacity: 0.7 }} />
              <Typography
                variant="caption"
                sx={{
                  fontWeight: 700,
                  fontSize: { xs: "9px", sm: "10px" },
                  letterSpacing: "1.2px",
                  textTransform: "uppercase",
                  color: "text.secondary",
                  opacity: 0.7,
                }}
              >
                {t("Top Processes")} ({processStats.length})
              </Typography>
            </Box>

            {processStats.length === 0 ? (
              <Box sx={{ py: 4, textAlign: "center" }}>
                <Typography variant="caption" color="text.secondary">
                  {t("No data")}
                </Typography>
              </Box>
            ) : (
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                {processStats.slice(0, 20).map((stat, index) =>
                  renderStatCard(stat, index, maxProcessTraffic),
                )}
              </Box>
            )}
          </Box>
        </Box>
      </Box>
    </BasePage>
  );
};

export default TrafficAnalyticsPage;
