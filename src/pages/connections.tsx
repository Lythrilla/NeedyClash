import {
  PauseCircleOutlineRounded,
  PlayCircleOutlineRounded,
  TableChartRounded,
  TableRowsRounded,
  DeleteSweepRounded,
} from "@mui/icons-material";
import {
  Box,
  IconButton,
  MenuItem,
  Tooltip,
  Typography,
} from "@mui/material";
import { useLockFn } from "ahooks";
import { useCallback, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Virtuoso } from "react-virtuoso";
import { closeAllConnections } from "tauri-plugin-mihomo-api";

import { BaseEmpty, BasePage } from "@/components/base";
import { BaseSearchBox } from "@/components/base/base-search-box";
import { BaseStyledSelect } from "@/components/base/base-styled-select";
import {
  ConnectionDetail,
  ConnectionDetailRef,
} from "@/components/connection/connection-detail";
import { ConnectionItem } from "@/components/connection/connection-item";
import { ConnectionTable } from "@/components/connection/connection-table";
import { useConnectionData } from "@/hooks/use-connection-data";
import { useVisibility } from "@/hooks/use-visibility";
import { useConnectionSetting } from "@/services/states";
import parseTraffic from "@/utils/parse-traffic";

const initConn: IConnections = {
  uploadTotal: 0,
  downloadTotal: 0,
  connections: [],
};

type OrderFunc = (list: IConnectionsItem[]) => IConnectionsItem[];

