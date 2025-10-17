import {
  InputAdornment,
  MenuItem,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
} from "@mui/material";
import { useLockFn } from "ahooks";
import type { Ref } from "react";
import { useEffect, useImperativeHandle, useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";

import { BaseDialog, Switch } from "@/components/base";
import { GlassSelect } from "@/components/base";
import {
  EnhancedDialogTitle,
  EnhancedFormGroup,
  EnhancedFormItem,
} from "@/components/setting/mods/enhanced-dialog-components";
import { useProfiles } from "@/hooks/use-profiles";
import { createProfile, patchProfile } from "@/services/cmds";
import { showNotice } from "@/services/noticeService";
import { version } from "@root/package.json";

import { FileInput } from "./file-input";

interface Props {
  onChange: (isActivating?: boolean) => void;
}

export interface ProfileViewerRef {
  create: () => void;
  edit: (item: IProfileItem) => void;
}

// create or edit the profile
// remote / local
type ProfileViewerProps = Props & { ref?: Ref<ProfileViewerRef> };

export function ProfileViewer({ onChange, ref }: ProfileViewerProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [openType, setOpenType] = useState<"new" | "edit">("new");
  const [loading, setLoading] = useState(false);
  const { profiles } = useProfiles();

  // file input
  const fileDataRef = useRef<string | null>(null);

  const { control, watch, setValue, reset, handleSubmit, getValues } =
    useForm<IProfileItem>({
      defaultValues: {
        type: "remote",
        name: "",
        desc: "",
        url: "",
        option: {
          with_proxy: false,
          self_proxy: false,
        },
      },
    });

  useImperativeHandle(ref, () => ({
    create: () => {
      setOpenType("new");
      setOpen(true);
    },
    edit: (item: IProfileItem) => {
      if (item) {
        Object.entries(item).forEach(([key, value]) => {
          setValue(key as any, value);
        });
      }
      setOpenType("edit");
      setOpen(true);
    },
  }));

  const selfProxy = watch("option.self_proxy");
  const withProxy = watch("option.with_proxy");

  useEffect(() => {
    if (selfProxy) setValue("option.with_proxy", false);
  }, [selfProxy, setValue]);

  useEffect(() => {
    if (withProxy) setValue("option.self_proxy", false);
  }, [setValue, withProxy]);

  const handleOk = useLockFn(
    handleSubmit(async (form) => {
      if (form.option?.timeout_seconds) {
        form.option.timeout_seconds = +form.option.timeout_seconds;
      }

      setLoading(true);
      try {
        // 基本验证
        if (!form.type) throw new Error("`Type` should not be null");
        if (form.type === "remote" && !form.url) {
          throw new Error("The URL should not be null");
        }

        // 处理表单数据
        if (form.option?.update_interval) {
          form.option.update_interval = +form.option.update_interval;
        } else {
          delete form.option?.update_interval;
        }
        if (form.option?.user_agent === "") {
          delete form.option.user_agent;
        }

        const name = form.name || `${form.type} file`;
        const item = { ...form, name };
        const isRemote = form.type === "remote";
        const isUpdate = openType === "edit";

        // 判断是否是当前激活的配置
        const isActivating = isUpdate && form.uid === (profiles?.current ?? "");

        // 保存原始代理设置以便回退成功后恢复
        const originalOptions = {
          with_proxy: form.option?.with_proxy,
          self_proxy: form.option?.self_proxy,
        };

        // 执行创建或更新操作，本地配置不需要回退机制
        if (!isRemote) {
          if (openType === "new") {
            await createProfile(item, fileDataRef.current);
          } else {
            if (!form.uid) throw new Error("UID not found");
            await patchProfile(form.uid, item);
          }
        } else {
          // 远程配置使用回退机制
          try {
            // 尝试正常操作
            if (openType === "new") {
              await createProfile(item, fileDataRef.current);
            } else {
              if (!form.uid) throw new Error("UID not found");
              await patchProfile(form.uid, item);
            }
          } catch {
            // 首次创建/更新失败，尝试使用自身代理
            showNotice(
              "info",
              t("Profile creation failed, retrying with Clash proxy..."),
            );

            // 使用自身代理的配置
            const retryItem = {
              ...item,
              option: {
                ...item.option,
                with_proxy: false,
                self_proxy: true,
              },
            };

            // 使用自身代理再次尝试
            if (openType === "new") {
              await createProfile(retryItem, fileDataRef.current);
            } else {
              if (!form.uid) throw new Error("UID not found");
              await patchProfile(form.uid, retryItem);

              // 编辑模式下恢复原始代理设置
              await patchProfile(form.uid, { option: originalOptions });
            }

            showNotice(
              "success",
              t("Profile creation succeeded with Clash proxy"),
            );
          }
        }

        // 成功后的操作
        setOpen(false);
        setTimeout(() => reset(), 500);
        fileDataRef.current = null;

        // 优化：UI先关闭，异步通知父组件
        setTimeout(() => {
          onChange(isActivating);
        }, 0);
      } catch (err: any) {
        showNotice("error", err.message || err.toString());
      } finally {
        setLoading(false);
      }
    }),
  );

  const handleClose = () => {
    try {
      setOpen(false);
      fileDataRef.current = null;
      setTimeout(() => reset(), 500);
    } catch (e) {
      console.warn("[ProfileViewer] handleClose error:", e);
    }
  };

  const formType = watch("type");
  const isRemote = formType === "remote";
  const isLocal = formType === "local";

  return (
    <BaseDialog
      open={open}
      title=""
      contentSx={{ width: 520, maxHeight: 680, px: 3, py: 3 }}
      okBtn={t("Save")}
      cancelBtn={t("Cancel")}
      onClose={handleClose}
      onCancel={handleClose}
      onOk={handleOk}
      loading={loading}
    >
      {/* 标题 */}
      <EnhancedDialogTitle
        title={openType === "new" ? t("Create Profile") : t("Edit Profile")}
      />

      {/* 基本配置 */}
      <EnhancedFormGroup title={t("Basic Settings")}>
        <EnhancedFormItem label={t("Type")}>
          <Controller
            name="type"
            control={control}
            render={({ field }) => (
              <ToggleButtonGroup
                {...field}
                exclusive
                size="small"
                sx={{
                  "& .MuiToggleButton-root": {
                    px: 2,
                    py: 0.5,
                    fontSize: "13px",
                    textTransform: "none",
                  },
                }}
              >
                <ToggleButton value="remote">Remote</ToggleButton>
                <ToggleButton value="local">Local</ToggleButton>
              </ToggleButtonGroup>
            )}
          />
        </EnhancedFormItem>

        <EnhancedFormItem label={t("Name")} fullWidth>
          <Controller
            name="name"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                size="small"
                fullWidth
                placeholder={t("Profile name")}
              />
            )}
          />
        </EnhancedFormItem>

        <EnhancedFormItem label={t("Descriptions")} fullWidth>
          <Controller
            name="desc"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                size="small"
                fullWidth
                placeholder={t("Optional description")}
              />
            )}
          />
        </EnhancedFormItem>

        <EnhancedFormItem label={t("Group")} fullWidth>
          <Controller
            name="group_id"
            control={control}
            render={({ field }) => (
              <GlassSelect
                {...field}
                size="small"
                fullWidth
                displayEmpty
              >
                <MenuItem value="">{t("No Group")}</MenuItem>
                {(profiles?.groups || []).map((group) => (
                  <MenuItem key={group.id} value={group.id}>
                    {group.name}
                  </MenuItem>
                ))}
              </GlassSelect>
            )}
          />
        </EnhancedFormItem>
      </EnhancedFormGroup>

      {/* 远程订阅配置 */}
      {isRemote && (
        <EnhancedFormGroup title={t("Remote Settings")}>
          <EnhancedFormItem label={t("Subscription URL")} fullWidth>
            <Controller
              name="url"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  size="small"
                  fullWidth
                  multiline
                  rows={2}
                  placeholder="https://..."
                />
              )}
            />
          </EnhancedFormItem>

          <EnhancedFormItem
            label="User Agent"
            description={t("Custom HTTP User-Agent header")}
            fullWidth
          >
            <Controller
              name="option.user_agent"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  size="small"
                  fullWidth
                  placeholder={`NeedyClash/v${version}`}
                />
              )}
            />
          </EnhancedFormItem>

          <EnhancedFormItem
            label={t("HTTP Request Timeout")}
            description={t("Maximum time to wait for response")}
          >
            <Controller
              name="option.timeout_seconds"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  size="small"
                  type="number"
                  sx={{ width: 120 }}
                  placeholder="60"
                  slotProps={{
                    input: {
                      endAdornment: (
                        <InputAdornment position="end">
                          {t("seconds")}
                        </InputAdornment>
                      ),
                    },
                  }}
                />
              )}
            />
          </EnhancedFormItem>
        </EnhancedFormGroup>
      )}

      {/* 本地文件配置 */}
      {isLocal && openType === "new" && (
        <EnhancedFormGroup title={t("Local File")}>
          <EnhancedFormItem label={t("Select File")} fullWidth>
            <FileInput
              onChange={(file, val) => {
                setValue("name", getValues("name") || file.name);
                fileDataRef.current = val;
              }}
            />
          </EnhancedFormItem>
        </EnhancedFormGroup>
      )}

      {/* 更新配置 */}
      {(isRemote || isLocal) && (
        <EnhancedFormGroup title={t("Update Settings")}>
          <EnhancedFormItem
            label={t("Update Interval")}
            description={t("Automatic update interval (0 = disabled)")}
          >
            <Controller
              name="option.update_interval"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  size="small"
                  type="number"
                  sx={{ width: 120 }}
                  placeholder="0"
                  slotProps={{
                    input: {
                      endAdornment: (
                        <InputAdornment position="end">
                          {t("mins")}
                        </InputAdornment>
                      ),
                    },
                  }}
                />
              )}
            />
          </EnhancedFormItem>
        </EnhancedFormGroup>
      )}

      {/* 代理选项 */}
      {isRemote && (
        <EnhancedFormGroup title={t("Proxy Options")}>
          <EnhancedFormItem
            label={t("Use System Proxy")}
            description={t("Use system proxy for subscription requests")}
          >
            <Controller
              name="option.with_proxy"
              control={control}
              render={({ field }) => (
                <Switch edge="end" checked={field.value} {...field} />
              )}
            />
          </EnhancedFormItem>

          <EnhancedFormItem
            label={t("Use Clash Proxy")}
            description={t("Use Clash proxy for subscription requests")}
          >
            <Controller
              name="option.self_proxy"
              control={control}
              render={({ field }) => (
                <Switch edge="end" checked={field.value} {...field} />
              )}
            />
          </EnhancedFormItem>

          <EnhancedFormItem
            label={t("Accept Invalid Certs (Danger)")}
            description={t("Skip SSL certificate verification (insecure)")}
          >
            <Controller
              name="option.danger_accept_invalid_certs"
              control={control}
              render={({ field }) => (
                <Switch edge="end" checked={field.value} {...field} />
              )}
            />
          </EnhancedFormItem>
        </EnhancedFormGroup>
      )}
    </BaseDialog>
  );
}
