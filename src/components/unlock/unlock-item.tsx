import {
  DeleteRounded,
  PlayArrowRounded,
  CheckCircleRounded,
  CancelRounded,
  AccessTimeRounded,
  PublicRounded,
} from "@mui/icons-material";
import {
  styled,
  ListItem,
  IconButton,
  ListItemText,
  Box,
  alpha,
  Tooltip,
} from "@mui/material";

import type { UnlockItemData } from "@/pages/unlock";

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

const StatusIcon = styled(Box)(() => ({
  width: 20,
  height: 20,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  marginRight: 8,
  borderRadius: "50%",
  flexShrink: 0,
}));

interface Props {
  value: UnlockItemData;
  isLoading?: boolean;
  onTest: (name: string) => void;
  onDelete?: (name: string) => void;
  disabled?: boolean;
}

// 获取状态颜色
const getStatusColor = (status: string) => {
  if (status === "Yes") return "success.main";
  if (status === "No") return "error.main";
  if (status === "Soon") return "warning.main";
  if (status.includes("Failed")) return "error.main";
  if (status === "Completed") return "info.main";
  return "text.secondary";
};

// 获取状态图标
const getStatusIcon = (status: string) => {
  if (status === "Yes") {
    return <CheckCircleRounded sx={{ fontSize: 14, color: "success.main" }} />;
  }
  if (status === "No") {
    return <CancelRounded sx={{ fontSize: 14, color: "error.main" }} />;
  }
  if (status === "Soon") {
    return <AccessTimeRounded sx={{ fontSize: 14, color: "warning.main" }} />;
  }
  return null;
};

export const UnlockItem = (props: Props) => {
  const { value, isLoading, onTest, onDelete, disabled } = props;

  const statusIcon = getStatusIcon(value.status);

  return (
    <ListItem
      dense
      sx={{
        borderBottom: "1px solid var(--divider-color)",
        py: 1.25,
        px: { xs: 1.5, sm: 2 },
        "&:hover": {
          bgcolor: (theme) =>
            theme.palette.mode === "dark"
              ? "rgba(255, 255, 255, 0.02)"
              : "rgba(0, 0, 0, 0.02)",
        },
        transition: "background-color 0.2s",
      }}
      secondaryAction={
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
          <Tooltip title={isLoading ? "Testing..." : "Test"} arrow>
            <IconButton
              size="small"
              onClick={() => onTest(value.name)}
              disabled={disabled || isLoading}
              sx={{
                width: 32,
                height: 32,
                transition: "all 0.2s",
                "&:hover": {
                  bgcolor: "primary.main",
                  color: "primary.contrastText",
                  transform: "scale(1.05)",
                },
              }}
            >
              <PlayArrowRounded
                sx={{
                  fontSize: 18,
                  animation: isLoading ? "spin 1s linear infinite" : "none",
                  "@keyframes spin": {
                    "0%": { transform: "rotate(0deg)" },
                    "100%": { transform: "rotate(360deg)" },
                  },
                }}
              />
            </IconButton>
          </Tooltip>
          {value.isCustom && onDelete && (
            <Tooltip title="Delete" arrow>
              <IconButton
                size="small"
                onClick={() => onDelete(value.name)}
                sx={{
                  width: 32,
                  height: 32,
                  transition: "all 0.2s",
                  "&:hover": {
                    bgcolor: "error.main",
                    color: "error.contrastText",
                    transform: "scale(1.05)",
                  },
                }}
              >
                <DeleteRounded sx={{ fontSize: 18 }} />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      }
    >
      <ListItemText
        sx={{
          userSelect: "text",
          pr: value.isCustom ? 10 : 6,
          m: 0,
        }}
        primary={
          <Box sx={{ display: "flex", alignItems: "center", mb: 0.5 }}>
            {statusIcon && <StatusIcon>{statusIcon}</StatusIcon>}
            <Box
              component="span"
              sx={{
                fontSize: "14px",
                fontWeight: 500,
                color: "text.primary",
                letterSpacing: "-0.01em",
              }}
            >
              {value.name}
            </Box>
          </Box>
        }
        secondary={
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.25, mt: 0.5 }}>
            <Tag
              sx={{
                color: getStatusColor(value.status),
                textTransform: "uppercase",
                fontWeight: 600,
                backgroundColor: (theme) =>
                  alpha(
                    theme.palette.mode === "dark"
                      ? "rgba(255, 255, 255, 0.05)"
                      : "rgba(0, 0, 0, 0.05)",
                    0.5,
                  ),
              }}
            >
              {value.status}
            </Tag>
            {value.region && (
              <Tag
                sx={{
                  color: "info.main",
                  display: "flex",
                  alignItems: "center",
                  gap: 0.3,
                }}
              >
                <PublicRounded sx={{ fontSize: 10 }} />
                {value.region}
              </Tag>
            )}
            {value.check_time && (
              <Tag
                sx={{
                  color: "text.secondary",
                  display: "flex",
                  alignItems: "center",
                  gap: 0.3,
                }}
              >
                <AccessTimeRounded sx={{ fontSize: 10 }} />
                {value.check_time}
              </Tag>
            )}
            {value.isCustom && (
              <Tag
                sx={{
                  color: "warning.main",
                  fontWeight: 600,
                  backgroundColor: (theme) =>
                    alpha(theme.palette.warning.main, 0.1),
                  borderColor: (theme) => alpha(theme.palette.warning.main, 0.3),
                }}
              >
                CUSTOM
              </Tag>
            )}
            {value.description && (
              <Tag
                sx={{
                  color: "text.secondary",
                  fontStyle: "italic",
                  maxWidth: 200,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {value.description}
              </Tag>
            )}
          </Box>
        }
      />
    </ListItem>
  );
};

