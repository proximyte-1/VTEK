import React, { useState } from "react";
import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import Toolbar from "@mui/material/Toolbar";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import Menu from "@mui/material/Menu";
import MenuIcon from "@mui/icons-material/Menu";
import Container from "@mui/material/Container";
import Avatar from "@mui/material/Avatar";
import Button from "@mui/material/Button";
import Tooltip from "@mui/material/Tooltip";
import MenuItem from "@mui/material/MenuItem";
import { useNavigate } from "react-router-dom";
import logo from "../../assets/logo.png";
import { ExpandLess, ExpandMore } from "@mui/icons-material";
import { Collapse, List, ListItemButton } from "@mui/material";
import { useAuth } from "../../utils/auth";

const pages = [
  { endpoint: "", name: "Home" },
  { endpoint: "master", name: "Master" },
  { endpoint: "flk", name: "Laporan Kerja" },
  { endpoint: "report", name: "Report" },
  { endpoint: "login", name: "User" },
];
const settings = [
  { endpoint: "/profile", name: "Profile" },
  { endpoint: "/logout", name: "Logout" },
];

const menu_flk = [
  { name: "Dengan Barang", endpoint: "/flk" },
  { name: "Tanpa Barang", endpoint: "/flk-no-barang" },
];

const menu_master = [
  { name: "User", endpoint: "/users" },
  { name: "Kontrak", endpoint: "/contract" },
  { name: "Instalasi", endpoint: "/instalasi" },
  { name: "Area", endpoint: "/area" },
  { name: "Global Settings", endpoint: "/settings" },
];

// const menu_report = [
//   { name: "Per Periode", endpoint: "/users" },
//   { name: "Per ", endpoint: "/contract" },
//   { name: "Instalasi", endpoint: "/instalasi" },
//   { name: "Area", endpoint: "/area" },
//   { name: "Global Settings", endpoint: "/settings" },
// ];

