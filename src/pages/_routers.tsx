// 使用统一的 Sharp 风格图标，极客硬朗风格
import ArticleSharpIcon from "@mui/icons-material/ArticleSharp";
import BarChartSharpIcon from "@mui/icons-material/BarChartSharp";
import CableSharpIcon from "@mui/icons-material/CableSharp";
import DashboardSharpIcon from "@mui/icons-material/DashboardSharp";
import FilterListSharpIcon from "@mui/icons-material/FilterListSharp";
import NetworkCheckSharpIcon from "@mui/icons-material/NetworkCheckSharp";
import TerminalSharpIcon from "@mui/icons-material/TerminalSharp";
import TuneSharpIcon from "@mui/icons-material/TuneSharp";
import VpnKeySharpIcon from "@mui/icons-material/VpnKeySharp";

import ConnectionsSvg from "@/assets/image/itemicon/connections.svg?react";
import HomeSvg from "@/assets/image/itemicon/home.svg?react";
import LogsSvg from "@/assets/image/itemicon/logs.svg?react";
import ProfilesSvg from "@/assets/image/itemicon/profiles.svg?react";
import ProxiesSvg from "@/assets/image/itemicon/proxies.svg?react";
import RulesSvg from "@/assets/image/itemicon/rules.svg?react";
import SettingsSvg from "@/assets/image/itemicon/settings.svg?react";
import UnlockSvg from "@/assets/image/itemicon/unlock.svg?react";
import { BaseErrorBoundary } from "@/components/base";

import ConnectionsPage from "./connections";
import HomePage from "./home";
import LogsPage from "./logs";
import ProfilesPage from "./profiles";
import ProxiesPage from "./proxies";
import RulesPage from "./rules";
import SettingsPage from "./settings";
import TrafficAnalyticsPage from "./traffic-analytics";
import UnlockPage from "./unlock";

export const routers = [
  {
    label: "Label-Home",
    path: "/home",
    icon: [<DashboardSharpIcon key="mui" />, <HomeSvg key="svg" />],
    element: <HomePage />,
  },
  {
    label: "Label-Proxies",
    path: "/",
    icon: [<CableSharpIcon key="mui" />, <ProxiesSvg key="svg" />],
    element: <ProxiesPage />,
  },
  {
    label: "Label-Profiles",
    path: "/profile",
    icon: [<ArticleSharpIcon key="mui" />, <ProfilesSvg key="svg" />],
    element: <ProfilesPage />,
  },
  {
    label: "Label-Connections",
    path: "/connections",
    icon: [<NetworkCheckSharpIcon key="mui" />, <ConnectionsSvg key="svg" />],
    element: <ConnectionsPage />,
  },
  {
    label: "Label-Analytics",
    path: "/analytics",
    icon: [<BarChartSharpIcon key="mui" />, <ConnectionsSvg key="svg" />],
    element: <TrafficAnalyticsPage />,
  },
  {
    label: "Label-Rules",
    path: "/rules",
    icon: [<FilterListSharpIcon key="mui" />, <RulesSvg key="svg" />],
    element: <RulesPage />,
  },
  {
    label: "Label-Logs",
    path: "/logs",
    icon: [<TerminalSharpIcon key="mui" />, <LogsSvg key="svg" />],
    element: <LogsPage />,
  },
  {
    label: "Label-Unlock",
    path: "/unlock",
    icon: [<VpnKeySharpIcon key="mui" />, <UnlockSvg key="svg" />],
    element: <UnlockPage />,
  },
  {
    label: "Label-Settings",
    path: "/settings",
    icon: [<TuneSharpIcon key="mui" />, <SettingsSvg key="svg" />],
    element: <SettingsPage />,
  },
].map((router) => ({
  ...router,
  element: (
    <BaseErrorBoundary key={router.label}>{router.element}</BaseErrorBoundary>
  ),
}));
