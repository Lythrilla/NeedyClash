import getSystem from "@/utils/get-system";
const OS = getSystem();

// 现代化主题配色 - 大胆、简约、极致扁平
export const defaultTheme = {
  primary_color: "#6366F1", // 靛蓝色 - 更有个性的主色
  secondary_color: "#EC4899", // 粉红色 - 活力辅助色
  primary_text: "#0F172A", // 极深灰文字
  secondary_text: "#64748B", // 石板灰文字
  info_color: "#0EA5E9",
  error_color: "#F43F5E",
  warning_color: "#F59E0B",
  success_color: "#22C55E",
  background_color: "#F8FAFC", // 浅灰背景
  font_family: `-apple-system, BlinkMacSystemFont,"Microsoft YaHei UI", "Microsoft YaHei", Roboto, "Helvetica Neue", Arial, sans-serif, "Apple Color Emoji"${
    OS === "windows" ? ", twemoji mozilla" : ""
  }`,
};

// 深色模式 - 极致扁平设计
export const defaultDarkTheme = {
  ...defaultTheme,
  primary_color: "#818CF8", // 亮靛蓝
  secondary_color: "#F472B6", // 亮粉红
  primary_text: "#F1F5F9", // 浅色文字
  background_color: "#0F172A", // 深蓝黑背景
  secondary_text: "#94A3B8", // 石板灰
  info_color: "#38BDF8",
  error_color: "#FB7185",
  warning_color: "#FBBF24",
  success_color: "#4ADE80",
};
