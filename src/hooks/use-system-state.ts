import { useEffect } from "react";
import useSWR from "swr";

import {
  systemStateSWRConfig,
  serviceSWRConfig,
  SWR_CONFIG,
} from "@/config/swr-config";
import { getRunningMode, isAdmin, isServiceAvailable } from "@/services/cmds";
import { getLogger } from "@/utils/logger";

const logger = getLogger("useSystemState");

/**
 * 自定义 hook 用于获取系统运行状态
 * 包括运行模式、管理员状态、系统服务是否可用
 */
export function useSystemState() {
  // 获取运行模式
  const {
    data: runningMode = "Sidecar",
    mutate: mutateRunningMode,
    isLoading: runningModeLoading,
  } = useSWR("getRunningMode", getRunningMode, systemStateSWRConfig);
  const isSidecarMode = runningMode === "Sidecar";
  const isServiceMode = runningMode === "Service";

  // 获取管理员状态
  const { data: isAdminMode = false, isLoading: isAdminLoading } = useSWR(
    "isAdmin",
    isAdmin,
    systemStateSWRConfig,
  );

  const {
    data: isServiceOk = false,
    mutate: mutateServiceOk,
    isLoading: isServiceLoading,
  } = useSWR(isServiceMode ? "isServiceAvailable" : null, isServiceAvailable, {
    ...serviceSWRConfig,
    refreshInterval: isServiceMode ? SWR_CONFIG.SERVICE_REFRESH_INTERVAL : 0,
    onSuccess: (data) => {
      logger.debug("服务状态更新:", data);
    },
    onError: (error) => {
      logger.error("服务状态检查失败:", error);
    },
  });

  const isLoading =
    runningModeLoading || isAdminLoading || (isServiceMode && isServiceLoading);

  const isTunModeAvailable = isAdminMode || isServiceOk;

  // 组件挂载时立即初始化状态，而不是延迟 2 秒
  useEffect(() => {
    let mounted = true;

    const initServiceState = async () => {
      if (!mounted) return;

      logger.debug("应用启动，初始化状态");
      await mutateRunningMode();

      if (mounted && isServiceMode) {
        await mutateServiceOk();
      }
    };

    // 使用 requestIdleCallback 或短暂延迟，避免阻塞初始渲染
    const idleCallback = requestIdleCallback
      ? requestIdleCallback(() => initServiceState())
      : setTimeout(() => initServiceState(), 100);

    return () => {
      mounted = false;
      if (typeof idleCallback === "number") {
        clearTimeout(idleCallback);
      } else {
        cancelIdleCallback(idleCallback);
      }
    };
  }, [isServiceMode, mutateRunningMode, mutateServiceOk]);

  return {
    runningMode,
    isAdminMode,
    isSidecarMode,
    isServiceMode,
    isServiceOk,
    isTunModeAvailable: isTunModeAvailable,
    mutateRunningMode,
    mutateServiceOk,
    isLoading,
  };
}
