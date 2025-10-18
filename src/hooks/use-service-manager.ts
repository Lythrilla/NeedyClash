import { t } from "i18next";
import { useCallback, useRef, useState } from "react";

import {
  installService,
  reinstallService,
  uninstallService,
  stopCore,
  restartCore,
} from "@/services/cmds";
import { showNotice } from "@/services/noticeService";
import { getLogger } from "@/utils/logger";

const logger = getLogger("useServiceManager");

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

// 延迟时间常量
const TIMING = {
  SERVICE_STABILIZATION: 800, // 服务稳定等待时间
  CORE_STOP: 400, // 核心停止等待时间
  STATE_UPDATE: 500, // 状态更新等待时间
} as const;

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

  // 使用 ref 来追踪操作状态，避免依赖项问题
  const operatingRef = useRef(false);

  /**
   * 通用服务操作执行器
   */
  const executeServiceOperation = useCallback(
    async (
      operationType: keyof ServiceManagerState,
      steps: ServiceOperationStep[],
      completionMsg: string,
    ) => {
      // 检查是否有操作正在进行（使用 ref 避免依赖 state）
      if (operatingRef.current) {
        logger.warn(`操作正在进行中，忽略新的 ${operationType} 请求`);
        return;
      }

      operatingRef.current = true;
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

        // 等待状态稳定后更新
        await waitForStateStabilization(TIMING.STATE_UPDATE);
        await Promise.all([mutateRunningMode(), mutateServiceOk()]);

        showNotice("success", t(completionMsg));
      } catch (err) {
        const msg = (err as Error)?.message || String(err);
        showNotice("error", msg);
        throw err;
      } finally {
        operatingRef.current = false;
        setState((prev) => ({ ...prev, [operationType]: false }));
      }
    },
    [mutateRunningMode, mutateServiceOk, isAdminMode],
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
        fn: () => waitForStateStabilization(TIMING.SERVICE_STABILIZATION),
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
        fn: () => waitForStateStabilization(TIMING.SERVICE_STABILIZATION),
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
        fn: () => waitForStateStabilization(TIMING.CORE_STOP),
        name: "WaitForCoreStop",
      },
      {
        fn: () => uninstallService(),
        name: "UninstallService",
        startMsg: "Uninstalling Service...",
        successMsg: "Service Uninstalled Successfully",
      },
      {
        fn: () => waitForStateStabilization(TIMING.SERVICE_STABILIZATION),
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
