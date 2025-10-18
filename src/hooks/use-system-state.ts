import { useEffect } from "react";
import useSWR from "swr";

import { getRunningMode, isAdmin, isServiceAvailable } from "@/services/cmds";

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
  } = useSWR("getRunningMode", getRunningMode, {
    suspense: false,
    revalidateOnFocus: true, // 允许重新验证运行模式
    revalidateOnReconnect: true, // 网络重连时重新验证
  });
  const isSidecarMode = runningMode === "Sidecar";
  const isServiceMode = runningMode === "Service";

  // 获取管理员状态
  const { data: isAdminMode = false, isLoading: isAdminLoading } = useSWR(
    "isAdmin",
    isAdmin,
    {
      suspense: false,
      revalidateOnFocus: false,
    },
  );

  const {
    data: isServiceOk = false,
    mutate: mutateServiceOk,
    isLoading: isServiceLoading,
  } = useSWR(isServiceMode ? "isServiceAvailable" : null, isServiceAvailable, {
    suspense: false,
    revalidateOnFocus: false, // 减少不必要的重新验证
    revalidateOnReconnect: true, // 网络重连时重新验证
    refreshInterval: isServiceMode ? 30000 : 0, // 从10秒增加到30秒，减少频繁检查
    dedupingInterval: 5000, // 从2秒增加到5秒，更强的去重
    onSuccess: (data) => {
      console.log("[useSystemState] 服务状态更新:", data);
    },
    onError: (error) => {
      console.error("[useSystemState] 服务状态检查失败:", error);
    },
  });

  const isLoading =
    runningModeLoading || isAdminLoading || (isServiceMode && isServiceLoading);

  const isTunModeAvailable = isAdminMode || isServiceOk;

  // 应用启动时强制刷新服务状态 - 优化启动性能
  useEffect(() => {
    const initServiceState = async () => {
      console.log("[useSystemState] 应用启动，强制刷新运行模式和服务状态");
      await mutateRunningMode();
      if (isServiceMode) {
        await mutateServiceOk();
      }
    };

    // 增加启动延迟到2秒，让UI先渲染，避免阻塞窗口响应
    const timer = setTimeout(() => {
      initServiceState();
    }, 2000);

    return () => clearTimeout(timer);
  }, []); // 只在组件挂载时执行一次

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
