import { useEffect } from "react";
import useSWR from "swr";

import {
  systemStateSWRConfig,
  serviceSWRConfig,
  SWR_CONFIG,
} from "@/config/swr-config";
import {
  getRunningMode,
  isAdmin,
  isServiceInstalled,
  isServiceAvailable,
} from "@/services/cmds";
import { getLogger } from "@/utils/logger";

const logger = getLogger("useSystemState");

export function useSystemState() {
  const {
    data: runningMode = "Sidecar",
    mutate: mutateRunningMode,
    isLoading: runningModeLoading,
  } = useSWR("getRunningMode", getRunningMode, systemStateSWRConfig);
  const isSidecarMode = runningMode === "Sidecar";
  const isServiceMode = runningMode === "Service";

  const { data: isAdminMode = false, isLoading: isAdminLoading } = useSWR(
    "isAdmin",
    isAdmin,
    systemStateSWRConfig,
  );

  const {
    data: isServiceOk = false,
    mutate: mutateServiceOk,
    isLoading: isServiceLoading,
  } = useSWR("isServiceInstalled", isServiceInstalled, {
    ...serviceSWRConfig,
    refreshInterval: SWR_CONFIG.SERVICE_REFRESH_INTERVAL,
    dedupingInterval: 1000,
  });

  const isLoading = runningModeLoading || isAdminLoading || isServiceLoading;

  const isTunModeAvailable = isAdminMode || isServiceOk;

  useEffect(() => {
    let mounted = true;
    let timeoutId: number | undefined;

    const initServiceState = () => {
      if (!mounted) return;

      mutateRunningMode().catch(err => {
        logger.error("运行模式初始化失败", err);
      });

      timeoutId = window.setTimeout(() => {
        if (mounted) {
          mutateServiceOk().catch(err => {
            logger.error("服务状态初始化失败", err);
          });
        }
      }, 50);
    };

    if (typeof requestIdleCallback !== 'undefined') {
      const idleId = requestIdleCallback(() => {
        initServiceState();
      }, { timeout: 200 });
      
      return () => {
        mounted = false;
        cancelIdleCallback(idleId);
        if (timeoutId) clearTimeout(timeoutId);
      };
    } else {
      timeoutId = window.setTimeout(() => {
        initServiceState();
      }, 50);
      
      return () => {
        mounted = false;
        if (timeoutId) clearTimeout(timeoutId);
      };
    }
  }, [mutateRunningMode, mutateServiceOk]);

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
