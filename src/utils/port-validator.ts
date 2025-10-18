/**
 * 端口验证范围常量
 * MIN: 1024 - 标准非特权端口起始值（1-1023为系统保留端口）
 * MAX: 65535 - 最大端口号
 */
export const PORT_RANGE = {
  MIN: 1024,
  MAX: 65535,
} as const;

/** 端口类型 */
export type PortType =
  | "port"
  | "socks-port"
  | "mixed-port"
  | "redir-port"
  | "tproxy-port";

/**
 * 验证单个端口是否在有效范围内
 */
export const validatePort = (port: number): boolean => {
  return port >= PORT_RANGE.MIN && port <= PORT_RANGE.MAX;
};

/**
 * 验证端口配置并抛出详细错误
 */
export const validatePortConfig = (
  port: number,
  portType: PortType = "port",
): void => {
  if (port < PORT_RANGE.MIN) {
    throw new Error(
      `The ${portType} should not be less than ${PORT_RANGE.MIN}`,
    );
  }
  if (port > PORT_RANGE.MAX) {
    throw new Error(
      `The ${portType} should not be greater than ${PORT_RANGE.MAX}`,
    );
  }
};

/**
 * 批量验证端口配置对象
 */
export const validatePorts = (
  config: Partial<Record<PortType, number | undefined>>,
): void => {
  const portEntries = Object.entries(config).filter(
    ([_, value]) => value != null,
  ) as [PortType, number][];

  for (const [portType, port] of portEntries) {
    validatePortConfig(port, portType);
  }
};

/**
 * 检测端口冲突
 */
export const detectPortConflicts = (
  ports: (number | undefined)[],
): boolean => {
  const validPorts = ports.filter((p) => p != null && p > 0);
  return new Set(validPorts).size !== validPorts.length;
};

/**
 * 正则验证端口格式（用于表单输入）
 */
export const portRegex =
  /^(?:[1-9]\d{0,3}|[1-5]\d{4}|6[0-4]\d{3}|65[0-4]\d{2}|655[0-2]\d|6553[0-5])$/;

export const validatePortFormat = (value: string): boolean => {
  return portRegex.test(value);
};

