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
        cursor: "pointer",
        borderRadius: "10px",
        backgroundColor: "transparent",
        border: isActive ? "2px solid" : "1px solid",
        borderColor: isActive 
          ? "primary.main" 
          : (theme) => theme.palette.mode === "light" 
            ? "rgba(0, 0, 0, 0.1)" 
            : "rgba(255, 255, 255, 0.1)",
        transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
        "&:hover": {
          borderColor: "primary.main",
          transform: "translateY(-2px)",
          boxShadow: (theme) => `0 4px 12px ${alpha(theme.palette.primary.main, 0.2)}`,
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
            top: 6,
            right: 6,
            width: 22,
            height: 22,
            opacity: 0,
            transition: "all 0.2s ease",
            backgroundColor: (theme) => alpha(theme.palette.error.main, 0.95),
            color: "#fff",
            zIndex: 3,
            "&:hover": {
              backgroundColor: "error.dark",
              transform: "scale(1.1)",
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
            top: 6,
            right: 6,
            width: 22,
            height: 22,
            borderRadius: "50%",
            backgroundColor: "primary.main",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 2,
            boxShadow: (theme) => `0 2px 4px ${alpha(theme.palette.primary.main, 0.3)}`,
          }}
        >
          <CheckRounded sx={{ fontSize: 14, color: "#fff" }} />
        </Box>
      )}

      {/* 主题预览 */}
      <Box sx={{ p: 1.5 }}>
        {/* 主色渐变块 */}
        <Box
          sx={{
            height: 56,
            borderRadius: "8px",
            background: `linear-gradient(135deg, ${preset.primary_color} 0%, ${preset.secondary_color} 100%)`,
            mb: 1.25,
            boxShadow: (theme) => theme.palette.mode === "light"
              ? `0 2px 8px ${alpha(preset.primary_color, 0.3)}`
              : `0 2px 8px ${alpha(preset.primary_color, 0.4)}`,
            position: "relative",
            overflow: "hidden",
            "&::after": {
              content: '""',
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: "linear-gradient(135deg, rgba(255,255,255,0.15) 0%, transparent 60%)",
              pointerEvents: "none",
            },
          }}
        />

        {/* 主题名称 */}
        <Box
          sx={{
            fontSize: 13,
            fontWeight: isActive ? 600 : 500,
            color: isActive ? "primary.main" : "text.primary",
            textAlign: "center",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            transition: "color 0.2s ease",
          }}
        >
          {preset.name}
        </Box>
      </Box>
    </Box>
  );
};
