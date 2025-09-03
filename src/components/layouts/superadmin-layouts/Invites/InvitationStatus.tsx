import React from "react";
import { Box, Typography, Card, CardContent } from "@mui/material";

const InvitationStatus: React.FC = () => {
    // Later we'll fetch real invitations from Firestore
    return (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
            <Card sx={{ width: "100%", maxWidth: 600, boxShadow: 2, borderRadius: 2 }}>
                <CardContent>
                    <Typography variant="h5" gutterBottom>
                        Invitation Status
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        This is where you’ll see a list of invitations (pending, accepted, expired).
                    </Typography>
                </CardContent>
            </Card>
        </Box>
    );
};

export default InvitationStatus;
