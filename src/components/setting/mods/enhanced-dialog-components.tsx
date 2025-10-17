import { Box, Typography, Divider } from "@mui/material";
import React, { ReactNode } from "react";

/**
 * 简洁统一的对话框标题
 */
interface EnhancedDialogTitleProps {
  title: string;
  action?: ReactNode;
}

export const EnhancedDialogTitle: React.FC<EnhancedDialogTitleProps> = ({
  title,
  action,
}) => {
  return (
    <Box sx={{ mb: 3 }}>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          pb: 1.5,
        }}
      >
        <Typography
          sx={{
            fontSize: "15px",
            fontWeight: 600,
            color: "text.primary",
          }}
        >
          {title}
        </Typography>
        {action}
      </Box>
      <Divider />
    </Box>
  );
};

/**
 * 简洁统一的表单项
 */
interface EnhancedFormItemProps {
  label: string | ReactNode;
  description?: string;
  children: ReactNode;
  fullWidth?: boolean;
}

export const EnhancedFormItem: React.FC<EnhancedFormItemProps> = ({
  label,
  description,
  children,
  fullWidth = false,
}) => {
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: fullWidth ? "flex-start" : "center",
        flexDirection: fullWidth ? "column" : "row",
        justifyContent: "space-between",
        py: 1.5,
        gap: fullWidth ? 1 : 2,
      }}
    >
      <Box sx={{ flex: fullWidth ? "none" : 1 }}>
        <Typography
          sx={{
            fontSize: "13px",
            fontWeight: 500,
            color: "text.primary",
            lineHeight: 1.5,
          }}
        >
          {label}
        </Typography>
        {description && (
          <Typography
            sx={{
              fontSize: "12px",
              color: "text.secondary",
              lineHeight: 1.5,
              mt: 0.25,
            }}
          >
            {description}
          </Typography>
        )}
      </Box>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          width: fullWidth ? "100%" : "auto",
        }}
      >
        {children}
      </Box>
    </Box>
  );
};

/**
 * 简洁统一的信息区域
 */
interface EnhancedInfoCardProps {
  title: string;
  children: ReactNode;
}

export const EnhancedInfoCard: React.FC<EnhancedInfoCardProps> = ({
  title,
  children,
}) => {
  return (
    <Box sx={{ mb: 3 }}>
      <Typography
        sx={{
          fontSize: "12px",
          fontWeight: 600,
          color: "text.secondary",
          mb: 1,
        }}
      >
        {title}
      </Typography>
      <Box>{children}</Box>
    </Box>
  );
};

/**
 * 简洁统一的信息行
 */
interface EnhancedInfoRowProps {
  label: string;
  value: string | ReactNode;
}

export const EnhancedInfoRow: React.FC<EnhancedInfoRowProps> = ({
  label,
  value,
}) => {
  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        py: 1,
        borderBottom: "1px solid",
        borderColor: "divider",
        "&:last-child": {
          borderBottom: "none",
        },
      }}
    >
      <Typography
        sx={{
          fontSize: "13px",
          color: "text.secondary",
        }}
      >
        {label}
      </Typography>
      <Typography
        sx={{
          fontSize: "13px",
          fontWeight: 500,
          color: "text.primary",
          fontFamily: typeof value === "string" ? "monospace" : "inherit",
        }}
      >
        {value}
      </Typography>
    </Box>
  );
};

/**
 * 简洁统一的表单分组
 */
interface EnhancedFormGroupProps {
  title?: string;
  children: ReactNode;
}

export const EnhancedFormGroup: React.FC<EnhancedFormGroupProps> = ({
  title,
  children,
}) => {
  return (
    <Box sx={{ mb: 3 }}>
      {title && (
        <Typography
          sx={{
            fontSize: "12px",
            fontWeight: 600,
            color: "text.secondary",
            mb: 1,
          }}
        >
          {title}
        </Typography>
      )}
      <Box>
        {children}
        <Divider sx={{ mt: 1.5 }} />
      </Box>
    </Box>
  );
};

