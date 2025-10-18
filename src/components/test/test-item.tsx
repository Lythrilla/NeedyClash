import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { LanguageRounded } from "@mui/icons-material";
import { Box, MenuItem, Menu, alpha, useTheme } from "@mui/material";
import { convertFileSrc } from "@tauri-apps/api/core";
import { UnlistenFn } from "@tauri-apps/api/event";
import { useLockFn } from "ahooks";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { BaseLoading } from "@/components/base";
import { useListen } from "@/hooks/use-listen";
import { cmdTestDelay, downloadIconCache } from "@/services/cmds";
import delayManager from "@/services/delay";
import { showNotice } from "@/services/noticeService";

interface Props {
  id: string;
  itemData: IVergeTestItem;
  onEdit: () => void;
  onDelete: (uid: string) => void;
}

export const TestItem = ({
  id,
  itemData,
  onEdit,
  onDelete: removeTest,
}: Props) => {
  const theme = useTheme();
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id,
  });

  const { t } = useTranslation();
  const [anchorEl, setAnchorEl] = useState<any>(null);
  const [position, setPosition] = useState({ left: 0, top: 0 });
  const [delay, setDelay] = useState(-1);
  const { uid, name, icon, url } = itemData;
  const [iconCachePath, setIconCachePath] = useState("");
  const { addListener } = useListen();

  const onDelay = useCallback(async () => {
    setDelay(-2);
    const result = await cmdTestDelay(url);
    setDelay(result);
  }, [url]);

  const initIconCachePath = useCallback(async () => {
    if (icon && icon.trim().startsWith("http")) {
      const fileName = uid + "-" + getFileName(icon);
      const iconPath = await downloadIconCache(icon, fileName);
      setIconCachePath(convertFileSrc(iconPath));
    } else {
      setIconCachePath("");
    }
  }, [icon, uid]);

  useEffect(() => {
    void initIconCachePath();
  }, [initIconCachePath]);

  function getFileName(url: string) {
    return url.substring(url.lastIndexOf("/") + 1);
  }

  const onEditTest = () => {
    setAnchorEl(null);
    onEdit();
  };

  const onDelete = useLockFn(async () => {
    setAnchorEl(null);
    try {
      removeTest(uid);
    } catch (err: any) {
      showNotice("error", err.message || err.toString());
    }
  });

  const menu = [
    { label: "Edit", handler: onEditTest },
    { label: "Delete", handler: onDelete },
  ];

  useEffect(() => {
    let unlistenFn: UnlistenFn | null = null;

    const setupListener = async () => {
      if (unlistenFn) {
        unlistenFn();
      }
      unlistenFn = await addListener("verge://test-all", () => {
        onDelay();
      });
    };

    setupListener();

    return () => {
      if (unlistenFn) {
        console.log(
          `TestItem for ${id} unmounting or url changed, cleaning up test-all listener.`,
        );
        unlistenFn();
      }
    };
  }, [url, addListener, onDelay, id]);

  return (
    <Box
      sx={{
        position: "relative",
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? "calc(infinity)" : undefined,
      }}
    >
      <Box
        ref={setNodeRef}
        {...attributes}
        {...listeners}
        onContextMenu={(event) => {
          const { clientX, clientY } = event;
          setPosition({ top: clientY, left: clientX });
          setAnchorEl(event.currentTarget);
          event.preventDefault();
        }}
        sx={{
          position: "relative",
          padding: "6px",
          border: "1px solid",
          borderColor: "divider",
          borderRadius: "var(--cv-border-radius-sm)",
          backgroundColor: "transparent",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          cursor: isDragging ? "grabbing" : "grab",
          transition: "all 0.15s",
          "&:hover": {
            borderColor: "primary.main",
            backgroundColor: alpha(theme.palette.primary.main, 0.04),
          },
        }}
      >
        {/* 图标 */}
        <Box
          sx={{
            width: "28px",
            height: "28px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            mb: 0.5,
            opacity: 0.8,
          }}
        >
          {icon && icon.trim() !== "" ? (
            <>
              {icon.trim().startsWith("http") && (
                <img
                  src={iconCachePath === "" ? icon : iconCachePath}
                  height="28px"
                  style={{ maxWidth: "28px", objectFit: "contain" }}
                />
              )}
              {icon.trim().startsWith("data") && (
                <img
                  src={icon}
                  height="28px"
                  style={{ maxWidth: "28px", objectFit: "contain" }}
                />
              )}
              {icon.trim().startsWith("<svg") && (
                <img
                  src={`data:image/svg+xml;base64,${btoa(icon)}`}
                  height="28px"
                  style={{ maxWidth: "28px", objectFit: "contain" }}
                />
              )}
            </>
          ) : (
            <LanguageRounded sx={{ fontSize: "28px", opacity: 0.6 }} />
          )}
        </Box>

        {/* 名称 */}
        <Box
          sx={{
            fontSize: "9px",
            fontWeight: 400,
            color: "text.secondary",
            textAlign: "center",
            mb: 0.5,
            maxWidth: "100%",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {name}
        </Box>

        {/* 延迟显示 */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            minHeight: "18px",
          }}
        >
          {delay === -2 && <BaseLoading />}

          {delay === -1 && (
            <Box
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onDelay();
              }}
              sx={{
                fontSize: "8px",
                padding: "2px 4px",
                cursor: "pointer",
                color: "primary.main",
                opacity: 0.6,
                "&:hover": {
                  opacity: 1,
                  backgroundColor: alpha(theme.palette.primary.main, 0.08),
                },
              }}
            >
              {t("Test")}
            </Box>
          )}

          {delay >= 0 && (
            <Box
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onDelay();
              }}
              sx={{
                fontSize: "8px",
                fontWeight: 500,
                padding: "2px 4px",
                cursor: "pointer",
                color: delayManager.formatDelayColor(delay),
                "&:hover": {
                  backgroundColor: alpha(theme.palette.primary.main, 0.08),
                },
              }}
            >
              {delayManager.formatDelay(delay)}
            </Box>
          )}
        </Box>
      </Box>

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
            position: "fixed",
            backgroundColor: (theme) =>
              theme.palette.mode === "light"
                ? "rgba(255, 255, 255, 0.95)"
                : "rgba(50, 50, 50, 0.95)",
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
        {menu.map((item) => (
          <MenuItem
            key={item.label}
            onClick={item.handler}
            sx={{ minWidth: 120 }}
            dense
          >
            {t(item.label)}
          </MenuItem>
        ))}
      </Menu>
    </Box>
  );
};
