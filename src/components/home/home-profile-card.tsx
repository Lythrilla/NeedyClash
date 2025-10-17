import {
  AccessTimeRounded,
  CloudUploadOutlined,
  EventOutlined,
  LaunchOutlined,
  SpeedRounded,
  StorageOutlined,
  TrendingUpRounded,
  UpdateOutlined,
} from "@mui/icons-material";
import {
  Box,
  Button,
  Chip,
  Divider,
  LinearProgress,
  Link,
  Stack,
  Typography,
  alpha,
  keyframes,
} from "@mui/material";
import { useLockFn } from "ahooks";
import dayjs from "dayjs";
import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

import { useAppData } from "@/providers/app-data-context";
import { openWebUrl, updateProfile } from "@/services/cmds";
import { showNotice } from "@/services/noticeService";
import parseTraffic from "@/utils/parse-traffic";

import { EnhancedCard } from "./enhanced-card";

// 定义旋转动画
const round = keyframes`
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
`;

// 辅助函数解析URL和过期时间
const parseUrl = (url?: string) => {
  if (!url) return "-";
  if (url.startsWith("http")) return new URL(url).host;
  return "local";
};

const parseExpire = (expire?: number) => {
  if (!expire) return "-";
  return dayjs(expire * 1000).format("YYYY-MM-DD");
};

// 使用类型定义，而不是导入
interface ProfileExtra {
  upload: number;
  download: number;
  total: number;
  expire: number;
}

interface ProfileItem {
  uid: string;
  type?: "local" | "remote" | "merge" | "script";
  name?: string;
  desc?: string;
  file?: string;
  url?: string;
  updated?: number;
  extra?: ProfileExtra;
  home?: string;
  option?: any;
}

interface HomeProfileCardProps {
  current: ProfileItem | null | undefined;
  onProfileUpdated?: () => void;
}

