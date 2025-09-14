import React, { useEffect, useState } from "react";
import { Box, Card, CardContent, Grid, Typography } from "@mui/material";
import { collection, onSnapshot, query, where ,writeBatch,getDocs} from "firebase/firestore";
import { db } from "../../../firebaseConfig";
import BusinessIcon from "@mui/icons-material/Business";
import PeopleIcon from "@mui/icons-material/People";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";
import TripOriginIcon from "@mui/icons-material/TripOrigin";
import { useNavigate } from "react-router-dom";



const SuperadminDashboard: React.FC = () => {
    const [newCompanyRequests, setNewCompanyRequests] = useState(0);
    const navigate = useNavigate();
    useEffect(() => {
        const q = query(
            collection(db, "notifications"),
            where("status", "==", "unread"),
            where("type", "==", "company_request")
        );

        const unsub = onSnapshot(q, (snap) => {
            setNewCompanyRequests(snap.size);
        });

        return () => unsub();
    }, []);

    const handleCompanyRequestsClick = async () => {
        try {
            // Query all unread company_request notifications
            const q = query(
                collection(db, "notifications"),
                where("status", "==", "unread"),
                where("type", "==", "company_request")
            );

            const snap = await getDocs(q);

            if (!snap.empty) {
                const batch = writeBatch(db);
                snap.forEach((docSnap) => {
                    batch.update(docSnap.ref, { status: "read" });
                });
                await batch.commit();
            }

            // After marking as read, navigate
            navigate("/console/superadmin/requests");
        } catch (err) {
            console.error("Error updating notifications:", err);
        }
    };
    return (
        <Box p={3}>
            <Typography variant="h5" fontWeight="bold" gutterBottom>
                Drive Sphere Overview
            </Typography>
            <Typography variant="body2" color="text.secondary" mb={3}>
                Monitor new company signups, requests, and system usage
            </Typography>

            <Grid container spacing={2}>
                {/* Card 1: New Company Requests */}
                <Grid item xs={12} md={3}>
                    <Card sx={{ borderRadius: 3, boxShadow: 2,cursor: "pointer" }}
                          onClick={handleCompanyRequestsClick}
                           >
                        <CardContent>
                            {/* Row: Icon + Title */}
                            <Box display="flex" alignItems="center" gap={1}>
                                <BusinessIcon color="primary" fontSize="large" />
                                <Typography variant="subtitle2" color="text.secondary" fontWeight="bold">
                                    NEW COMPANY REQUESTS
                                </Typography>
                            </Box>

                            {/* Row: Description */}
                            <Typography variant="body2" color="text.secondary" mt={1}>
                                Pending approval requests from new companies
                            </Typography>

                            {/* Row: Count */}
                            <Typography variant="h4" color="primary" mt={2}>
                                {newCompanyRequests}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Card 2: Total Admins */}
                <Grid item xs={12} md={3}>
                    <Card sx={{ borderRadius: 3, boxShadow: 2 }}>
                        <CardContent>
                            <PeopleIcon color="secondary" fontSize="large" />
                            <Typography variant="subtitle2" color="text.secondary" mt={1}>
                                ACTIVE ADMINS
                            </Typography>
                            <Typography variant="h5" fontWeight="bold">
                                12 {/* Replace with Firestore query */}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Card 3: Registered Companies */}
                <Grid item xs={12} md={3}>
                    <Card sx={{ borderRadius: 3, boxShadow: 2 }}>
                        <CardContent>
                            <LocalShippingIcon color="error" fontSize="large" />
                            <Typography variant="subtitle2" color="text.secondary" mt={1}>
                                REGISTERED COMPANIES
                            </Typography>
                            <Typography variant="h5" fontWeight="bold">
                                5 {/* Replace with Firestore query */}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Card 4: Active Drivers */}
                <Grid item xs={12} md={3}>
                    <Card sx={{ borderRadius: 3, boxShadow: 2 }}>
                        <CardContent>
                            <TripOriginIcon color="success" fontSize="large" />
                            <Typography variant="subtitle2" color="text.secondary" mt={1}>
                                ACTIVE DRIVERS
                            </Typography>
                            <Typography variant="h5" fontWeight="bold">
                                28 {/* Replace with Firestore query */}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>
        </Box>
    );
};

export default SuperadminDashboard;
