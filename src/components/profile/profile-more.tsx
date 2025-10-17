import { FeaturedPlayListRounded } from "@mui/icons-material";
import {
  Box,
  Badge,
  Chip,
  Typography,
  MenuItem,
  Menu,
  IconButton,
  LinearProgress,
} from "@mui/material";
import { useLockFn } from "ahooks";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { EditorViewer } from "@/components/profile/editor-viewer";
import { viewProfile, readProfileFile, saveProfileFile } from "@/services/cmds";
import { showNotice } from "@/services/noticeService";

import { LogViewer } from "./log-viewer";
import { ProfileBox } from "./profile-box";

interface Props {
  logInfo?: [string, string][];
  id: "Merge" | "Script";
  onSave?: (prev?: string, curr?: string) => void;
}

const EMPTY_LOG_INFO: [string, string][] = [];

// profile enhanced item
export const ProfileMore = (props: Props) => {
  const { id, logInfo, onSave } = props;

  const entries = logInfo ?? EMPTY_LOG_INFO;
  const { t } = useTranslation();
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [position, setPosition] = useState({ left: 0, top: 0 });
  const [fileOpen, setFileOpen] = useState(false);
  const [logOpen, setLogOpen] = useState(false);

  const onEditFile = () => {
    setAnchorEl(null);
    setFileOpen(true);
  };

  const onOpenFile = useLockFn(async () => {
    setAnchorEl(null);
    try {
      await viewProfile(id);
    } catch (err: any) {
      showNotice("error", err?.message || err.toString());
    }
  });

  const hasError = entries.some(([level]) => level === "exception");

  const itemMenu = [
    { label: "Edit File", handler: onEditFile },
    { label: "Open File", handler: onOpenFile },
  ];

  return (
    <>
      <ProfileBox
        className="custom-profile-card"
        onDoubleClick={onEditFile}
        onContextMenu={(event) => {
          const { clientX, clientY } = event;
          setPosition({ top: clientY, left: clientX });
          setAnchorEl(event.currentTarget as HTMLElement);
          event.preventDefault();
        }}
      >
        {/* 第一行：标题栏 */}
        <Box sx={{ display: "flex", alignItems: "center", mb: 0.5 }}>
          <Typography
            width="calc(100% - 52px)"
            variant="h6"
            component="h2"
            noWrap
            title={t(`Global ${id}`)}
          >
            {t(`Global ${id}`)}
          </Typography>

          <Chip
            label={id}
            color="primary"
            size="small"
            variant="outlined"
            sx={{ height: 20, textTransform: "capitalize" }}
          />
        </Box>

        {/* 第二行：空行占位，保持与订阅卡片一致 */}
        <Box sx={{ height: 26, display: "flex", alignItems: "center" }}>
          <Typography sx={{ fontSize: "14px", color: "text.secondary" }}>
            {t("Global Configuration")}
          </Typography>
        </Box>

        {/* 第三行：控制台按钮 */}
        <Box sx={{ 
          height: 26, 
          display: "flex", 
          alignItems: "center",
          justifyContent: "space-between",
        }}>
          {id === "Script" &&
            (hasError ? (
              <Badge color="error" variant="dot" overlap="circular">
                <IconButton
                  size="small"
                  edge="start"
                  color="error"
                  title={t("Script Console")}
                  onClick={() => setLogOpen(true)}
                >
                  <FeaturedPlayListRounded fontSize="inherit" />
                </IconButton>
              </Badge>
            ) : (
              <IconButton
                size="small"
                edge="start"
                color="inherit"
                title={t("Script Console")}
                onClick={() => setLogOpen(true)}
              >
                <FeaturedPlayListRounded fontSize="inherit" />
              </IconButton>
            ))}
        </Box>

        {/* 占位进度条，保持与订阅卡片一致的高度 */}
        <LinearProgress
          variant="determinate"
          value={0}
          sx={{ opacity: 0 }}
        />
      </ProfileBox>

      <Menu
        open={!!anchorEl}
        anchorEl={anchorEl}
        onClose={() => setAnchorEl(null)}
        anchorPosition={position}
        anchorReference="anchorPosition"
        transitionDuration={225}
        MenuListProps={{ sx: { py: 0.5 } }}
        PaperProps={{
          sx: {
            position: 'fixed',
            backgroundColor: (theme) =>
              theme.palette.mode === "light" ? "rgba(255, 255, 255, 0.95)" : "rgba(50, 50, 50, 0.95)",
            backdropFilter: "blur(20px) saturate(180%)",
            WebkitBackdropFilter: "blur(20px) saturate(180%)",
            border: (theme) =>
              `1px solid ${theme.palette.mode === "light" ? "#E2E8F0" : "rgba(255, 255, 255, 0.1)"}`,
            zIndex: 1400,
          },
        }}
        onContextMenu={(e) => {
          setAnchorEl(null);
          e.preventDefault();
        }}
      >
        {itemMenu
          .filter((item: any) => item.show !== false)
          .map((item) => (
            <MenuItem
              key={item.label}
              onClick={item.handler}
              sx={[
                { minWidth: 120 },
                (theme) => {
                  return {
                    color:
                      item.label === "Delete"
                        ? theme.palette.error.main
                        : undefined,
                  };
                },
              ]}
              dense
            >
              {t(item.label)}
            </MenuItem>
          ))}
      </Menu>
      {fileOpen && (
        <EditorViewer
          open={true}
          title={`${t("Global " + id)}`}
          initialData={readProfileFile(id)}
          language={id === "Merge" ? "yaml" : "javascript"}
          schema={id === "Merge" ? "clash" : undefined}
          onSave={async (prev, curr) => {
            await saveProfileFile(id, curr ?? "");
            onSave?.(prev, curr);
          }}
          onClose={() => setFileOpen(false)}
        />
      )}
      {logOpen && (
        <LogViewer
          open={logOpen}
          logInfo={entries}
          onClose={() => setLogOpen(false)}
        />
      )}
    </>
  );
};
