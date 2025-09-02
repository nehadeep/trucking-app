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
import SettingsIcon from "@mui/icons-material/Settings";
import MailIcon from "@mui/icons-material/Mail";

const drawerWidth = 240;

const navItems = [
    { text: "Settings", icon: <SettingsIcon />, path: "settings" },
    { text: "Invites", icon: <MailIcon />, path: "invites" },
];

const SuperadminLayout: React.FC = () => {
    const [mobileOpen, setMobileOpen] = useState(false);
    const location = useLocation();

    const drawer = (
        <div>
            <Toolbar>
                <Typography variant="h6">Superadmin Panel</Typography>
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
            {/* AppBar for mobile */}
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
                        Superadmin Panel
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
            <Box
                component="main"
                sx={{
                    flexGrow: 1,
                    p: 3,
                    ml: { sm: `${drawerWidth}px` }, // offset so content isn’t hidden
                    minHeight: "100vh"
                }}
            >
                <Toolbar />
                <Outlet />
            </Box>
        </Box>
    );
};

export default SuperadminLayout;
