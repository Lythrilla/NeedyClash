import {
  DirectionsRounded,
  LanguageRounded,
  LinkRounded,
  MultipleStopRounded,
} from "@mui/icons-material";
import { Box } from "@mui/material";
import { useLockFn } from "ahooks";
import { useCallback, useEffect, useMemo, useReducer, useState } from "react";
import { useTranslation } from "react-i18next";
import useSWR from "swr";
import { closeAllConnections, getBaseConfig } from "tauri-plugin-mihomo-api";

import { BasePage, BaseModeSelector } from "@/components/base";
import { ProviderButton } from "@/components/proxy/provider-button";
import { ProxyGroups } from "@/components/proxy/proxy-groups";
import { useVerge } from "@/hooks/use-verge";
import {
  getRuntimeProxyChainConfig,
  patchClashMode,
  updateProxyChainConfigInRuntime,
} from "@/services/cmds";

const ProxyPage = () => {
  const { t } = useTranslation();

  // 从 localStorage 恢复链式代理按钮状态
  const [isChainMode, setIsChainMode] = useState(() => {
    try {
      const saved = localStorage.getItem("proxy-chain-mode-enabled");
      return saved === "true";
    } catch {
      return false;
    }
  });

  const [chainConfigData, dispatchChainConfigData] = useReducer(
    (_: string | null, action: string | null) => action,
    null as string | null,
  );

  const updateChainConfigData = useCallback((value: string | null) => {
    dispatchChainConfigData(value);
  }, []);

  const { data: clashConfig, mutate: mutateClash } = useSWR(
    "getClashConfig",
    getBaseConfig,
    {
      revalidateOnFocus: false,
      revalidateIfStale: true,
      dedupingInterval: 1000,
      errorRetryInterval: 5000,
    },
  );

  const { verge } = useVerge();

  const curMode = clashConfig?.mode?.toLowerCase() || "rule";

  // 模式选项配置
  const modeOptions = useMemo(
    () => [
      {
        value: "rule",
        label: t("rule"),
        icon: <MultipleStopRounded sx={{ fontSize: 16 }} />,
        description: t("Rule Mode Description"),
      },
      {
        value: "global",
        label: t("global"),
        icon: <LanguageRounded sx={{ fontSize: 16 }} />,
        description: t("Global Mode Description"),
      },
      {
        value: "direct",
        label: t("direct"),
        icon: <DirectionsRounded sx={{ fontSize: 16 }} />,
        description: t("Direct Mode Description"),
      },
    ],
    [t],
  );

  const onChangeMode = useLockFn(async (mode: string) => {
    if (mode !== curMode && verge?.auto_close_connection) {
      closeAllConnections();
    }
    await patchClashMode(mode);
    mutateClash();
  });

  const onToggleChainMode = useLockFn(async () => {
    const newChainMode = !isChainMode;

    if (!newChainMode) {
      // 退出链式代理模式时，清除链式代理配置
      try {
        console.log("Exiting chain mode, clearing chain configuration");
        await updateProxyChainConfigInRuntime(null);
        console.log("Chain configuration cleared successfully");
      } catch (error) {
        console.error("Failed to clear chain configuration:", error);
      }
    }

    setIsChainMode(newChainMode);

    // 保存链式代理按钮状态到 localStorage
    localStorage.setItem("proxy-chain-mode-enabled", newChainMode.toString());
  });

  // 当开启链式代理模式时，获取配置数据
  useEffect(() => {
    if (!isChainMode) {
      updateChainConfigData(null);
      return;
    }

    let cancelled = false;

    const fetchChainConfig = async () => {
      try {
        const exitNode = localStorage.getItem("proxy-chain-exit-node");

        if (!exitNode) {
          console.error("No proxy chain exit node found in localStorage");
          if (!cancelled) {
            updateChainConfigData("");
          }
          return;
        }

        const configData = await getRuntimeProxyChainConfig(exitNode);
        if (!cancelled) {
          updateChainConfigData(configData || "");
        }
      } catch (error) {
        console.error("Failed to get runtime proxy chain config:", error);
        if (!cancelled) {
          updateChainConfigData("");
        }
      }
    };

    fetchChainConfig();

    return () => {
      cancelled = true;
    };
  }, [isChainMode, updateChainConfigData]);

  return (
    <BasePage
      full
      contentStyle={{ height: "101.5%" }}
      title={isChainMode ? t("Proxy Chain Mode") : t("Proxy Groups")}
      header={
        <Box display="flex" alignItems="center" gap={1.5}>
          <ProviderButton />

          {/* 使用统一的模式选择器 */}
          <BaseModeSelector
            value={curMode}
            options={modeOptions}
            onChange={onChangeMode}
            label="MODE"
          />

          {/* 链式代理按钮 */}
          <BaseModeSelector
            value={isChainMode ? "chain" : "normal"}
            options={[
              {
                value: "chain",
                label: t("Chain Proxy"),
                icon: <LinkRounded sx={{ fontSize: 16 }} />,
                description: t("Enable chain proxy mode"),
              },
              {
                value: "normal",
                label: t("Normal"),
                icon: <LinkRounded sx={{ fontSize: 16 }} />,
                description: t("Normal proxy mode"),
              },
            ]}
            onChange={(value) => {
              if ((value === "chain") !== isChainMode) {
                onToggleChainMode();
              }
            }}
          />
        </Box>
      }
    >
      <ProxyGroups
        mode={curMode!}
        isChainMode={isChainMode}
        chainConfigData={chainConfigData}
      />
    </BasePage>
  );
};

export default ProxyPage;
