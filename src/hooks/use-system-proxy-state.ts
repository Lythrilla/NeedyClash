import useSWR, { mutate } from "swr";

import { systemProxySWRConfig } from "@/config/swr-config";
import { closeAllConnections } from "tauri-plugin-mihomo-api";

import { useVerge } from "@/hooks/use-verge";
import { useAppData } from "@/providers/app-data-context";
import { getAutotemProxy } from "@/services/cmds";
import { getLogger } from "@/utils/logger";

const logger = getLogger("useSystemProxyState");

// 系统代理状态检测统一逻辑
export const useSystemProxyState = () => {
  const { verge, mutateVerge, patchVerge } = useVerge();
  const { sysproxy } = useAppData();
  const { data: autoproxy } = useSWR(
    "getAutotemProxy",
    getAutotemProxy,
    systemProxySWRConfig,
  );

  const { enable_system_proxy, proxy_auto_config } = verge ?? {};

  const getSystemProxyActualState = () => {
    const userEnabled = enable_system_proxy ?? false;

    // 用户配置状态应该与系统实际状态一致
    // 如果用户启用了系统代理，检查实际的系统状态
    if (userEnabled) {
      if (proxy_auto_config) {
        return autoproxy?.enable ?? false;
      } else {
        return sysproxy?.enable ?? false;
      }
    }

    // 用户没有启用时，返回 false
    return false;
  };

  const getSystemProxyIndicator = () => {
    if (proxy_auto_config) {
      return autoproxy?.enable ?? false;
    } else {
      return sysproxy?.enable ?? false;
    }
  };

  const updateProxyStatus = async () => {
    await new Promise((resolve) => setTimeout(resolve, 100));
    await mutate("getSystemProxy");
    await mutate("getAutotemProxy");
  };

  const toggleSystemProxy = async (enabled: boolean) => {
    // 乐观更新
    mutateVerge({ ...verge, enable_system_proxy: enabled }, false);

    try {
      if (!enabled && verge?.auto_close_connection) {
        closeAllConnections();
      }
      await patchVerge({ enable_system_proxy: enabled });
      await updateProxyStatus();
    } catch (error) {
      console.warn("[useSystemProxyState] toggleSystemProxy failed:", error);
      // 回滚状态
      mutateVerge({ ...verge, enable_system_proxy: !enabled }, false);
      throw error;
    }
  };

  return {
    actualState: getSystemProxyActualState(),
    indicator: getSystemProxyIndicator(),
    configState: enable_system_proxy ?? false,
    sysproxy,
    autoproxy,
    proxy_auto_config,
    toggleSystemProxy,
  };
};
