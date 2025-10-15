import { Typography } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import React, { ReactNode } from "react";

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

  const isDark = theme.palette.mode === "dark";

  return (
    <BaseErrorBoundary>
      <div className="base-page">
        <header data-tauri-drag-region="true" style={{ userSelect: "none" }}>
          <Typography
            sx={{
              fontSize: "24px",
              fontWeight: "700",
              letterSpacing: "-0.5px",
            }}
            data-tauri-drag-region="true"
          >
            {title}
          </Typography>

          {header}
        </header>

        <div
          className={full ? "base-container no-padding" : "base-container"}
          style={{ backgroundColor: isDark ? "#0F172A" : "#F8FAFC" }}
        >
          <section
            style={{
              backgroundColor: isDark ? "#0F172A" : "#F8FAFC",
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
