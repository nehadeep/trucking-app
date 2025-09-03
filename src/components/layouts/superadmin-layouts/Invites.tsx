import React from "react";
import { Tabs, Tab, Box } from "@mui/material";
import { Outlet, useLocation, useNavigate } from "react-router-dom";

const Invites: React.FC = () => {
    const location = useLocation();
    const navigate = useNavigate();

    // Which tab is active based on route
    const currentTab = location.pathname.includes("status") ? "status" : "send";

    const handleChange = (_: React.SyntheticEvent, newValue: string) => {
        navigate(newValue);
    };

    return (
        <Box sx={{ width: "100%" }}>
            <Tabs
                value={currentTab}
                onChange={handleChange}
                centered
                textColor="primary"
                indicatorColor="primary"
                sx={{ mb: 3 }}
            >
                <Tab label="Send Invitation" value="send" />
                <Tab label="Invitation Status" value="status" />
            </Tabs>

            {/* Nested routes render here */}
            <Outlet />
        </Box>
    );
};

export default Invites;
