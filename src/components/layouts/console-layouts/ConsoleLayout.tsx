import React, { useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import {
    AppBar,
    Toolbar,
    Typography,
    Box,
    IconButton,
} from "@mui/material";
import NotificationsIcon from "@mui/icons-material/Notifications";
import LogoutIcon from "@mui/icons-material/Logout";
import MenuIcon from "@mui/icons-material/Menu";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import { logout } from "../../Logout";

type OutletContextType = {
    mobileOpen: boolean;
    handleDrawerToggle: () => void;
};

const ConsoleLayout: React.FC = () => {
    const [mobileOpen, setMobileOpen] = useState(false);
    const navigate = useNavigate();

    const handleDrawerToggle = () => {
        setMobileOpen(!mobileOpen);
    };

    const handleLogout = async () => {
        await logout();
        navigate("/"); // redirect to login page
    };

    return (
        <Box sx={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
            {/* Shared Header */}
            <AppBar position="static">
                <Toolbar>
                    {/* Mobile menu button */}
                    <IconButton
                        color="inherit"
                        edge="start"
                        sx={{ mr: 2, display: { sm: "none" } }}
                        onClick={handleDrawerToggle}
                    >
                        <MenuIcon />
                    </IconButton>

                    {/* Title */}
                    <Typography
                        variant="h6"
                        sx={{ flexGrow: 1, textAlign: "center" }}
                    >
                        Fleet Console
                    </Typography>

                    {/* Always visible actions */}
                    <IconButton color="inherit">
                        <NotificationsIcon />
                    </IconButton>
                    <IconButton color="inherit">
                        <AccountCircleIcon />
                    </IconButton>
                    <IconButton color="inherit" onClick={handleLogout}>
                        <LogoutIcon />
                    </IconButton>
                </Toolbar>
            </AppBar>

            {/* Main content area */}
            <Box
                sx={{
                    flex: 1,
                    display: "flex",
                    flexDirection: "column", // ✅ stack children vertically
                    width: "100%",           // ✅ force Outlet to take full width
                    minHeight: "100vh",      // optional, ensures full page height
                }}

            >
                <Outlet context={{ mobileOpen, handleDrawerToggle } as OutletContextType} />
            </Box>

            {/* Shared Footer */}
            <Box
                component="footer"
                sx={{ p: 2, textAlign: "center", bgcolor: "grey.200" }}
            >
                <Typography variant="body2">
                    © {new Date().getFullYear()} FleetPro Logistics
                </Typography>
            </Box>
        </Box>
    );
};

export type { OutletContextType };
export default ConsoleLayout;
