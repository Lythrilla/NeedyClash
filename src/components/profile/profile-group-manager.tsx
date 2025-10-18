import { DeleteRounded, EditRounded, FolderRounded } from "@mui/icons-material";
import {
  Box,
  IconButton,
  MenuItem,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { useLockFn } from "ahooks";
import { forwardRef, useImperativeHandle, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { BaseDialog, GlassSelect } from "@/components/base";
import {
  EnhancedDialogTitle,
  EnhancedFormGroup,
  EnhancedFormItem,
} from "@/components/setting/mods/enhanced-dialog-components";
import { useProfiles } from "@/hooks/use-profiles";
import { patchProfile } from "@/services/cmds";
import { showNotice } from "@/services/noticeService";

export interface ProfileGroupManagerRef {
  open: () => void;
}

interface ProfileGroupManagerProps {
  onGroupChange?: (groupId: string | null) => void;
}

const DEFAULT_COLORS = [
  "#7C3AED",
  "#3B82F6",
  "#10B981",
  "#F59E0B",
  "#EF4444",
  "#EC4899",
  "#8B5CF6",
  "#06B6D4",
];

export const ProfileGroupManager = forwardRef<
  ProfileGroupManagerRef,
  ProfileGroupManagerProps
>(({ onGroupChange }, ref) => {
  const { t } = useTranslation();
  const { profiles, patchProfiles, mutateProfiles } = useProfiles();
  const [open, setOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<IProfileGroup | null>(null);
  const [groupName, setGroupName] = useState("");
  const [groupColor, setGroupColor] = useState(DEFAULT_COLORS[0]);
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);

  const groups = profiles?.groups || [];

  const groupCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    profiles?.items?.forEach((item) => {
      if (item.group_id) {
        counts[item.group_id] = (counts[item.group_id] || 0) + 1;
      }
    });
    return counts;
  }, [profiles?.items]);

  useImperativeHandle(ref, () => ({
    open: () => setOpen(true),
  }));

  const handleClose = () => {
    setOpen(false);
    setEditingGroup(null);
    setGroupName("");
    setGroupColor(DEFAULT_COLORS[0]);
  };

  const handleSave = useLockFn(async () => {
    if (!groupName.trim()) {
      showNotice("error", t("Group name cannot be empty"));
      return;
    }

    // 验证颜色格式
    const colorRegex = /^#[0-9A-Fa-f]{6}$/;
    if (!colorRegex.test(groupColor)) {
      showNotice("error", t("Invalid color format. Please use #RRGGBB format"));
      return;
    }

    try {
      const newGroups = [...groups];
      if (editingGroup) {
        const index = newGroups.findIndex((g) => g.id === editingGroup.id);
        if (index !== -1) {
          newGroups[index] = {
            ...editingGroup,
            name: groupName.trim(),
            color: groupColor.toUpperCase(),
          };
        }
      } else {
        newGroups.push({
          id: `g_${Date.now()}`,
          name: groupName.trim(),
          color: groupColor.toUpperCase(),
        });
      }

      await patchProfiles({ groups: newGroups });
      await mutateProfiles();
      handleClose();
      showNotice("success", t("Group saved successfully"));
    } catch (e: any) {
      showNotice("error", e.message || e.toString());
    }
  });

  const handleDelete = useLockFn(async (groupId: string) => {
    try {
      const newGroups = groups.filter((g) => g.id !== groupId);
      await patchProfiles({ groups: newGroups });

      const affectedItems =
        profiles?.items?.filter((item) => item.group_id === groupId) || [];
      for (const item of affectedItems) {
        if (item.uid) {
          await patchProfile(item.uid, { group_id: undefined } as any);
        }
      }

      await mutateProfiles();
      showNotice("success", t("Group deleted successfully"));
    } catch (e: any) {
      showNotice("error", e.message || e.toString());
    }
  });

  const handleEdit = (group: IProfileGroup) => {
    setEditingGroup(group);
    setGroupName(group.name);
    setGroupColor(group.color || DEFAULT_COLORS[0]);
  };

  const handleGroupSelect = (groupId: string | null) => {
    setSelectedGroup(groupId);
    onGroupChange?.(groupId);
  };

  return (
    <>
      <Box
        sx={{ display: "flex", alignItems: "center", gap: 1, width: "100%" }}
      >
        <Typography
          sx={{
            fontSize: 11,
            fontWeight: 600,
            color: "text.disabled",
            textTransform: "uppercase",
            letterSpacing: "0.5px",
          }}
        >
          {t("Group")}
        </Typography>

        <GlassSelect
          value={selectedGroup || "all"}
          onChange={(e) =>
            handleGroupSelect(
              (e.target.value as string) === "all"
                ? null
                : (e.target.value as string),
            )
          }
          size="small"
          sx={{
            minWidth: 140,
            flex: 1,
            maxWidth: 300,
          }}
        >
          <MenuItem value="all">
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <FolderRounded sx={{ fontSize: 16 }} />
              <span>{t("All Profiles")}</span>
            </Box>
          </MenuItem>
          {groups.map((group) => (
            <MenuItem key={group.id} value={group.id}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Box
                  sx={{
                    width: 12,
                    height: 12,
                    borderRadius: "var(--cv-border-radius-xs)",
                    bgcolor: group.color || DEFAULT_COLORS[0],
                  }}
                />
                <span>{group.name}</span>
              </Box>
            </MenuItem>
          ))}
        </GlassSelect>

        <Tooltip title={t("Manage Groups")} arrow>
          <IconButton
            size="small"
            onClick={() => setOpen(true)}
            sx={{
              width: 28,
              height: 28,
              "&:hover": { bgcolor: "action.hover" },
            }}
          >
            <EditRounded sx={{ fontSize: 18 }} />
          </IconButton>
        </Tooltip>
      </Box>

      <BaseDialog
        open={open}
        title=""
        contentSx={{ width: 520, maxHeight: 680, px: 3, py: 3 }}
        okBtn={t("Save")}
        cancelBtn={t("Cancel")}
        disableOk={!groupName.trim()}
        onClose={handleClose}
        onCancel={handleClose}
        onOk={handleSave}
      >
        <EnhancedDialogTitle
          title={editingGroup ? t("Edit Group") : t("Manage Groups")}
        />

        {!editingGroup && groups.length > 0 && (
          <EnhancedFormGroup title={t("Existing Groups")}>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
              {groups.map((group) => (
                <Box
                  key={group.id}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    p: 1.5,
                    borderRadius: "var(--cv-border-radius-sm)",
                    border: (theme) => `1px solid ${theme.palette.divider}`,
                    transition: "all 0.15s ease",
                    "&:hover": {
                      borderColor: "primary.main",
                      bgcolor: "action.hover",
                    },
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                    <Box
                      sx={{
                        width: 16,
                        height: 16,
                        borderRadius: "var(--cv-border-radius-xs)",
                        bgcolor: group.color || DEFAULT_COLORS[0],
                      }}
                    />
                    <Box>
                      <Typography sx={{ fontSize: 13, fontWeight: 500 }}>
                        {group.name}
                      </Typography>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ fontSize: 11 }}
                      >
                        {groupCounts[group.id] || 0} {t("profiles")}
                      </Typography>
                    </Box>
                  </Box>
                  <Box sx={{ display: "flex", gap: 0.5 }}>
                    <IconButton
                      size="small"
                      onClick={() => handleEdit(group)}
                      sx={{ width: 24, height: 24 }}
                    >
                      <EditRounded sx={{ fontSize: 16 }} />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleDelete(group.id)}
                      sx={{ width: 24, height: 24 }}
                    >
                      <DeleteRounded sx={{ fontSize: 16 }} />
                    </IconButton>
                  </Box>
                </Box>
              ))}
            </Box>
          </EnhancedFormGroup>
        )}

        <EnhancedFormGroup
          title={editingGroup ? t("Edit Group") : t("New Group")}
        >
          <EnhancedFormItem label={t("Group Name")} fullWidth>
            <TextField
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              fullWidth
              size="small"
              autoFocus
              placeholder={t("Enter group name") as string}
            />
          </EnhancedFormItem>

          <EnhancedFormItem label={t("Color")} fullWidth>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {/* 预设颜色 */}
              <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                {DEFAULT_COLORS.map((color) => (
                  <Box
                    key={color}
                    onClick={() => setGroupColor(color)}
                    sx={{
                      width: 32,
                      height: 32,
                      borderRadius: "var(--cv-border-radius-sm)",
                      bgcolor: color,
                      cursor: "pointer",
                      border: (theme) =>
                        groupColor === color
                          ? `2px solid ${theme.palette.text.primary}`
                          : `1px solid ${theme.palette.divider}`,
                      "&:hover": {
                        opacity: 0.8,
                      },
                      transition: "all 0.15s ease",
                    }}
                  />
                ))}
              </Box>

              {/* 自定义颜色 */}
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ minWidth: 80 }}
                >
                  {t("Custom")}:
                </Typography>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Box
                    component="input"
                    type="color"
                    value={groupColor}
                    onChange={(e: any) => setGroupColor(e.target.value)}
                    sx={{
                      width: 50,
                      height: 32,
                      border: "1px solid",
                      borderColor: "divider",
                      borderRadius: "var(--cv-border-radius-sm)",
                      cursor: "pointer",
                      bgcolor: "transparent",
                      "&::-webkit-color-swatch-wrapper": {
                        padding: 0,
                      },
                      "&::-webkit-color-swatch": {
                        border: "none",
                        borderRadius: "var(--cv-border-radius-xs)",
                      },
                    }}
                  />
                  <TextField
                    size="small"
                    value={groupColor.toUpperCase()}
                    onChange={(e) => {
                      let value = e.target.value;
                      // 自动添加 # 前缀
                      if (!value.startsWith("#")) {
                        value = "#" + value.replace(/[^0-9A-Fa-f]/g, "");
                      }
                      // 验证格式并限制长度
                      if (/^#[0-9A-Fa-f]{0,6}$/.test(value)) {
                        setGroupColor(value);
                      }
                    }}
                    onBlur={(e) => {
                      // 失去焦点时补全为6位
                      const value = e.target.value.replace("#", "");
                      if (value.length > 0 && value.length < 6) {
                        setGroupColor("#" + value.padEnd(6, "0"));
                      }
                    }}
                    placeholder="#7C3AED"
                    sx={{
                      width: 100,
                      "& .MuiOutlinedInput-root": {
                        height: 32,
                        fontSize: 13,
                        fontFamily: "monospace",
                      },
                    }}
                  />
                </Box>
              </Box>
            </Box>
          </EnhancedFormItem>
        </EnhancedFormGroup>
      </BaseDialog>
    </>
  );
});