function Navbar() {
  const [anchorElNav, setAnchorElNav] = useState(null);
  const [anchorElUser, setAnchorElUser] = useState(null);
  const [anchorElFLK, setAnchorElFLK] = useState(null);
  const [anchorElMaster, setAnchorElMaster] = useState(null);
  const [openSubMenu, setOpenSubMenu] = useState(false);

  // Destructure authentication state and functions from the context
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleOpenNavMenu = (event) => {
    setAnchorElNav(event.currentTarget);
  };
  const handleLogout = async () => {
    console.log(user);
    // return;
    logout();
  };
  const handleOpenUserMenu = (event) => {
    setAnchorElUser(event.currentTarget);
  };
  const handleOpenFLKMenu = (event) => {
    setAnchorElFLK(event.currentTarget);
  };
  const handleOpenMasterMenu = (event) => {
    setAnchorElMaster(event.currentTarget);
  };
  const handleCloseNavMenu = () => {
    setAnchorElNav(null);
  };
  const handleToggleSubMenu = () => {
    setOpenSubMenu((prev) => !prev);
  };

  const handleCloseUserMenu = () => {
    setAnchorElUser(null);
  };
  const handleCloseFLKMenu = () => {
    setAnchorElFLK(null);
  };
  const handleCloseMasterMenu = () => {
    setAnchorElMaster(null);
  };

  return (
    <AppBar position="static">
      <Container maxWidth="xl">
        <Toolbar disableGutters>
          <img
            src={logo}
            style={{ backgroundColor: "white", maxWidth: 85 }}
            sx={{
              display: { xs: "none", md: "flex" },
              mr: 1,
              backgroundColor: "white",
              maxWidth: 85,
            }}
            loading="lazy"
            onClick={() => navigate(pages.Home)}
          ></img>

          {/* Display Responsive */}
          <Box sx={{ flexGrow: 1, display: { xs: "flex", md: "none" } }}>
            <IconButton
              size="large"
              aria-label="account of current user"
              aria-controls="menu-appbar"
              aria-haspopup="true"
              onClick={handleOpenNavMenu}
              color="inherit"
            >
              <MenuIcon />
            </IconButton>
            <Menu
              id="menu-appbar"
              anchorEl={anchorElNav}
              anchorOrigin={{
                vertical: "bottom",
                horizontal: "center",
              }}
              keepMounted
              transformOrigin={{
                vertical: "top",
                horizontal: "center",
              }}
              open={Boolean(anchorElNav)}
              onClose={handleCloseNavMenu}
              sx={{ display: { xs: "block", md: "none" } }}
            >
              {pages.map((data) => {
                if (data.endpoint === "flk") {
                  return (
                    <div key={data.endpoint}>
                      <MenuItem onClick={handleToggleSubMenu}>
                        <Typography textAlign="center" sx={{ flexGrow: 1 }}>
                          {data.name}
                        </Typography>
                        {openSubMenu ? <ExpandLess /> : <ExpandMore />}
                      </MenuItem>
                      <Collapse in={openSubMenu} timeout="auto" unmountOnExit>
                        <List component="div" disablePadding>
                          {menu_flk.map((sub) => (
                            <ListItemButton
                              key={sub.endpoint}
                              sx={{ pl: 4 }}
                              onClick={() => {
                                navigate(sub.endpoint);
                                handleCloseNavMenu();
                              }}
                            >
                              <Typography>{sub.name}</Typography>
                            </ListItemButton>
                          ))}
                        </List>
                      </Collapse>
                    </div>
                  );
                }

                return (
                  <MenuItem
                    key={data.endpoint}
                    onClick={() => {
                      navigate(`/${data.endpoint}`);
                      handleCloseNavMenu();
                    }}
                  >
                    <Typography textAlign="center">{data.name}</Typography>
                  </MenuItem>
                );
              })}
            </Menu>
          </Box>

          {/* Display Normal */}
          <Box sx={{ flexGrow: 1, display: { xs: "none", md: "flex" } }}>
            {Object.entries(pages).map(([index, data]) => (
              <Button
                key={index}
                onClick={(e) => {
                  if (data.endpoint === "flk") {
                    handleOpenFLKMenu(e);
                  } else if (data.endpoint === "master") {
                    handleOpenMasterMenu(e);
                  } else if (data.endpoint === "login") {
                    console.log(user);
                  } else {
                    navigate(data.endpoint);
                  }
                }}
                sx={{ my: 2, mx: 2, color: "white", display: "block" }}
              >
                {data.name}
              </Button>
            ))}

            <Menu
              sx={{ mt: "45px" }}
              id="menu-appbar"
              anchorEl={anchorElFLK}
              anchorOrigin={{
                vertical: "top",
                horizontal: "right",
              }}
              keepMounted
              transformOrigin={{
                vertical: "top",
                horizontal: "right",
              }}
              open={Boolean(anchorElFLK)}
              onClose={handleCloseFLKMenu}
            >
              {menu_flk.map((data) => (
                <MenuItem key={data.endpoint} onClick={handleCloseFLKMenu}>
                  <Typography
                    sx={{ textAlign: "center", padding: "2px" }}
                    onClick={() => navigate(data.endpoint)}
                  >
                    {data.name}
                  </Typography>
                </MenuItem>
              ))}
            </Menu>

            <Menu
              sx={{ mt: "45px" }}
              id="menu-appbar"
              anchorEl={anchorElMaster}
              anchorOrigin={{
                vertical: "top",
                horizontal: "right",
              }}
              keepMounted
              transformOrigin={{
                vertical: "top",
                horizontal: "right",
              }}
              open={Boolean(anchorElMaster)}
              onClose={handleCloseMasterMenu}
            >
              {menu_master.map((data) => (
                <MenuItem key={data.endpoint} onClick={handleCloseMasterMenu}>
                  <Typography
                    sx={{ textAlign: "center", padding: "2px" }}
                    onClick={() => navigate(data.endpoint)}
                  >
                    {data.name}
                  </Typography>
                </MenuItem>
              ))}
            </Menu>
          </Box>

          <Box sx={{ flexGrow: 0 }}>
            <Tooltip title="Open settings">
              <IconButton onClick={handleOpenUserMenu} sx={{ p: 0 }}>
                <Avatar
                  alt="Remy Sharp"
                  referrerPolicy="no-referrer"
                  src={user?._json?.picture || "/static/images/avatar/2.jpg"}
                />
              </IconButton>
            </Tooltip>
            <Menu
              sx={{ mt: "45px" }}
              id="menu-appbar"
              anchorEl={anchorElUser}
              anchorOrigin={{
                vertical: "top",
                horizontal: "right",
              }}
              keepMounted
              transformOrigin={{
                vertical: "top",
                horizontal: "right",
              }}
              open={Boolean(anchorElUser)}
              onClose={handleCloseUserMenu}
            >
              {settings.map((data) => (
                <MenuItem key={data.endpoint} onClick={handleCloseUserMenu}>
                  <Typography
                    sx={{ textAlign: "center" }}
                    onClick={() => handleLogout()}
                  >
                    {data.name}
                  </Typography>
                </MenuItem>
              ))}
            </Menu>
          </Box>
        </Toolbar>
      </Container>
    </AppBar>
  );
}
export default Navbar;
