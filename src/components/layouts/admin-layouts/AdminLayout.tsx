import React, { useState } from "react";
import { Outlet, Link, useLocation } from "react-router-dom";
import {
    AppBar,
    Toolbar,
    IconButton,
    Typography,
    Drawer,
    List,
    ListItem,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    CssBaseline,
    Box,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import DashboardIcon from "@mui/icons-material/Dashboard";
import PeopleIcon from "@mui/icons-material/People";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";
import InventoryIcon from "@mui/icons-material/Inventory";
import MapIcon from "@mui/icons-material/Map";
import RouteIcon from "@mui/icons-material/AltRoute";
import SettingsIcon from "@mui/icons-material/Settings";

const drawerWidth = 240;

const navItems = [
    { text: "Dashboard", icon: <DashboardIcon />, path: "dashboard" },
    { text: "Drivers", icon: <PeopleIcon />, path: "drivers" },
    { text: "Trucks", icon: <LocalShippingIcon />, path: "trucks" },
    { text: "Trailers", icon: <InventoryIcon />, path: "trailers" },
    { text: "Routes", icon: <MapIcon />, path: "routes" },
    { text: "Trips", icon: <RouteIcon />, path: "trips" },
    { text: "Settings", icon: <SettingsIcon />, path: "settings" },
];

const AdminLayout: React.FC = () => {
    const [mobileOpen, setMobileOpen] = useState(false);
    const location = useLocation();

    const drawer = (
        <div>
            <Toolbar>
                <Typography variant="h6">Admin Panel</Typography>
            </Toolbar>
            <List>
                {navItems.map((item) => (
                    <ListItem key={item.text} disablePadding>
                        <ListItemButton
                            component={Link}
                            to={item.path}
                            selected={location.pathname.includes(item.path)}
                        >
                            <ListItemIcon>{item.icon}</ListItemIcon>
                            <ListItemText primary={item.text} />
                        </ListItemButton>
                    </ListItem>
                ))}
            </List>
        </div>
    );

    return (
        <Box sx={{ display: "flex" }}>
            <CssBaseline />

            {/* Top bar for mobile */}
            <AppBar position="fixed" sx={{ display: { sm: "none" } }}>
                <Toolbar>
                    <IconButton
                        color="inherit"
                        edge="start"
                        onClick={() => setMobileOpen(!mobileOpen)}
                    >
                        <MenuIcon />
                    </IconButton>
                    <Typography variant="h6" noWrap>
                        Admin Panel
                    </Typography>
                </Toolbar>
            </AppBar>

            {/* Drawer for mobile */}
            <Drawer
                variant="temporary"
                open={mobileOpen}
                onClose={() => setMobileOpen(false)}
                sx={{
                    display: { xs: "block", sm: "none" },
                    "& .MuiDrawer-paper": { width: drawerWidth },
                }}
            >
                {drawer}
            </Drawer>

            {/* Permanent drawer for desktop */}
            <Drawer
                variant="permanent"
                sx={{
                    display: { xs: "none", sm: "block" },
                    "& .MuiDrawer-paper": { width: drawerWidth, boxSizing: "border-box" },
                }}
                open
            >
                {drawer}
            </Drawer>

            {/* Page Content */}
            <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
                <Toolbar /> {/* keeps content below AppBar */}
                <Outlet />
            </Box>
        </Box>
    );
};

export default AdminLayout;
