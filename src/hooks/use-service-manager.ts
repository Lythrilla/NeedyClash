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
  executeWithRetry,
  type ServiceOperationStep,
} from "./use-service-operations";
import { useSystemState } from "./use-system-state";
import { isServiceInstalled } from "@/services/cmds";

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
        // 检查管理员权限
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

        if (operationType === "isInstalling" || operationType === "isUninstalling" || operationType === "isReinstalling") {
          console.log(`[ServiceManager] ${operationType}: 开始验证服务状态变化`);

          await waitForStateStabilization(TIMING.SERVICE_STABILIZATION);

          const expectedServiceState =
            operationType === "isInstalling" || operationType === "isReinstalling";
          let finalState: boolean = false;

          try {
            finalState = await executeWithRetry(
              async () => {
                const currentState = await isServiceInstalled();
                console.log(`[ServiceManager] 服务状态检查: 期望=${expectedServiceState}, 实际=${currentState}`);

                if (currentState !== expectedServiceState) {
                  throw new Error(
                    `服务状态未更新: 期望${expectedServiceState}, 实际${currentState}`
                  );
                }
                return currentState;
              },
              5,
              1000,
            );
            console.log(`[ServiceManager] ${operationType}: 服务状态验证成功，最终状态=${finalState}`);
          } catch (err) {
            console.error(`[ServiceManager] ${operationType}: 服务状态验证失败`, err);
            try {
              finalState = await isServiceInstalled();
              console.warn(`[ServiceManager] 使用当前检查到的状态: ${finalState}`);
            } catch (e) {
              console.error("[ServiceManager] 无法获取服务状态", e);
            }
          }

          console.log(`[ServiceManager] [${operationType}] 准备更新 SWR 缓存: isServiceOk=${finalState}`);

          await mutateServiceOk(finalState, { revalidate: false });

          console.log(`[ServiceManager] [${operationType}] SWR 缓存已更新，新值=${finalState}`);

          try {
            const verifyState = await isServiceInstalled();
            if (verifyState !== finalState) {
              console.warn(`[ServiceManager] [${operationType}] 状态验证不一致: 更新值=${finalState}, 实际值=${verifyState}`);
            } else {
              console.log(`[ServiceManager] [${operationType}] 状态验证一致: ${verifyState}`);
            }
          } catch (e) {
            console.error(`[ServiceManager] [${operationType}] 状态验证失败`, e);
          }
        }

        try {
          await mutateRunningMode(undefined, { revalidate: true });
          logger.debug("运行模式状态更新成功");
        } catch (err) {
          logger.warn("运行模式状态更新失败", err);
        }

        await waitForStateStabilization(200);

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
        startMsg: t("Installing Service..."),
        successMsg: t("Service Installed Successfully"),
      },
      {
        fn: () => waitForStateStabilization(TIMING.SERVICE_STABILIZATION),
        name: "WaitForServiceStabilization",
      },
      {
        fn: () => restartCore(),
        name: "RestartCore",
        startMsg: t("Restarting Core..."),
        isOptional: true,
      },
    ];

    await executeServiceOperation(
      "isInstalling",
      steps,
      t("Service Installed Successfully"),
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
        startMsg: t("Reinstalling Service..."),
        successMsg: t("Service Reinstalled Successfully"),
      },
      {
        fn: () => waitForStateStabilization(TIMING.SERVICE_STABILIZATION),
        name: "WaitForServiceStabilization",
      },
      {
        fn: () => restartCore(),
        name: "RestartCore",
        startMsg: t("Restarting Core..."),
        isOptional: true,
      },
    ];

    await executeServiceOperation(
      "isReinstalling",
      steps,
      t("Service Reinstalled Successfully"),
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
        startMsg: t("Stopping Core..."),
        isOptional: true,
      },
      {
        fn: () => waitForStateStabilization(TIMING.CORE_STOP),
        name: "WaitForCoreStop",
      },
      {
        fn: () => uninstallService(),
        name: "UninstallService",
        startMsg: t("Uninstalling Service..."),
        successMsg: t("Service Uninstalled Successfully"),
      },
      {
        fn: () => waitForStateStabilization(TIMING.SERVICE_STABILIZATION),
        name: "WaitForServiceRemoval",
      },
      {
        fn: () => restartCore(),
        name: "RestartCore",
        startMsg: t("Restarting Core..."),
        isOptional: true,
      },
    ];

    await executeServiceOperation(
      "isUninstalling",
      steps,
      t("Service Uninstalled Successfully"),
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
