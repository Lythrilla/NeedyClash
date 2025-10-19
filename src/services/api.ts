import { fetch } from "@tauri-apps/plugin-http";
import axios, { AxiosInstance } from "axios";

import { getLogger } from "@/utils/logger";

import { getClashInfo } from "./cmds";

const logger = getLogger("API");

let instancePromise: Promise<AxiosInstance> = null!;

async function getInstancePromise() {
  let server = "";
  let secret = "";

  try {
    const info = await getClashInfo();

    if (info?.server) {
      server = info.server;

      // compatible width `external-controller`
      if (server.startsWith(":")) server = `127.0.0.1${server}`;
      else if (/^\d+$/.test(server)) server = `127.0.0.1:${server}`;
    }
    if (info?.secret) secret = info?.secret;
  } catch {}

  const axiosIns = axios.create({
    baseURL: `http://${server}`,
    headers: secret ? { Authorization: `Bearer ${secret}` } : {},
    timeout: 15000,
  });
  axiosIns.interceptors.response.use((r) => r.data);
  return axiosIns;
}

/// initialize some information
/// enable force update axiosIns
export const getAxios = async (force: boolean = false) => {
  if (!instancePromise || force) {
    instancePromise = getInstancePromise();
  }
  return instancePromise;
};

// Get current IP and geolocation information （refactored IP detection with service-specific mappings）
interface IpInfo {
  ip: string;
  country_code: string;
  country: string;
  region: string;
  city: string;
  organization: string;
  asn: number;
  asn_organization: string;
  longitude: number;
  latitude: number;
  timezone: string;
}

// IP检测服务响应数据结构 - 使用灵活的类型定义以支持不同API

type ServiceResponse = Record<string, any>;

// IP检测服务配置
interface ServiceConfig {
  url: string;
  mapping: (data: ServiceResponse) => IpInfo;
  timeout?: number;
}

// 可用的IP检测服务列表及字段映射
const IP_CHECK_SERVICES: ServiceConfig[] = [
  {
    url: "https://api.ip.sb/geoip",
    mapping: (data) => ({
      ip: data.ip || "",
      country_code: data.country_code || "",
      country: data.country || "",
      region: data.region || "",
      city: data.city || "",
      organization: data.organization || data.isp || "",
      asn: data.asn || 0,
      asn_organization: data.asn_organization || "",
      longitude: data.longitude || 0,
      latitude: data.latitude || 0,
      timezone: data.timezone || "",
    }),
  },
  {
    url: "https://ipapi.co/json",
    mapping: (data) => ({
      ip: data.ip || "",
      country_code: data.country_code || "",
      country: data.country_name || "",
      region: data.region || "",
      city: data.city || "",
      organization: data.org || "",
      asn: data.asn ? parseInt(data.asn.replace("AS", "")) : 0,
      asn_organization: data.org || "",
      longitude: data.longitude || 0,
      latitude: data.latitude || 0,
      timezone: data.timezone || "",
    }),
  },
  {
    url: "https://api.ipapi.is/",
    mapping: (data) => ({
      ip: data.ip || "",
      country_code: data.location?.country_code || "",
      country: data.location?.country || "",
      region: data.location?.state || "",
      city: data.location?.city || "",
      organization: data.asn?.org || data.company?.name || "",
      asn: data.asn?.asn || 0,
      asn_organization: data.asn?.org || "",
      longitude: data.location?.longitude || 0,
      latitude: data.location?.latitude || 0,
      timezone: data.location?.timezone || "",
    }),
  },
  {
    url: "https://ipwho.is/",
    mapping: (data) => ({
      ip: data.ip || "",
      country_code: data.country_code || "",
      country: data.country || "",
      region: data.region || "",
      city: data.city || "",
      organization: data.connection?.org || data.connection?.isp || "",
      asn: data.connection?.asn || 0,
      asn_organization: data.connection?.isp || "",
      longitude: data.longitude || 0,
      latitude: data.latitude || 0,
      timezone: data.timezone?.id || "",
    }),
  },
];

