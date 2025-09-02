import React from "react";
import { Outlet } from "react-router-dom";
import { AppBar, Toolbar, Typography, Box } from "@mui/material";

const ConsoleLayout: React.FC = () => {
    return (
        <Box sx={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
            {/* Shared Header */}
            <AppBar position="static">
                <Toolbar>
                    <Typography variant="h6" sx={{ flexGrow: 1 }}>
                        Fleet Console
                    </Typography>
                    {/* Example: You can add a logout button, profile menu, etc. here */}
                </Toolbar>
            </AppBar>

            {/* Role-specific layouts (Superadmin or Admin) will be nested here */}
            <Box sx={{ flex: 1, display: "flex" }}>
                <Outlet />
            </Box>

            {/* Shared Footer */}
            <Box component="footer" sx={{ p: 2, textAlign: "center", bgcolor: "grey.200" }}>
                <Typography variant="body2">© {new Date().getFullYear()} FleetPro Logistics</Typography>
            </Box>
        </Box>
    );
};

export default ConsoleLayout;
