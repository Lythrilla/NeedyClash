import {
  CheckRounded,
  DeleteRounded,
} from "@mui/icons-material";
import { Box, IconButton, alpha } from "@mui/material";
import { useTranslation } from "react-i18next";

import type { ThemePreset } from "./theme-types";

interface Props {
  preset: ThemePreset;
  isActive: boolean;
  onApply: (preset: ThemePreset) => void;
  onDelete?: (preset: ThemePreset) => void;
}

export const ThemePresetCard = ({ preset, isActive, onApply, onDelete }: Props) => {
  const { t } = useTranslation();

  return (
    <Box
      onClick={() => onApply(preset)}
      sx={{
        position: "relative",
        overflow: "hidden",
        cursor: "pointer",
        border: 1,
        borderColor: isActive ? "primary.main" : "divider",
        transition: "all 0.2s",
        "&:hover": {
          borderColor: "primary.main",
          boxShadow: 1,
          "& .delete-btn": {
            opacity: 1,
          },
        },
      }}
    >
      {/* 删除按钮 */}
      {preset.isCustom && onDelete && (
        <IconButton
          className="delete-btn"
          size="small"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(preset);
          }}
          sx={{
            position: "absolute",
            top: 4,
            right: 4,
            width: 20,
            height: 20,
            opacity: 0,
            transition: "opacity 0.2s",
            backgroundColor: "error.main",
            color: "#fff",
            zIndex: 2,
            "&:hover": {
              backgroundColor: "error.dark",
            },
          }}
        >
          <DeleteRounded sx={{ fontSize: 14 }} />
        </IconButton>
      )}

      {/* 激活指示器 */}
      {isActive && (
        <Box
          sx={{
            position: "absolute",
            top: 4,
            right: 4,
            width: 18,
            height: 18,
            backgroundColor: "primary.main",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 2,
          }}
        >
          <CheckRounded sx={{ fontSize: 12, color: "#fff" }} />
        </Box>
      )}

      {/* 主题预览 */}
      <Box sx={{ p: 1 }}>
        {/* 渐变色块 */}
        <Box
          sx={{
            height: 40,
            background: `linear-gradient(135deg, ${preset.primary_color} 0%, ${preset.secondary_color} 100%)`,
            mb: 0.5,
          }}
        />

        {/* 颜色点 */}
        <Box sx={{ display: "flex", gap: 0.5, mb: 0.5 }}>
          {[preset.info_color, preset.success_color, preset.warning_color, preset.error_color].map((color, i) => (
            <Box
              key={i}
              sx={{
                flex: 1,
                height: 4,
                backgroundColor: color,
              }}
            />
          ))}
        </Box>

        {/* 主题名称 */}
        <Box
          sx={{
            fontSize: 11,
            fontWeight: isActive ? 600 : 500,
            color: isActive ? "primary.main" : "text.secondary",
            textAlign: "center",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {preset.name}
        </Box>
      </Box>
    </Box>
  );
};
