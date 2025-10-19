import { useLockFn } from "ahooks";
import useSWR, { mutate } from "swr";
import { getVersion } from "tauri-plugin-mihomo-api";

import {
  getClashInfo,
  patchClashConfig,
  getRuntimeConfig,
} from "@/services/cmds";
import { validatePorts } from "@/utils/port-validator";

export const useClash = () => {
  const { data: clash, mutate: mutateClash } = useSWR(
    "getRuntimeConfig",
    getRuntimeConfig,
  );

  const { data: versionData, mutate: mutateVersion } = useSWR(
    "getVersion",
    getVersion,
  );

  const patchClash = useLockFn(async (patch: Partial<IConfigData>) => {
    await patchClashConfig(patch);
    mutateClash();
  });

  const version = versionData?.meta
    ? `${versionData.version} Mihomo`
    : versionData?.version || "-";

  return {
    clash,
    version,
    mutateClash,
    mutateVersion,
    patchClash,
  };
};

export const useClashInfo = () => {
  const { data: clashInfo, mutate: mutateInfo } = useSWR(
    "getClashInfo",
    getClashInfo,
  );

  const patchInfo = async (
    patch: Partial<
      Pick<
        IConfigData,
        | "port"
        | "socks-port"
        | "mixed-port"
        | "redir-port"
        | "tproxy-port"
        | "external-controller"
        | "secret"
      >
    >,
  ) => {
    const hasInfo =
      patch["redir-port"] != null ||
      patch["tproxy-port"] != null ||
      patch["mixed-port"] != null ||
      patch["socks-port"] != null ||
      patch["port"] != null ||
      patch["external-controller"] != null ||
      patch.secret != null;

    if (!hasInfo) return;

    // 使用端口验证
    validatePorts(patch);

    await patchClashConfig(patch);
    mutateInfo();
    mutate("getClashConfig");
  };

  return {
    clashInfo,
    mutateInfo,
    patchInfo,
  };
};
