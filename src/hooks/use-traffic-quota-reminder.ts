import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";

import { useProfiles } from "./use-profiles";
import { useVerge } from "./use-verge";
import { showNotice } from "@/services/noticeService";

const ONE_HOUR = 60 * 60 * 1000; // 1小时的毫秒数

export const useTrafficQuotaReminder = () => {
  const { t } = useTranslation();
  const { verge, patchVerge } = useVerge();
  const { current } = useProfiles();
  const lastCheckRef = useRef<number>(0);

  useEffect(() => {
    // 检查是否启用了流量提醒
    const reminderConfig = verge?.traffic_quota_reminder;
    if (!reminderConfig?.enabled) {
      return;
    }

    // 检查是否有当前配置和流量信息
    if (!current?.extra?.total || !current?.extra) {
      return;
    }

    const usedTraffic = current.extra.upload + current.extra.download;
    const totalTraffic = current.extra.total;
    const threshold = reminderConfig.threshold || 80; // 默认80%

    // 计算使用百分比
    const usagePercentage = (usedTraffic / totalTraffic) * 100;

    // 如果超过阈值，且距离上次提醒超过1小时
    const now = Date.now();
    const lastReminder = reminderConfig.last_reminder || 0;

    if (usagePercentage >= threshold) {
      // 防止频繁检查，只在每次渲染间隔超过5秒时检查
      if (now - lastCheckRef.current < 5000) {
        return;
      }
      lastCheckRef.current = now;

      // 如果距离上次提醒超过1小时，再次提醒
      if (now - lastReminder > ONE_HOUR) {
        const remainingPercentage = 100 - usagePercentage;

        showNotice(
          "error",
          t("Traffic Quota Warning", {
            usage: usagePercentage.toFixed(1),
            remaining: remainingPercentage.toFixed(1),
          }),
          8000
        );

        // 更新最后提醒时间
        patchVerge({
          traffic_quota_reminder: {
            ...reminderConfig,
            last_reminder: now,
          },
        });
      }
    }
  }, [current, verge, patchVerge, t]);
};

