import { LoadingButton } from "@mui/lab";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  type SxProps,
  type Theme,
} from "@mui/material";
import { ReactNode } from "react";

interface Props {
  title: ReactNode;
  open: boolean;
  okBtn?: ReactNode;
  cancelBtn?: ReactNode;
  disableOk?: boolean;
  disableCancel?: boolean;
  disableFooter?: boolean;
  contentSx?: SxProps<Theme>;
  children?: ReactNode;
  loading?: boolean;
  onOk?: () => void;
  onCancel?: () => void;
  onClose?: () => void;
}

export interface DialogRef {
  open: () => void;
  close: () => void;
}

export const BaseDialog: React.FC<Props> = ({
  open,
  title,
  children,
  okBtn,
  cancelBtn,
  contentSx,
  disableCancel,
  disableOk,
  disableFooter,
  loading,
  onOk,
  onCancel,
  onClose,
}) => {
  return (
    <Dialog
      className="custom-dialog"
      open={open}
      onClose={onClose}
      sx={{
        "& .MuiBackdrop-root": {
          backgroundColor: "rgba(0, 0, 0, 0.5)",
        },
        "& .MuiDialog-container": {
          alignItems: "center",
          justifyContent: "center",
          height: "100vh",
        },
        "& .MuiDialog-paper": {
          margin: "auto",
          position: "relative",
          maxHeight: "90vh",
        },
      }}
      disablePortal={false}
      keepMounted={false}
      disableScrollLock={false}
    >
      <DialogTitle>{title}</DialogTitle>

      <DialogContent sx={contentSx}>{children}</DialogContent>

      {!disableFooter && (
        <DialogActions>
          {!disableCancel && (
            <Button variant="outlined" onClick={onCancel}>
              {cancelBtn}
            </Button>
          )}
          {!disableOk && (
            <LoadingButton loading={loading} variant="contained" onClick={onOk}>
              {okBtn}
            </LoadingButton>
          )}
        </DialogActions>
      )}
    </Dialog>
  );
};
