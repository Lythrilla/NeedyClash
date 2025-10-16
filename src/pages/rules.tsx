import { Box, Typography } from "@mui/material";
import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Virtuoso, VirtuosoHandle } from "react-virtuoso";

import { BaseEmpty, BasePage } from "@/components/base";
import { BaseSearchBox } from "@/components/base/base-search-box";
import { ScrollTopButton } from "@/components/layout/scroll-top-button";
import { ProviderButton } from "@/components/rule/provider-button";
import RuleItem from "@/components/rule/rule-item";
import { useVisibility } from "@/hooks/use-visibility";
import { useAppData } from "@/providers/app-data-context";

const RulesPage = () => {
  const { t } = useTranslation();
  const { rules = [], refreshRules, refreshRuleProviders } = useAppData();
  const [match, setMatch] = useState(() => (_: string) => true);
  const virtuosoRef = useRef<VirtuosoHandle>(null);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const pageVisible = useVisibility();

  // 在组件挂载时和页面获得焦点时刷新规则数据
  useEffect(() => {
    refreshRules();
    refreshRuleProviders();

    if (pageVisible) {
      refreshRules();
      refreshRuleProviders();
    }
  }, [refreshRules, refreshRuleProviders, pageVisible]);

  const filteredRules = useMemo(() => {
    return rules.filter((item) => match(item.payload));
  }, [rules, match]);

  const scrollToTop = () => {
    virtuosoRef.current?.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const handleScroll = (e: any) => {
    setShowScrollTop(e.target.scrollTop > 100);
  };

  return (
    <BasePage
      full
      title={t("Rules")}
      contentStyle={{ height: "100%", padding: 0 }}
      header={
        <Box display="flex" alignItems="center" gap={1.5}>
          <Typography
            sx={{
              fontSize: 11,
              fontWeight: 600,
              color: "text.disabled",
              textTransform: "uppercase",
              letterSpacing: "0.5px",
            }}
          >
            PROVIDERS
          </Typography>
          <ProviderButton />
        </Box>
      }
    >
      {/* 搜索工具栏 */}
      <Box
        sx={{
          px: { xs: 1.5, sm: 2 },
          pt: { xs: 1.25, sm: 1.5 },
          pb: { xs: 1.25, sm: 1.5 },
          display: "flex",
          alignItems: "center",
          borderBottom: (theme) =>
            `1px solid ${
              theme.palette.mode === "dark"
                ? "rgba(255, 255, 255, 0.04)"
                : "rgba(0, 0, 0, 0.04)"
            }`,
        }}
      >
        <BaseSearchBox onSearch={(match) => setMatch(() => match)} />
      </Box>

      {/* 规则列表 */}
      <Box
        sx={{
          flex: 1,
          overflow: "hidden",
          height: "calc(100% - 56px)",
        }}
      >
        {filteredRules && filteredRules.length > 0 ? (
          <>
            <Virtuoso
              ref={virtuosoRef}
              data={filteredRules}
              style={{ height: "100%" }}
              itemContent={(index, item) => (
                <RuleItem index={index + 1} value={item} />
              )}
              followOutput={"smooth"}
              scrollerRef={(ref) => {
                if (ref) ref.addEventListener("scroll", handleScroll);
              }}
            />
            <ScrollTopButton onClick={scrollToTop} show={showScrollTop} />
          </>
        ) : (
          <BaseEmpty />
        )}
      </Box>
    </BasePage>
  );
};

export default RulesPage;
