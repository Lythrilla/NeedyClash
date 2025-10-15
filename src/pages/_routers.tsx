// 使用更现代、清晰的图标
import HomeIcon from "@mui/icons-material/Home";
import RouterIcon from "@mui/icons-material/Router";
import LayersIcon from "@mui/icons-material/Layers";
import HubIcon from "@mui/icons-material/Hub";
import RuleIcon from "@mui/icons-material/Rule";
import DescriptionIcon from "@mui/icons-material/Description";
import VpnKeyIcon from "@mui/icons-material/VpnKey";
import TuneIcon from "@mui/icons-material/Tune";

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
import UnlockPage from "./unlock";

export const routers = [
  {
    label: "Label-Home",
    path: "/home",
    icon: [<HomeIcon key="mui" />, <HomeSvg key="svg" />],
    element: <HomePage />,
  },
  {
    label: "Label-Proxies",
    path: "/",
    icon: [<RouterIcon key="mui" />, <ProxiesSvg key="svg" />],
    element: <ProxiesPage />,
  },
  {
    label: "Label-Profiles",
    path: "/profile",
    icon: [<LayersIcon key="mui" />, <ProfilesSvg key="svg" />],
    element: <ProfilesPage />,
  },
  {
    label: "Label-Connections",
    path: "/connections",
    icon: [<HubIcon key="mui" />, <ConnectionsSvg key="svg" />],
    element: <ConnectionsPage />,
  },
  {
    label: "Label-Rules",
    path: "/rules",
    icon: [<RuleIcon key="mui" />, <RulesSvg key="svg" />],
    element: <RulesPage />,
  },
  {
    label: "Label-Logs",
    path: "/logs",
    icon: [<DescriptionIcon key="mui" />, <LogsSvg key="svg" />],
    element: <LogsPage />,
  },
  {
    label: "Label-Unlock",
    path: "/unlock",
    icon: [<VpnKeyIcon key="mui" />, <UnlockSvg key="svg" />],
    element: <UnlockPage />,
  },
  {
    label: "Label-Settings",
    path: "/settings",
    icon: [<TuneIcon key="mui" />, <SettingsSvg key="svg" />],
    element: <SettingsPage />,
  },
].map((router) => ({
  ...router,
  element: (
    <BaseErrorBoundary key={router.label}>{router.element}</BaseErrorBoundary>
  ),
}));
