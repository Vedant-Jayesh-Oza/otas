import * as React from "react";
import { styled, alpha } from "@mui/material/styles";
import Box from "@mui/material/Box";
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Container from "@mui/material/Container";
import Divider from "@mui/material/Divider";
import MenuItem from "@mui/material/MenuItem";
import Drawer from "@mui/material/Drawer";
import MenuIcon from "@mui/icons-material/Menu";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import Typography from "@mui/material/Typography";
import ColorModeIconDropdown from "../../shared-ui-theme/ColorModeIconDropdown";
import { useNavigate } from "react-router-dom";

const StyledToolbar = styled(Toolbar)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  flexShrink: 0,
  borderRadius: `calc(${theme.shape.borderRadius}px + 8px)`,
  backdropFilter: "blur(24px)",
  border: "1px solid",
  borderColor: (theme.vars || theme).palette.divider,
  backgroundColor: theme.vars
    ? `rgba(${theme.vars.palette.background.defaultChannel} / 0.4)`
    : alpha(theme.palette.background.default, 0.4),
  boxShadow: (theme.vars || theme).shadows[1],
  padding: "8px 12px",
}));

const navItems = [
  { label: "Features", sectionId: "features" },
  { label: "Highlights", sectionId: "highlights" },
  { label: "FAQ", sectionId: "faq" },
];

function scrollToSection(sectionId: string) {
  const el = document.getElementById(sectionId);
  if (el) {
    el.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

export default function AppAppBar() {
  const [open, setOpen] = React.useState(false);
  const navigate = useNavigate();

  const toggleDrawer = (newOpen: boolean) => () => {
    setOpen(newOpen);
  };

  const handleNavClick = (sectionId: string) => {
    setOpen(false);
    scrollToSection(sectionId);
  };

  return (
    <AppBar
      position="fixed"
      enableColorOnDark
      sx={{
        boxShadow: 0,
        bgcolor: "transparent",
        backgroundImage: "none",
        mt: "calc(var(--template-frame-height, 0px) + 28px)",
      }}
    >
      <Container maxWidth={false}>
        <StyledToolbar variant="dense" disableGutters>
          <Box
            sx={{
              flexGrow: 1,
              display: "flex",
              alignItems: "center",
              px: 0,
              gap: 2,
            }}
          >
            <Typography
              variant="h6"
              color="text.primary"
              onClick={() => navigate("/")}
              sx={{
                display: "flex",
                alignItems: "center",
                fontSize: { xs: "1.25rem", sm: "1.5rem" },
                fontWeight: 600,
                letterSpacing: "-0.02em",
                cursor: "pointer",
                userSelect: "none",
                ml: 1,
              }}
            >
              OT
              <Typography
                component="span"
                variant="h6"
                sx={{
                  fontSize: "inherit",
                  color: "primary.main",
                }}
              >
                AS
              </Typography>
            </Typography>
            <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />

            {/* Desktop nav */}
            <Box sx={{ display: { xs: "none", md: "flex" } }}>
              {navItems.map(({ label, sectionId }) => (
                <MenuItem
                  key={sectionId}
                  onClick={() => handleNavClick(sectionId)}
                >
                  {label}
                </MenuItem>
              ))}
            </Box>
          </Box>

          {/* Desktop auth buttons */}
          <Box
            sx={{
              display: { xs: "none", md: "flex" },
              gap: 1,
              alignItems: "center",
            }}
          >
            <Button
              color="primary"
              variant="text"
              size="small"
              onClick={() => navigate("/login")}
            >
              Log in
            </Button>
            <Button
              color="primary"
              variant="contained"
              size="small"
              onClick={() => navigate("/signup")}
            >
              Sign up
            </Button>
            <ColorModeIconDropdown />
          </Box>

          {/* Mobile */}
          <Box sx={{ display: { xs: "flex", md: "none" }, gap: 1 }}>
            <ColorModeIconDropdown size="medium" />
            <IconButton aria-label="Menu button" onClick={toggleDrawer(true)}>
              <MenuIcon />
            </IconButton>
            <Drawer
              anchor="top"
              open={open}
              onClose={toggleDrawer(false)}
              PaperProps={{
                sx: {
                  top: "var(--template-frame-height, 0px)",
                },
              }}
            >
              <Box sx={{ p: 2, backgroundColor: "background.default" }}>
                <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
                  <IconButton onClick={toggleDrawer(false)}>
                    <CloseRoundedIcon />
                  </IconButton>
                </Box>

                {navItems.map(({ label, sectionId }) => (
                  <MenuItem
                    key={sectionId}
                    onClick={() => handleNavClick(sectionId)}
                  >
                    {label}
                  </MenuItem>
                ))}

                <Divider sx={{ my: 3 }} />
                <MenuItem>
                  <Button
                    color="primary"
                    variant="contained"
                    fullWidth
                    onClick={() => navigate("/login")}
                  >
                    Log in
                  </Button>
                </MenuItem>
                <MenuItem>
                  <Button
                    color="primary"
                    variant="outlined"
                    fullWidth
                    onClick={() => navigate("/signup")}
                  >
                    Sign up
                  </Button>
                </MenuItem>
              </Box>
            </Drawer>
          </Box>
        </StyledToolbar>
      </Container>
    </AppBar>
  );
}
