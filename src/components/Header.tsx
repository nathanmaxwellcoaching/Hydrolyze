// Header.tsx
import { useLocation } from "react-router-dom";
import { observer } from "mobx-react-lite";
import swimStore from "../store/SwimStore";
import {
  Box,
  Typography,
  IconButton,
  Tooltip,
  useMediaQuery,
  useTheme,
  Avatar,
} from "@mui/material";
import FilterListIcon from "@mui/icons-material/FilterList";
import ViewColumnIcon from "@mui/icons-material/ViewColumn";
import MenuIcon from "@mui/icons-material/Menu";
import { useState } from "react";


import ColumnManager from "./ColumnManager";

const Header = observer(
  ({ handleDrawerToggle }: { handleDrawerToggle: () => void }) => {
    const location = useLocation();

    const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down("lg")); // matches Layout breakpoint

    const handleColumnManagerClick = (event: React.MouseEvent<HTMLElement>) =>
      setAnchorEl(event.currentTarget);
    const handleColumnManagerClose = () => setAnchorEl(null);

    let userRole = "";
    if (swimStore.currentUser) {
      if (swimStore.currentUser.isAdmin) {
        if (swimStore.currentUser.userType === "swimmer") {
          userRole = "Swimmer & Admin";
        } else if (swimStore.currentUser.userType === "coach") {
          userRole = "Coach & Admin";
        } else {
          userRole = "Admin";
        }
      } else {
        if (swimStore.currentUser.userType === "swimmer") {
          userRole = "Swimmer";
        } else if (swimStore.currentUser.userType === "coach") {
          userRole = "Coach";
        }
      }
    }

    const iconButtonStyles = {
      color: "var(--color-text-secondary)",
      border: "1px solid rgba(255, 255, 255, 0.1)",
      backgroundColor: "var(--color-background-card)",
      borderRadius: "12px",
      transition: "all 0.3s ease",
      "&:hover": {
        color: "var(--color-accent-green)",
        backgroundColor: "#2c2c2c",
        transform: "scale(1.1)",
        boxShadow: "0 0 15px rgba(113, 235, 75, 0.4)",
      },
    };

    return (
      <Box>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 3,
            p: 1.5,
            background: "transparent",
            borderRadius: "16px",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            {isMobile && (
              <IconButton
                color="inherit"
                aria-label="open drawer"
                edge="start"
                onClick={handleDrawerToggle}
                sx={{ ...iconButtonStyles, mr: 1 }}
              >
                <MenuIcon />
              </IconButton>
            )}
            <Box>
              <Typography
                variant="h4"
                sx={{ fontWeight: "bold", color: "var(--color-text-light)" }}
              >
                {swimStore.currentUser?.name
                  ? `Welcome, ${swimStore.currentUser.name}`
                  : "Dashboard"}
              </Typography>
              {!isMobile && (
              <Typography
                variant="subtitle1"
                sx={{ color: "var(--color-text-secondary)" }}
              >
                Here's your performance overview.
              </Typography>
              )}
            </Box>
          </Box>

          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            {location.pathname === "/" && (
              <>
                {/* ----------  CONTROLS  ---------- */}

                <Tooltip title="Manage Columns">
                  <IconButton
                    sx={iconButtonStyles}
                    onClick={handleColumnManagerClick}
                  >
                    <ViewColumnIcon />
                  </IconButton>
                </Tooltip>
              </>
            )}

            {/* ----------  DESKTOP  AVATAR  BLOCK  ---------- */}
            {!isMobile && (
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1.5,
                  ml: 2,
                  borderLeft: "1px solid rgba(255, 255, 255, 0.1)",
                  pl: 2,
                }}
              >
                <Avatar
                  sx={{
                    bgcolor: "var(--color-accent-blue-purple)",
                    width: 48,
                    height: 48,
                  }}
                >
                  {swimStore.currentUser?.name.charAt(0)}
                </Avatar>
                <Box>
                  <Typography sx={{ fontWeight: "bold" }}>
                    {swimStore.currentUser?.name}
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{ color: "var(--color-text-secondary)" }}
                  >
                    {userRole}
                  </Typography>
                </Box>
              </Box>
            )}
          </Box>
        </Box>

        {/* Filter & column UI rendered below bar */}

        <ColumnManager anchorEl={anchorEl} onClose={handleColumnManagerClose} />
      </Box>
    );
  }
);

export default Header;
