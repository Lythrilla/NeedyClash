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
    revalidateOnFocus: false,
    revalidateOnReconnect: true,
    refreshInterval: isServiceMode ? 30000 : 0,
    dedupingInterval: 5000,
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

  // 组件挂载时立即初始化状态，而不是延迟 2 秒
  useEffect(() => {
    let mounted = true;

    const initServiceState = async () => {
      if (!mounted) return;

      console.log("[useSystemState] 应用启动，初始化状态");
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
  }, []);

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
