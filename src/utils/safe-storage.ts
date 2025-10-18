/**
 * 安全的 localStorage 操作工具
 * 提供错误处理和回退机制
 */

interface StorageOptions<T> {
  key: string;
  defaultValue: T;
  onError?: (error: Error) => void;
}

/**
 * 安全地从 localStorage 获取数据
 */
export function safeGetStorage<T>(options: StorageOptions<T>): T {
  const { key, defaultValue, onError } = options;

  try {
    const item = localStorage.getItem(key);
    if (item === null) {
      return defaultValue;
    }

    const parsed = JSON.parse(item);
    return parsed as T;
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    console.error(
      `[SafeStorage] Failed to get item from localStorage (key: ${key}):`,
      err,
    );
    onError?.(err);
    return defaultValue;
  }
}

/**
 * 安全地保存数据到 localStorage
 */
export function safeSetStorage<T>(
  key: string,
  value: T,
  onError?: (error: Error) => void,
): boolean {
  try {
    const serialized = JSON.stringify(value);
    localStorage.setItem(key, serialized);
    return true;
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    console.error(
      `[SafeStorage] Failed to set item to localStorage (key: ${key}):`,
      err,
    );
    onError?.(err);
    return false;
  }
}

/**
 * 安全地从 localStorage 删除数据
 */
export function safeRemoveStorage(
  key: string,
  onError?: (error: Error) => void,
): boolean {
  try {
    localStorage.removeItem(key);
    return true;
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    console.error(
      `[SafeStorage] Failed to remove item from localStorage (key: ${key}):`,
      err,
    );
    onError?.(err);
    return false;
  }
}

/**
 * 检查 localStorage 是否可用
 */
export function isStorageAvailable(): boolean {
  try {
    const testKey = "__storage_test__";
    localStorage.setItem(testKey, "test");
    localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}
