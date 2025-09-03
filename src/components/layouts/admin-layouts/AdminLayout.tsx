import React from "react";
import { Outlet, Link, useLocation, useOutletContext } from "react-router-dom";
import {
    Toolbar,
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
import DashboardIcon from "@mui/icons-material/Dashboard";
import PeopleIcon from "@mui/icons-material/People";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";
import InventoryIcon from "@mui/icons-material/Inventory";
import MapIcon from "@mui/icons-material/Map";
import RouteIcon from "@mui/icons-material/AltRoute";
import SettingsIcon from "@mui/icons-material/Settings";
import { OutletContextType } from "../console-layouts/ConsoleLayout";

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
    const { mobileOpen, handleDrawerToggle } =
        useOutletContext<OutletContextType>();
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
                            sx={{
                                "&.Mui-selected": {
                                    bgcolor: "primary.main",
                                    color: "white",
                                    "& .MuiListItemIcon-root": {
                                        color: "white",
                                    },
                                },
                                "&.Mui-selected:hover": {
                                    bgcolor: "primary.dark",
                                },
                            }}
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

            {/* Drawer for mobile */}
            <Drawer
                variant="temporary"
                open={mobileOpen}
                onClose={handleDrawerToggle}
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
            <Box
                component="main"
                sx={{
                    flexGrow: 1,
                    ml: { sm: `${drawerWidth}px` }, // ✅ offset for drawer
                    minHeight: "100vh",
                }}
            >
                <Outlet />
            </Box>
        </Box>
    );
};

export default AdminLayout;
