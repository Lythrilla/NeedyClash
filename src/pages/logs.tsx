import {
  PlayCircleOutlineRounded,
  PauseCircleOutlineRounded,
  DeleteSweepRounded,
} from "@mui/icons-material";
import { Box, IconButton, MenuItem, Tooltip, Typography } from "@mui/material";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Virtuoso } from "react-virtuoso";

import { BaseEmpty, BasePage } from "@/components/base";
import { GlassSelect } from "@/components/base";
import { BaseSearchBox } from "@/components/base/base-search-box";
import { SearchState } from "@/components/base/base-search-box";
import LogItem from "@/components/log/log-item";
import { useLogData } from "@/hooks/use-log-data-new";
import { toggleLogEnabled } from "@/services/global-log-service";
import { LogFilter, useClashLog } from "@/services/states";

const LogPage = () => {
  const { t } = useTranslation();
  const [clashLog, setClashLog] = useClashLog();
  const enableLog = clashLog.enable;
  const logState = clashLog.logFilter;

  const [match, setMatch] = useState(() => (_: string) => true);
  const [searchState, setSearchState] = useState<SearchState>();
  const {
    response: { data: logData },
    refreshGetClashLog,
  } = useLogData();

  const filterLogs = useMemo(() => {
    if (!logData || logData.length === 0) {
      return [];
    }

    // Server-side filtering handles level filtering via query parameters
    // We only need to apply search filtering here
    return logData.filter((data) => {
      // 构建完整的搜索文本，包含时间、类型和内容
      const searchText =
        `${data.time || ""} ${data.type} ${data.payload}`.toLowerCase();

      const matchesSearch = match(searchText);

      return (
        (logState == "all" ? true : data.type.includes(logState)) &&
        matchesSearch
      );
    });
  }, [logData, logState, match]);

  const handleLogLevelChange = (newLevel: string) => {
    setClashLog((pre: any) => ({ ...pre, logFilter: newLevel }));
    // changeLogLevel(newLevel);
  };

  const handleToggleLog = async () => {
    await toggleLogEnabled();
    setClashLog((pre: any) => ({ ...pre, enable: !enableLog }));
  };

  return (
    <BasePage
      full
      title={t("Logs")}
      contentStyle={{ height: "100%", padding: 0 }}
      header={
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
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
            <Tooltip title={enableLog ? t("Pause") : t("Resume")} arrow>
              <IconButton
                size="small"
                onClick={handleToggleLog}
                sx={{
                  width: 28,
                  height: 28,
                  "&:hover": { bgcolor: "action.hover" },
                }}
              >
                {enableLog ? (
                  <PauseCircleOutlineRounded sx={{ fontSize: 18 }} />
                ) : (
                  <PlayCircleOutlineRounded sx={{ fontSize: 18 }} />
                )}
              </IconButton>
            </Tooltip>

            <Tooltip title={t("Clear")} arrow>
              <IconButton
                size="small"
                onClick={() => {
                  refreshGetClashLog(true);
                }}
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
      {/* 筛选和搜索工具栏 */}
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
        <GlassSelect
          value={logState}
          onChange={(e) => handleLogLevelChange(e.target.value as LogFilter)}
          sx={{ minWidth: 100 }}
        >
          <MenuItem value="all">ALL</MenuItem>
          <MenuItem value="debug">DEBUG</MenuItem>
          <MenuItem value="info">INFO</MenuItem>
          <MenuItem value="warn">WARN</MenuItem>
          <MenuItem value="err">ERROR</MenuItem>
        </GlassSelect>
        <BaseSearchBox
          onSearch={(matcher, state) => {
            setMatch(() => matcher);
            setSearchState(state);
          }}
        />
      </Box>

      {/* 日志列表 */}
      <Box
        sx={{
          flex: 1,
          overflow: "hidden",
          height: "calc(100% - 56px)",
        }}
      >
        {filterLogs.length > 0 ? (
          <Virtuoso
            initialTopMostItemIndex={999}
            data={filterLogs}
            style={{ height: "100%" }}
            itemContent={(index, item) => (
              <LogItem value={item} searchState={searchState} />
            )}
            followOutput={"smooth"}
          />
        ) : (
          <BaseEmpty />
        )}
      </Box>
    </BasePage>
  );
};

export default LogPage;
