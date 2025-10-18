import { CheckCircleOutlineRounded } from "@mui/icons-material";
import { alpha, Box, ListItemButton, styled, Typography } from "@mui/material";
import { useLockFn } from "ahooks";
import { useCallback, useEffect, useReducer } from "react";
import { useTranslation } from "react-i18next";

import { BaseLoading } from "@/components/base";
import { useVerge } from "@/hooks/use-verge";
import delayManager from "@/services/delay";

interface Props {
  group: IProxyGroupItem;
  proxy: IProxyItem;
  selected: boolean;
  showType?: boolean;
  onClick?: (name: string) => void;
}

// 多列布局
export const ProxyItemMini = (props: Props) => {
  const { group, proxy, selected, showType = true, onClick } = props;

  const { t } = useTranslation();

  const presetList = ["DIRECT", "REJECT", "REJECT-DROP", "PASS", "COMPATIBLE"];
  const isPreset = presetList.includes(proxy.name);
  // -1/<=0 为 不显示
  // -2 为 loading
  const [delay, setDelay] = useReducer((_: number, value: number) => value, -1);
  const { verge } = useVerge();
  const timeout = verge?.default_latency_timeout || 10000;

  useEffect(() => {
    if (isPreset) return;
    delayManager.setListener(proxy.name, group.name, setDelay);

    return () => {
      delayManager.removeListener(proxy.name, group.name);
    };
  }, [isPreset, proxy.name, group.name]);

  const updateDelay = useCallback(() => {
    if (!proxy) return;
    setDelay(delayManager.getDelayFix(proxy, group.name));
  }, [proxy, group.name]);

  useEffect(() => {
    updateDelay();
  }, [updateDelay]);

  const onDelay = useLockFn(async () => {
    setDelay(-2);
    setDelay(await delayManager.checkDelay(proxy.name, group.name, timeout));
  });

  return (
    <ListItemButton
      className="custom-proxy-card"
      dense
      selected={selected}
      onClick={() => onClick?.(proxy.name)}
      sx={[
        {
          px: 1.5,
          py: 1,
          borderBottom: "1px solid",
          borderColor: "divider",
          justifyContent: "space-between",
          alignItems: "center",
        },
        ({ palette: { mode, primary } }) => {
          const showDelay = delay > 0;
          const selectColor = mode === "light" ? primary.main : primary.light;

          return {
            "&:hover .the-check": { display: !showDelay ? "block" : "none" },
            "&:hover .the-delay": { display: showDelay ? "block" : "none" },
            "&:hover .the-icon": { display: "none" },
            "&:hover": {
              bgcolor: "action.hover",
            },
            "& .the-pin, & .the-unpin": {
              position: "absolute",
              fontSize: "12px",
              top: "-3px",
              right: "-3px",
            },
            "& .the-unpin": { filter: "grayscale(1)" },
            "&.Mui-selected": {
              borderLeft: `3px solid ${selectColor}`,
              bgcolor: alpha(primary.main, mode === "light" ? 0.08 : 0.15),
              "&:hover": {
                bgcolor: alpha(primary.main, mode === "light" ? 0.12 : 0.2),
              },
            },
          };
        },
      ]}
    >
      <Box
        title={`${proxy.name}\n${proxy.now ?? ""}`}
        sx={{ overflow: "hidden" }}
      >
        <Typography
          variant="body2"
          component="div"
          color="text.primary"
          sx={{
            display: "block",
            textOverflow: "ellipsis",
            wordBreak: "break-all",
            overflow: "hidden",
            whiteSpace: "nowrap",
            fontSize: "13px",
            fontWeight: 500,
            lineHeight: 1.5,
          }}
        >
          {proxy.name}
        </Typography>

        {showType && (
          <Box
            sx={{
              display: "flex",
              flexWrap: "nowrap",
              flex: "none",
              marginTop: "4px",
            }}
          >
            {proxy.now && (
              <Typography
                variant="body2"
                component="div"
                color="text.secondary"
                sx={{
                  display: "block",
                  textOverflow: "ellipsis",
                  wordBreak: "break-all",
                  overflow: "hidden",
                  whiteSpace: "nowrap",
                  marginRight: "8px",
                }}
              >
                {proxy.now}
              </Typography>
            )}
            {!!proxy.provider && (
              <TypeBox color="text.secondary" component="span">
                {proxy.provider}
              </TypeBox>
            )}
            <TypeBox color="text.secondary" component="span">
              {proxy.type}
            </TypeBox>
            {proxy.udp && (
              <TypeBox color="text.secondary" component="span">
                UDP
              </TypeBox>
            )}
            {proxy.xudp && (
              <TypeBox color="text.secondary" component="span">
                XUDP
              </TypeBox>
            )}
            {proxy.tfo && (
              <TypeBox color="text.secondary" component="span">
                TFO
              </TypeBox>
            )}
            {proxy.mptcp && (
              <TypeBox color="text.secondary" component="span">
                MPTCP
              </TypeBox>
            )}
            {proxy.smux && (
              <TypeBox color="text.secondary" component="span">
                SMUX
              </TypeBox>
            )}
          </Box>
        )}
      </Box>
      <Box
        sx={{ ml: 0.5, color: "primary.main", display: isPreset ? "none" : "" }}
      >
        {delay === -2 && (
          <Widget>
            <BaseLoading />
          </Widget>
        )}
        {!proxy.provider && delay !== -2 && (
          // provider的节点不支持检测
          <Widget
            className="the-check"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onDelay();
            }}
            sx={({ palette }) => ({
              display: "none", // hover才显示
              ":hover": { bgcolor: alpha(palette.primary.main, 0.15) },
            })}
          >
            Check
          </Widget>
        )}

        {delay >= 0 && (
          // 显示延迟
          <Widget
            className="the-delay"
            onClick={(e) => {
              if (proxy.provider) return;
              e.preventDefault();
              e.stopPropagation();
              onDelay();
            }}
            color={delayManager.formatDelayColor(delay, timeout)}
            sx={({ palette }) =>
              !proxy.provider
                ? { ":hover": { bgcolor: alpha(palette.primary.main, 0.15) } }
                : {}
            }
          >
            {delayManager.formatDelay(delay, timeout)}
          </Widget>
        )}
        {proxy.type !== "Direct" && delay !== -2 && delay < 0 && selected && (
          // 展示已选择的icon
          <CheckCircleOutlineRounded
            className="the-icon"
            sx={{ fontSize: 16, mr: 0.5, display: "block" }}
          />
        )}
      </Box>
      {group.fixed && group.fixed === proxy.name && (
        // 展示fixed状态
        <span
          className={proxy.name === group.now ? "the-pin" : "the-unpin"}
          title={
            group.type === "URLTest" ? t("Delay check to cancel fixed") : ""
          }
        >
          📌
        </span>
      )}
    </ListItemButton>
  );
};

const Widget = styled(Box)(({ theme: { typography } }) => ({
  padding: "2px 6px",
  fontSize: 12,
  fontWeight: 600,
  fontFamily: "monospace",
  borderRadius: "var(--cv-border-radius-xs)",
}));

const TypeBox = styled(Box, {
  shouldForwardProp: (prop) => prop !== "component",
})<{ component?: React.ElementType }>(({ theme }) => ({
  display: "inline-block",
  border: "1px solid",
  borderColor: alpha(theme.palette.text.secondary, 0.2),
  color: alpha(theme.palette.text.secondary, 0.5),
  fontSize: 10,
  fontWeight: 600,
  marginRight: "4px",
  marginTop: "auto",
  padding: "1px 4px",
  lineHeight: 1.2,
  textTransform: "uppercase",
  letterSpacing: "0.3px",
}));
