import {
  DirectionsRounded,
  LanguageRounded,
  LinkRounded,
  MultipleStopRounded,
} from "@mui/icons-material";
import { Box, Chip, Typography, alpha } from "@mui/material";
import { useLockFn } from "ahooks";
import { useCallback, useEffect, useMemo, useReducer, useState } from "react";
import { useTranslation } from "react-i18next";
import useSWR from "swr";
import { closeAllConnections, getBaseConfig } from "tauri-plugin-mihomo-api";

import { BasePage } from "@/components/base";
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

  const modeList = useMemo(() => ["rule", "global", "direct"], []);

  const curMode = clashConfig?.mode?.toLowerCase();

  const onChangeMode = useLockFn(async (mode: string) => {
    // 断开连接
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

  useEffect(() => {
    if (curMode && !modeList.includes(curMode)) {
      onChangeMode("rule");
    }
  }, [curMode, modeList, onChangeMode]);

  const modeIcons = useMemo(
    () => ({
      rule: <MultipleStopRounded sx={{ fontSize: 16 }} />,
      global: <LanguageRounded sx={{ fontSize: 16 }} />,
      direct: <DirectionsRounded sx={{ fontSize: 16 }} />,
    }),
    [],
  );

  return (
    <BasePage
      full
      contentStyle={{ height: "101.5%" }}
      title={isChainMode ? t("Proxy Chain Mode") : t("Proxy Groups")}
      header={
        <Box display="flex" alignItems="center" gap={1.5}>
          <ProviderButton />

          {/* 代理模式选择 - 与首页风格统一 */}
          <Box
            sx={{
              display: "flex",
              gap: 1,
              alignItems: "center",
            }}
          >
            <Typography
              sx={{
                fontSize: 11,
                fontWeight: 600,
                color: "text.disabled",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
              }}
            >
              MODE
            </Typography>
            <Box sx={{ display: "flex", gap: 0.75 }}>
              {modeList.map((mode) => {
                const isActive = mode === curMode;
                return (
                  <Box
                    key={mode}
                    onClick={() => onChangeMode(mode)}
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 0.5,
                      px: 1.25,
                      py: 0.5,
                      cursor: "pointer",
                      borderRadius: 1.5,
                      border: "1px solid",
                      borderColor: isActive ? "primary.main" : "divider",
                      backgroundColor: isActive
                        ? (theme) => alpha(theme.palette.primary.main, 0.08)
                        : "transparent",
                      transition: "all 0.2s ease",
                      "&:hover": {
                        borderColor: "primary.main",
                        backgroundColor: isActive
                          ? (theme) => alpha(theme.palette.primary.main, 0.12)
                          : (theme) => alpha(theme.palette.primary.main, 0.04),
                      },
                    }}
                  >
                    <Box
                      sx={{
                        color: isActive ? "primary.main" : "text.secondary",
                        display: "flex",
                        alignItems: "center",
                      }}
                    >
                      {modeIcons[mode as keyof typeof modeIcons]}
                    </Box>
                    <Typography
                      sx={{
                        fontSize: 12,
                        fontWeight: isActive ? 600 : 500,
                        color: isActive ? "primary.main" : "text.secondary",
                        textTransform: "capitalize",
                      }}
                    >
                      {t(mode)}
                    </Typography>
                  </Box>
                );
              })}
            </Box>
          </Box>

          {/* 链式代理按钮 */}
          <Chip
            icon={<LinkRounded sx={{ fontSize: "1rem !important" }} />}
            label={t("Chain Proxy")}
            onClick={onToggleChainMode}
            color={isChainMode ? "primary" : "default"}
            variant={isChainMode ? "filled" : "outlined"}
            sx={{
              height: 28,
              fontSize: 12,
              fontWeight: 500,
              cursor: "pointer",
              "&:hover": {
                backgroundColor: isChainMode
                  ? (theme) => alpha(theme.palette.primary.main, 0.12)
                  : (theme) => alpha(theme.palette.action.hover, 0.5),
              },
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