/**
 * Shuffle IP check services using Fisher-Yates algorithm
 * Simplified version with single shuffle pass for better performance
 */
function shuffleServices(): ServiceConfig[] {
  // Filter invalid services and ensure type safety
  const validServices = IP_CHECK_SERVICES.filter(
    (service): service is ServiceConfig =>
      service !== null &&
      service !== undefined &&
      typeof service.url === "string" &&
      typeof service.mapping === "function",
  );

  if (validServices.length === 0) {
    logger.error("No valid services found in IP_CHECK_SERVICES");
    return [];
  }

  // Fisher-Yates shuffle algorithm - single pass is sufficient
  const shuffled = [...validServices];
  const length = shuffled.length;

  for (let i = length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));

    // Swap elements
    const temp = shuffled[i];
    shuffled[i] = shuffled[j];
    shuffled[j] = temp;
  }

  return shuffled;
}

// 获取当前IP和地理位置信息
export const getIpInfo = async (signal?: AbortSignal): Promise<IpInfo> => {
  // 配置参数
  const maxRetries = 2;
  const serviceTimeout = 10000;

  try {
    const shuffledServices = shuffleServices();
    let lastError: Error | null = null;
    const failedServices: string[] = [];

    for (const service of shuffledServices) {
      // 检查是否已被取消
      if (signal?.aborted) {
        throw new Error("请求已取消");
      }

      logger.debug(`尝试IP检测服务: ${service.url}`);

      for (let attempt = 0; attempt < maxRetries; attempt++) {
        let timeoutId: ReturnType<typeof setTimeout> | null = null;

        try {
          // 检查是否已被取消
          if (signal?.aborted) {
            throw new Error("请求已取消");
          }

          const timeoutController = new AbortController();
          timeoutId = setTimeout(() => {
            timeoutController.abort();
          }, service.timeout || serviceTimeout);

          // 组合信号：如果外部信号取消或超时信号触发，都会取消请求
          const combinedSignal = signal
            ? AbortSignal.any
              ? AbortSignal.any([signal, timeoutController.signal])
              : timeoutController.signal
            : timeoutController.signal;

          const response = await fetch(service.url, {
            method: "GET",
            signal: combinedSignal,
            connectTimeout: service.timeout || serviceTimeout,
          });

          if (timeoutId) clearTimeout(timeoutId);

          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }

          const data = await response.json();

          if (data && data.ip) {
            logger.info(`IP检测成功，使用服务: ${service.url}`);
            return service.mapping(data);
          } else {
            throw new Error(`无效的响应格式 from ${service.url}`);
          }
        } catch (error: any) {
          if (timeoutId) clearTimeout(timeoutId);

          // 如果是外部取消信号，立即停止所有尝试
          if (signal?.aborted || error.message === "请求已取消") {
            throw new Error("请求已取消");
          }

          lastError = error;
          const errorMsg =
            error.name === "AbortError"
              ? "请求超时"
              : error.message || error.toString();

          logger.warn(
            `尝试 ${attempt + 1}/${maxRetries} 失败 (${service.url}): ${errorMsg}`,
          );

          // 如果是最后一次重试，跳到下一个服务
          if (attempt >= maxRetries - 1) {
            break;
          }

          // 短暂延迟后重试
          await new Promise((resolve) => setTimeout(resolve, 300));
        }
      }

      failedServices.push(service.url);
    }

    // 所有服务都失败
    const errorMsg = lastError?.message || lastError?.toString() || "未知错误";
    throw new Error(
      `所有IP检测服务都失败 (已尝试 ${failedServices.length} 个服务): ${errorMsg}`,
    );
  } catch (error: any) {
    // 改进错误消息
    if (error.message === "请求已取消") {
      throw error;
    }
    throw error;
  }
};
