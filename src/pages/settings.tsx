import { GitHub, HelpOutlineRounded, Telegram } from "@mui/icons-material";
import { Box, ButtonGroup, IconButton, Grid, alpha, useTheme } from "@mui/material";
import { useLockFn } from "ahooks";
import { useTranslation } from "react-i18next";

import { BasePage } from "@/components/base";
import SettingClash from "@/components/setting/setting-clash";
import SettingSystem from "@/components/setting/setting-system";
import SettingVergeAdvanced from "@/components/setting/setting-verge-advanced";
import SettingVergeBasic from "@/components/setting/setting-verge-basic";
import { openWebUrl } from "@/services/cmds";
import { showNotice } from "@/services/noticeService";
import { useThemeMode } from "@/services/states";

const SettingPage = () => {
  const { t } = useTranslation();

  const onError = (err: any) => {
    showNotice("error", err?.message || err.toString());
  };

  const toGithubRepo = useLockFn(() => {
    return openWebUrl("https://github.com/clash-verge-rev/clash-verge-rev");
  });

  const toGithubDoc = useLockFn(() => {
    return openWebUrl("https://clash-verge-rev.github.io/index.html");
  });

  const toTelegramChannel = useLockFn(() => {
    return openWebUrl("https://t.me/clash_verge_re");
  });

  const mode = useThemeMode();
  const theme = useTheme();
  const isDark = mode === "light" ? false : true;

  return (
    <BasePage
      title={t("Settings")}
      contentStyle={{ padding: 0 }}
      header={
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
          <IconButton
            size="small"
            color="inherit"
            title={t("Manual")}
            onClick={toGithubDoc}
            sx={{ borderRadius: "6px", padding: "6px" }}
          >
            <HelpOutlineRounded fontSize="small" />
          </IconButton>
          <IconButton
            size="small"
            color="inherit"
            title={t("TG Channel")}
            onClick={toTelegramChannel}
            sx={{ borderRadius: "6px", padding: "6px" }}
          >
            <Telegram fontSize="small" />
          </IconButton>

          <IconButton
            size="small"
            color="inherit"
            title={t("Github Repo")}
            onClick={toGithubRepo}
            sx={{ borderRadius: "6px", padding: "6px" }}
          >
            <GitHub fontSize="small" />
          </IconButton>
        </Box>
      }
    >
      {/* 极简设置布局 - 去除卡片，使用分隔线 */}
      <Grid container spacing={0} columns={{ xs: 1, sm: 1, md: 2 }}>
        {/* 左列 */}
        <Grid size={1}>
          <Box
            sx={{
              borderRight: { md: "1px solid" },
              borderColor: "divider",
              p: 3,
            }}
          >
            <Box sx={{ mb: 4 }}>
              <SettingSystem onError={onError} />
            </Box>
            <Box
              sx={{
                pt: 4,
                borderTop: "1px solid",
                borderColor: "divider",
              }}
            >
              <SettingClash onError={onError} />
            </Box>
          </Box>
        </Grid>

        {/* 右列 */}
        <Grid size={1}>
          <Box sx={{ p: 3 }}>
            <Box sx={{ mb: 4 }}>
              <SettingVergeBasic onError={onError} />
            </Box>
            <Box
              sx={{
                pt: 4,
                borderTop: "1px solid",
                borderColor: "divider",
              }}
            >
              <SettingVergeAdvanced onError={onError} />
            </Box>
          </Box>
        </Grid>
      </Grid>
    </BasePage>
  );
};

export default SettingPage;
