import { t } from "i18next";
import { useCallback, useState } from "react";

import {
  installService,
  reinstallService,
  uninstallService,
  stopCore,
  restartCore,
} from "@/services/cmds";
import { showNotice } from "@/services/noticeService";

import {
  executeServiceSequence,
  waitForStateStabilization,
  type ServiceOperationStep,
} from "./use-service-operations";
import { useSystemState } from "./use-system-state";

interface ServiceManagerState {
  isInstalling: boolean;
  isReinstalling: boolean;
  isUninstalling: boolean;
}

/**
 * 统一的服务管理 Hook
 * 整合了服务安装、重装、卸载的所有逻辑，减少代码重复
 */
export const useServiceManager = () => {
  const { mutateRunningMode, mutateServiceOk, isAdminMode } = useSystemState();

  const [state, setState] = useState<ServiceManagerState>({
    isInstalling: false,
    isReinstalling: false,
    isUninstalling: false,
  });

  /**
   * 通用服务操作执行器
   */
  const executeServiceOperation = useCallback(
    async (
      operationType: keyof ServiceManagerState,
      steps: ServiceOperationStep[],
      completionMsg: string,
    ) => {
      // 检查是否有操作正在进行
      if (Object.values(state).some(Boolean)) {
        console.warn(
          `[useServiceManager] 操作正在进行中，忽略新的 ${operationType} 请求`,
        );
        return;
      }

      setState((prev) => ({ ...prev, [operationType]: true }));

      try {
        // 检查管理员权限（仅提示）
        if (!isAdminMode) {
          const msgKey =
            operationType === "isUninstalling"
              ? "Service Uninstallation Requires Administrator"
              : "Service Installation Requires Administrator";
          showNotice("info", t(msgKey));
        }

        // 执行服务操作序列
        const result = await executeServiceSequence(steps);

        if (!result.success) {
          throw new Error(result.error || `${operationType} failed`);
        }

        // 更新运行模式和服务状态
        await Promise.all([mutateRunningMode(), mutateServiceOk()]);

        showNotice("success", t(completionMsg));
      } catch (err) {
        const msg = (err as Error)?.message || String(err);
        showNotice("error", msg);
        throw err;
      } finally {
        setState((prev) => ({ ...prev, [operationType]: false }));
      }
    },
    [state, mutateRunningMode, mutateServiceOk, isAdminMode],
  );

  /**
   * 安装服务并重启核心
   */
  const installServiceAndRestartCore = useCallback(async () => {
    const steps: ServiceOperationStep[] = [
      {
        fn: () => installService(),
        name: "InstallService",
        startMsg: "Installing Service...",
        successMsg: "Service Installed Successfully",
      },
      {
        fn: () => waitForStateStabilization(800),
        name: "WaitForServiceStabilization",
      },
      {
        fn: () => restartCore(),
        name: "RestartCore",
        startMsg: "Restarting Core...",
        isOptional: true,
      },
    ];

    await executeServiceOperation(
      "isInstalling",
      steps,
      "Service installation completed",
    );
  }, [executeServiceOperation]);

  /**
   * 重装服务并重启核心
   */
  const reinstallServiceAndRestartCore = useCallback(async () => {
    const steps: ServiceOperationStep[] = [
      {
        fn: () => reinstallService(),
        name: "ReinstallService",
        startMsg: "Reinstalling Service...",
        successMsg: "Service Reinstalled Successfully",
      },
      {
        fn: () => waitForStateStabilization(800),
        name: "WaitForServiceStabilization",
      },
      {
        fn: () => restartCore(),
        name: "RestartCore",
        startMsg: "Restarting Core...",
        isOptional: true,
      },
    ];

    await executeServiceOperation(
      "isReinstalling",
      steps,
      "Service reinstallation completed",
    );
  }, [executeServiceOperation]);

  /**
   * 卸载服务并重启核心
   */
  const uninstallServiceAndRestartCore = useCallback(async () => {
    const steps: ServiceOperationStep[] = [
      {
        fn: () => stopCore(),
        name: "StopCore",
        startMsg: "Stopping Core...",
        isOptional: true,
      },
      {
        fn: () => waitForStateStabilization(400),
        name: "WaitForCoreStop",
      },
      {
        fn: () => uninstallService(),
        name: "UninstallService",
        startMsg: "Uninstalling Service...",
        successMsg: "Service Uninstalled Successfully",
      },
      {
        fn: () => waitForStateStabilization(800),
        name: "WaitForServiceRemoval",
      },
      {
        fn: () => restartCore(),
        name: "RestartCore",
        startMsg: "Restarting Core...",
        isOptional: true,
      },
    ];

    await executeServiceOperation(
      "isUninstalling",
      steps,
      "Service uninstallation completed",
    );
  }, [executeServiceOperation]);

  return {
    // 操作函数
    installServiceAndRestartCore,
    reinstallServiceAndRestartCore,
    uninstallServiceAndRestartCore,
    // 状态
    ...state,
    // 计算属性：是否有任何操作正在进行
    isOperating: Object.values(state).some(Boolean),
  };
};
