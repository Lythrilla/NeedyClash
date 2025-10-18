import {
  DnsOutlined,
  HelpOutlineRounded,
  HistoryEduOutlined,
  RouterOutlined,
  SettingsOutlined,
  SpeedOutlined,
} from "@mui/icons-material";
import {
  Box,
  Checkbox,
  FormControlLabel,
  Grid,
  Skeleton,
  Typography,
} from "@mui/material";
import { useLockFn } from "ahooks";
import { Suspense, lazy, useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import {
  BasePage,
  BaseIconButton,
  ToolbarButtonGroup,
  BaseDialog,
} from "@/components/base";
import { ClashModeCard } from "@/components/home/clash-mode-card";
import { CurrentProxyCard } from "@/components/home/current-proxy-card";
import { EnhancedCard } from "@/components/home/enhanced-card";
import { EnhancedTrafficStats } from "@/components/home/enhanced-traffic-stats";
import { HomeProfileCard } from "@/components/home/home-profile-card";
import { ProxyTunCard } from "@/components/home/proxy-tun-card";
import {
  EnhancedDialogTitle,
  EnhancedFormGroup,
} from "@/components/setting/mods/enhanced-dialog-components";
import { useProfiles } from "@/hooks/use-profiles";
import { useTrafficQuotaReminder } from "@/hooks/use-traffic-quota-reminder";
import { useVerge } from "@/hooks/use-verge";
import { entry_lightweight_mode, openWebUrl } from "@/services/cmds";

const LazyTestCard = lazy(() =>
  import("@/components/home/test-card").then((module) => ({
    default: module.TestCard,
  })),
);
const LazyIpInfoCard = lazy(() =>
  import("@/components/home/ip-info-card").then((module) => ({
    default: module.IpInfoCard,
  })),
);
const LazyClashInfoCard = lazy(() =>
  import("@/components/home/clash-info-card").then((module) => ({
    default: module.ClashInfoCard,
  })),
);
const LazySystemInfoCard = lazy(() =>
  import("@/components/home/system-info-card").then((module) => ({
    default: module.SystemInfoCard,
  })),
);

// 定义首页卡片设置接口
interface HomeCardsSettings {
  profile: boolean;
  proxy: boolean;
  network: boolean;
  mode: boolean;
  traffic: boolean;
  info: boolean;
  clashinfo: boolean;
  systeminfo: boolean;
  test: boolean;
  ip: boolean;
  [key: string]: boolean;
}

// 首页设置对话框组件接口
interface HomeSettingsDialogProps {
  open: boolean;
  onClose: () => void;
  homeCards: HomeCardsSettings;
  onSave: (cards: HomeCardsSettings) => void;
}

// 首页设置对话框组件
const HomeSettingsDialog = ({
  open,
  onClose,
  homeCards,
  onSave,
}: HomeSettingsDialogProps) => {
  const { t } = useTranslation();
  const [cards, setCards] = useState<HomeCardsSettings>(homeCards);
  const { patchVerge } = useVerge();

  const handleToggle = (key: string) => {
    setCards((prev: HomeCardsSettings) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleSave = async () => {
    await patchVerge({ home_cards: cards });
    onSave(cards);
    onClose();
  };

  return (
    <BaseDialog
      open={open}
      title=""
      contentSx={{ width: 520, maxHeight: 680, px: 3, py: 3 }}
      okBtn={t("Save")}
      cancelBtn={t("Cancel")}
      onClose={onClose}
      onCancel={onClose}
      onOk={handleSave}
    >
      <EnhancedDialogTitle title={t("Home Settings")} />

      <EnhancedFormGroup>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
          <FormControlLabel
            control={
              <Checkbox
                checked={cards.profile || false}
                onChange={() => handleToggle("profile")}
              />
            }
            label={t("Profile Card")}
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={cards.proxy || false}
                onChange={() => handleToggle("proxy")}
              />
            }
            label={t("Current Proxy Card")}
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={cards.network || false}
                onChange={() => handleToggle("network")}
              />
            }
            label={t("Network Settings Card")}
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={cards.mode || false}
                onChange={() => handleToggle("mode")}
              />
            }
            label={t("Proxy Mode Card")}
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={cards.traffic || false}
                onChange={() => handleToggle("traffic")}
              />
            }
            label={t("Traffic Stats Card")}
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={cards.test || false}
                onChange={() => handleToggle("test")}
              />
            }
            label={t("Website Tests Card")}
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={cards.ip || false}
                onChange={() => handleToggle("ip")}
              />
            }
            label={t("IP Information Card")}
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={cards.clashinfo || false}
                onChange={() => handleToggle("clashinfo")}
              />
            }
            label={t("Clash Info Cards")}
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={cards.systeminfo || false}
                onChange={() => handleToggle("systeminfo")}
              />
            }
            label={t("System Info Cards")}
          />
        </Box>
      </EnhancedFormGroup>
    </BaseDialog>
  );
};

