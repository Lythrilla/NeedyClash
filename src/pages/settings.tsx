import { GitHub, HelpOutlineRounded, Telegram } from "@mui/icons-material";
import { Box, IconButton, Tooltip, Typography } from "@mui/material";
import { useLockFn } from "ahooks";
import { useTranslation } from "react-i18next";

import { BasePage } from "@/components/base";
import SettingClash from "@/components/setting/setting-clash";
import SettingSystem from "@/components/setting/setting-system";
import SettingVergeAdvanced from "@/components/setting/setting-verge-advanced";
import SettingVergeBasic from "@/components/setting/setting-verge-basic";
import { openWebUrl } from "@/services/cmds";
import { showNotice } from "@/services/noticeService";

const SettingPage = () => {
  const { t } = useTranslation();

  const onError = (err: any) => {
    showNotice("error", err?.message || err.toString());
  };

  const toGithubRepo = useLockFn(() => {
    return openWebUrl("https://github.com/clash-verge-rev/clash-verge-rev"); // Original project
  });

  const toGithubDoc = useLockFn(() => {
    return openWebUrl("https://clash-verge-rev.github.io/index.html"); // Original project docs
  });

  const toTelegramChannel = useLockFn(() => {
    return openWebUrl("https://t.me/clash_verge_re");
  });

  return (
    <BasePage
      title={t("Settings")}
      contentStyle={{ padding: 0, height: "100%" }}
      header={
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Typography
            sx={{
              fontSize: 11,
              fontWeight: 600,
              color: "text.disabled",
              textTransform: "uppercase",
              letterSpacing: "0.5px",
            }}
          >
            LINKS
          </Typography>

          <Box sx={{ display: "flex", gap: 0.75 }}>
            <Tooltip title={t("Manual")} arrow>
              <IconButton
                size="small"
                onClick={toGithubDoc}
                sx={{
                  width: 28,
                  height: 28,
                  "&:hover": { bgcolor: "action.hover" },
                }}
              >
                <HelpOutlineRounded sx={{ fontSize: 18 }} />
              </IconButton>
            </Tooltip>
            <Tooltip title={t("TG Channel")} arrow>
              <IconButton
                size="small"
                onClick={toTelegramChannel}
                sx={{
                  width: 28,
                  height: 28,
                  "&:hover": { bgcolor: "action.hover" },
                }}
              >
                <Telegram sx={{ fontSize: 18 }} />
              </IconButton>
            </Tooltip>
            <Tooltip title={t("Github Repo")} arrow>
              <IconButton
                size="small"
                onClick={toGithubRepo}
                sx={{
                  width: 28,
                  height: 28,
                  "&:hover": { bgcolor: "action.hover" },
                }}
              >
                <GitHub sx={{ fontSize: 18 }} />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
      }
    >
      {/* Flexbox 布局 - 与主页相同 */}
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          minHeight: "100%",
        }}
      >
        {/* 主内容区 - 单栏/双栏自适应 */}
        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", md: "row" },
            flex: 1,
          }}
        >
          {/* 左列 */}
          <Box
            sx={{
              width: { xs: "100%", md: "50%" },
              display: "flex",
              flexDirection: "column",
              borderRight: {
                xs: "none",
                md: (theme) =>
                  `1px solid ${
                    theme.palette.mode === "dark"
                      ? "rgba(255, 255, 255, 0.04)"
                      : "rgba(0, 0, 0, 0.04)"
                  }`,
              },
            }}
          >
            <Box
              className="settings-section"
              sx={{
                borderBottom: (theme) =>
                  `1px solid ${
                    theme.palette.mode === "dark"
                      ? "rgba(255, 255, 255, 0.04)"
                      : "rgba(0, 0, 0, 0.04)"
                  }`,
                pr: { xs: 1.5, sm: 2 },
                pb: { xs: 1.5, sm: 2 },
              }}
            >
              <SettingSystem onError={onError} />
            </Box>

            <Box
              className="settings-section"
              sx={{
                pr: { xs: 1.5, sm: 2 },
                pt: { xs: 1.5, sm: 2 },
              }}
            >
              <SettingClash onError={onError} />
            </Box>
          </Box>

          {/* 右列 */}
          <Box
            sx={{
              width: { xs: "100%", md: "50%" },
              display: "flex",
              flexDirection: "column",
            }}
          >
            <Box
              className="settings-section"
              sx={{
                borderBottom: (theme) =>
                  `1px solid ${
                    theme.palette.mode === "dark"
                      ? "rgba(255, 255, 255, 0.04)"
                      : "rgba(0, 0, 0, 0.04)"
                  }`,
                px: { xs: 1.5, sm: 2, md: 0 },
                pl: { md: 2 },
                pb: { xs: 1.5, sm: 2 },
              }}
            >
              <SettingVergeBasic onError={onError} />
            </Box>

            <Box
              className="settings-section"
              sx={{
                px: { xs: 1.5, sm: 2, md: 0 },
                pl: { md: 2 },
                pt: { xs: 1.5, sm: 2 },
              }}
            >
              <SettingVergeAdvanced onError={onError} />
            </Box>
          </Box>
        </Box>
      </Box>
    </BasePage>
  );
};

export default SettingPage;
