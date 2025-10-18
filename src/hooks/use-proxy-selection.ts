import { useLockFn } from "ahooks";
import { useCallback, useMemo } from "react";
import {
  closeConnections,
  getConnections,
  selectNodeForGroup,
} from "tauri-plugin-mihomo-api";

import { useProfiles } from "@/hooks/use-profiles";
import { useVerge } from "@/hooks/use-verge";
import { syncTrayProxySelection } from "@/services/cmds";
import { getLogger } from "@/utils/logger";

const logger = getLogger("ProxySelection");

// 缓存连接清理
const cleanupConnections = async (previousProxy: string) => {
  try {
    const { connections } = await getConnections();
    const cleanupPromises = (connections ?? [])
      .filter((conn) => conn.chains.includes(previousProxy))
      .map((conn) => closeConnections(conn.id));

    if (cleanupPromises.length > 0) {
      await Promise.allSettled(cleanupPromises);
      logger.info(`清理了 ${cleanupPromises.length} 个连接`);
    }
  } catch (error) {
    logger.warn("连接清理失败:", error);
  }
};

interface ProxySelectionOptions {
  onSuccess?: () => void;
  onError?: (error: any) => void;
  enableConnectionCleanup?: boolean;
}

// 代理选择 Hook
export const useProxySelection = (options: ProxySelectionOptions = {}) => {
  const { current, patchCurrent } = useProfiles();
  const { verge } = useVerge();

  const { onSuccess, onError, enableConnectionCleanup = true } = options;

  // 缓存
  const config = useMemo(
    () => ({
      autoCloseConnection: verge?.auto_close_connection ?? false,
      enableConnectionCleanup,
    }),
    [verge?.auto_close_connection, enableConnectionCleanup],
  );

  // 切换节点
  const changeProxy = useLockFn(
    async (
      groupName: string,
      proxyName: string,
      previousProxy?: string,
      skipConfigSave: boolean = false,
    ) => {
      logger.info(`代理切换: ${groupName} -> ${proxyName}`);

      try {
        // 第一步：保存配置到本地
        if (current && !skipConfigSave) {
          if (!current.selected) current.selected = [];

          const index = current.selected.findIndex(
            (item) => item.name === groupName,
          );

          if (index < 0) {
            current.selected.push({ name: groupName, now: proxyName });
          } else {
            current.selected[index] = { name: groupName, now: proxyName };
          }
          await patchCurrent({ selected: current.selected });
        }

        // 第二步：应用到 Clash 核心
        await selectNodeForGroup(groupName, proxyName);
        
        // 第三步：同步到系统托盘
        await syncTrayProxySelection();
        
        logger.info(`代理和状态同步完成: ${groupName} -> ${proxyName}`);

        onSuccess?.();

        // 第四步：清理旧连接（异步，不阻塞）
        if (
          config.enableConnectionCleanup &&
          config.autoCloseConnection &&
          previousProxy
        ) {
          queueMicrotask(() => cleanupConnections(previousProxy));
        }
      } catch (error) {
        logger.error(`代理切换失败: ${groupName} -> ${proxyName}`, error);
        
        // 配置保存失败或核心应用失败，通知用户
        onError?.(error);
        
        // 不进行重试，因为参数没有变化，重试会得到相同结果
        throw error;
      }
    },
  );

  const handleSelectChange = useCallback(
    (
      groupName: string,
      previousProxy?: string,
      skipConfigSave: boolean = false,
    ) =>
      (event: { target: { value: string } }) => {
        const newProxy = event.target.value;
        changeProxy(groupName, newProxy, previousProxy, skipConfigSave);
      },
    [changeProxy],
  );

  const handleProxyGroupChange = useCallback(
    (group: { name: string; now?: string }, proxy: { name: string }) => {
      changeProxy(group.name, proxy.name, group.now);
    },
    [changeProxy],
  );

  return {
    changeProxy,
    handleSelectChange,
    handleProxyGroupChange,
  };
};
