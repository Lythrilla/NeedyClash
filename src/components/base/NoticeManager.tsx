import {
  CheckCircleRounded,
  CloseRounded,
  ErrorRounded,
  InfoRounded,
  WarningRounded,
} from "@mui/icons-material";
import { Box, IconButton, Snackbar, Typography, alpha } from "@mui/material";
import React, { useSyncExternalStore } from "react";

import {
  subscribeNotices,
  hideNotice,
  getSnapshotNotices,
} from "@/services/noticeService";

const severityConfig = {
  success: {
    icon: <CheckCircleRounded />,
    color: "#10b981",
    bgLight: "rgba(16, 185, 129, 0.08)",
    bgDark: "rgba(16, 185, 129, 0.12)",
  },
  error: {
    icon: <ErrorRounded />,
    color: "#ef4444",
    bgLight: "rgba(239, 68, 68, 0.08)",
    bgDark: "rgba(239, 68, 68, 0.12)",
  },
  warning: {
    icon: <WarningRounded />,
    color: "#f59e0b",
    bgLight: "rgba(245, 158, 11, 0.08)",
    bgDark: "rgba(245, 158, 11, 0.12)",
  },
  info: {
    icon: <InfoRounded />,
    color: "#3b82f6",
    bgLight: "rgba(59, 130, 246, 0.08)",
    bgDark: "rgba(59, 130, 246, 0.12)",
  },
};

export const NoticeManager: React.FC = () => {
  const currentNotices = useSyncExternalStore(
    subscribeNotices,
    getSnapshotNotices,
  );

  const handleClose = (id: number) => {
    hideNotice(id);
  };

  return (
    <Box
      sx={{
        position: "fixed",
        top: "20px",
        right: "20px",
        zIndex: 1500,
        display: "flex",
        flexDirection: "column",
        gap: "12px",
        maxWidth: "400px",
        pointerEvents: "none",
      }}
    >
      {currentNotices.map((notice) => {
        const config =
          severityConfig[notice.type as keyof typeof severityConfig] ||
          severityConfig.info;

        return (
          <Snackbar
            key={notice.id}
            open={true}
            anchorOrigin={{ vertical: "top", horizontal: "right" }}
            sx={{
              position: "relative",
              transform: "none",
              top: "auto",
              right: "auto",
              bottom: "auto",
              left: "auto",
              width: "100%",
              pointerEvents: "auto",
            }}
          >
            <Box
              sx={{
                display: "flex",
                alignItems: "flex-start",
                gap: 1.5,
                width: "100%",
                px: 2,
                py: 1.5,
                borderRadius: 2,
                border: "1px solid",
                borderColor: (theme) =>
                  theme.palette.mode === "dark"
                    ? alpha(config.color, 0.2)
                    : alpha(config.color, 0.15),
                backgroundColor: (theme) =>
                  theme.palette.mode === "dark"
                    ? config.bgDark
                    : config.bgLight,
                backdropFilter: "blur(8px)",
                boxShadow: (theme) =>
                  theme.palette.mode === "dark"
                    ? "0 4px 12px rgba(0, 0, 0, 0.3)"
                    : "0 4px 12px rgba(0, 0, 0, 0.1)",
              }}
            >
              {/* 图标 */}
              <Box
                sx={{
                  color: config.color,
                  display: "flex",
                  alignItems: "center",
                  fontSize: 20,
                  mt: 0.25,
                }}
              >
                {config.icon}
              </Box>

              {/* 消息内容 */}
              <Typography
                sx={{
                  flex: 1,
                  fontSize: 13,
                  fontWeight: 500,
                  color: "text.primary",
                  lineHeight: 1.5,
                  wordBreak: "break-word",
                }}
              >
                {notice.message}
              </Typography>

              {/* 关闭按钮 */}
              <IconButton
                size="small"
                onClick={() => handleClose(notice.id)}
                sx={{
                  color: "text.secondary",
                  padding: 0.5,
                  "&:hover": {
                    backgroundColor: (theme) =>
                      alpha(theme.palette.action.hover, 0.5),
                  },
                }}
              >
                <CloseRounded sx={{ fontSize: 18 }} />
              </IconButton>
            </Box>
          </Snackbar>
        );
      })}
    </Box>
  );
};
