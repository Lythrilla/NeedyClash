import { t } from "i18next";
import { useCallback } from "react";

import { restartCore, stopCore, uninstallService } from "@/services/cmds";
import { showNotice } from "@/services/noticeService";

import { useSystemState } from "./use-system-state";

const executeWithErrorHandling = async (
  operation: () => Promise<void>,
  loadingMessage: string,
  successMessage?: string,
) => {
  try {
    showNotice("info", t(loadingMessage));
    await operation();
    if (successMessage) {
      showNotice("success", t(successMessage));
    }
  } catch (err) {
    const msg = (err as Error)?.message || String(err);
    showNotice("error", msg);
    throw err;
  }
};

export const useServiceUninstaller = () => {
  const { mutateRunningMode, mutateServiceOk, isAdminMode } = useSystemState();

  const uninstallServiceAndRestartCore = useCallback(async () => {
    // 如果不是管理员模式，提示需要管理员权限
    if (!isAdminMode) {
      showNotice("info", t("Service Uninstallation Requires Administrator"));
    }

    await executeWithErrorHandling(() => stopCore(), "Stopping Core...");

    await executeWithErrorHandling(
      () => uninstallService(),
      "Uninstalling Service...",
      "Service Uninstalled Successfully",
    );

    await executeWithErrorHandling(() => restartCore(), "Restarting Core...");
    
    // 等待服务状态更新
    await new Promise(resolve => setTimeout(resolve, 500));
    await mutateRunningMode();
    await mutateServiceOk();
  }, [mutateRunningMode, mutateServiceOk, isAdminMode]);

  return { uninstallServiceAndRestartCore };
};
