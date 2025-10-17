import { getCurrentWindow } from "@tauri-apps/api/window";
import React, { useCallback, useEffect, useMemo, useState } from "react";

import { getVergeConfig, patchVergeConfig } from "@/services/cmds";
import { WindowContext } from "./WindowContext";

export const WindowProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const currentWindow = useMemo(() => getCurrentWindow(), []);
  const [decorated, setDecorated] = useState<boolean | null>(null);
  const [maximized, setMaximized] = useState<boolean | null>(null);

  const close = useCallback(() => currentWindow.close(), [currentWindow]);
  const minimize = useCallback(() => currentWindow.minimize(), [currentWindow]);

  useEffect(() => {
    let active = true;

    const updateMaximized = async () => {
      const value = await currentWindow.isMaximized();
      if (!active) return;
      setMaximized((prev) => (prev === value ? prev : value));
    };

    updateMaximized();
    const unlistenPromise = currentWindow.onResized(updateMaximized);

    return () => {
      active = false;
      unlistenPromise.then((unlisten) => unlisten());
    };
  }, [currentWindow]);

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
    setDecorated((prev) => (prev === val ? prev : val));
    return val;
  }, [currentWindow]);

  const toggleDecorations = useCallback(async () => {
    const currentVal = await currentWindow.isDecorated();
    const newVal = !currentVal;
    await currentWindow.setDecorations(newVal);
    setDecorated(newVal);
    
    // 保存到配置文件
    try {
      await patchVergeConfig({ window_use_system_titlebar: newVal });
    } catch (err) {
      console.error("Failed to save window decoration setting:", err);
    }
  }, [currentWindow]);

  useEffect(() => {
    let active = true;
    
    const initDecorations = async () => {
      try {
        // 从配置读取设置
        const config = await getVergeConfig();
        const useSysTitlebar = config.window_use_system_titlebar ?? false;
        
        if (!active) return;
        
        // 应用配置
        await currentWindow.setDecorations(useSysTitlebar);
        setDecorated(useSysTitlebar);
      } catch (err) {
        console.error("Failed to initialize window decorations:", err);
        // 失败时使用当前状态
        if (active) {
          refreshDecorated();
        }
      }
    };
    
    initDecorations();
    currentWindow.setMinimizable?.(true);
    
    return () => {
      active = false;
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
