import getSystem from "@/utils/get-system";
const OS = getSystem();

// 配色
export const defaultTheme = {
  primary_color: "#7C3AED",
  secondary_color: "#EC4899",
  primary_text: "#0F172A",
  secondary_text: "#64748B",
  info_color: "#0EA5E9",
  error_color: "#F43F5E",
  warning_color: "#F59E0B",
  success_color: "#10B981",
  background_color: "#F8FAFC",
  font_family: `-apple-system, BlinkMacSystemFont,"Microsoft YaHei UI", "Microsoft YaHei", Roboto, "Helvetica Neue", Arial, sans-serif, "Apple Color Emoji"${
    OS === "windows" ? ", twemoji mozilla" : ""
  }`,
};

// 深色模式
export const defaultDarkTheme = {
  ...defaultTheme,
  primary_color: "#A78BFA",
  secondary_color: "#F472B6",
  primary_text: "#E2E8F0",
  background_color: "#282828",
  secondary_text: "#94A3B8",
  info_color: "#60A5FA",
  error_color: "#F87171",
  warning_color: "#FBBF24",
  success_color: "#34D399",
};
