import { t } from "i18next";

import { showNotice } from "@/services/noticeService";
import { getLogger } from "@/utils/logger";

const logger = getLogger("ServiceOperations");

/**
 * 服务操作结果接口
 */
export interface ServiceOperationResult {
  success: boolean;
  error?: string;
}

/**
 * 服务操作步骤接口
 */
export interface ServiceOperationStep {
  fn: () => Promise<void> | Promise<any>;
  name: string;
  startMsg?: string;
  successMsg?: string;
  isOptional?: boolean;
}

/**
 * 等待状态稳定
 * @param ms 等待时间（毫秒）
 */
export const waitForStateStabilization = (ms: number): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

/**
 * 执行服务操作序列
 * 按顺序执行多个操作步骤，支持可选步骤和错误处理
 *
 * @param steps 操作步骤数组
 * @returns 操作结果
 */
export const executeServiceSequence = async (
  steps: ServiceOperationStep[],
): Promise<ServiceOperationResult> => {
  for (const step of steps) {
    try {
      // 显示开始消息
      if (step.startMsg) {
        showNotice("info", t(step.startMsg));
      }

      logger.debug(`执行步骤: ${step.name}`);

      // 执行操作
      await step.fn();

      // 显示成功消息
      if (step.successMsg) {
        showNotice("success", t(step.successMsg));
      }

      logger.debug(`步骤成功: ${step.name}`);
    } catch (err) {
      const errorMsg = (err as Error)?.message || String(err);
      logger.error(`步骤失败: ${step.name}`, errorMsg);

      // 如果是可选步骤，记录错误但继续执行
      if (step.isOptional) {
        logger.warn(`可选步骤失败，继续执行: ${step.name}`);
        continue;
      }

      // 如果是必需步骤，返回错误
      return {
        success: false,
        error: errorMsg,
      };
    }
  }

  return { success: true };
};

/**
 * 使用重试机制执行操作
 * @param fn 要执行的函数
 * @param maxRetries 最大重试次数
 * @param retryDelay 重试延迟（毫秒）
 * @returns 操作结果
 */
export const executeWithRetry = async <T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  retryDelay: number = 1000,
): Promise<T> => {
  let lastError: Error | undefined;

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err as Error;
      logger.warn(`操作失败，重试 ${i + 1}/${maxRetries}:`, lastError.message);

      if (i < maxRetries - 1) {
        await waitForStateStabilization(retryDelay);
      }
    }
  }

  throw lastError || new Error("Operation failed after retries");
};
