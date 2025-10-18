import { alpha, createTheme, Theme as MuiTheme, Shadows } from "@mui/material";
import {
  arSD as arXDataGrid,
  enUS as enXDataGrid,
  faIR as faXDataGrid,
  ruRU as ruXDataGrid,
  zhCN as zhXDataGrid,
} from "@mui/x-data-grid/locales";
import {
  getCurrentWebviewWindow,
  WebviewWindow,
} from "@tauri-apps/api/webviewWindow";
import { Theme as TauriOsTheme } from "@tauri-apps/api/window";
import { useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";

import { useVerge } from "@/hooks/use-verge";
import { defaultDarkTheme, defaultTheme } from "@/pages/_theme";
import { useSetThemeMode, useThemeMode } from "@/services/states";

const languagePackMap: Record<string, any> = {
  zh: { ...zhXDataGrid },
  fa: { ...faXDataGrid },
  ru: { ...ruXDataGrid },
  ar: { ...arXDataGrid },
  en: { ...enXDataGrid },
};

const getLanguagePackMap = (key: string) =>
  languagePackMap[key] || languagePackMap.en;

/**
 * custom theme
 */
export const useCustomTheme = () => {
  const appWindow: WebviewWindow = useMemo(() => getCurrentWebviewWindow(), []);
  const { verge } = useVerge();
  const { i18n } = useTranslation();
  const { theme_mode, theme_setting } = verge ?? {};
  const mode = useThemeMode();
  const setMode = useSetThemeMode();

  // 背景设置
  const backgroundType = theme_setting?.background_type || "none";
  const backgroundColor = theme_setting?.background_color || "#000000";
  const backgroundImage = theme_setting?.background_image || "";
  const backgroundVideo = theme_setting?.background_video || "";
  const backgroundOpacity = theme_setting?.background_opacity ?? 1;
  const backgroundBlur = theme_setting?.background_blur ?? 0;
  const backgroundBrightness = theme_setting?.background_brightness ?? 100;
  const backgroundBlendMode = theme_setting?.background_blend_mode || "normal";
  const backgroundSize = theme_setting?.background_size || "cover";
  const backgroundPosition = theme_setting?.background_position || "center";
  const backgroundRepeat = theme_setting?.background_repeat || "no-repeat";
  const backgroundScale = theme_setting?.background_scale ?? 1.0;

  const hasCustomBackground = backgroundType !== "none";

  // 布局元素样式设置
  const sidebarBgColor = theme_setting?.sidebar_background_color;
  const sidebarOpacity = theme_setting?.sidebar_opacity ?? 1;
  const sidebarBlur = theme_setting?.sidebar_blur ?? 0;
  const headerBgColor = theme_setting?.header_background_color;
  const headerOpacity = theme_setting?.header_opacity ?? 1;
  const headerBlur = theme_setting?.header_blur ?? 0;

  // 设置页面样式
  const settingsBlur = theme_setting?.settings_background_blur ?? false;
  const settingsOpacity = theme_setting?.settings_background_opacity ?? 0.95;

  // 连接表格样式设置
  const connectionTableBlur = theme_setting?.connection_table_blur ?? 0;

  // 组件微调样式设置
  const componentStyles = theme_setting?.component_styles || {};
  const globalStyle = componentStyles.global || {};

  // 辅助函数：将颜色和opacity合并为rgba
  const applyOpacityToColor = (color: string, opacity: number): string => {
    // 如果已经是rgba格式，替换alpha值
    if (color.startsWith("rgba")) {
      return color.replace(/[\d.]+\)$/, `${opacity})`);
    }
    // 如果是rgb格式，转换为rgba
    if (color.startsWith("rgb(")) {
      return color.replace("rgb(", "rgba(").replace(")", `, ${opacity})`);
    }
    // 如果是hex格式，转换为rgba
    if (color.startsWith("#")) {
      const hex = color.replace("#", "");
      const r = parseInt(hex.substring(0, 2), 16);
      const g = parseInt(hex.substring(2, 4), 16);
      const b = parseInt(hex.substring(4, 6), 16);
      return `rgba(${r}, ${g}, ${b}, ${opacity})`;
    }
    // 其他格式直接返回
    return color;
  };

  // 获取组件样式或使用全局默认值
  const getComponentStyle = (key: string) => {
    const compStyle = (componentStyles as any)[key] || {};
    if (compStyle.enabled === false) return null;

    // 检查是否真的设置了样式（组件级别或全局级别）
    const hasComponentStyle =
      compStyle.background_color ||
      compStyle.blur !== undefined ||
      compStyle.opacity !== undefined;
    const hasGlobalStyle =
      globalStyle.background_color ||
      globalStyle.blur !== undefined ||
      globalStyle.opacity !== undefined;

    // 如果都没设置，返回 null
    if (!hasComponentStyle && !hasGlobalStyle) return null;

    const baseColor =
      compStyle.background_color ||
      globalStyle.background_color ||
      (mode === "dark" ? "rgba(26, 26, 26, 0.7)" : "rgba(255, 255, 255, 0.7)");
    const opacity = compStyle.opacity ?? globalStyle.opacity ?? 0.7;

    return {
      backgroundColor: applyOpacityToColor(baseColor, opacity),
      blur: compStyle.blur ?? globalStyle.blur ?? 25,
    };
  };

  // 调试日志
  useEffect(() => {
    if (backgroundType !== "none") {
      console.log("[Background Debug] Type:", backgroundType);
      console.log("[Background Debug] Image URL:", backgroundImage);
      console.log("[Background Debug] Video URL:", backgroundVideo);
      console.log("[Background Debug] Color:", backgroundColor);
      console.log("[Background Debug] Settings:", {
        opacity: backgroundOpacity,
        blur: backgroundBlur,
        brightness: backgroundBrightness,
        size: backgroundSize,
        position: backgroundPosition,
      });
    }
  }, [
    backgroundType,
    backgroundImage,
    backgroundVideo,
    backgroundColor,
    backgroundOpacity,
    backgroundBlur,
    backgroundBrightness,
    backgroundSize,
    backgroundPosition,
  ]);

  useEffect(() => {
    if (theme_mode === "light" || theme_mode === "dark") {
      setMode(theme_mode);
    }
  }, [theme_mode, setMode]);

  useEffect(() => {
    if (theme_mode !== "system") {
      return;
    }

    if (
      typeof window !== "undefined" &&
      typeof window.matchMedia === "function"
    ) {
      return;
    }

    let isMounted = true;

    const timerId = setTimeout(() => {
      if (!isMounted) return;
      appWindow
        .theme()
        .then((systemTheme) => {
          if (isMounted && systemTheme) {
            setMode(systemTheme);
          }
        })
        .catch((err) => {
          console.error("Failed to get initial system theme:", err);
        });
    }, 0);

    const unlistenPromise = appWindow.onThemeChanged(({ payload }) => {
      if (isMounted) {
        setMode(payload);
      }
    });

    return () => {
      isMounted = false;
      clearTimeout(timerId);
      unlistenPromise
        .then((unlistenFn) => {
          if (typeof unlistenFn === "function") {
            unlistenFn();
          }
        })
        .catch((err) => {
          console.error("Failed to unlisten from theme changes:", err);
        });
    };
  }, [theme_mode, appWindow, setMode]);

  useEffect(() => {
    if (theme_mode !== "system") {
      return;
    }

    if (
      typeof window === "undefined" ||
      typeof window.matchMedia !== "function"
    ) {
      return;
    }

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const syncMode = (isDark: boolean) => setMode(isDark ? "dark" : "light");
    const handleChange = (event: MediaQueryListEvent) =>
      syncMode(event.matches);

    syncMode(mediaQuery.matches);

    if (typeof mediaQuery.addEventListener === "function") {
      mediaQuery.addEventListener("change", handleChange);
      return () => mediaQuery.removeEventListener("change", handleChange);
    }

    type MediaQueryListLegacy = MediaQueryList & {
      addListener?: (
        listener: (this: MediaQueryList, event: MediaQueryListEvent) => void,
      ) => void;
      removeListener?: (
        listener: (this: MediaQueryList, event: MediaQueryListEvent) => void,
      ) => void;
    };

    const legacyQuery = mediaQuery as MediaQueryListLegacy;
    legacyQuery.addListener?.(handleChange);
    return () => legacyQuery.removeListener?.(handleChange);
  }, [theme_mode, setMode]);

  useEffect(() => {
    if (theme_mode === undefined) {
      return;
    }

    if (theme_mode === "system") {
      appWindow.setTheme(null).catch((err) => {
        console.error(
          "Failed to set window theme to follow system (setTheme(null)):",
          err,
        );
      });
    } else if (mode) {
      appWindow.setTheme(mode as TauriOsTheme).catch((err) => {
        console.error(`Failed to set window theme to ${mode}:`, err);
      });
    }
  }, [mode, appWindow, theme_mode]);

  const theme = useMemo(() => {
    const setting = theme_setting || {};
    const dt = mode === "light" ? defaultTheme : defaultDarkTheme;
    let muiTheme: MuiTheme;

    try {
      muiTheme = createTheme(
        {
          breakpoints: {
            values: { xs: 0, sm: 650, md: 900, lg: 1200, xl: 1536 },
          },
          zIndex: {
            mobileStepper: 1000,
            fab: 1050,
            speedDial: 1050,
            appBar: 1100,
            drawer: 1200,
            modal: 1300,
            snackbar: 1400,
            tooltip: 1500,
          },
          palette: {
            mode,
            primary: { main: setting.primary_color || dt.primary_color },
            secondary: { main: setting.secondary_color || dt.secondary_color },
            info: { main: setting.info_color || dt.info_color },
            error: { main: setting.error_color || dt.error_color },
            warning: { main: setting.warning_color || dt.warning_color },
            success: { main: setting.success_color || dt.success_color },
            text: {
              primary: setting.primary_text || dt.primary_text,
              secondary: setting.secondary_text || dt.secondary_text,
            },
            background: {
              paper: mode === "light" ? "#FFFFFF" : "#3232326b",
              default: dt.background_color,
            },
            divider:
              mode === "light"
                ? "rgba(0, 0, 0, 0.08)"
                : "rgba(255, 255, 255, 0.08)",
            action: {
              hover:
                mode === "light"
                  ? "rgba(0, 0, 0, 0.04)"
                  : "rgba(255, 255, 255, 0.05)",
              selected:
                mode === "light"
                  ? "rgba(0, 0, 0, 0.08)"
                  : "rgba(255, 255, 255, 0.08)",
            },
          },
          shadows: Array(25).fill("none") as Shadows,
          typography: {
            fontFamily: setting.font_family
              ? `${setting.font_family}, ${dt.font_family}`
              : dt.font_family,
          },
          components: {
            MuiPaper: {
              styleOverrides: {
                root: {
                  backgroundImage: "none",
                  backgroundColor: mode === "light" ? "#FFFFFF" : "#3232326b",
                },
              },
            },
            MuiPopover: {
              styleOverrides: {
                paper: {
                  border: `1px solid ${mode === "light" ? "#E2E8F0" : "rgba(255, 255, 255, 0.1)"}`,
                  boxShadow:
                    mode === "light"
                      ? "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)"
                      : "0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -1px rgba(0, 0, 0, 0.2)",
                },
              },
            },
            MuiMenu: {
              styleOverrides: {
                paper: {
                  backgroundColor: mode === "light" ? "#FFFFFF" : "#3232326b",
                  border: `1px solid ${mode === "light" ? "#E2E8F0" : "rgba(255, 255, 255, 0.1)"}`,
                },
                list: {
                  padding: "4px",
                },
              },
            },
            MuiMenuItem: {
              styleOverrides: {
                root: {
                  margin: "2px 4px",
                  padding: "8px 12px",
                  fontSize: "14px",
                  transition: "all 0.2s ease",
                  minHeight: "auto",
                  "&:hover": {
                    backgroundColor:
                      mode === "light"
                        ? "#F8FAFC"
                        : "rgba(255, 255, 255, 0.08)",
                  },
                  "&.Mui-selected": {
                    backgroundColor:
                      mode === "light"
                        ? alpha(setting.primary_color || dt.primary_color, 0.1)
                        : alpha(
                            setting.primary_color || dt.primary_color,
                            0.16,
                          ),
                    color: setting.primary_color || dt.primary_color,
                    fontWeight: 500,
                    "&:hover": {
                      backgroundColor:
                        mode === "light"
                          ? alpha(
                              setting.primary_color || dt.primary_color,
                              0.15,
                            )
                          : alpha(
                              setting.primary_color || dt.primary_color,
                              0.22,
                            ),
                    },
                  },
                  "&.Mui-focusVisible": {
                    backgroundColor:
                      mode === "light"
                        ? "#F8FAFC"
                        : "rgba(255, 255, 255, 0.08)",
                  },
                },
              },
            },
            MuiSelect: {
              defaultProps: {
                MenuProps: {
                  PaperProps: {
                    sx: {
                      backgroundColor:
                        mode === "light" ? "#FFFFFF" : "#3232326b",
                      border: `1px solid ${mode === "light" ? "#E2E8F0" : "rgba(255, 255, 255, 0.1)"}`,
                      boxShadow:
                        mode === "light"
                          ? "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)"
                          : "0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -1px rgba(0, 0, 0, 0.2)",
                      mt: 0.5,
                      "& .MuiList-root": {
                        padding: "4px",
                      },
                    },
                  },
                },
              },
              styleOverrides: {
                select: {
                  padding: "4px 32px 4px 12px !important",
                  height: "24px",
                  display: "flex",
                  alignItems: "center",
                  "&.MuiSelect-select.MuiInputBase-inputSizeSmall": {
                    padding: "4px 32px 4px 12px !important",
                    height: "24px",
                  },
                },
                icon: {
                  color:
                    mode === "light"
                      ? "rgba(0, 0, 0, 0.54)"
                      : "rgba(255, 255, 255, 0.7)",
                },
              },
            },
            MuiNativeSelect: {
              styleOverrides: {
                select: {
                  backgroundColor:
                    mode === "light" ? "#FFFFFF" : "rgba(255, 255, 255, 0.03)",
                  padding: "4px 32px 4px 12px",
                  fontSize: "13px",
                  minHeight: "32px",
                  height: "32px",
                  color:
                    mode === "light"
                      ? "rgba(0, 0, 0, 0.87)"
                      : "rgba(255, 255, 255, 0.87)",
                  "&:focus": {
                    backgroundColor:
                      mode === "light"
                        ? "#FFFFFF"
                        : "rgba(255, 255, 255, 0.03)",
                  },
                },
                icon: {
                  color:
                    mode === "light"
                      ? "rgba(0, 0, 0, 0.54)"
                      : "rgba(255, 255, 255, 0.7)",
                },
              },
            },
            MuiFormControl: {
              styleOverrides: {
                root: {
                  "& .MuiInputLabel-root": {
                    color:
                      mode === "light"
                        ? "rgba(0, 0, 0, 0.6)"
                        : "rgba(255, 255, 255, 0.7)",
                    fontSize: "14px",
                    "&.Mui-focused": {
                      color: setting.primary_color || dt.primary_color,
                    },
                  },
                },
              },
            },
            MuiInputLabel: {
              styleOverrides: {
                root: {
                  color:
                    mode === "light"
                      ? "rgba(0, 0, 0, 0.6)"
                      : "rgba(255, 255, 255, 0.7)",
                  fontSize: "14px",
                  "&.Mui-focused": {
                    color: setting.primary_color || dt.primary_color,
                  },
                  "&.Mui-error": {
                    color: setting.error_color || dt.error_color,
                  },
                },
                shrink: {
                  color:
                    mode === "light"
                      ? "rgba(0, 0, 0, 0.6)"
                      : "rgba(255, 255, 255, 0.7)",
                  "&.Mui-focused": {
                    color: setting.primary_color || dt.primary_color,
                  },
                },
              },
            },
            MuiTextField: {
              styleOverrides: {
                root: {
                  "& .MuiInputBase-root": {
                    backgroundColor:
                      mode === "light"
                        ? "#FFFFFF"
                        : "rgba(255, 255, 255, 0.03)",
                  },
                },
              },
            },
            MuiOutlinedInput: {
              styleOverrides: {
                root: {
                  backgroundColor:
                    mode === "light" ? "#FFFFFF" : "rgba(255, 255, 255, 0.03)",
                  transition: "all 0.2s ease",
                  "&:hover .MuiOutlinedInput-notchedOutline": {
                    borderColor:
                      mode === "light" ? "#CBD5E1" : "rgba(255, 255, 255, 0.2)",
                  },
                  "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                    borderColor: setting.primary_color || dt.primary_color,
                    borderWidth: "2px",
                  },
                  "&.Mui-error .MuiOutlinedInput-notchedOutline": {
                    borderColor: setting.error_color || dt.error_color,
                  },
                  "&.MuiInputBase-sizeSmall": {
                    height: "32px",
                    "& input": {
                      padding: "4px 12px",
                      height: "24px",
                    },
                  },
                },
                notchedOutline: {
                  borderColor:
                    mode === "light" ? "#E2E8F0" : "rgba(255, 255, 255, 0.12)",
                  transition: "all 0.2s ease",
                },
                input: {
                  color:
                    mode === "light"
                      ? "rgba(0, 0, 0, 0.87)"
                      : "rgba(255, 255, 255, 0.87)",
                },
              },
            },
            MuiButton: {
              styleOverrides: {
                root: {
                  textTransform: "none",
                  fontWeight: 500,
                },
                outlined: {
                  borderColor:
                    mode === "light" ? "#E2E8F0" : "rgba(255, 255, 255, 0.12)",
                  "&:hover": {
                    borderColor: setting.primary_color || dt.primary_color,
                    backgroundColor:
                      mode === "light"
                        ? alpha(setting.primary_color || dt.primary_color, 0.04)
                        : alpha(
                            setting.primary_color || dt.primary_color,
                            0.08,
                          ),
                  },
                },
                contained: {
                  boxShadow: "none",
                  "&:hover": {
                    boxShadow: "none",
                  },
                },
              },
            },
            MuiIconButton: {
              styleOverrides: {
                root: {
                  "&:hover": {
                    backgroundColor:
                      mode === "light"
                        ? "rgba(0, 0, 0, 0.04)"
                        : "rgba(255, 255, 255, 0.05)",
                  },
                },
              },
            },
            MuiCard: {
              styleOverrides: {
                root: {
                  backgroundColor: mode === "light" ? "#FFFFFF" : "#3232326b",
                  border: `1px solid ${mode === "light" ? "#E2E8F0" : "rgba(255, 255, 255, 0.1)"}`,
                  transition: "all 0.2s ease",
                  "&:hover": {
                    borderColor: setting.primary_color || dt.primary_color,
                    backgroundColor: mode === "light" ? "#F8FAFC" : "#3C3C3C",
                  },
                },
              },
            },
            MuiDialog: {
              styleOverrides: {
                paper: {
                  backgroundColor: mode === "light" ? "#FFFFFF" : "#3232326b",
                  border: `1px solid ${mode === "light" ? "#E2E8F0" : "rgba(255, 255, 255, 0.1)"}`,
                },
              },
            },
            MuiTooltip: {
              defaultProps: {
                arrow: true,
                placement: "top",
                PopperProps: {
                  modifiers: [
                    {
                      name: "offset",
                      options: {
                        offset: [0, -8],
                      },
                    },
                  ],
                },
              },
              styleOverrides: {
                tooltip: {
                  backgroundColor:
                    mode === "light"
                      ? "rgba(0, 0, 0, 0.87)"
                      : "rgba(50, 50, 50, 0.95)",
                  fontSize: "12px",
                  padding: "6px 12px",
                },
                arrow: {
                  color:
                    mode === "light"
                      ? "rgba(0, 0, 0, 0.87)"
                      : "rgba(50, 50, 50, 0.95)",
                },
              },
            },
            MuiListItem: {
              styleOverrides: {
                root: {
                  "&:hover": {
                    backgroundColor:
                      mode === "light"
                        ? "#F8FAFC"
                        : "rgba(255, 255, 255, 0.05)",
                  },
                },
              },
            },
            MuiListItemButton: {
              styleOverrides: {
                root: {
                  "&:hover": {
                    backgroundColor:
                      mode === "light"
                        ? "#F8FAFC"
                        : "rgba(255, 255, 255, 0.05)",
                  },
                },
              },
            },
            MuiChip: {
              styleOverrides: {
                root: {},
              },
            },
            MuiSwitch: {
              styleOverrides: {
                root: {
                  width: 42,
                  height: 26,
                  padding: 0,
                },
                switchBase: {
                  padding: 1,
                  "&.Mui-checked": {
                    transform: "translateX(16px)",
                    color: "#fff",
                    "& + .MuiSwitch-track": {
                      backgroundColor:
                        setting.primary_color || dt.primary_color,
                      opacity: 1,
                    },
                  },
                },
                thumb: {
                  width: 24,
                  height: 24,
                },
                track: {
                  backgroundColor:
                    mode === "light" ? "#E2E8F0" : "rgba(255, 255, 255, 0.2)",
                  opacity: 1,
                },
              },
            },
          },
        },
        getLanguagePackMap(i18n.language),
      );
    } catch (e) {
      console.error("Error creating MUI theme, falling back to defaults:", e);
      muiTheme = createTheme({
        breakpoints: {
          values: { xs: 0, sm: 650, md: 900, lg: 1200, xl: 1536 },
        },
        palette: {
          mode,
          primary: { main: dt.primary_color },
          secondary: { main: dt.secondary_color },
          info: { main: dt.info_color },
          error: { main: dt.error_color },
          warning: { main: dt.warning_color },
          success: { main: dt.success_color },
          text: { primary: dt.primary_text, secondary: dt.secondary_text },
          background: {
            paper: dt.background_color,
            default: dt.background_color,
          },
        },
        typography: { fontFamily: dt.font_family },
      });
    }

    const rootEle = document.documentElement;
    if (rootEle) {
      // 立即设置 data-theme 属性，确保主题样式立即生效
      rootEle.setAttribute("data-theme", mode);

      // 立即设置背景色，防止闪烁
      const themeBackgroundColor = mode === "light" ? "#FAFAFA" : "#0F0F0F";
      document.body.style.backgroundColor = themeBackgroundColor;
      rootEle.style.backgroundColor = themeBackgroundColor;

      // 暗色模式配色方案
      const backgroundColor =
        mode === "light" ? "#F8FAFC" : dt.background_color;
      const selectColor = mode === "light" ? "#F1F5F9" : "#3232326b";
      const scrollColor = mode === "light" ? "#CBD5E1" : "#5A5A5A";
      const dividerColor =
        mode === "light" ? "rgba(0, 0, 0, 0.06)" : "rgba(255, 255, 255, 0.08)";
      const cardBackground = mode === "light" ? "#FFFFFF" : "#3232326b";
      const cardHoverBackground = mode === "light" ? "#F8FAFC" : "#3C3C3C";
      const borderColor =
        mode === "light" ? "#E2E8F0" : "rgba(255, 255, 255, 0.1)";

      rootEle.style.setProperty("--divider-color", dividerColor);
      rootEle.style.setProperty("--border-color", borderColor);
      rootEle.style.setProperty("--background-color", backgroundColor);
      rootEle.style.setProperty("--card-background", cardBackground);
      rootEle.style.setProperty("--card-hover-background", cardHoverBackground);
      rootEle.style.setProperty("--selection-color", selectColor);
      rootEle.style.setProperty("--scroller-color", scrollColor);
      rootEle.style.setProperty(
        "--primary-main",
        muiTheme.palette.primary.main,
      );
      rootEle.style.setProperty(
        "--background-color-alpha",
        alpha(muiTheme.palette.primary.main, mode === "light" ? 0.08 : 0.12),
      );
      rootEle.style.setProperty(
        "--window-border-color",
        mode === "light" ? "#E2E8F0" : "#404040",
      );
      // 滚动条颜色变量
      rootEle.style.setProperty(
        "--cv-scroller-color",
        mode === "light"
          ? "rgba(148, 163, 184, 0.4)"
          : "rgba(148, 163, 184, 0.3)",
      );
      rootEle.style.setProperty(
        "--cv-scroller-hover-color",
        mode === "light"
          ? "rgba(100, 116, 139, 0.6)"
          : "rgba(148, 163, 184, 0.5)",
      );
      // 自定义背景CSS变量
      rootEle.style.setProperty("--bg-type", backgroundType);
      rootEle.style.setProperty("--bg-custom-color", backgroundColor);
      rootEle.style.setProperty(
        "--bg-image",
        backgroundType === "image" && backgroundImage
          ? `url('${backgroundImage}')`
          : "none",
      );
      rootEle.style.setProperty(
        "--bg-video-url",
        backgroundType === "video" && backgroundVideo ? backgroundVideo : "",
      );
      rootEle.style.setProperty("--bg-opacity", String(backgroundOpacity));
      rootEle.style.setProperty("--bg-blur", `${backgroundBlur}px`);
      rootEle.style.setProperty("--bg-brightness", `${backgroundBrightness}%`);
      rootEle.style.setProperty("--bg-blend-mode", backgroundBlendMode);
      rootEle.style.setProperty("--bg-size", backgroundSize);
      rootEle.style.setProperty("--bg-position", backgroundPosition);
      rootEle.style.setProperty("--bg-repeat", backgroundRepeat);
    }

    let styleElement = document.querySelector("style#verge-theme");
    if (!styleElement) {
      styleElement = document.createElement("style");
      styleElement.id = "verge-theme";
      document.head.appendChild(styleElement!);
    }

    if (styleElement) {
      const globalStyles = `
        /* 背景 */
        body {
          position: relative;
          ${backgroundType === "none" ? `background-color: var(--background-color);` : "background-color: transparent;"}
        }

        /* 对话框样式 - 始终应用，无论背景类型 */
        .MuiDialog-paper {
          background-color: ${mode === "light" ? "rgba(255, 255, 255, 0.95)" : "rgba(40, 40, 40, 0.95)"} !important;
          backdrop-filter: blur(25px) saturate(180%) !important;
          -webkit-backdrop-filter: blur(25px) saturate(180%) !important;
        }

        /* 下拉菜单背景 - 全局默认样式 */
        ${(() => {
          const selectStyle = getComponentStyle("select");
          if (selectStyle) {
            return `
        .MuiPaper-root.MuiMenu-paper,
        .MuiPaper-root.MuiPopover-paper {
          background-color: ${selectStyle.backgroundColor} !important;
          backdrop-filter: blur(${selectStyle.blur}px) saturate(180%) !important;
          -webkit-backdrop-filter: blur(${selectStyle.blur}px) saturate(180%) !important;
        }
            `;
          }
          return "";
        })()}

        /* 侧边栏自定义样式 - 使用伪元素实现背景效果，不影响内容 */
        ${
          sidebarBgColor ||
          sidebarOpacity !== 1 ||
          sidebarBlur > 0 ||
          (hasCustomBackground &&
            (globalStyle.background_color || globalStyle.blur))
            ? `
        .layout-content__left {
          position: relative !important;
          background-color: transparent !important;
        }
        
        .layout-content__left::before {
          content: "" !important;
          position: absolute !important;
          top: 0 !important;
          left: 0 !important;
          right: 0 !important;
          bottom: 0 !important;
          ${
            sidebarBgColor
              ? `background-color: ${sidebarBgColor} !important;
                 opacity: ${sidebarOpacity} !important;`
              : (globalStyle.background_color || globalStyle.blur) &&
                  hasCustomBackground
                ? `background-color: ${globalStyle.background_color || (mode === "dark" ? "rgba(26, 26, 26, 0.7)" : "rgba(255, 255, 255, 0.7)")} !important;`
                : `background-color: ${mode === "dark" ? `rgba(26, 26, 26, ${sidebarOpacity})` : `rgba(255, 255, 255, ${sidebarOpacity})`} !important;`
          }
          ${
            sidebarBlur > 0
              ? `backdrop-filter: blur(${sidebarBlur}px) saturate(180%) !important;
          -webkit-backdrop-filter: blur(${sidebarBlur}px) saturate(180%) !important;`
              : (globalStyle.background_color || globalStyle.blur) &&
                  hasCustomBackground &&
                  (globalStyle.blur ?? 25) > 0
                ? `backdrop-filter: blur(${globalStyle.blur ?? 25}px) saturate(180%) !important;
          -webkit-backdrop-filter: blur(${globalStyle.blur ?? 25}px) saturate(180%) !important;`
                : ""
          }
          z-index: 0 !important;
          pointer-events: none !important;
        }
        
        .layout-content__left > * {
          position: relative !important;
          z-index: 1 !important;
        }
        `
            : ""
        }

        /* Header自定义样式 - 使用伪元素实现背景效果，不影响内容 */
        ${
          headerBgColor ||
          headerOpacity !== 1 ||
          headerBlur > 0 ||
          (hasCustomBackground &&
            (globalStyle.background_color || globalStyle.blur))
            ? `
        .base-page > header {
          position: relative !important;
          background-color: transparent !important;
        }
        
        .base-page > header::before {
          content: "" !important;
          position: absolute !important;
          top: 0 !important;
          left: 0 !important;
          right: 0 !important;
          bottom: 0 !important;
          ${
            headerBgColor
              ? `background-color: ${headerBgColor} !important;
                 opacity: ${headerOpacity} !important;`
              : (globalStyle.background_color || globalStyle.blur) &&
                  hasCustomBackground
                ? `background-color: ${globalStyle.background_color || (mode === "dark" ? "rgba(26, 26, 26, 0.7)" : "rgba(255, 255, 255, 0.7)")} !important;`
                : `background-color: ${mode === "dark" ? `rgba(26, 26, 26, ${headerOpacity})` : `rgba(255, 255, 255, ${headerOpacity})`} !important;`
          }
          ${
            headerBlur > 0
              ? `backdrop-filter: blur(${headerBlur}px) saturate(180%) !important;
          -webkit-backdrop-filter: blur(${headerBlur}px) saturate(180%) !important;`
              : (globalStyle.background_color || globalStyle.blur) &&
                  hasCustomBackground &&
                  (globalStyle.blur ?? 25) > 0
                ? `backdrop-filter: blur(${globalStyle.blur ?? 25}px) saturate(180%) !important;
          -webkit-backdrop-filter: blur(${globalStyle.blur ?? 25}px) saturate(180%) !important;`
                : ""
          }
          z-index: 0 !important;
          pointer-events: none !important;
        }
        
        .base-page > header > * {
          position: relative !important;
          z-index: 1 !important;
        }
        `
            : ""
        }

        /* 设置页面背景模糊 - 只影响设置区域的背景层，不影响内部组件 */
        ${
          settingsBlur
            ? `
        .settings-section::before {
          content: "" !important;
          position: absolute !important;
          top: 0 !important;
          left: 0 !important;
          right: 0 !important;
          bottom: 0 !important;
          background-color: ${
            theme.palette.mode === "dark"
              ? `rgba(26, 26, 26, ${settingsOpacity})`
              : `rgba(255, 255, 255, ${settingsOpacity})`
          } !important;
          backdrop-filter: blur(20px) saturate(180%) !important;
          -webkit-backdrop-filter: blur(20px) saturate(180%) !important;
          z-index: -1 !important;
          pointer-events: none !important;
        }
        
        .settings-section {
          position: relative !important;
        }
        `
            : ""
        }

        /* 流量分析页面透明模糊背景 - 当有自定义背景时启用 */
        ${
          hasCustomBackground
            ? `
        .analytics-section::before {
          content: "" !important;
          position: absolute !important;
          top: 0 !important;
          left: 0 !important;
          right: 0 !important;
          bottom: 0 !important;
          background-color: ${
            mode === "dark"
              ? "rgba(50, 50, 50, 0.7)"
              : "rgba(255, 255, 255, 0.7)"
          } !important;
          backdrop-filter: blur(25px) saturate(180%) !important;
          -webkit-backdrop-filter: blur(25px) saturate(180%) !important;
          z-index: -1 !important;
          pointer-events: none !important;
        }
        
        .analytics-section {
          position: relative !important;
          background-color: transparent !important;
        }
        `
            : ""
        }

        ${
          backgroundType === "color" && backgroundColor
            ? `
        /* 纯色背景层 */
        body::before {
          content: "" !important;
          position: fixed !important;
          top: 0 !important;
          left: 0 !important;
          width: 100% !important;
          height: 100% !important;
          background-color: ${backgroundColor} !important;
          opacity: ${backgroundOpacity} !important;
          z-index: 0 !important;
          pointer-events: none !important;
          filter: blur(${backgroundBlur}px) brightness(${backgroundBrightness}%) !important;
        }

        /* 确保主应用容器在背景之上 */
        body > div#root {
          position: relative !important;
          z-index: 1 !important;
        }
        `
            : ""
        }

        ${
          backgroundType === "image" && backgroundImage
            ? (() => {
                console.log(
                  "[CSS Injection] Applying image background:",
                  backgroundImage,
                );
                console.log(
                  "[CSS Injection] Image scale:",
                  backgroundScale.toFixed(2),
                  "Blur:",
                  backgroundBlur + "px",
                  "Opacity:",
                  backgroundOpacity,
                  "Brightness:",
                  backgroundBrightness + "%",
                );
                return `
        /* 图片背景层 - 动态缩放防止模糊白边，实时响应所有参数变化 */
        body::before {
          content: "" !important;
          position: fixed !important;
          top: 50% !important;
          left: 50% !important;
          width: ${(backgroundScale * 100).toFixed(2)}% !important;
          height: ${(backgroundScale * 100).toFixed(2)}% !important;
          transform: translate(-50%, -50%) !important;
          background-image: url("${backgroundImage}") !important;
          background-size: ${backgroundSize} !important;
          background-position: center !important;
          background-repeat: ${backgroundRepeat} !important;
          opacity: ${backgroundOpacity} !important;
          filter: blur(${backgroundBlur}px) brightness(${backgroundBrightness}%) !important;
          z-index: 0 !important;
          pointer-events: none !important;
          transition: width 0.3s ease, height 0.3s ease, opacity 0.3s ease, filter 0.3s ease !important;
        }

        /* 确保主应用容器在背景之上 */
        body > div#root {
          position: relative !important;
          z-index: 1 !important;
        }
        `;
              })()
            : ""
        }

        ${
          backgroundType === "video" && backgroundVideo
            ? (() => {
                console.log(
                  "[CSS Injection] Applying video background:",
                  backgroundVideo,
                );
                console.log(
                  "[CSS Injection] Video scale:",
                  backgroundScale.toFixed(2),
                  "Blur:",
                  backgroundBlur + "px",
                  "Opacity:",
                  backgroundOpacity,
                  "Brightness:",
                  backgroundBrightness + "%",
                );
                return `
        #background-video-container {
          position: fixed !important;
          top: 0 !important;
          left: 0 !important;
          width: 100% !important;
          height: 100% !important;
          z-index: 0 !important;
          overflow: hidden !important;
          pointer-events: none !important;
        }

        #background-video {
          position: absolute !important;
          top: 50% !important;
          left: 50% !important;
          min-width: 100% !important;
          min-height: 100% !important;
          width: auto !important;
          height: auto !important;
          transform: translate(-50%, -50%) scale(${backgroundScale.toFixed(2)}) !important;
          opacity: ${backgroundOpacity} !important;
          filter: blur(${backgroundBlur}px) brightness(${backgroundBrightness}%) !important;
          transition: transform 0.3s ease, opacity 0.3s ease, filter 0.3s ease !important;
        }

        /* 确保主应用容器在背景之上 */
        body > div#root {
          position: relative !important;
          z-index: 1 !important;
        }
        `;
              })()
            : ""
        }

        /* 强制确保所有菜单和弹出层正确显示 */
        .MuiPopover-root,
        .MuiModal-root,
        .MuiPopper-root {
          z-index: 1400 !important;
        }
        
        .MuiPopover-paper,
        .MuiMenu-paper,
        .MuiMenu-list,
        .MuiDialog-paper {
          z-index: 1400 !important;
        }
        
        /* 确保菜单 Paper 不被其他样式影响 */
        .MuiMenu-paper,
        .MuiPopover-paper {
          position: fixed !important;
        }

        /* 设置页面按钮和列表项样式 */
        
        /* Tab 组件样式 */
        .MuiTab-root {
          text-transform: none;
          font-weight: 500;
          min-height: 48px;
          transition: all 0.2s ease;
        }

        .MuiTabs-indicator {
          height: 3px;
        }

        /* Divider 样式 */
        .MuiDivider-root {
          border-color: ${mode === "light" ? "rgba(0, 0, 0, 0.08)" : "rgba(255, 255, 255, 0.08)"};
        }

        /* 原生 option 标签样式 */
        option {
          background-color: ${mode === "light" ? "#FFFFFF" : "#3232326b"};
          color: ${mode === "light" ? "rgba(0, 0, 0, 0.87)" : "rgba(255, 255, 255, 0.87)"};
          padding: 8px 12px;
        }

        option:hover,
        option:focus {
          background-color: ${mode === "light" ? "#F8FAFC" : "rgba(255, 255, 255, 0.08)"};
        }

        /* MUI Select 组件样式 */
        .MuiSelect-select,
        .MuiNativeSelect-select {
          transition: all 0.2s ease !important;
        }

        /* TextField 和 Select 背景色 */
        .MuiOutlinedInput-root {
          background-color: ${mode === "light" ? "#FFFFFF" : "rgba(255, 255, 255, 0.03)"} !important;
        }

        /* TextField 和 Select 边框样式 */
        .MuiOutlinedInput-notchedOutline {
          border-color: ${mode === "light" ? "#E2E8F0" : "rgba(255, 255, 255, 0.12)"} !important;
        }

        .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline {
          border-color: ${mode === "light" ? "#CBD5E1" : "rgba(255, 255, 255, 0.2)"} !important;
        }

        .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline {
          border-color: ${setting.primary_color || dt.primary_color} !important;
          border-width: 2px !important;
        }

        /* TextField 标签样式 */
        .MuiInputLabel-root.Mui-focused {
          color: ${setting.primary_color || dt.primary_color};
        }

        /* 数据网格样式 */
        .MuiDataGrid-root {
          border-color: ${mode === "light" ? "#E2E8F0" : "rgba(255, 255, 255, 0.1)"};
        }

        .MuiDataGrid-cell:focus,
        .MuiDataGrid-cell:focus-within {
          outline: 2px solid ${alpha(setting.primary_color || dt.primary_color, 0.3)};
          outline-offset: -1px;
        }

        .MuiDataGrid-columnHeader:focus,
        .MuiDataGrid-columnHeader:focus-within {
          outline: 2px solid ${alpha(setting.primary_color || dt.primary_color, 0.3)};
          outline-offset: -1px;
        }

        /* 焦点轮廓 */
        * {
          outline: none !important;
        }

        /* 选择器样式 */
        ::selection {
          background-color: ${mode === "light" ? alpha(muiTheme.palette.primary.main, 0.2) : alpha(muiTheme.palette.primary.main, 0.3)};
          color: ${mode === "light" ? muiTheme.palette.text.primary : "#FFFFFF"};
        }

        /* 组件微调样式 */
        ${(() => {
          const styles: string[] = [];

          // Select 下拉框 - 应用自定义样式
          const selectStyle = getComponentStyle("select");
          if (selectStyle) {
            styles.push(`
              .custom-select::before {
                background-color: ${selectStyle.backgroundColor} !important;
                backdrop-filter: blur(${selectStyle.blur}px) saturate(180%) !important;
                -webkit-backdrop-filter: blur(${selectStyle.blur}px) saturate(180%) !important;
              }
            `);
          }

          // Profile 卡片 - 固定位置组件，可以安全使用模糊
          const profileCardStyle = getComponentStyle("profile_card");
          if (profileCardStyle) {
            styles.push(`
              .custom-profile-card {
                background-color: ${profileCardStyle.backgroundColor} !important;
                backdrop-filter: blur(${profileCardStyle.blur}px) saturate(180%) !important;
                -webkit-backdrop-filter: blur(${profileCardStyle.blur}px) saturate(180%) !important;
              }
            `);
          }

          // Proxy 卡片 - 固定位置组件，可以安全使用模糊
          const proxyCardStyle = getComponentStyle("proxy_card");
          if (proxyCardStyle) {
            styles.push(`
              .custom-proxy-card {
                background-color: ${proxyCardStyle.backgroundColor} !important;
                backdrop-filter: blur(${proxyCardStyle.blur}px) saturate(180%) !important;
                -webkit-backdrop-filter: blur(${proxyCardStyle.blur}px) saturate(180%) !important;
              }
            `);
          }

          // Analytics 图表 - 固定位置组件，可以安全使用模糊
          const analyticsChartStyle = getComponentStyle("analytics_chart");
          if (analyticsChartStyle) {
            styles.push(`
              .custom-analytics-chart {
                position: relative !important;
                overflow: hidden !important;
                background-color: ${analyticsChartStyle.backgroundColor} !important;
                backdrop-filter: blur(${analyticsChartStyle.blur}px) saturate(180%) !important;
                -webkit-backdrop-filter: blur(${analyticsChartStyle.blur}px) saturate(180%) !important;
              }
            `);
          }

          // Analytics 头部
          const analyticsHeaderStyle = getComponentStyle("analytics_header");
          if (analyticsHeaderStyle) {
            styles.push(`
              .custom-analytics-header {
                background-color: ${analyticsHeaderStyle.backgroundColor} !important;
                backdrop-filter: blur(${analyticsHeaderStyle.blur}px) saturate(180%) !important;
                -webkit-backdrop-filter: blur(${analyticsHeaderStyle.blur}px) saturate(180%) !important;
              }
            `);
          }

          // Dialog 弹窗
          const dialogStyle = getComponentStyle("dialog");
          if (dialogStyle) {
            styles.push(`
              .custom-dialog .MuiPaper-root {
                background-color: ${dialogStyle.backgroundColor} !important;
              }
            `);
          }

          // 导航栏图标 hover 效果
          if (hasCustomBackground && globalStyle) {
            const baseNavColor =
              globalStyle.background_color ||
              (mode === "dark"
                ? "rgba(26, 26, 26, 0.7)"
                : "rgba(255, 255, 255, 0.7)");
            const navOpacity = globalStyle.opacity ?? 0.7;
            const navBgColor = applyOpacityToColor(baseNavColor, navOpacity);
            const navBlur = globalStyle.blur ?? 25;

            styles.push(`
              .MuiListItemButton-root:not(.custom-proxy-card):hover {
                background-color: ${navBgColor} !important;
                backdrop-filter: blur(${navBlur}px) saturate(180%) !important;
                -webkit-backdrop-filter: blur(${navBlur}px) saturate(180%) !important;
              }
            `);
          }

          return styles.join("\n");
        })()}
      `;

      styleElement.innerHTML = (setting.css_injection || "") + globalStyles;
    }

    const { palette } = muiTheme;
    setTimeout(() => {
      const dom = document.querySelector("#Gradient2");
      if (dom) {
        dom.innerHTML = `
        <stop offset="0%" stop-color="${palette.primary.main}" />
        <stop offset="80%" stop-color="${palette.primary.dark}" />
        <stop offset="100%" stop-color="${palette.primary.dark}" />
        `;
      }
    }, 0);

    return muiTheme;
  }, [
    mode,
    theme_setting,
    i18n.language,
    backgroundType,
    backgroundColor,
    backgroundImage,
    backgroundVideo,
    backgroundOpacity,
    backgroundBlur,
    backgroundBrightness,
    backgroundBlendMode,
    backgroundSize,
    backgroundPosition,
    backgroundRepeat,
    backgroundScale,
    sidebarBgColor,
    sidebarOpacity,
    sidebarBlur,
    headerBgColor,
    headerOpacity,
    headerBlur,
    settingsBlur,
    settingsOpacity,
    componentStyles,
  ]);

  return { theme };
};
