import { TextField, type TextFieldProps, styled } from "@mui/material";
import { useTranslation } from "react-i18next";

export const BaseStyledTextField = styled((props: TextFieldProps) => {
  const { t } = useTranslation();

  return (
    <TextField
      autoComplete="new-password"
      hiddenLabel
      fullWidth
      size="small"
      variant="outlined"
      spellCheck="false"
      placeholder={t("Filter conditions")}
      sx={{}}
      {...props}
    />
  );
})(({ theme }) => ({
  // 使用MUI主题的全局配置
}));
