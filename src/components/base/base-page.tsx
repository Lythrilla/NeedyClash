import { Typography } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import React, { ReactNode } from "react";

import { useVerge } from "@/hooks/use-verge";

import { BaseErrorBoundary } from "./base-error-boundary";

interface Props {
  title?: React.ReactNode; // the page title
  header?: React.ReactNode; // something behind title
  contentStyle?: React.CSSProperties;
  children?: ReactNode;
  full?: boolean;
}

export const BasePage: React.FC<Props> = (props) => {
  const { title, header, contentStyle, full, children } = props;
  const theme = useTheme();
  const { verge } = useVerge();

  const isDark = theme.palette.mode === "dark";
  const backgroundType = verge?.theme_setting?.background_type || "none";
  const hasCustomBackground = backgroundType !== "none";

  return (
    <BaseErrorBoundary>
      <div className="base-page">
        <header data-tauri-drag-region="true" style={{ userSelect: "none" }}>
          <Typography
            sx={{
              fontSize: "20px", /* 更小的标题 */
              fontWeight: "600",
              letterSpacing: "-0.3px",
            }}
            data-tauri-drag-region="true"
          >
            {title}
          </Typography>

          {header}
        </header>

        <div
          className={full ? "base-container no-padding" : "base-container"}
          style={{ 
            backgroundColor: hasCustomBackground 
              ? "transparent" 
              : (isDark ? "#282828" : "#F8FAFC")
          }}
        >
          <section
            style={{
              backgroundColor: hasCustomBackground 
                ? "transparent" 
                : (isDark ? "#282828" : "#F8FAFC"),
            }}
          >
            <div className="base-content" style={contentStyle}>
              {children}
            </div>
          </section>
        </div>
      </div>
    </BaseErrorBoundary>
  );
};
