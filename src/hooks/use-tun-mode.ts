import { invoke } from "@tauri-apps/api/core";
import { t } from "i18next";
import { useCallback, useState } from "react";

import { showNotice } from "@/services/noticeService";

import { useSystemState } from "./use-system-state";
import { useVerge } from "./use-verge";

interface TunModeOperationResult {
  success: boolean;
  error?: string;
}

/**
 * TUN 模式管理 Hook
 * 提供检查、启用、禁用 TUN 模式的功能
 */
export const useTunMode = () => {
  const { verge, mutateVerge, patchVerge } = useVerge();
  const { isTunModeAvailable, isServiceMode, isAdminMode } = useSystemState();
  const [isToggling, setIsToggling] = useState(false);

  const enableTunMode = verge?.enable_tun_mode ?? false;

  /**
   * 检查是否可以启用 TUN 模式
   */
  const checkTunAvailable = useCallback(async (): Promise<boolean> => {
    try {
      const available = await invoke<boolean>("check_tun_available");
      return available;
    } catch (err) {
      console.error("[useTunMode] 检查 TUN 可用性失败:", err);
      return false;
    }
  }, []);

  /**
   * 获取 TUN 状态
   */
  const getTunStatus = useCallback(async (): Promise<string> => {
    try {
      const status = await invoke<string>("get_tun_status");
      return status;
    } catch (err) {
      console.error("[useTunMode] 获取 TUN 状态失败:", err);
      return "Unknown";
    }
  }, []);

  /**
   * 切换 TUN 模式
   */
  const toggleTunMode = useCallback(
    async (value: boolean): Promise<TunModeOperationResult> => {
      if (isToggling) {
        console.warn("[useTunMode] TUN 模式切换操作正在进行中");
        return { success: false, error: "Operation in progress" };
      }

      setIsToggling(true);

      try {
        // 预检查：确认是否可以启用 TUN 模式
        if (value && !isTunModeAvailable) {
          const errorMsg = isServiceMode
            ? t("TUN mode requires Service Mode or Admin Mode")
            : t(
                "Please install service or run as administrator to enable TUN mode",
              );

          showNotice("error", errorMsg);
          return { success: false, error: errorMsg };
        }

        // 检查 TUN 是否可用
        if (value) {
          const available = await checkTunAvailable();
          if (!available) {
            const errorMsg = t("TUN mode is not available on this system");
            showNotice("error", errorMsg);
            return { success: false, error: errorMsg };
          }
        }

        // 乐观更新 UI
        mutateVerge({ ...verge, enable_tun_mode: value }, false);

        // 发送请求到后端（后端的 patch_verge 会自动调用 sync_tun_status）
        await patchVerge({ enable_tun_mode: value });

        // 确认状态更新
        await mutateVerge();

        const successMsg = value
          ? t("TUN mode enabled successfully")
          : t("TUN mode disabled successfully");

        showNotice("success", successMsg);

        return { success: true };
      } catch (err) {
        const errorMsg = (err as Error)?.message || String(err);
        console.error("[useTunMode] TUN 模式切换失败:", errorMsg);

        // 恢复原始状态
        mutateVerge({ ...verge, enable_tun_mode: !value }, false);
        await mutateVerge();

        showNotice("error", errorMsg);
        return { success: false, error: errorMsg };
      } finally {
        setIsToggling(false);
      }
    },
    [
      isToggling,
      isTunModeAvailable,
      isServiceMode,
      verge,
      mutateVerge,
      patchVerge,
      checkTunAvailable,
    ],
  );

  /**
   * 重新应用 TUN 配置
   */
  const reapplyTunConfig =
    useCallback(async (): Promise<TunModeOperationResult> => {
      try {
        showNotice("info", t("Reapplying TUN configuration..."));

        await invoke("reapply_tun_config");

        showNotice("success", t("TUN configuration reapplied successfully"));
        return { success: true };
      } catch (err) {
        const errorMsg = (err as Error)?.message || String(err);
        console.error("[useTunMode] 重新应用 TUN 配置失败:", errorMsg);

        showNotice("error", errorMsg);
        return { success: false, error: errorMsg };
      }
    }, []);

  return {
    enableTunMode,
    isTunModeAvailable,
    isToggling,
    toggleTunMode,
    checkTunAvailable,
    getTunStatus,
    reapplyTunConfig,
  };
};
