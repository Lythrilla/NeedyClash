import {
  LocationOnOutlined,
  RefreshOutlined,
  VisibilityOutlined,
  VisibilityOffOutlined,
} from "@mui/icons-material";
import { Box, Typography, Button, Skeleton, IconButton } from "@mui/material";
import { useState, useEffect, useCallback, memo, useRef } from "react";
import { useTranslation } from "react-i18next";

import { getIpInfo } from "@/services/api";
import { getLogger } from "@/utils/logger";

import { EnhancedCard } from "./enhanced-card";

const logger = getLogger("IpInfoCard");

// 定义刷新时间（秒）
const IP_REFRESH_SECONDS = 300;

const InfoRow = memo(
  ({ label, value }: { label: string; value: string | React.ReactNode }) => (
    <Box
      sx={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        py: 0.75,
        borderBottom: "1px solid",
        borderColor: "divider",
        "&:last-child": {
          borderBottom: "none",
        },
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
        {label}
      </Typography>
      <Typography
        variant="body2"
        sx={{
          fontSize: "11px",
          fontWeight: 500,
          color: "text.primary",
          textAlign: "right",
          maxWidth: "60%",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
      >
        {value || "-"}
      </Typography>
    </Box>
  ),
);

// 获取国旗表情
const getCountryFlag = (countryCode: string) => {
  if (!countryCode) return "";
  const codePoints = countryCode
    .toUpperCase()
    .split("")
    .map((char) => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
};

// IP信息卡片组件
export const IpInfoCard = () => {
  const { t } = useTranslation();
  const [ipInfo, setIpInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showIp, setShowIp] = useState(false);
  const [countdown, setCountdown] = useState(IP_REFRESH_SECONDS);

  // 使用 ref 管理 AbortController，避免组件卸载时请求继续
  const abortControllerRef = useRef<AbortController | null>(null);

  // 获取IP信息 - 使用 ref 来稳定函数引用
  const fetchIpInfoRef = useRef<(() => Promise<void>) | undefined>(undefined);
  fetchIpInfoRef.current = async () => {
    try {
      // 取消之前的请求
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      // 创建新的 AbortController
      abortControllerRef.current = new AbortController();

      setLoading(true);
      setError("");

      const data = await getIpInfo(abortControllerRef.current.signal);

      setIpInfo(data);
      setCountdown(IP_REFRESH_SECONDS);
    } catch (err: any) {
      // 忽略取消错误
      if (err.message === "请求已取消" || err.name === "AbortError") {
        logger.debug("IP检测请求被取消");
        return;
      }
      setError(err.message || t("Failed to get IP info"));
    } finally {
      setLoading(false);
    }
  };

  // 暴露一个稳定的函数给外部使用
  const fetchIpInfo = useCallback(() => {
    fetchIpInfoRef.current?.();
  }, []);

  // 组件加载时获取IP信息
  useEffect(() => {
    let mounted = true;
    let timer: number | null = null;
    let currentCount = IP_REFRESH_SECONDS;

    // 初始加载
    if (mounted) {
      fetchIpInfoRef.current?.();
    }

    // 倒计时和自动刷新
    const startCountdown = () => {
      timer = window.setInterval(() => {
        if (!mounted) return;

        currentCount -= 1;

        if (currentCount <= 0) {
          fetchIpInfoRef.current?.();
          currentCount = IP_REFRESH_SECONDS;
        }

        // 每5秒更新UI显示
        if (currentCount % 5 === 0) {
          setCountdown(currentCount);
        }
      }, 1000);
    };

    startCountdown();

    return () => {
      mounted = false;
      if (timer) clearInterval(timer);
      // 组件卸载时取消正在进行的请求
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []); // 移除 fetchIpInfo 依赖，避免循环

  const toggleShowIp = useCallback(() => {
    setShowIp((prev) => !prev);
  }, []);

  // 渲染加载状态
  if (loading) {
    return (
      <EnhancedCard
        title={t("IP Information")}
        icon={<LocationOnOutlined />}
        iconColor="info"
        action={
          <IconButton size="small" onClick={fetchIpInfo} disabled={true}>
            <RefreshOutlined />
          </IconButton>
        }
      >
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
          <Skeleton variant="text" width="60%" height={30} />
          <Skeleton variant="text" width="80%" height={24} />
          <Skeleton variant="text" width="70%" height={24} />
          <Skeleton variant="text" width="50%" height={24} />
        </Box>
      </EnhancedCard>
    );
  }

  // 渲染错误状态
  if (error) {
    return (
      <EnhancedCard
        title={t("IP Information")}
        icon={<LocationOnOutlined />}
        iconColor="info"
        action={
          <IconButton size="small" onClick={fetchIpInfo}>
            <RefreshOutlined />
          </IconButton>
        }
      >
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            height: "100%",
            color: "error.main",
          }}
        >
          <Typography variant="body1" color="error">
            {error}
          </Typography>
          <Button onClick={fetchIpInfo} sx={{ mt: 2 }}>
            {t("Retry")}
          </Button>
        </Box>
      </EnhancedCard>
    );
  }

  // 渲染正常数据 - 极简设计
  return (
    <EnhancedCard
      title={t("IP Information")}
      icon={<LocationOnOutlined />}
      iconColor="info"
      action={
        <IconButton
          size="small"
          onClick={fetchIpInfo}
          sx={{
            width: "24px",
            height: "24px",
            "& svg": { fontSize: "16px" },
          }}
        >
          <RefreshOutlined />
        </IconButton>
      }
    >
      <Box sx={{ display: "flex", flexDirection: "column" }}>
        {/* 国家/地区 */}
        <InfoRow
          label={t("Location")}
          value={
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
              <Box
                component="span"
                sx={{
                  fontSize: "14px",
                  fontFamily: '"twemoji mozilla", sans-serif',
                }}
              >
                {getCountryFlag(ipInfo?.country_code)}
              </Box>
              <span>{ipInfo?.country || "-"}</span>
            </Box>
          }
        />

        {/* IP 地址 */}
        <InfoRow
          label="IP"
          value={
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
              <Box
                component="span"
                sx={{
                  fontFamily: "monospace",
                  fontSize: "10px",
                  maxWidth: "120px",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {showIp ? ipInfo?.ip : "•••••"}
              </Box>
              <IconButton
                size="small"
                onClick={toggleShowIp}
                sx={{
                  width: "16px",
                  height: "16px",
                  ml: 0.5,
                  "& svg": { fontSize: "12px" },
                }}
              >
                {showIp ? <VisibilityOffOutlined /> : <VisibilityOutlined />}
              </IconButton>
            </Box>
          }
        />

        {/* ISP */}
        <InfoRow
          label="ISP"
          value={ipInfo?.isp || ipInfo?.asn_organization || "-"}
        />

        {/* 城市 */}
        {ipInfo?.city && (
          <InfoRow
            label={t("City")}
            value={[ipInfo?.city, ipInfo?.region].filter(Boolean).join(", ")}
          />
        )}

        {/* ASN */}
        <InfoRow label="ASN" value={ipInfo?.asn ? `AS${ipInfo.asn}` : "-"} />
      </Box>
    </EnhancedCard>
  );
};
