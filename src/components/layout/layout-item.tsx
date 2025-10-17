import {
  alpha,
  ListItem,
  ListItemButton,
  ListItemText,
  ListItemIcon,
} from "@mui/material";
import { useMatch, useResolvedPath, useNavigate } from "react-router-dom";

import { useVerge } from "@/hooks/use-verge";
interface Props {
  to: string;
  children: string;
  icon: React.ReactNode[];
}
export const LayoutItem = (props: Props) => {
  const { to, children, icon } = props;
  const { verge } = useVerge();
  const { menu_icon } = verge ?? {};
  const resolved = useResolvedPath(to);
  const match = useMatch({ path: resolved.pathname, end: true });
  const navigate = useNavigate();

  return (
    <ListItem sx={{ py: 0, px: 0, margin: "3px 0" }}>
      <ListItemButton
        selected={!!match}
        sx={[
          {
            padding: "8px 10px",
            minHeight: "36px",
            borderRadius: "var(--cv-border-radius-md)",
            transition: "all 0.2s ease",
            display: "flex",
            justifyContent: "center",
            
            "& .MuiListItemText-primary": {
              color: "text.primary",
              fontWeight: "400",
              fontSize: "12px",
              lineHeight: "18px",
              textAlign: "center",
            },
            "& .MuiListItemIcon-root": {
              minWidth: "28px",
              color: "text.secondary",
              opacity: 0.6,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              "& svg": {
                fontSize: "18px",
                width: "18px",
                height: "18px",
              },
            },
            
            /* Hover效果 */
            "&:hover": {
              background: "action.hover",
            },
          },
          ({ palette: { mode, primary } }) => {
            const selectedBg = mode === "light" 
              ? primary.main
              : primary.main;
            
            return {
              /* 选中状态 */
              "&.Mui-selected": {
                background: selectedBg,
                
                "& .MuiListItemText-primary": {
                  color: "#FFFFFF",
                  fontWeight: "500",
                },
                "& .MuiListItemIcon-root": {
                  color: "#FFFFFF",
                  opacity: 1,
                },
                
                "&:hover": {
                  background: selectedBg,
                },
              },
            };
          },
        ]}
        onClick={() => navigate(to)}
      >
        {(menu_icon === "monochrome" || !menu_icon) && (
          <ListItemIcon sx={{ mr: 0.75 }}>
            {icon[0]}
          </ListItemIcon>
        )}
        {menu_icon === "colorful" && (
          <ListItemIcon sx={{ mr: 0.75 }}>
            {icon[1]}
          </ListItemIcon>
        )}
        <ListItemText
          sx={{ 
            margin: 0,
            textAlign: menu_icon === "disable" ? "center" : "left",
          }}
          primary={children}
        />
      </ListItemButton>
    </ListItem>
  );
};
