/**
 * 日志管理模块
 * 根据环境变量控制日志输出，生产环境自动禁用
 */

const isDev = import.meta.env.DEV;
const isDebugMode = import.meta.env.VITE_DEBUG === "true";

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  NONE = 4,
}

// 从环境变量读取日志级别
const getLogLevel = (): LogLevel => {
  const level = import.meta.env.VITE_LOG_LEVEL;
  switch (level) {
    case "debug":
      return LogLevel.DEBUG;
    case "info":
      return LogLevel.INFO;
    case "warn":
      return LogLevel.WARN;
    case "error":
      return LogLevel.ERROR;
    case "none":
      return LogLevel.NONE;
    default:
      // 开发环境默认 DEBUG，生产环境默认 WARN
      return isDev || isDebugMode ? LogLevel.DEBUG : LogLevel.WARN;
  }
};

const currentLogLevel = getLogLevel();

/**
 * 日志工厂函数
 */
const createLogger = (module: string) => {
  const prefix = `[${module}]`;

  return {
    debug: (...args: unknown[]) => {
      if (currentLogLevel <= LogLevel.DEBUG) {
        console.debug(prefix, ...args);
      }
    },
    info: (...args: unknown[]) => {
      if (currentLogLevel <= LogLevel.INFO) {
        console.info(prefix, ...args);
      }
    },
    log: (...args: unknown[]) => {
      if (currentLogLevel <= LogLevel.INFO) {
        console.log(prefix, ...args);
      }
    },
    warn: (...args: unknown[]) => {
      if (currentLogLevel <= LogLevel.WARN) {
        console.warn(prefix, ...args);
      }
    },
    error: (...args: unknown[]) => {
      if (currentLogLevel <= LogLevel.ERROR) {
        console.error(prefix, ...args);
      }
    },
  };
};

/**
 * 获取指定模块的日志记录器
 * @param module 模块名称
 * @returns 日志记录器
 */
export const getLogger = (module: string) => createLogger(module);

/**
 * 默认日志记录器
 */
export const logger = {
  debug: (...args: unknown[]) => {
    if (currentLogLevel <= LogLevel.DEBUG) {
      console.debug(...args);
    }
  },
  info: (...args: unknown[]) => {
    if (currentLogLevel <= LogLevel.INFO) {
      console.info(...args);
    }
  },
  log: (...args: unknown[]) => {
    if (currentLogLevel <= LogLevel.INFO) {
      console.log(...args);
    }
  },
  warn: (...args: unknown[]) => {
    if (currentLogLevel <= LogLevel.WARN) {
      console.warn(...args);
    }
  },
  error: (...args: unknown[]) => {
    if (currentLogLevel <= LogLevel.ERROR) {
      console.error(...args);
    }
  },
};