const HomePage = () => {
  const { t } = useTranslation();
  const { verge } = useVerge();
  const { current, mutateProfiles } = useProfiles();

  // 使用流量配额提醒hook
  useTrafficQuotaReminder();

  // 设置弹窗的状态
  const [settingsOpen, setSettingsOpen] = useState(false);

  // 卡片显示状态
  const defaultCards = useMemo<HomeCardsSettings>(
    () => ({
      info: false,
      profile: true,
      proxy: true,
      network: true,
      mode: true,
      traffic: true,
      clashinfo: true,
      systeminfo: true,
      test: true,
      ip: true,
    }),
    [],
  );

  const [homeCards, setHomeCards] = useState<HomeCardsSettings>(() => {
    return (verge?.home_cards as HomeCardsSettings) || defaultCards;
  });

  // 文档链接函数
  const toGithubDoc = useLockFn(() => {
    return openWebUrl("https://github.com/clash-verge-rev/clash-verge-rev"); // Original project
  });

  // 新增：打开设置弹窗
  const openSettings = useCallback(() => {
    setSettingsOpen(true);
  }, []);

  const renderCard = useCallback(
    (cardKey: string, component: React.ReactNode, size: number = 6) => {
      if (!homeCards[cardKey]) return null;

      return (
        <Grid size={size} key={cardKey}>
          {component}
        </Grid>
      );
    },
    [homeCards],
  );

  const criticalCards = useMemo(
    () => [
      renderCard(
        "profile",
        <HomeProfileCard current={current} onProfileUpdated={mutateProfiles} />,
        12, // 配置文件独占一行
      ),
      renderCard("mode", <ClashModeEnhancedCard />, 3), // 模式卡片
      renderCard("network", <NetworkSettingsCard />, 3), // 网络设置
      renderCard("proxy", <CurrentProxyCard />, 6), // 当前代理 - 内容更多，给更多空间
    ],
    [current, mutateProfiles, renderCard],
  );

  // 新增：保存设置时用requestIdleCallback/setTimeout
  const handleSaveSettings = (newCards: HomeCardsSettings) => {
    if (window.requestIdleCallback) {
      window.requestIdleCallback(() => setHomeCards(newCards));
    } else {
      setTimeout(() => setHomeCards(newCards), 0);
    }
  };

  const nonCriticalCards = useMemo(
    () => [
      renderCard(
        "traffic",
        <EnhancedCard
          title={t("Traffic Stats")}
          icon={<SpeedOutlined />}
          iconColor="secondary"
        >
          <EnhancedTrafficStats />
        </EnhancedCard>,
        12,
      ),
      renderCard(
        "test",
        <Suspense fallback={<Skeleton variant="rectangular" height={160} />}>
          <LazyTestCard />
        </Suspense>,
        3, // 网站连通性测试
      ),
      renderCard(
        "ip",
        <Suspense fallback={<Skeleton variant="rectangular" height={160} />}>
          <LazyIpInfoCard />
        </Suspense>,
        3, // IP信息
      ),
      renderCard(
        "clashinfo",
        <Suspense fallback={<Skeleton variant="rectangular" height={160} />}>
          <LazyClashInfoCard />
        </Suspense>,
        3, // Clash信息
      ),
      renderCard(
        "systeminfo",
        <Suspense fallback={<Skeleton variant="rectangular" height={160} />}>
          <LazySystemInfoCard />
        </Suspense>,
        3, // 系统信息
      ),
    ],
    [t, renderCard],
  );

  return (
    <BasePage
      title={t("Label-Home")}
      contentStyle={{ padding: 0, height: "100%" }}
      header={
        <ToolbarButtonGroup label="TOOLS">
          <BaseIconButton
            icon={<HistoryEduOutlined sx={{ fontSize: 18 }} />}
            tooltip={t("LightWeight Mode")}
            onClick={async () => await entry_lightweight_mode()}
          />
          <BaseIconButton
            icon={<HelpOutlineRounded sx={{ fontSize: 18 }} />}
            tooltip={t("Manual")}
            onClick={toGithubDoc}
          />
          <BaseIconButton
            icon={<SettingsOutlined sx={{ fontSize: 18 }} />}
            tooltip={t("Home Settings")}
            onClick={openSettings}
          />
        </ToolbarButtonGroup>
      }
    >
      {/* Flexbox 布局 */}
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          minHeight: "100%",
        }}
      >
        {/* 顶部横条 - 配置文件 */}
        <Box
          sx={{
            borderBottom: (theme) =>
              `1px solid ${
                theme.palette.mode === "dark"
                  ? "rgba(255, 255, 255, 0.04)"
                  : "rgba(0, 0, 0, 0.04)"
              }`,
            pb: { xs: 1.5, sm: 2 },
          }}
        >
          <HomeProfileCard
            current={current}
            onProfileUpdated={mutateProfiles}
          />
        </Box>

        {/* 主内容区 - 单栏/双栏自适应 */}
        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", md: "row" },
            flex: 1,
          }}
        >
          {/* 左列 */}
          <Box
            sx={{
              width: { xs: "100%", md: "50%" },
              display: "flex",
              flexDirection: "column",
              order: { xs: 2, md: 1 },
              borderRight: {
                xs: "none",
                md: (theme) =>
                  `1px solid ${
                    theme.palette.mode === "dark"
                      ? "rgba(255, 255, 255, 0.04)"
                      : "rgba(0, 0, 0, 0.04)"
                  }`,
              },
            }}
          >
            {/* Proxy Mode */}
            <Box
              sx={{
                borderBottom: (theme) =>
                  `1px solid ${
                    theme.palette.mode === "dark"
                      ? "rgba(255, 255, 255, 0.04)"
                      : "rgba(0, 0, 0, 0.04)"
                  }`,
                pr: { xs: 1.5, sm: 2 },
                pt: { xs: 1.5, sm: 2 },
                pb: { xs: 1.5, sm: 2 },
              }}
            >
              <Typography
                variant="caption"
                sx={{
                  display: "block",
                  mb: 2.5,
                  fontWeight: 700,
                  fontSize: { xs: "9px", sm: "10px" },
                  letterSpacing: "1.2px",
                  textTransform: "uppercase",
                  color: "text.secondary",
                  opacity: 0.7,
                }}
              >
                {t("Proxy Mode")}
              </Typography>
              <ClashModeCard />
            </Box>

            {/* Traffic & Testing */}
            <Box
              sx={{
                pr: { xs: 1.5, sm: 2 },
                pt: { xs: 1.5, sm: 2 },
              }}
            >
              <Typography
                variant="caption"
                sx={{
                  display: "block",
                  mb: 2.5,
                  fontWeight: 400,
                  fontSize: { xs: "9px", sm: "10px" },
                  letterSpacing: "0.8px",
                  textTransform: "uppercase",
                  color: "text.disabled",
                  opacity: 0.5,
                }}
              >
                {t("Traffic")}
              </Typography>
              <EnhancedTrafficStats />
              <Typography
                variant="caption"
                sx={{
                  display: "block",
                  mb: 2.5,
                  fontWeight: 400,
                  fontSize: { xs: "9px", sm: "10px" },
                  letterSpacing: "0.8px",
                  textTransform: "uppercase",
                  color: "text.disabled",
                  opacity: 0.5,
                }}
              >
                {t("Testing")}
              </Typography>
              <Suspense
                fallback={<Skeleton variant="rectangular" height={100} />}
              >
                <LazyTestCard />
              </Suspense>
            </Box>
          </Box>

          {/* 右列 */}
          <Box
            sx={{
              width: { xs: "100%", md: "50%" },
              display: "flex",
              flexDirection: "column",
              order: { xs: 1, md: 2 },
            }}
          >
            {/* Network */}
            <Box
              sx={{
                borderBottom: (theme) =>
                  `1px solid ${
                    theme.palette.mode === "dark"
                      ? "rgba(255, 255, 255, 0.04)"
                      : "rgba(0, 0, 0, 0.04)"
                  }`,
                pl: { xs: 1.5, sm: 2 },
                pt: { xs: 1.5, sm: 2 },
                pb: { xs: 1.5, sm: 2 },
              }}
            >
              <Typography
                variant="caption"
                sx={{
                  display: "block",
                  mb: 2.5,
                  fontWeight: 700,
                  fontSize: { xs: "9px", sm: "10px" },
                  letterSpacing: "1.2px",
                  textTransform: "uppercase",
                  color: "text.secondary",
                  opacity: 0.7,
                }}
              >
                {t("Network")}
              </Typography>
              <ProxyTunCard />
            </Box>

            {/* Info */}
            <Box
              sx={{
                pl: { xs: 1.5, sm: 2 },
                pt: { xs: 1.5, sm: 2 },
              }}
            >
              <Typography
                variant="caption"
                sx={{
                  display: "block",
                  mb: 2.5,
                  fontWeight: 400,
                  fontSize: { xs: "9px", sm: "10px" },
                  letterSpacing: "0.8px",
                  textTransform: "uppercase",
                  color: "text.disabled",
                  opacity: 0.5,
                }}
              >
                {t("Info")}
              </Typography>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                <Suspense
                  fallback={<Skeleton variant="rectangular" height={80} />}
                >
                  <LazyIpInfoCard />
                </Suspense>
                <Suspense
                  fallback={<Skeleton variant="rectangular" height={80} />}
                >
                  <LazyClashInfoCard />
                </Suspense>
                <Suspense
                  fallback={<Skeleton variant="rectangular" height={80} />}
                >
                  <LazySystemInfoCard />
                </Suspense>
              </Box>
            </Box>
          </Box>
        </Box>
      </Box>

      {/* 首页设置弹窗 */}
      <HomeSettingsDialog
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        homeCards={homeCards}
        onSave={handleSaveSettings}
      />
    </BasePage>
  );
};

const NetworkSettingsCard = () => {
  const { t } = useTranslation();
  return (
    <EnhancedCard
      title={t("Network Settings")}
      icon={<DnsOutlined />}
      iconColor="primary"
      action={null}
    >
      <ProxyTunCard />
    </EnhancedCard>
  );
};

const ClashModeEnhancedCard = () => {
  const { t } = useTranslation();
  return (
    <EnhancedCard
      title={t("Proxy Mode")}
      icon={<RouterOutlined />}
      iconColor="info"
      action={null}
    >
      <ClashModeCard />
    </EnhancedCard>
  );
};

export default HomePage;
