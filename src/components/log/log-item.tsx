import {
  styled,
  Box,
  ListItem,
  ListItemText,
  alpha,
} from "@mui/material";
import type { ReactNode } from "react";

import { SearchState } from "@/components/base/base-search-box";

const Tag = styled("span")(({ theme }) => ({
  fontSize: "10px",
  padding: "0 4px",
  lineHeight: 1.375,
  border: "1px solid",
  borderRadius: 4,
  borderColor: alpha(theme.palette.text.secondary, 0.35),
  marginTop: "4px",
  marginRight: "4px",
}));

interface Props {
  value: ILogItem;
  searchState?: SearchState;
}

const LogItem = ({ value, searchState }: Props) => {
  const renderHighlightText = (text: string) => {
    if (!searchState?.text.trim()) return text;

    try {
      const searchText = searchState.text;
      let pattern: string;

      if (searchState.useRegularExpression) {
        try {
          new RegExp(searchText);
          pattern = searchText;
        } catch {
          pattern = searchText.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        }
      } else {
        const escaped = searchText.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        pattern = searchState.matchWholeWord ? `\\b${escaped}\\b` : escaped;
      }

      const flags = searchState.matchCase ? "g" : "gi";
      const regex = new RegExp(pattern, flags);
      const elements: ReactNode[] = [];
      let lastIndex = 0;
      let match: RegExpExecArray | null;

      while ((match = regex.exec(text)) !== null) {
        const start = match.index;
        const matchText = match[0];

        if (matchText === "") {
          regex.lastIndex += 1;
          continue;
        }

        if (start > lastIndex) {
          elements.push(text.slice(lastIndex, start));
        }

        elements.push(
          <span
            key={`highlight-${start}`}
            style={{
              backgroundColor: "#ffeb3b40",
              borderRadius: 2,
              padding: "0 2px",
            }}
          >
            {matchText}
          </span>,
        );

        lastIndex = start + matchText.length;
      }

      if (lastIndex < text.length) {
        elements.push(text.slice(lastIndex));
      }

      return elements.length ? elements : text;
    } catch {
      return text;
    }
  };

  const getTypeColor = (type: string) => {
    const lowerType = type.toLowerCase();
    if (lowerType === "error" || lowerType === "err") return "error.main";
    if (lowerType === "warning" || lowerType === "warn") return "warning.main";
    if (lowerType === "info" || lowerType === "inf") return "info.main";
    return "text.secondary";
  };

  return (
    <ListItem
      dense
      sx={{ borderBottom: "1px solid var(--divider-color)" }}
    >
      <ListItemText
        sx={{ userSelect: "text" }}
        primary={renderHighlightText(value.payload)}
        secondary={
          <Box sx={{ display: "flex", flexWrap: "wrap" }}>
            <Tag sx={{ color: "text.secondary" }}>
              {renderHighlightText(value.time || "")}
            </Tag>
            <Tag
              sx={{
                textTransform: "uppercase",
                color: getTypeColor(value.type),
              }}
            >
              {renderHighlightText(value.type)}
            </Tag>
          </Box>
        }
      />
    </ListItem>
  );
};

export default LogItem;
