import { invoke } from "@tauri-apps/api/core";
import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";

import { useSystemState } from "@/hooks/use-system-state";
import { useVerge } from "@/hooks/use-verge";
import { showNotice } from "@/services/noticeService";

/**
 * TUN 状态监控组件
 * 负责监控 TUN 模式状态并在必要时自动同步
 */
export const TunStatusMonitor = () => {
  const { t } = useTranslation();
  const { verge } = useVerge();
  const { isTunModeAvailable } = useSystemState();

  const lastSyncTimeRef = useRef<number>(0);
  const isSyncingRef = useRef<boolean>(false);

  const enableTunMode = verge?.enable_tun_mode ?? false;

  useEffect(() => {
    // 仅在应用启动后 3 秒开始监控
    const startupDelay = setTimeout(() => {
      // 检查是否需要同步
      const now = Date.now();
      const timeSinceLastSync = now - lastSyncTimeRef.current;

      // 至少间隔 10 秒才进行下一次同步
      if (timeSinceLastSync < 10000) {
        return;
      }

      // 避免重复同步
      if (isSyncingRef.current) {
        return;
      }

      // 如果 TUN 模式启用但服务不可用，同步状态
      if (enableTunMode && !isTunModeAvailable) {
        console.log("[TunStatusMonitor] 检测到 TUN 状态不一致，准备同步");
        syncTunStatus();
      }
    }, 3000);

    return () => clearTimeout(startupDelay);
  }, [enableTunMode, isTunModeAvailable]);

  const syncTunStatus = async () => {
    if (isSyncingRef.current) {
      return;
    }

    isSyncingRef.current = true;
    lastSyncTimeRef.current = Date.now();

    try {
      console.log("[TunStatusMonitor] 正在同步 TUN 状态...");
      await invoke("sync_tun_status");
      console.log("[TunStatusMonitor] TUN 状态同步成功");
    } catch (err) {
      console.error("[TunStatusMonitor] TUN 状态同步失败:", err);

      // 仅在关键错误时显示通知
      if (
        (err as Error)?.message?.includes("Service") ||
        (err as Error)?.message?.includes("Administrator")
      ) {
        showNotice(
          "info",
          t("TUN mode requires Service Mode or Administrator privileges"),
        );
      }
    } finally {
      isSyncingRef.current = false;
    }
  };

  // 不渲染任何 UI
  return null;
};
