import { CheckCircleOutlineRounded, StarRounded, StarBorderRounded } from "@mui/icons-material";
import {
  alpha,
  Box,
  IconButton,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  styled,
  SxProps,
  Theme,
  Tooltip,
} from "@mui/material";
import { useLockFn } from "ahooks";
import { useCallback, useEffect, useMemo, useReducer } from "react";

import { BaseLoading } from "@/components/base";
import { useVerge } from "@/hooks/use-verge";
import delayManager from "@/services/delay";

interface Props {
  group: IProxyGroupItem;
  proxy: IProxyItem;
  selected: boolean;
  showType?: boolean;
  sx?: SxProps<Theme>;
  onClick?: (name: string) => void;
}

const Widget = styled(Box)(() => ({
  padding: "2px 6px",
  fontSize: 12,
  fontWeight: 600,
  fontFamily: "monospace",
}));

const TypeBox = styled("span")(({ theme }) => ({
  display: "inline-block",
  border: "1px solid",
  borderColor: alpha(theme.palette.text.secondary, 0.2),
  color: alpha(theme.palette.text.secondary, 0.5),
  fontSize: 10,
  fontWeight: 600,
  padding: "1px 4px",
  lineHeight: 1.2,
  textTransform: "uppercase",
  letterSpacing: "0.3px",
}));

export const ProxyItem = (props: Props) => {
  const { group, proxy, selected, showType = true, sx, onClick } = props;

  const presetList = ["DIRECT", "REJECT", "REJECT-DROP", "PASS", "COMPATIBLE"];
  const isPreset = presetList.includes(proxy.name);
  // -1/<=0 为 不显示
  // -2 为 loading
  const [delay, setDelay] = useReducer((_: number, value: number) => value, -1);
  const { verge, patchVerge } = useVerge();
  const timeout = verge?.default_latency_timeout || 10000;

  // 收藏状态
  const isFavorite = useMemo(() => {
    return verge?.favorite_proxies?.includes(proxy.name) || false;
  }, [verge?.favorite_proxies, proxy.name]);

  // 切换收藏状态
  const toggleFavorite = useLockFn(async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const currentFavorites = verge?.favorite_proxies || [];
    let newFavorites: string[];
    
    if (isFavorite) {
      newFavorites = currentFavorites.filter(name => name !== proxy.name);
    } else {
      newFavorites = [...currentFavorites, proxy.name];
    }
    
    await patchVerge({ favorite_proxies: newFavorites });
  });
  useEffect(() => {
    if (isPreset) return;
    delayManager.setListener(proxy.name, group.name, setDelay);

    return () => {
      delayManager.removeListener(proxy.name, group.name);
    };
  }, [proxy.name, group.name, isPreset]);

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
    <ListItem sx={{ px: 0, ...sx }}>
      <ListItemButton
        className="custom-proxy-card"
        dense
        selected={selected}
        onClick={() => onClick?.(proxy.name)}
        sx={[
          ({ palette: { mode, primary } }) => {
            const selectColor = mode === "light" ? primary.main : primary.light;
            const showDelay = delay > 0;

            return {
              px: 2,
              py: 1,
              borderBottom: "1px solid",
              borderColor: "divider",
              "&:hover .the-check": { display: !showDelay ? "block" : "none" },
              "&:hover .the-delay": { display: showDelay ? "block" : "none" },
              "&:hover .the-icon": { display: "none" },
              "&:hover .favorite-btn": { opacity: 1 },
              "&:hover": {
                bgcolor: "action.hover",
              },
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
        {/* 收藏按钮 */}
        {!isPreset && (
          <Tooltip title={isFavorite ? "取消收藏" : "收藏"} arrow>
            <IconButton
              size="small"
              className="favorite-btn"
              onClick={toggleFavorite}
              sx={{
                position: "absolute",
                left: 4,
                opacity: isFavorite ? 1 : 0,
                transition: "opacity 0.2s",
                color: isFavorite ? "warning.main" : "text.secondary",
                "&:hover": {
                  color: "warning.main",
                  bgcolor: alpha("#FFA500", 0.08),
                },
              }}
            >
              {isFavorite ? (
                <StarRounded sx={{ fontSize: 18 }} />
              ) : (
                <StarBorderRounded sx={{ fontSize: 18 }} />
              )}
            </IconButton>
          </Tooltip>
        )}
        <ListItemText
          title={proxy.name}
          primary={
            <Box
              sx={{
                fontSize: "13px",
                fontWeight: 500,
                color: "text.primary",
                lineHeight: 1.5,
                pl: !isPreset ? 3.5 : 0, // 为收藏按钮留出空间
              }}
            >
              {proxy.name}
            </Box>
          }
          secondary={
            showType && (
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mt: 0.25 }}>
                {!!proxy.provider && (
                  <TypeBox>{proxy.provider}</TypeBox>
                )}
                <TypeBox>{proxy.type}</TypeBox>
                {proxy.now && (
                  <Box
                    component="span"
                    sx={{
                      fontSize: "11px",
                      color: "text.secondary",
                    }}
                  >
                    → {proxy.now}
                  </Box>
                )}
                {proxy.udp && <TypeBox>UDP</TypeBox>}
                {proxy.xudp && <TypeBox>XUDP</TypeBox>}
                {proxy.tfo && <TypeBox>TFO</TypeBox>}
                {proxy.mptcp && <TypeBox>MPTCP</TypeBox>}
                {proxy.smux && <TypeBox>SMUX</TypeBox>}
              </Box>
            )
          }
        />

        <ListItemIcon
          sx={{
            justifyContent: "flex-end",
            color: "primary.main",
            display: isPreset ? "none" : "",
          }}
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

          {delay > 0 && (
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

          {delay !== -2 && delay <= 0 && selected && (
            // 展示已选择的icon
            <CheckCircleOutlineRounded
              className="the-icon"
              sx={{ fontSize: 16 }}
            />
          )}
        </ListItemIcon>
      </ListItemButton>
    </ListItem>
  );
};
