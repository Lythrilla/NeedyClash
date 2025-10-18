import type { SWRConfiguration } from "swr";

/**
 * SWR全局配置常量
 */
export const SWR_CONFIG = {
  /** 默认去重时间间隔（毫秒） */
  DEDUPING_INTERVAL: 5000,
  /** 快速去重时间间隔（毫秒） */
  DEDUPING_INTERVAL_FAST: 2000,
  /** 默认错误重试次数 */
  ERROR_RETRY_COUNT: 3,
  /** 错误重试间隔（毫秒） */
  ERROR_RETRY_INTERVAL: 1000,
  /** 服务状态刷新间隔（毫秒） */
  SERVICE_REFRESH_INTERVAL: 30000,
  /** 代理数据刷新间隔（毫秒） - 适中频率，不影响性能 */
  PROXY_REFRESH_INTERVAL: 8000,
  /** 配置数据刷新间隔（毫秒） - 低频率，配置不常变 */
  CONFIG_REFRESH_INTERVAL: 60000,
  /** 系统代理刷新间隔（毫秒） - 低频率 */
  SYSPROXY_REFRESH_INTERVAL: 10000,
  /** Uptime 刷新间隔（毫秒） */
  UPTIME_REFRESH_INTERVAL: 5000,
} as const;

/**
 * 默认SWR配置
 */
export const defaultSWRConfig: SWRConfiguration = {
  suspense: false,
  revalidateOnFocus: false,
  revalidateOnReconnect: true,
  dedupingInterval: SWR_CONFIG.DEDUPING_INTERVAL,
  errorRetryCount: SWR_CONFIG.ERROR_RETRY_COUNT,
  errorRetryInterval: SWR_CONFIG.ERROR_RETRY_INTERVAL,
};

/**
 * 配置数据的SWR配置（需要更快的响应）
 */
export const profileSWRConfig: SWRConfiguration = {
  ...defaultSWRConfig,
  dedupingInterval: SWR_CONFIG.DEDUPING_INTERVAL_FAST,
  refreshInterval: 0,
};

/**
 * 系统状态的SWR配置
 */
export const systemStateSWRConfig: SWRConfiguration = {
  ...defaultSWRConfig,
  revalidateOnFocus: true,
};

/**
 * 系统代理状态的SWR配置
 */
export const systemProxySWRConfig: SWRConfiguration = {
  suspense: false,
  revalidateOnFocus: false,
  revalidateOnReconnect: false,
  dedupingInterval: SWR_CONFIG.DEDUPING_INTERVAL,
};

/**
 * 服务状态的SWR配置（定期刷新）
 */
export const serviceSWRConfig: SWRConfiguration = {
  ...defaultSWRConfig,
  refreshInterval: SWR_CONFIG.SERVICE_REFRESH_INTERVAL,
};

/**
 * 代理数据的SWR配置
 */
export const proxySWRConfig: SWRConfiguration = {
  ...defaultSWRConfig,
  refreshInterval: SWR_CONFIG.PROXY_REFRESH_INTERVAL,
  revalidateOnFocus: true,
  dedupingInterval: SWR_CONFIG.DEDUPING_INTERVAL_FAST,
};

/**
 * Clash 配置的SWR配置
 */
export const clashConfigSWRConfig: SWRConfiguration = {
  ...defaultSWRConfig,
  refreshInterval: SWR_CONFIG.CONFIG_REFRESH_INTERVAL,
  revalidateOnFocus: false,
};

/**
 * 提供者数据的SWR配置
 */
export const providerSWRConfig: SWRConfiguration = {
  ...defaultSWRConfig,
  revalidateOnFocus: false,
  revalidateOnReconnect: false,
  dedupingInterval: SWR_CONFIG.DEDUPING_INTERVAL,
};

/**
 * 规则数据的SWR配置
 */
export const ruleSWRConfig: SWRConfiguration = {
  ...defaultSWRConfig,
  revalidateOnFocus: false,
};

/**
 * Uptime 的SWR配置
 */
export const uptimeSWRConfig: SWRConfiguration = {
  suspense: false,
  revalidateOnFocus: false,
  refreshInterval: SWR_CONFIG.UPTIME_REFRESH_INTERVAL,
};

