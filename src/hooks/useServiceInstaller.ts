import { t } from "i18next";
import { useCallback } from "react";

import { installService, reinstallService, restartCore } from "@/services/cmds";
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

export const useServiceInstaller = () => {
  const { mutateRunningMode, mutateServiceOk, isAdminMode } = useSystemState();

  const installServiceAndRestartCore = useCallback(async () => {
    // 如果不是管理员模式，提示需要管理员权限
    if (!isAdminMode) {
      showNotice("info", t("Service Installation Requires Administrator"));
    }

    await executeWithErrorHandling(
      () => installService(),
      "Installing Service...",
      "Service Installed Successfully",
    );

    await executeWithErrorHandling(() => restartCore(), "Restarting Core...");
    await mutateRunningMode();
    await mutateServiceOk();
  }, [mutateRunningMode, mutateServiceOk, isAdminMode]);

  const reinstallServiceAndRestartCore = useCallback(async () => {
    // 如果不是管理员模式，提示需要管理员权限
    if (!isAdminMode) {
      showNotice("info", t("Service Installation Requires Administrator"));
    }

    await executeWithErrorHandling(
      () => reinstallService(),
      "Reinstalling Service...",
      "Service Reinstalled Successfully",
    );

    await executeWithErrorHandling(() => restartCore(), "Restarting Core...");
    await mutateRunningMode();
    await mutateServiceOk();
  }, [mutateRunningMode, mutateServiceOk, isAdminMode]);

  return { installServiceAndRestartCore, reinstallServiceAndRestartCore };
};
