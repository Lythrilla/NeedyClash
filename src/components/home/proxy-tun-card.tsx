import { ComputerRounded, TroubleshootRounded } from "@mui/icons-material";
import { Box, Typography } from "@mui/material";
import { FC } from "react";
import { useTranslation } from "react-i18next";

import ProxyControlSwitches from "@/components/shared/ProxyControlSwitches";
import { useSystemProxyState } from "@/hooks/use-system-proxy-state";
import { useSystemState } from "@/hooks/use-system-state";
import { useVerge } from "@/hooks/use-verge";
import { showNotice } from "@/services/noticeService";

export const ProxyTunCard: FC = () => {
  const { t } = useTranslation();
  const { verge } = useVerge();
  const { isTunModeAvailable } = useSystemState();
  const { actualState: systemProxyActualState } = useSystemProxyState();

  const { enable_tun_mode } = verge ?? {};

  const handleError = (err: Error) => {
    showNotice("error", err.message || err.toString());
  };

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        gap: 0,
        width: "100%",
        flex: 1,
      }}
    >
      {/* 系统代理 */}
      <Box
        sx={{
          borderBottom: "1px solid",
          borderColor: (theme) =>
            theme.palette.mode === "dark"
              ? "rgba(255, 255, 255, 0.03)"
              : "rgba(0, 0, 0, 0.03)",
          pb: 2,
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1.5,
            mb: 1.5,
          }}
        >
          <ComputerRounded
            sx={{
              fontSize: 18,
              color: systemProxyActualState ? "success.main" : "text.secondary",
            }}
          />
          <Typography
            sx={{
              fontSize: 13,
              fontWeight: 500,
              color: "text.primary",
              flex: 1,
            }}
          >
            {t("System Proxy")}
          </Typography>
          {systemProxyActualState && (
            <Box
              sx={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                backgroundColor: "success.main",
              }}
            />
          )}
        </Box>
        <ProxyControlSwitches
          onError={handleError}
          label={t("System Proxy")}
          noRightPadding={true}
        />
      </Box>

      {/* TUN 模式 */}
      <Box sx={{ pt: 2, pb: 0 }}>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1.5,
            mb: 1.5,
          }}
        >
          <TroubleshootRounded
            sx={{
              fontSize: 18,
              color:
                enable_tun_mode && isTunModeAvailable
                  ? "success.main"
                  : "text.secondary",
            }}
          />
          <Typography
            sx={{
              fontSize: 13,
              fontWeight: 500,
              color: "text.primary",
              flex: 1,
            }}
          >
            {t("Tun Mode")}
          </Typography>
          {enable_tun_mode && isTunModeAvailable && (
            <Box
              sx={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                backgroundColor: "success.main",
              }}
            />
          )}
        </Box>
        <ProxyControlSwitches
          onError={handleError}
          label={t("Tun Mode")}
          noRightPadding={true}
        />
      </Box>
    </Box>
  );
};
