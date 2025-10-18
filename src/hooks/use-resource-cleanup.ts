import { useEffect, useRef } from 'react';
import { resourceManager } from '@/utils/resource-manager';
import { nanoid } from 'nanoid';

/**
 * 自动管理资源清理的 Hook
 * 在组件卸载时自动清理资源
 * 
 * @example
 * ```tsx
 * function MyComponent() {
 *   const registerCleanup = useResourceCleanup('MyComponent');
 *   
 *   useEffect(() => {
 *     const ws = new WebSocket('ws://...');
 *     registerCleanup(() => ws.close(), 'WebSocket连接');
 *     
 *     return () => {
 *       // 可选：手动清理
 *     };
 *   }, []);
 * }
 * ```
 */
export function useResourceCleanup(componentName?: string) {
  const cleanupFnsRef = useRef<Array<() => void>>([]);
  const componentIdRef = useRef(componentName || `component-${nanoid(8)}`);

  useEffect(() => {
    // 组件卸载时执行清理
    return () => {
      cleanupFnsRef.current.forEach((cleanup) => {
        try {
          cleanup();
        } catch (error) {
          console.error(
            `[useResourceCleanup] 清理失败 (${componentIdRef.current}):`,
            error
          );
        }
      });
      cleanupFnsRef.current = [];
    };
  }, []);

  /**
   * 注册清理函数
   */
  const registerCleanup = (
    cleanup: () => void | Promise<void>,
    description?: string
  ) => {
    const resourceId = `${componentIdRef.current}-${nanoid(8)}`;
    const unregister = resourceManager.register(resourceId, cleanup, description);
    
    // 保存清理函数
    cleanupFnsRef.current.push(unregister);
    
    // 返回立即清理函数
    return () => {
      unregister();
      cleanupFnsRef.current = cleanupFnsRef.current.filter((fn) => fn !== unregister);
    };
  };

  return registerCleanup;
}

/**
 * 自动管理定时器的 Hook
 * 
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { setTimeout, setInterval } = useSafeTimers();
 *   
 *   useEffect(() => {
 *     const timeoutId = setTimeout(() => {
 *       console.log('延迟执行');
 *     }, 1000);
 *     
 *     const intervalId = setInterval(() => {
 *       console.log('定期执行');
 *     }, 1000);
 *   }, []);
 * }
 * ```
 */
export function useSafeTimers() {
  const timersRef = useRef<{
    timeouts: Set<ReturnType<typeof setTimeout>>;
    intervals: Set<ReturnType<typeof setInterval>>;
  }>({
    timeouts: new Set(),
    intervals: new Set(),
  });

  useEffect(() => {
    return () => {
      // 清理定时器
      timersRef.current.timeouts.forEach((id) => clearTimeout(id));
      timersRef.current.intervals.forEach((id) => clearInterval(id));
      timersRef.current.timeouts.clear();
      timersRef.current.intervals.clear();
    };
  }, []);

  const safeSetTimeout = (callback: () => void, delay: number) => {
    const id = setTimeout(() => {
      callback();
      timersRef.current.timeouts.delete(id);
    }, delay);
    timersRef.current.timeouts.add(id);
    return id;
  };

  const safeSetInterval = (callback: () => void, delay: number) => {
    const id = setInterval(callback, delay);
    timersRef.current.intervals.add(id);
    return id;
  };

  const clearSafeTimeout = (id: ReturnType<typeof setTimeout>) => {
    clearTimeout(id);
    timersRef.current.timeouts.delete(id);
  };

  const clearSafeInterval = (id: ReturnType<typeof setInterval>) => {
    clearInterval(id);
    timersRef.current.intervals.delete(id);
  };

  return {
    setTimeout: safeSetTimeout,
    setInterval: safeSetInterval,
    clearTimeout: clearSafeTimeout,
    clearInterval: clearSafeInterval,
  };
}

