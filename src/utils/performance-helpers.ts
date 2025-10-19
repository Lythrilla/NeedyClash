export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  delay: number = 300,
  useIdle: boolean = true
): (...args: Parameters<T>) => void {
  let timeoutId: number | undefined;
  let idleCallbackId: number | undefined;

  return function (this: any, ...args: Parameters<T>) {
    const context = this;

    if (timeoutId !== undefined) {
      clearTimeout(timeoutId);
      timeoutId = undefined;
    }
    if (idleCallbackId !== undefined && typeof cancelIdleCallback !== 'undefined') {
      cancelIdleCallback(idleCallbackId);
      idleCallbackId = undefined;
    }

    if (useIdle && typeof requestIdleCallback !== 'undefined') {
      // 使用requestIdleCallback在浏览器空闲时执行
      timeoutId = window.setTimeout(() => {
        idleCallbackId = requestIdleCallback(() => {
          fn.apply(context, args);
        }, { timeout: delay });
      }, delay);
    } else {
      timeoutId = window.setTimeout(() => {
        fn.apply(context, args);
      }, delay);
    }
  };
}

export function throttle<T extends (...args: any[]) => any>(
  fn: T,
  limit: number = 300
): (...args: Parameters<T>) => void {
  let lastRun: number = 0;
  let timeoutId: number | undefined;

  return function (this: any, ...args: Parameters<T>) {
    const context = this;
    const now = performance.now();

    if (now - lastRun >= limit) {
      lastRun = now;
      fn.apply(context, args);
    } else {
      if (timeoutId !== undefined) {
        clearTimeout(timeoutId);
      }
      timeoutId = window.setTimeout(() => {
        lastRun = performance.now();
        fn.apply(context, args);
      }, limit - (now - lastRun));
    }
  };
}

export function scheduleIdleTask(
  fn: () => void,
  timeout: number = 1000
): () => void {
  if (typeof requestIdleCallback !== 'undefined') {
    const id = requestIdleCallback(fn, { timeout });
    return () => cancelIdleCallback(id);
  } else {
    const id = setTimeout(fn, Math.min(timeout, 50));
    return () => clearTimeout(id);
  }
}

export function batchExecute(
  tasks: Array<() => void | Promise<void>>,
  onComplete?: () => void
): () => void {
  let currentIndex = 0;
  let cancelled = false;

  const executeNext = () => {
    if (cancelled || currentIndex >= tasks.length) {
      if (onComplete && currentIndex >= tasks.length) {
        onComplete();
      }
      return;
    }

    const task = tasks[currentIndex++];
    
    scheduleIdleTask(() => {
      if (cancelled) return;
      
      const result = task();
      if (result instanceof Promise) {
        result.then(() => executeNext()).catch(() => executeNext());
      } else {
        executeNext();
      }
    });
  };

  executeNext();

  return () => {
    cancelled = true;
  };
}

export function memoize<T extends (...args: any[]) => any>(
  fn: T,
  keyFn?: (...args: Parameters<T>) => string,
  maxSize: number = 100
): T {
  const cache = new Map<string, ReturnType<T>>();
  const keys: string[] = [];

  return function (this: any, ...args: Parameters<T>): ReturnType<T> {
    const key = keyFn ? keyFn(...args) : JSON.stringify(args);

    if (cache.has(key)) {
      return cache.get(key)!;
    }

    const result = fn.apply(this, args);
    cache.set(key, result);
    keys.push(key);

    // LRU缓存淘汰策略
    if (keys.length > maxSize) {
      const oldestKey = keys.shift()!;
      cache.delete(oldestKey);
    }

    return result;
  } as T;
}

export class MicroTaskScheduler {
  private pending = false;
  private callbacks: Array<() => void> = [];

  schedule(callback: () => void): void {
    this.callbacks.push(callback);

    if (!this.pending) {
      this.pending = true;
      queueMicrotask(() => {
        this.flush();
      });
    }
  }

  private flush(): void {
    const callbacks = this.callbacks.slice();
    this.callbacks = [];
    this.pending = false;

    for (const callback of callbacks) {
      try {
        callback();
      } catch (error) {
        console.error('MicroTaskScheduler error:', error);
      }
    }
  }
}

export function rafThrottle<T extends (...args: any[]) => any>(
  fn: T
): (...args: Parameters<T>) => void {
  let rafId: number | null = null;
  let latestArgs: Parameters<T> | null = null;

  return function (this: any, ...args: Parameters<T>) {
    const context = this;
    latestArgs = args;

    if (rafId === null) {
      rafId = requestAnimationFrame(() => {
        if (latestArgs !== null) {
          fn.apply(context, latestArgs);
          latestArgs = null;
        }
        rafId = null;
      });
    }
  };
}

