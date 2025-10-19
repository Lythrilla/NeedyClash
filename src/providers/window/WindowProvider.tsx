import { getCurrentWindow } from "@tauri-apps/api/window";
import React, { useCallback, useEffect, useMemo, useState } from "react";

import { getVergeConfig, patchVergeConfig } from "@/services/cmds";
import debounce from "@/utils/debounce";

import { WindowContext } from "./WindowContext";

export const WindowProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const currentWindow = useMemo(() => getCurrentWindow(), []);
  const [decorated, setDecorated] = useState<boolean | null>(null);
  const [maximized, setMaximized] = useState<boolean | null>(null);

  const close = useCallback(() => currentWindow.close(), [currentWindow]);
  const minimize = useCallback(() => currentWindow.minimize(), [currentWindow]);

  // 缓存 debounce 函数，避免每次 effect 重新创建
  const checkMaximized = useMemo(
    () =>
      debounce(async () => {
        const value = await currentWindow.isMaximized();
        setMaximized(value);
      }, 300),
    [currentWindow],
  );

  useEffect(() => {
    // 初始化时立即检查一次最大化状态
    checkMaximized();

    const unlistenPromise = currentWindow.onResized(checkMaximized);

    return () => {
      unlistenPromise.then((unlisten) => unlisten());
    };
  }, [currentWindow, checkMaximized]);

  const toggleMaximize = useCallback(async () => {
    if (await currentWindow.isMaximized()) {
      await currentWindow.unmaximize();
      setMaximized(false);
    } else {
      await currentWindow.maximize();
      setMaximized(true);
    }
  }, [currentWindow]);

  const toggleFullscreen = useCallback(async () => {
    await currentWindow.setFullscreen(!(await currentWindow.isFullscreen()));
  }, [currentWindow]);

  const refreshDecorated = useCallback(async () => {
    const val = await currentWindow.isDecorated();
    setDecorated(val);
    return val;
  }, [currentWindow]);

  const toggleDecorations = useCallback(async () => {
    const newVal = !decorated;
    await currentWindow.setDecorations(newVal);
    setDecorated(newVal);

    // 保存到配置文件
    try {
      await patchVergeConfig({ window_use_system_titlebar: newVal });
    } catch (err) {
      console.error("Failed to save window decoration setting:", err);
    }
  }, [currentWindow, decorated]);

  useEffect(() => {
    let mounted = true;

    const initDecorations = async () => {
      try {
        // 从配置读取设置
        const config = await getVergeConfig();
        const useSysTitlebar = config.window_use_system_titlebar ?? false;

        if (!mounted) return;

        // 并行执行设置操作，提升初始化速度
        await Promise.all([
          currentWindow.setDecorations(useSysTitlebar),
          currentWindow.setMinimizable?.(true),
        ]);

        setDecorated(useSysTitlebar);
      } catch (err) {
        console.error("Failed to initialize window decorations:", err);
        // 失败时使用当前状态
        if (mounted) {
          refreshDecorated();
        }
      }
    };

    initDecorations();

    return () => {
      mounted = false;
    };
  }, [currentWindow, refreshDecorated]);

  const contextValue = useMemo(
    () => ({
      decorated,
      maximized,
      toggleDecorations,
      refreshDecorated,
      minimize,
      close,
      toggleMaximize,
      toggleFullscreen,
      currentWindow,
    }),
    [
      decorated,
      maximized,
      toggleDecorations,
      refreshDecorated,
      minimize,
      close,
      toggleMaximize,
      toggleFullscreen,
      currentWindow,
    ],
  );

  return <WindowContext value={contextValue}>{children}</WindowContext>;
};
