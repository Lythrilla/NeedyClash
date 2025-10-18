import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import useSWR from "swr";

import { useSystemState } from "@/hooks/use-system-state";
import { getVergeConfig, patchVergeConfig } from "@/services/cmds";
import { showNotice } from "@/services/noticeService";
import { getLogger } from "@/utils/logger";

const logger = getLogger("useVerge");

export const useVerge = () => {
  const { t } = useTranslation();
  const { isTunModeAvailable, isLoading } = useSystemState();

  const isProcessingRef = useRef(false);
  const hasNotifiedRef = useRef(false);
  const initTimeRef = useRef(Date.now());

  const { data: verge, mutate: mutateVerge } = useSWR(
    "getVergeConfig",
    async () => {
      const config = await getVergeConfig();
      return config;
    },
  );

  const patchVerge = async (value: Partial<IVergeConfig>) => {
    await patchVergeConfig(value);
    mutateVerge();
  };

  const { enable_tun_mode } = verge ?? {};

  useEffect(() => {
    const timeSinceInit = Date.now() - initTimeRef.current;
    // 应用启动5秒内不处理，避免初始化时误判
    if (timeSinceInit < 5000) {
      return;
    }

    // 避免重复处理
    if (isProcessingRef.current || hasNotifiedRef.current) {
      return;
    }

    // TUN模式启用但不可用时自动关闭
    if (enable_tun_mode && !isTunModeAvailable && !isLoading) {
      logger.info("检测到服务不可用，自动关闭TUN模式");

      isProcessingRef.current = true;

      patchVergeConfig({ enable_tun_mode: false })
        .then(() => {
          mutateVerge();
          if (!hasNotifiedRef.current) {
            showNotice(
              "info",
              t("TUN Mode automatically disabled due to service unavailable"),
            );
            hasNotifiedRef.current = true;
          }
        })
        .catch((err) => {
          logger.error("自动关闭TUN模式失败:", err);
          if (!hasNotifiedRef.current) {
            showNotice("error", t("Failed to disable TUN Mode automatically"));
            hasNotifiedRef.current = true;
          }
        })
        .finally(() => {
          isProcessingRef.current = false;
        });
    }
  }, [isTunModeAvailable, isLoading, enable_tun_mode, t, mutateVerge]);

  return {
    verge,
    mutateVerge,
    patchVerge,
  };
};
