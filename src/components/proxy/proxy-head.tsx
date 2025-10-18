import {
  AccessTimeRounded,
  MyLocationRounded,
  NetworkCheckRounded,
  FilterAltRounded,
  FilterAltOffRounded,
  VisibilityRounded,
  VisibilityOffRounded,
  WifiTetheringRounded,
  WifiTetheringOffRounded,
  SortByAlphaRounded,
  SortRounded,
} from "@mui/icons-material";
import { Box, IconButton, TextField, SxProps, Tooltip } from "@mui/material";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { useVerge } from "@/hooks/use-verge";
import delayManager from "@/services/delay";

import type { ProxySortType } from "./use-filter-sort";
import type { HeadState } from "./use-head-state";

interface Props {
  sx?: SxProps;
  url?: string;
  groupName: string;
  headState: HeadState;
  onLocation: () => void;
  onCheckDelay: () => void;
  onHeadState: (val: Partial<HeadState>) => void;
}

const defaultSx: SxProps = {};

export const ProxyHead = ({
  sx = defaultSx,
  url,
  groupName,
  headState,
  onHeadState,
  onLocation,
  onCheckDelay,
}: Props) => {
  const { showType, sortType, filterText, textState, testUrl } = headState;

  const { t } = useTranslation();
  const [autoFocus, setAutoFocus] = useState(false);

  useEffect(() => {
    // fix the focus conflict
    const timer = setTimeout(() => setAutoFocus(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const { verge } = useVerge();
  const defaultLatencyUrl =
    verge?.default_latency_test?.trim() ||
    "https://cp.cloudflare.com/generate_204";

  useEffect(() => {
    delayManager.setUrl(groupName, testUrl?.trim() || url || defaultLatencyUrl);
  }, [groupName, testUrl, defaultLatencyUrl, url]);

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 0.5,
        py: 1,
        px: 1.5,
        borderBottom: "1px solid",
        borderColor: "divider",
        ...sx,
      }}
    >
      <Tooltip title={t("locate")} arrow placement="top">
        <IconButton
          size="small"
          color="inherit"
          onClick={onLocation}
          sx={{
            width: 32,
            height: 32,
            borderRadius: "var(--cv-border-radius-sm)",
            "&:hover": { bgcolor: "action.hover" },
          }}
        >
          <MyLocationRounded sx={{ fontSize: 18 }} />
        </IconButton>
      </Tooltip>

      <Tooltip title={t("Delay check")} arrow placement="top">
        <IconButton
          size="small"
          color="inherit"
          onClick={() => {
            console.log(`[ProxyHead] 点击延迟测试按钮，组: ${groupName}`);
            if (testUrl?.trim() && textState !== "filter") {
              console.log(`[ProxyHead] 使用自定义测试URL: ${testUrl}`);
              onHeadState({ textState: "url" });
            }
            onCheckDelay();
          }}
          sx={{
            width: 32,
            height: 32,
            borderRadius: "var(--cv-border-radius-sm)",
            "&:hover": { bgcolor: "action.hover" },
          }}
        >
          <NetworkCheckRounded sx={{ fontSize: 18 }} />
        </IconButton>
      </Tooltip>

      <Tooltip
        title={
          [t("Sort by default"), t("Sort by delay"), t("Sort by name")][
            sortType
          ]
        }
        arrow
        placement="top"
      >
        <IconButton
          size="small"
          color="inherit"
          onClick={() =>
            onHeadState({ sortType: ((sortType + 1) % 3) as ProxySortType })
          }
          sx={{
            width: 32,
            height: 32,
            borderRadius: "var(--cv-border-radius-sm)",
            "&:hover": { bgcolor: "action.hover" },
          }}
        >
          {sortType !== 1 && sortType !== 2 && (
            <SortRounded sx={{ fontSize: 18 }} />
          )}
          {sortType === 1 && <AccessTimeRounded sx={{ fontSize: 18 }} />}
          {sortType === 2 && <SortByAlphaRounded sx={{ fontSize: 18 }} />}
        </IconButton>
      </Tooltip>

      <Tooltip title={t("Delay check URL")} arrow placement="top">
        <IconButton
          size="small"
          color="inherit"
          onClick={() =>
            onHeadState({ textState: textState === "url" ? null : "url" })
          }
          sx={{
            width: 32,
            height: 32,
            borderRadius: "var(--cv-border-radius-sm)",
            "&:hover": { bgcolor: "action.hover" },
          }}
        >
          {textState === "url" ? (
            <WifiTetheringRounded sx={{ fontSize: 18 }} />
          ) : (
            <WifiTetheringOffRounded sx={{ fontSize: 18 }} />
          )}
        </IconButton>
      </Tooltip>

      <Tooltip
        title={showType ? t("Proxy basic") : t("Proxy detail")}
        arrow
        placement="top"
      >
        <IconButton
          size="small"
          color="inherit"
          onClick={() => onHeadState({ showType: !showType })}
          sx={{
            width: 32,
            height: 32,
            borderRadius: "var(--cv-border-radius-sm)",
            "&:hover": { bgcolor: "action.hover" },
          }}
        >
          {showType ? (
            <VisibilityRounded sx={{ fontSize: 18 }} />
          ) : (
            <VisibilityOffRounded sx={{ fontSize: 18 }} />
          )}
        </IconButton>
      </Tooltip>

      <Tooltip title={t("Filter")} arrow placement="top">
        <IconButton
          size="small"
          color="inherit"
          onClick={() =>
            onHeadState({ textState: textState === "filter" ? null : "filter" })
          }
          sx={{
            width: 32,
            height: 32,
            borderRadius: "var(--cv-border-radius-sm)",
            "&:hover": { bgcolor: "action.hover" },
          }}
        >
          {textState === "filter" ? (
            <FilterAltRounded sx={{ fontSize: 18 }} />
          ) : (
            <FilterAltOffRounded sx={{ fontSize: 18 }} />
          )}
        </IconButton>
      </Tooltip>

      {textState === "filter" && (
        <TextField
          autoComplete="new-password"
          autoFocus={autoFocus}
          hiddenLabel
          value={filterText}
          size="small"
          variant="outlined"
          placeholder={t("Filter conditions")}
          onChange={(e) => onHeadState({ filterText: e.target.value })}
          sx={{
            ml: 0.5,
            flex: "1 1 auto",
            "& .MuiOutlinedInput-root": {
              fontSize: "13px",
              height: 32,
              "& input": {
                py: 0.5,
                px: 1.5,
              },
            },
          }}
        />
      )}

      {textState === "url" && (
        <TextField
          autoComplete="new-password"
          autoFocus={autoFocus}
          hiddenLabel
          autoSave="off"
          value={testUrl}
          size="small"
          variant="outlined"
          placeholder={t("Delay check URL")}
          onChange={(e) => onHeadState({ testUrl: e.target.value })}
          sx={{
            ml: 0.5,
            flex: "1 1 auto",
            "& .MuiOutlinedInput-root": {
              fontSize: "13px",
              height: 32,
              "& input": {
                py: 0.5,
                px: 1.5,
              },
            },
          }}
        />
      )}
    </Box>
  );
};
