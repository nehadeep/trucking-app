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
import SettingsIcon from "@mui/icons-material/Settings";
import MailIcon from "@mui/icons-material/Mail";
import { OutletContextType } from "../console-layouts/ConsoleLayout";
import DashboardIcon from "@mui/icons-material/Dashboard";
import BusinessIcon from "@mui/icons-material/Business";

const drawerWidth = 240;

const navItems = [
    { text: "Dashboard", icon:<DashboardIcon />, path: "dashboard" },
    { text: "Settings", icon: <SettingsIcon />, path: "settings" },
    { text: "Invites", icon: <MailIcon />, path: "invites" },
    { text: "Company Requests", icon: <BusinessIcon />, path: "requests" },
];

const SuperadminLayout: React.FC = () => {

    const { mobileOpen, handleDrawerToggle } = useOutletContext<OutletContextType>();

    const location = useLocation();

    const drawer = (
        <div>
            <Toolbar>
                <Typography variant="h6">Drive Sphere Panel</Typography>
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
                    p: 3,
                    ml: { sm: `${drawerWidth}px` }, // offset so content isn’t hidden
                    minHeight: "100vh",
                }}
            >
                <Outlet />
            </Box>
        </Box>
    );
};

export default SuperadminLayout;
