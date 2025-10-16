import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Typography,
} from "@mui/material";
import { CloseRounded } from "@mui/icons-material";
import { useLockFn } from "ahooks";
import dayjs from "dayjs";
import { t } from "i18next";
import { useImperativeHandle, useState, type Ref } from "react";
import { closeConnections } from "tauri-plugin-mihomo-api";

import parseTraffic from "@/utils/parse-traffic";

export interface ConnectionDetailRef {
  open: (detail: IConnectionsItem) => void;
}

export function ConnectionDetail({ ref }: { ref?: Ref<ConnectionDetailRef> }) {
  const [open, setOpen] = useState(false);
  const [detail, setDetail] = useState<IConnectionsItem>(null!);

  useImperativeHandle(ref, () => ({
    open: (detail: IConnectionsItem) => {
      if (open) return;
      setOpen(true);
      setDetail(detail);
    },
  }));

  const onClose = () => setOpen(false);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: "12px",
        },
      }}
    >
      {detail ? <InnerConnectionDetail data={detail} onClose={onClose} /> : null}
    </Dialog>
  );
}

interface InnerProps {
  data: IConnectionsItem;
  onClose?: () => void;
}

const InnerConnectionDetail = ({ data, onClose }: InnerProps) => {
  const { metadata, rulePayload } = data;
  const chains = [...data.chains].reverse().join(" → ");
  const rule = rulePayload ? `${data.rule}(${rulePayload})` : data.rule;
  const host = metadata.host
    ? `${metadata.host}:${metadata.destinationPort}`
    : `${metadata.remoteDestination}:${metadata.destinationPort}`;
  const Destination = metadata.destinationIP
    ? metadata.destinationIP
    : metadata.remoteDestination;

  const onDelete = useLockFn(async () => closeConnections(data.id));

  const InfoRow = ({ label, value }: { label: string; value: string }) => (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: "120px 1fr",
        gap: 2,
        alignItems: "start",
        py: 1,
        borderBottom: (theme) =>
          `1px solid ${
            theme.palette.mode === "dark"
              ? "rgba(255, 255, 255, 0.04)"
              : "rgba(0, 0, 0, 0.04)"
          }`,
        "&:last-child": {
          borderBottom: "none",
        },
      }}
    >
      <Typography
        sx={{
          fontSize: "12px",
          fontWeight: 600,
          color: "text.secondary",
          pt: 0.25,
        }}
      >
        {label}
      </Typography>
      <Typography
        sx={{
          fontSize: "13px",
          color: "text.primary",
          wordBreak: "break-all",
          fontFamily: "monospace",
          backgroundColor: (theme) =>
            theme.palette.mode === "dark"
              ? "rgba(255, 255, 255, 0.02)"
              : "rgba(0, 0, 0, 0.02)",
          px: 1,
          py: 0.5,
          borderRadius: "4px",
        }}
      >
        {value}
      </Typography>
    </Box>
  );

  return (
    <>
      <DialogTitle
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          pb: 2,
          borderBottom: (theme) =>
            `1px solid ${
              theme.palette.mode === "dark"
                ? "rgba(255, 255, 255, 0.08)"
                : "rgba(0, 0, 0, 0.08)"
            }`,
        }}
      >
        <Typography variant="h6" sx={{ fontSize: "15px", fontWeight: 600 }}>
          {t("Connection Details")}
        </Typography>
        <IconButton
          size="small"
          onClick={onClose}
          sx={{
            "&:hover": { bgcolor: "action.hover" },
          }}
        >
          <CloseRounded sx={{ fontSize: 20 }} />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ px: 3, py: 2.5 }}>
        <Box sx={{ userSelect: "text" }}>
          {/* 基础信息 */}
          <Typography
            sx={{
              fontSize: "11px",
              fontWeight: 700,
              color: "text.disabled",
              textTransform: "uppercase",
              letterSpacing: "0.8px",
              mb: 1.5,
            }}
          >
            {t("Connection Info")}
          </Typography>
          <Box sx={{ mb: 3 }}>
            <InfoRow label={t("Host")} value={host} />
            <InfoRow
              label={t("Type")}
              value={`${metadata.type}(${metadata.network})`}
            />
            <InfoRow label={t("Time")} value={dayjs(data.start).fromNow()} />
            <InfoRow label={t("Chains")} value={chains} />
            <InfoRow label={t("Rule")} value={rule} />
          </Box>

          {/* 流量信息 */}
          <Typography
            sx={{
              fontSize: "11px",
              fontWeight: 700,
              color: "text.disabled",
              textTransform: "uppercase",
              letterSpacing: "0.8px",
              mb: 1.5,
            }}
          >
            {t("Traffic Stats")}
          </Typography>
          <Box sx={{ mb: 3 }}>
            <InfoRow
              label={t("Downloaded")}
              value={parseTraffic(data.download).join(" ")}
            />
            <InfoRow
              label={t("Uploaded")}
              value={parseTraffic(data.upload).join(" ")}
            />
            <InfoRow
              label={t("DL Speed")}
              value={parseTraffic(data.curDownload ?? -1).join(" ") + "/s"}
            />
            <InfoRow
              label={t("UL Speed")}
              value={parseTraffic(data.curUpload ?? -1).join(" ") + "/s"}
            />
          </Box>

          {/* 网络信息 */}
          <Typography
            sx={{
              fontSize: "11px",
              fontWeight: 700,
              color: "text.disabled",
              textTransform: "uppercase",
              letterSpacing: "0.8px",
              mb: 1.5,
            }}
          >
            {t("Network Details")}
          </Typography>
          <Box>
            <InfoRow
              label={t("Source")}
              value={`${metadata.sourceIP}:${metadata.sourcePort}`}
            />
            <InfoRow label={t("Destination")} value={Destination} />
            <InfoRow
              label={t("DestinationPort")}
              value={`${metadata.destinationPort}`}
            />
            <InfoRow
              label={t("Process")}
              value={`${metadata.process}${metadata.processPath ? `\n${metadata.processPath}` : ""}`}
            />
          </Box>
        </Box>
      </DialogContent>

      <DialogActions
        sx={{
          px: 3,
          py: 2,
          borderTop: (theme) =>
            `1px solid ${
              theme.palette.mode === "dark"
                ? "rgba(255, 255, 255, 0.08)"
                : "rgba(0, 0, 0, 0.08)"
            }`,
        }}
      >
        <Button onClick={onClose}>{t("Cancel")}</Button>
        <Button
          variant="contained"
          color="error"
          onClick={() => {
            onDelete();
            onClose?.();
          }}
        >
          {t("Close Connection")}
        </Button>
      </DialogActions>
    </>
  );
};
