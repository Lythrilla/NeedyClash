import { listen } from "@tauri-apps/api/event";
import React, { useCallback, useEffect, useMemo } from "react";
import useSWR from "swr";
import {
  getBaseConfig,
  getRuleProviders,
  getRules,
} from "tauri-plugin-mihomo-api";

import {
  proxySWRConfig,
  clashConfigSWRConfig,
  providerSWRConfig,
  ruleSWRConfig,
  systemStateSWRConfig,
  uptimeSWRConfig,
} from "@/config/swr-config";
import { useVerge } from "@/hooks/use-verge";
import {
  calcuProxies,
  calcuProxyProviders,
  getAppUptime,
  getRunningMode,
  getSystemProxy,
} from "@/services/cmds";
import { getLogger } from "@/utils/logger";

import { AppDataContext, AppDataContextType } from "./app-data-context";

const logger = getLogger("AppDataProvider");

// 全局数据提供者组件
export const AppDataProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const { verge } = useVerge();

  const { data: proxiesData, mutate: refreshProxy } = useSWR(
    "getProxies",
    calcuProxies,
    proxySWRConfig,
  );

  const { data: clashConfig, mutate: refreshClashConfig } = useSWR(
    "getClashConfig",
    getBaseConfig,
    clashConfigSWRConfig,
  );

  const { data: proxyProviders, mutate: refreshProxyProviders } = useSWR(
    "getProxyProviders",
    calcuProxyProviders,
    providerSWRConfig,
  );

  const { data: ruleProviders, mutate: refreshRuleProviders } = useSWR(
    "getRuleProviders",
    getRuleProviders,
    ruleSWRConfig,
  );

  const { data: rulesData, mutate: refreshRules } = useSWR(
    "getRules",
    getRules,
    ruleSWRConfig,
  );

  // 监听配置变更事件
  useEffect(() => {
    let lastProfileId: string | null = null;
    let lastUpdateTime = 0;
    const refreshThrottle = 500;

    let isUnmounted = false;
    const scheduledTimeouts = new Set<ReturnType<typeof setTimeout>>();
    const cleanupFns: Array<() => void> = [];

    const registerCleanup = (fn: () => void) => {
      if (isUnmounted) {
        fn();
      } else {
        cleanupFns.push(fn);
      }
    };

    const addWindowListener = (eventName: string, handler: EventListener) => {
      // eslint-disable-next-line @eslint-react/web-api/no-leaked-event-listener -- cleanup is returned by this helper
      window.addEventListener(eventName, handler);
      return () => window.removeEventListener(eventName, handler);
    };

    const scheduleTimeout = (
      callback: () => void | Promise<void>,
      delay: number,
    ) => {
      const timeoutId = window.setTimeout(() => {
        scheduledTimeouts.delete(timeoutId);
        void callback();
      }, delay);

      scheduledTimeouts.add(timeoutId);
      return timeoutId;
    };

    const clearAllTimeouts = () => {
      scheduledTimeouts.forEach((timeoutId) => clearTimeout(timeoutId));
      scheduledTimeouts.clear();
    };

    const handleProfileChanged = (event: { payload: string }) => {
      const newProfileId = event.payload;
      const now = Date.now();

      logger.info(`Profile切换事件: ${newProfileId}`);

      if (
        lastProfileId === newProfileId &&
        now - lastUpdateTime < refreshThrottle
      ) {
        logger.debug("重复事件被防抖，跳过");
        return;
      }

      lastProfileId = newProfileId;
      lastUpdateTime = now;

      // 刷新所有相关数据
      scheduleTimeout(async () => {
        try {
          logger.debug("Profile切换 - 刷新代理数据");
          await refreshProxy();
          logger.debug("Profile切换 - 刷新代理提供者");
          await refreshProxyProviders();
        } catch (error) {
          logger.error("Profile切换时刷新失败:", error);
        }
      }, 100);

      // 刷新规则数据
      refreshRules().catch((error) => logger.warn("规则刷新失败:", error));
      refreshRuleProviders().catch((error) =>
        logger.warn("规则提供者刷新失败:", error),
      );
    };

    const handleRefreshClash = () => {
      const now = Date.now();
      logger.info("Clash配置刷新事件");

      if (now - lastUpdateTime <= refreshThrottle) {
        return;
      }

      lastUpdateTime = now;

      scheduleTimeout(async () => {
        try {
          logger.debug("Clash刷新 - 刷新代理数据");
          await refreshProxy();
          logger.debug("Clash刷新 - 刷新代理提供者");
          await refreshProxyProviders();
          logger.debug("Clash刷新 - 刷新配置");
          await refreshClashConfig();
        } catch (error) {
          logger.error("Clash刷新时失败:", error);
        }
      }, 0);
    };

    const handleRefreshProxy = () => {
      const now = Date.now();
      logger.info("代理配置刷新事件");

      if (now - lastUpdateTime <= refreshThrottle) {
        return;
      }

      lastUpdateTime = now;

      scheduleTimeout(async () => {
        try {
          await refreshProxy();
          await refreshProxyProviders();
        } catch (error) {
          logger.warn("代理刷新失败:", error);
        }
      }, 100);
    };

    const initializeListeners = async () => {
      try {
        const unlistenProfile = await listen<string>(
          "profile-changed",
          handleProfileChanged,
        );
        registerCleanup(unlistenProfile);
      } catch (error) {
        logger.error("监听 Profile 事件失败:", error);
      }

      try {
        const unlistenClash = await listen(
          "verge://refresh-clash-config",
          handleRefreshClash,
        );
        const unlistenProxy = await listen(
          "verge://refresh-proxy-config",
          handleRefreshProxy,
        );

        registerCleanup(() => {
          unlistenClash();
          unlistenProxy();
        });
      } catch (error) {
        logger.warn("设置 Tauri 事件监听器失败:", error);

        const fallbackHandlers: Array<[string, EventListener]> = [
          ["verge://refresh-clash-config", handleRefreshClash],
          ["verge://refresh-proxy-config", handleRefreshProxy],
        ];

        fallbackHandlers.forEach(([eventName, handler]) => {
          registerCleanup(addWindowListener(eventName, handler));
        });
      }
    };

    void initializeListeners();

    return () => {
      isUnmounted = true;
      clearAllTimeouts();
      cleanupFns.splice(0).forEach((fn) => fn());
    };
  }, [refreshProxy, refreshRules, refreshRuleProviders]);

  const { data: sysproxy, mutate: refreshSysproxy } = useSWR(
    "getSystemProxy",
    getSystemProxy,
    systemStateSWRConfig,
  );

  const { data: runningMode } = useSWR(
    "getRunningMode",
    getRunningMode,
    systemStateSWRConfig,
  );

  const { data: uptimeData } = useSWR("appUptime", getAppUptime, uptimeSWRConfig);

  // 刷新方法
  const refreshAll = useCallback(async () => {
    await Promise.all([
      refreshProxy(),
      refreshClashConfig(),
      refreshRules(),
      refreshSysproxy(),
      refreshProxyProviders(),
      refreshRuleProviders(),
    ]);
  }, [
    refreshProxy,
    refreshClashConfig,
    refreshRules,
    refreshSysproxy,
    refreshProxyProviders,
    refreshRuleProviders,
  ]);

  // 聚合所有数据
  const value = useMemo(() => {
    // 计算系统代理地址
    const calculateSystemProxyAddress = () => {
      if (!verge || !clashConfig) return "-";

      const isPacMode = verge.proxy_auto_config ?? false;

      if (isPacMode) {
        // PAC模式：显示我们期望设置的代理地址
        const proxyHost = verge.proxy_host || "127.0.0.1";
        const proxyPort =
          verge.verge_mixed_port || clashConfig.mixedPort || 7897;
        return `${proxyHost}:${proxyPort}`;
      } else {
        // HTTP代理模式：优先使用系统地址，但如果格式不正确则使用期望地址
        const systemServer = sysproxy?.server;
        if (
          systemServer &&
          systemServer !== "-" &&
          !systemServer.startsWith(":")
        ) {
          return systemServer;
        } else {
          // 系统地址无效，返回期望的代理地址
          const proxyHost = verge.proxy_host || "127.0.0.1";
          const proxyPort =
            verge.verge_mixed_port || clashConfig.mixedPort || 7897;
          return `${proxyHost}:${proxyPort}`;
        }
      }
    };

    return {
      // 数据
      proxies: proxiesData,
      clashConfig,
      rules: rulesData?.rules || [],
      sysproxy,
      runningMode,
      uptime: uptimeData || 0,

      // 提供者数据
      proxyProviders: proxyProviders || {},
      ruleProviders: ruleProviders?.providers || {},

      systemProxyAddress: calculateSystemProxyAddress(),

      // 刷新方法
      refreshProxy,
      refreshClashConfig,
      refreshRules,
      refreshSysproxy,
      refreshProxyProviders,
      refreshRuleProviders,
      refreshAll,
    } as AppDataContextType;
  }, [
    proxiesData,
    clashConfig,
    rulesData,
    sysproxy,
    runningMode,
    uptimeData,
    proxyProviders,
    ruleProviders,
    verge,
    refreshProxy,
    refreshClashConfig,
    refreshRules,
    refreshSysproxy,
    refreshProxyProviders,
    refreshRuleProviders,
    refreshAll,
  ]);

  return <AppDataContext value={value}>{children}</AppDataContext>;
};
