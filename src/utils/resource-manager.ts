/**
 * 资源管理器 - 用于追踪和清理应用资源
 * 防止内存泄漏和资源泄漏
 */

type CleanupFunction = () => void | Promise<void>;

interface ResourceEntry {
  id: string;
  cleanup: CleanupFunction;
  createdAt: number;
  description?: string;
}

class ResourceManager {
  private resources: Map<string, ResourceEntry> = new Map();
  private autoCleanupInterval: ReturnType<typeof setInterval> | null = null;
  private readonly MAX_RESOURCE_AGE = 1000 * 60 * 60; // 1小时

  /**
   * 注册资源清理函数
   */
  register(id: string, cleanup: CleanupFunction, description?: string): () => void {
    const entry: ResourceEntry = {
      id,
      cleanup,
      createdAt: Date.now(),
      description,
    };

    this.resources.set(id, entry);
    console.debug(`[ResourceManager] 注册资源: ${id}${description ? ` (${description})` : ''}`);

    // 返回移除函数
    return () => this.unregister(id);
  }

  /**
   * 注销并清理资源
   */
  async unregister(id: string): Promise<void> {
    const entry = this.resources.get(id);
    if (!entry) {
      console.warn(`[ResourceManager] 尝试清理不存在的资源: ${id}`);
      return;
    }

    try {
      await entry.cleanup();
      this.resources.delete(id);
      console.debug(`[ResourceManager] 清理资源: ${id}`);
    } catch (error) {
      console.error(`[ResourceManager] 清理资源失败: ${id}`, error);
      // 清理失败时移除记录
      this.resources.delete(id);
    }
  }

  /**
   * 清理所有资源
   */
  async cleanupAll(): Promise<void> {
    console.log(`[ResourceManager] 开始清理所有资源 (共 ${this.resources.size} 个)`);
    
    const cleanupPromises = Array.from(this.resources.keys()).map((id) =>
      this.unregister(id)
    );

    await Promise.allSettled(cleanupPromises);
    console.log('[ResourceManager] 所有资源清理完成');
  }

  /**
   * 清理过期资源
   */
  async cleanupExpired(): Promise<void> {
    const now = Date.now();
    const expiredIds: string[] = [];

    for (const [id, entry] of this.resources.entries()) {
      const age = now - entry.createdAt;
      if (age > this.MAX_RESOURCE_AGE) {
        expiredIds.push(id);
      }
    }

    if (expiredIds.length > 0) {
      console.warn(`[ResourceManager] 发现 ${expiredIds.length} 个过期资源，开始清理`);
      await Promise.allSettled(expiredIds.map((id) => this.unregister(id)));
    }
  }

  /**
   * 启动自动清理
   */
  startAutoCleanup(intervalMs: number = 1000 * 60 * 10): void {
    if (this.autoCleanupInterval) {
      console.warn('[ResourceManager] 自动清理已在运行');
      return;
    }

    this.autoCleanupInterval = setInterval(() => {
      this.cleanupExpired().catch((error) => {
        console.error('[ResourceManager] 自动清理失败:', error);
      });
    }, intervalMs);

    console.log(`[ResourceManager] 启动自动清理 (间隔: ${intervalMs}ms)`);
  }

  /**
   * 停止自动清理
   */
  stopAutoCleanup(): void {
    if (this.autoCleanupInterval) {
      clearInterval(this.autoCleanupInterval);
      this.autoCleanupInterval = null;
      console.log('[ResourceManager] 停止自动清理');
    }
  }

  /**
   * 获取资源统计信息
   */
  getStats(): {
    totalResources: number;
    oldestResourceAge: number;
    resources: Array<{ id: string; age: number; description?: string }>;
  } {
    const now = Date.now();
    const resources = Array.from(this.resources.values()).map((entry) => ({
      id: entry.id,
      age: now - entry.createdAt,
      description: entry.description,
    }));

    const oldestResourceAge = resources.length > 0
      ? Math.max(...resources.map((r) => r.age))
      : 0;

    return {
      totalResources: this.resources.size,
      oldestResourceAge,
      resources,
    };
  }
}

// 导出单例
export const resourceManager = new ResourceManager();

// 页面卸载时清理资源
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    resourceManager.cleanupAll().catch((error) => {
      console.error('[ResourceManager] 页面卸载清理失败:', error);
    });
  });
}