const ConnectionsPage = () => {
  const { t } = useTranslation();
  const pageVisible = useVisibility();
  const [match, setMatch] = useState<(input: string) => boolean>(
    () => () => true,
  );
  const [curOrderOpt, setCurOrderOpt] = useState("Default");

  const {
    response: { data: connections },
  } = useConnectionData();

  const [setting, setSetting] = useConnectionSetting();

  const isTableLayout = setting.layout === "table";

  const orderOpts = useMemo<Record<string, OrderFunc>>(
    () => ({
      Default: (list) =>
        list.sort(
          (a, b) =>
            new Date(b.start || "0").getTime()! -
            new Date(a.start || "0").getTime()!,
        ),
      "Upload Speed": (list) =>
        list.sort((a, b) => b.curUpload! - a.curUpload!),
      "Download Speed": (list) =>
        list.sort((a, b) => b.curDownload! - a.curDownload!),
    }),
    [],
  );

  const [isPaused, setIsPaused] = useState(false);
  const [frozenData, setFrozenData] = useState<IConnections | null>(null);

  // 使用全局连接数据
  const displayData = useMemo(() => {
    if (!pageVisible) return initConn;

    if (isPaused) {
      return (
        frozenData ?? {
          uploadTotal: connections?.uploadTotal,
          downloadTotal: connections?.downloadTotal,
          connections: connections?.connections,
        }
      );
    }

    return {
      uploadTotal: connections?.uploadTotal,
      downloadTotal: connections?.downloadTotal,
      connections: connections?.connections,
    };
  }, [isPaused, frozenData, connections, pageVisible]);

  const [filterConn] = useMemo(() => {
    const orderFunc = orderOpts[curOrderOpt];
    let conns = displayData.connections?.filter((conn) => {
      const { host, destinationIP, process } = conn.metadata;
      return (
        match(host || "") || match(destinationIP || "") || match(process || "")
      );
    });

    if (orderFunc) conns = orderFunc(conns ?? []);

    return [conns];
  }, [displayData, match, curOrderOpt, orderOpts]);

  const onCloseAll = useLockFn(closeAllConnections);

  const detailRef = useRef<ConnectionDetailRef>(null!);

  const handleSearch = useCallback((match: (content: string) => boolean) => {
    setMatch(() => match);
  }, []);

  const handlePauseToggle = useCallback(() => {
    setIsPaused((prev) => {
      if (!prev) {
        setFrozenData({
          uploadTotal: connections?.uploadTotal ?? 0,
          downloadTotal: connections?.downloadTotal ?? 0,
          connections: connections?.connections ?? [],
        });
      } else {
        setFrozenData(null);
      }
      return !prev;
    });
  }, [connections]);

  return (
    <BasePage
      full
      title={t("Connections")}
      contentStyle={{ height: "100%", padding: 0 }}
      header={
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          {/* Traffic信息 */}
          <Typography
            sx={{
              fontSize: 11,
              fontWeight: 600,
              color: "text.disabled",
              textTransform: "uppercase",
              letterSpacing: "0.5px",
            }}
          >
            TRAFFIC
          </Typography>
          <Box
            sx={{
              display: "flex",
              gap: 1,
              alignItems: "center",
              fontSize: "12px",
              color: "text.secondary",
            }}
          >
            <Box>
              ↓ {parseTraffic(displayData.downloadTotal)}
            </Box>
            <Box>
              ↑ {parseTraffic(displayData.uploadTotal)}
            </Box>
          </Box>

          <Box sx={{ flex: 1 }} />

          {/* 操作按钮组 */}
          <Typography
            sx={{
              fontSize: 11,
              fontWeight: 600,
              color: "text.disabled",
              textTransform: "uppercase",
              letterSpacing: "0.5px",
            }}
          >
            ACTIONS
          </Typography>
          <Box sx={{ display: "flex", gap: 0.75 }}>
            <Tooltip
              title={isTableLayout ? t("List View") : t("Table View")}
              arrow
            >
              <IconButton
                size="small"
                onClick={() =>
                  setSetting((o) =>
                    o?.layout !== "table"
                      ? { ...o, layout: "table" }
                      : { ...o, layout: "list" },
                  )
                }
                sx={{
                  width: 28,
                  height: 28,
                  "&:hover": { bgcolor: "action.hover" },
                }}
              >
                {isTableLayout ? (
                  <TableRowsRounded sx={{ fontSize: 18 }} />
                ) : (
                  <TableChartRounded sx={{ fontSize: 18 }} />
                )}
              </IconButton>
            </Tooltip>

            <Tooltip title={isPaused ? t("Resume") : t("Pause")} arrow>
              <IconButton
                size="small"
                onClick={handlePauseToggle}
                sx={{
                  width: 28,
                  height: 28,
                  "&:hover": { bgcolor: "action.hover" },
                }}
              >
                {isPaused ? (
                  <PlayCircleOutlineRounded sx={{ fontSize: 18 }} />
                ) : (
                  <PauseCircleOutlineRounded sx={{ fontSize: 18 }} />
                )}
              </IconButton>
            </Tooltip>

            <Tooltip title={t("Close All")} arrow>
              <IconButton
                size="small"
                onClick={onCloseAll}
                color="error"
                sx={{
                  width: 28,
                  height: 28,
                  "&:hover": { bgcolor: "action.hover" },
                }}
              >
                <DeleteSweepRounded sx={{ fontSize: 18 }} />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
      }
    >
      {/* 搜索和筛选工具栏 */}
      <Box
        sx={{
          px: { xs: 1.5, sm: 2 },
          pt: { xs: 1.25, sm: 1.5 },
          pb: { xs: 1.25, sm: 1.5 },
          display: "flex",
          alignItems: "center",
          gap: 1,
          borderBottom: (theme) =>
            `1px solid ${
              theme.palette.mode === "dark"
                ? "rgba(255, 255, 255, 0.04)"
                : "rgba(0, 0, 0, 0.04)"
            }`,
        }}
      >
        {!isTableLayout && (
          <BaseStyledSelect
            value={curOrderOpt}
            onChange={(e) => setCurOrderOpt(e.target.value)}
            sx={{ minWidth: 120 }}
          >
            {Object.keys(orderOpts).map((opt) => (
              <MenuItem key={opt} value={opt}>
                <span style={{ fontSize: 14 }}>{t(opt)}</span>
              </MenuItem>
            ))}
          </BaseStyledSelect>
        )}
        <BaseSearchBox onSearch={handleSearch} />
      </Box>

      {/* 连接列表 */}
      <Box
        sx={{
          flex: 1,
          overflow: "hidden",
          height: "calc(100% - 56px)",
        }}
      >
        {!filterConn || filterConn.length === 0 ? (
          <BaseEmpty />
        ) : isTableLayout ? (
          <Box
            sx={{
              height: "100%",
              px: { xs: 1.5, sm: 2 },
              pt: { xs: 1.5, sm: 2 },
            }}
          >
            <ConnectionTable
              connections={filterConn}
              onShowDetail={(detail) => detailRef.current?.open(detail)}
            />
          </Box>
        ) : (
          <Virtuoso
            style={{ height: "100%" }}
            data={filterConn}
            itemContent={(_, item) => (
              <ConnectionItem
                value={item}
                onShowDetail={() => detailRef.current?.open(item)}
              />
            )}
          />
        )}
      </Box>
      <ConnectionDetail ref={detailRef} />
    </BasePage>
  );
};

export default ConnectionsPage;
