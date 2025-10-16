import { Select, SelectProps, styled } from "@mui/material";

export const BaseStyledSelect = styled((props: SelectProps<string>) => {
  return (
    <Select
      size="small"
      autoComplete="new-password"
      sx={{
        width: 120,
        height: 32,
        fontSize: "13px",
        borderRadius: "8px",
        mr: 1,
        '[role="button"]': { py: 0.65 },
      }}
      {...props}
    />
  );
})(({ theme }) => ({
  backgroundColor:
    theme.palette.mode === "dark"
      ? "rgba(255, 255, 255, 0.02)"
      : "rgba(0, 0, 0, 0.02)",
}));
