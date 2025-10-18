import useSWR, { mutate } from "swr";
import { selectNodeForGroup } from "tauri-plugin-mihomo-api";

import { profileSWRConfig } from "@/config/swr-config";
import {
  getProfiles,
  patchProfile,
  patchProfilesConfig,
} from "@/services/cmds";
import { calcuProxies } from "@/services/cmds";
import { getLogger } from "@/utils/logger";

const logger = getLogger("useProfiles");

export const useProfiles = () => {
  const {
    data: profiles,
    mutate: mutateProfiles,
    error,
    isValidating,
  } = useSWR("getProfiles", getProfiles, {
    ...profileSWRConfig,
    onError: (error) => {
      logger.error("SWR错误:", error);
    },
    onSuccess: (data) => {
      logger.info("配置数据更新成功，配置数量:", data?.items?.length || 0);
    },
  });

  const patchProfiles = async (
    value: Partial<IProfilesConfig>,
    signal?: AbortSignal,
  ) => {
    try {
      if (signal?.aborted) {
        throw new DOMException("Operation was aborted", "AbortError");
      }
      const success = await patchProfilesConfig(value);

      if (signal?.aborted) {
        throw new DOMException("Operation was aborted", "AbortError");
      }

      await mutateProfiles();

      return success;
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        throw error;
      }

      await mutateProfiles();
      throw error;
    }
  };

  const patchCurrent = async (value: Partial<IProfileItem>) => {
    if (profiles?.current) {
      try {
        await patchProfile(profiles.current, value);
        mutateProfiles();
      } catch (error) {
        logger.error("更新当前配置失败:", error);
        throw error;
      }
    }
  };

  // 根据selected的节点选择
  const activateSelected = async () => {
    try {
      logger.debug("开始处理代理选择");

      const [proxiesData, profileData] = await Promise.all([
        calcuProxies(),
        getProfiles(),
      ]);

      if (!profileData || !proxiesData) {
        logger.debug("代理或配置数据不可用，跳过处理");
        return;
      }

      const current = profileData.items?.find(
        (e) => e && e.uid === profileData.current,
      );

      if (!current) {
        logger.debug("未找到当前profile配置");
        return;
      }

      // 检查是否有saved的代理选择
      const { selected = [] } = current;
      if (selected.length === 0) {
        logger.debug("当前profile无保存的代理选择，跳过");
        return;
      }

      logger.info(`当前profile有 ${selected.length} 个代理选择配置`);

      // 使用类型守卫过滤有效的选择项
      const validSelected = selected.filter(
        (item): item is { name: string; now: string } =>
          item?.name != null && item?.now != null,
      );

      const selectedMap = Object.fromEntries(
        validSelected.map((each) => [each.name, each.now]),
      );

      let hasChange = false;
      const newSelected: typeof selected = [];
      const { global, groups } = proxiesData;

      // 处理所有代理组
      [global, ...groups].forEach(({ type, name, now }) => {
        if (!now || type !== "Selector") {
          if (selectedMap[name] != null) {
            newSelected.push({ name, now: now || selectedMap[name] });
          }
          return;
        }

        const targetProxy = selectedMap[name];
        if (targetProxy != null && targetProxy !== now) {
          logger.info(`需要切换代理组 ${name}: ${now} -> ${targetProxy}`);
          hasChange = true;
          selectNodeForGroup(name, targetProxy);
        }

        newSelected.push({ name, now: targetProxy || now });
      });

      if (!hasChange) {
        logger.debug("所有代理选择已经是目标状态，无需更新");
        return;
      }

      logger.info("完成代理切换，保存新的选择配置");

      // 类型守卫确保 current 存在
      if (!profileData.current) {
        logger.error("Profile ID 不存在，无法保存配置");
        return;
      }

      try {
        await patchProfile(profileData.current, { selected: newSelected });
        logger.info("代理选择配置保存成功");

        setTimeout(() => {
          mutate("getProxies", calcuProxies());
        }, 100);
      } catch (error: unknown) {
        const errorMsg =
          error instanceof Error ? error.message : String(error);
        logger.error("保存代理选择配置失败:", errorMsg);
      }
    } catch (error: unknown) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      logger.error("处理代理选择失败:", errorMsg);
    }
  };

  return {
    profiles,
    current: profiles?.items?.find((p) => p && p.uid === profiles.current),
    activateSelected,
    patchProfiles,
    patchCurrent,
    mutateProfiles,
    // 新增故障检测状态
    isLoading: isValidating,
    error,
    isStale: !profiles && !error && !isValidating, // 检测是否处于异常状态
  };
};
