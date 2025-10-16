import { styled, Box, alpha, ListItem, ListItemText } from "@mui/material";

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

const COLOR = [
  "primary.main",
  "secondary.main",
  "info.main",
  "warning.main",
  "success.main",
];

interface Props {
  index: number;
  value: IRuleItem;
}

const parseColor = (text: string) => {
  if (text === "REJECT" || text === "REJECT-DROP") return "error.main";
  if (text === "DIRECT") return "text.primary";

  let sum = 0;
  for (let i = 0; i < text.length; i++) {
    sum += text.charCodeAt(i);
  }
  return COLOR[sum % COLOR.length];
};

const RuleItem = (props: Props) => {
  const { index, value } = props;

  return (
    <ListItem
      dense
      sx={{ borderBottom: "1px solid var(--divider-color)" }}
    >
      <ListItemText
        sx={{ userSelect: "text" }}
        primary={value.payload || "-"}
        secondary={
          <Box sx={{ display: "flex", flexWrap: "wrap" }}>
            <Tag sx={{ color: "text.secondary" }}>#{index}</Tag>
            <Tag sx={{ textTransform: "uppercase" }}>
              {value.type}
            </Tag>
            <Tag
              sx={{
                color: parseColor(value.proxy),
              }}
            >
              {value.proxy}
            </Tag>
          </Box>
        }
      />
    </ListItem>
  );
};

export default RuleItem;
