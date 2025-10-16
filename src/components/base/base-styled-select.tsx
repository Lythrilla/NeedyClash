import { Select, SelectProps, styled } from "@mui/material";

export const BaseStyledSelect = styled((props: SelectProps<string>) => {
  const { MenuProps, ...otherProps } = props;
  
  return (
    <Select
      className="custom-select"
      size="small"
      autoComplete="new-password"
      native={props.native}
      MenuProps={
        props.native
          ? undefined
          : {
              anchorOrigin: {
                vertical: 'bottom',
                horizontal: 'left',
              },
              transformOrigin: {
                vertical: 'top',
                horizontal: 'left',
              },
              PaperProps: {
                sx: {
                  position: 'fixed',
                  backgroundColor: (theme) =>
                    theme.palette.mode === "light" ? "rgba(255, 255, 255, 0.95)" : "rgba(50, 50, 50, 0.95)",
                  backdropFilter: "blur(20px) saturate(180%)",
                  WebkitBackdropFilter: "blur(20px) saturate(180%)",
                  border: (theme) =>
                    `1px solid ${theme.palette.mode === "light" ? "#E2E8F0" : "rgba(255, 255, 255, 0.1)"}`,
                  boxShadow: (theme) =>
                    theme.palette.mode === "light"
                      ? "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)"
                      : "0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -1px rgba(0, 0, 0, 0.2)",
                  mt: 0.5,
                  borderRadius: "8px",
                  maxHeight: '300px',
                  zIndex: 1400,
                  "& .MuiList-root": {
                    padding: "4px",
                  },
                },
              },
              ...MenuProps,
            }
      }
      sx={{
        width: 120,
        height: 32,
        fontSize: "13px",
        borderRadius: "8px",
        mr: 1,
        '[role="button"]': { py: 0.65 },
      }}
      {...otherProps}
    />
  );
})(({ theme }) => ({
  backgroundColor: theme.palette.background.paper,
  transition: "all 0.2s ease",
  "& .MuiOutlinedInput-notchedOutline": {
    borderColor:
      theme.palette.mode === "dark"
        ? "rgba(255, 255, 255, 0.12)"
        : "#E2E8F0",
  },
  "&:hover .MuiOutlinedInput-notchedOutline": {
    borderColor:
      theme.palette.mode === "dark"
        ? "rgba(255, 255, 255, 0.2)"
        : "#CBD5E1",
  },
  "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
    borderColor: theme.palette.primary.main,
    borderWidth: "2px",
  },
  "& .MuiSelect-icon": {
    color:
      theme.palette.mode === "dark"
        ? "rgba(255, 255, 255, 0.7)"
        : "rgba(0, 0, 0, 0.54)",
  },
  // 原生 select option 样式
  "& option": {
    backgroundColor:
      theme.palette.mode === "dark" ? "#3232326b" : "#FFFFFF",
    color: theme.palette.text.primary,
    padding: "8px 12px",
  },
}));