// 提取独立组件减少主组件复杂度
const ProfileDetails = ({
  current,
  onUpdateProfile,
  updating,
}: {
  current: ProfileItem;
  onUpdateProfile: () => void;
  updating: boolean;
}) => {
  const usedTraffic = useMemo(() => {
    if (!current.extra) return 0;
    return current.extra.upload + current.extra.download;
  }, [current.extra]);

  const trafficPercentage = useMemo(() => {
    if (!current.extra || !current.extra.total || current.extra.total <= 0)
      return 0;
    return Math.min(Math.round((usedTraffic / current.extra.total) * 100), 100);
  }, [current.extra, usedTraffic]);

  return (
    <Box 
      sx={{ 
        display: "flex", 
        flexDirection: "column",
        gap: 2,
      }}
    >
      {/* 第一行：订阅来源（加强版） */}
      <Box>
        {current.url && (
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 2, mb: 1 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, minWidth: 0, flex: 1 }}>
              <StorageOutlined sx={{ fontSize: 18, color: "primary.main", opacity: 0.8 }} />
              {current.home ? (
                <Link
                  component="button"
                  onClick={() => current.home && openWebUrl(current.home)}
                  sx={{
                    fontSize: 15,
                    fontWeight: 700,
                    color: "text.primary",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    textDecoration: "none",
                    display: "flex",
                    alignItems: "center",
                    gap: 0.5,
                    "&:hover": { 
                      color: "primary.main",
                    },
                  }}
                  title={parseUrl(current.url)}
                >
                  {parseUrl(current.url)}
                  <LaunchOutlined sx={{ fontSize: "0.8rem", opacity: 0.5 }} />
                </Link>
              ) : (
                <Typography
                  sx={{
                    fontSize: 15,
                    fontWeight: 700,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {parseUrl(current.url) || "本地配置"}
                </Typography>
              )}
            </Box>
          </Box>
        )}
        
        {/* 更新信息 */}
        {current.updated && (
          <Box 
            sx={{ 
              display: "flex", 
              alignItems: "center",
              gap: 2,
              justifyContent: "space-between",
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <AccessTimeRounded sx={{ fontSize: 14, color: "text.disabled" }} />
              <Typography sx={{ fontSize: 11, color: "text.secondary" }}>
                更新于 {dayjs(current.updated * 1000).format("YYYY-MM-DD HH:mm")}
              </Typography>
            </Box>
            
            <Box 
              sx={{ 
                display: "flex", 
                alignItems: "center", 
                gap: 0.75,
                cursor: "pointer",
                px: 1.5,
                py: 0.5,
                border: (theme) => `1px solid ${alpha(theme.palette.divider, 0.5)}`,
                "&:hover": { 
                  borderColor: "primary.main",
                  backgroundColor: (theme) => alpha(theme.palette.primary.main, 0.05),
                },
              }}
              onClick={onUpdateProfile}
            >
              <UpdateOutlined
                sx={{
                  fontSize: "0.85rem",
                  color: "text.secondary",
                  animation: updating ? `${round} 1.5s linear infinite` : "none",
                }}
              />
              <Typography sx={{ fontSize: 11, fontWeight: 500, color: "text.secondary" }}>
                刷新
              </Typography>
            </Box>
          </Box>
        )}
      </Box>

      {/* 第二行：流量统计（分组展示） */}
      {current.extra && (
        <Box 
          sx={{ 
            display: "flex",
            flexDirection: "column",
            gap: 1.5,
          }}
        >
          {/* 数据网格 */}
          <Box 
            sx={{ 
              display: "grid",
              gridTemplateColumns: { xs: "1fr 1fr", sm: "repeat(4, 1fr)" },
              gap: 1.5,
            }}
          >
            {/* 已用流量 */}
            <Box 
              sx={{ 
                display: "flex",
                flexDirection: "column",
                gap: 0.5,
              }}
            >
              <Typography sx={{ fontSize: 10, color: "text.disabled", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                已用流量
              </Typography>
              <Typography sx={{ fontSize: 16, fontWeight: 700, color: "text.primary" }}>
                {parseTraffic(usedTraffic)}
              </Typography>
            </Box>

            {/* 总流量 */}
            <Box 
              sx={{ 
                display: "flex",
                flexDirection: "column",
                gap: 0.5,
              }}
            >
              <Typography sx={{ fontSize: 10, color: "text.disabled", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                总流量
              </Typography>
              <Typography sx={{ fontSize: 16, fontWeight: 700, color: "text.primary" }}>
                {parseTraffic(current.extra.total)}
              </Typography>
            </Box>

            {/* 剩余流量 */}
            <Box 
              sx={{ 
                display: "flex",
                flexDirection: "column",
                gap: 0.5,
              }}
            >
              <Typography sx={{ fontSize: 10, color: "text.disabled", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                剩余流量
              </Typography>
              <Typography sx={{ fontSize: 16, fontWeight: 700, color: "success.main" }}>
                {parseTraffic(current.extra.total - usedTraffic)}
              </Typography>
            </Box>

            {/* 到期时间 */}
            {current.extra.expire > 0 && (
              <Box 
                sx={{ 
                  display: "flex",
                  flexDirection: "column",
                  gap: 0.5,
                }}
              >
                <Typography sx={{ fontSize: 10, color: "text.disabled", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  到期时间
                </Typography>
                <Typography sx={{ fontSize: 16, fontWeight: 700, color: "text.primary" }}>
                  {parseExpire(current.extra.expire)}
                </Typography>
              </Box>
            )}
          </Box>

          {/* 进度条区域 */}
          <Box>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 0.75 }}>
              <Typography sx={{ fontSize: 11, fontWeight: 600, color: "text.secondary" }}>
                使用进度
              </Typography>
              <Typography 
                sx={{ 
                  fontSize: 13, 
                  fontWeight: 700,
                  color: trafficPercentage > 90 
                    ? "error.main" 
                    : trafficPercentage > 70 
                    ? "warning.main" 
                    : "primary.main",
                }}
              >
                {trafficPercentage}%
              </Typography>
            </Box>
            
            <LinearProgress
              variant="determinate"
              value={trafficPercentage}
              sx={{
                height: 8,
                backgroundColor: (theme) => alpha(theme.palette.primary.main, 0.08),
                "& .MuiLinearProgress-bar": {
                  background: (theme) => 
                    trafficPercentage > 90
                      ? `linear-gradient(90deg, ${theme.palette.error.main}, ${theme.palette.error.dark})`
                      : trafficPercentage > 70
                      ? `linear-gradient(90deg, ${theme.palette.warning.main}, ${theme.palette.warning.dark})`
                      : `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
                },
              }}
            />
          </Box>
        </Box>
      )}
    </Box>
  );
};

// 提取空配置组件
const EmptyProfile = ({ onClick }: { onClick: () => void }) => {
  const { t } = useTranslation();

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        py: 2.4,
        cursor: "pointer",
        "&:hover": { bgcolor: "action.hover" },
      }}
      onClick={onClick}
    >
      <CloudUploadOutlined
        sx={{ fontSize: 60, color: "primary.main", mb: 2 }}
      />
      <Typography variant="h6" gutterBottom>
        {t("Import")} {t("Profiles")}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        {t("Click to import subscription")}
      </Typography>
    </Box>
  );
};

export const HomeProfileCard = ({
  current,
  onProfileUpdated,
}: HomeProfileCardProps) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { refreshAll } = useAppData();

  // 更新当前订阅
  const [updating, setUpdating] = useState(false);

  const onUpdateProfile = useLockFn(async () => {
    if (!current?.uid) return;

    setUpdating(true);
    try {
      await updateProfile(current.uid, current.option);
      onProfileUpdated?.();

      // 刷新首页数据
      refreshAll();
    } catch (err: any) {
      showNotice("error", err.message || err.toString(), 3000);
    } finally {
      setUpdating(false);
    }
  });

  // 导航到订阅页面
  const goToProfiles = useCallback(() => {
    navigate("/profile");
  }, [navigate]);

  // 卡片标题
  const cardTitle = useMemo(() => {
    if (!current) return t("Profiles");

    if (!current.home) return current.name;

    return (
      <Link
        component="button"
        variant="h6"
        fontWeight="medium"
        fontSize={18}
        onClick={() => current.home && openWebUrl(current.home)}
        sx={{
          color: "inherit",
          textDecoration: "none",
          display: "flex",
          alignItems: "center",
          minWidth: 0,
          maxWidth: "100%",
          "& > span": {
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            flex: 1,
          },
        }}
        title={current.name}
      >
        <span>{current.name}</span>
        <LaunchOutlined
          fontSize="inherit"
          sx={{
            ml: 0.5,
            fontSize: "0.8rem",
            opacity: 0.7,
            flexShrink: 0,
          }}
        />
      </Link>
    );
  }, [current, t]);

  // 卡片操作按钮
  const cardAction = useMemo(() => {
    if (!current) return null;

    return (
      <Button
        variant="outlined"
        size="small"
        onClick={goToProfiles}
        endIcon={<StorageOutlined fontSize="small" />}
      >
        {t("Label-Profiles")}
      </Button>
    );
  }, [current, goToProfiles, t]);

  return (
    <EnhancedCard
      title={cardTitle}
      icon={<CloudUploadOutlined />}
      iconColor="info"
      action={cardAction}
    >
      {current ? (
        <ProfileDetails
          current={current}
          onUpdateProfile={onUpdateProfile}
          updating={updating}
        />
      ) : (
        <EmptyProfile onClick={goToProfiles} />
      )}
    </EnhancedCard>
  );
};
