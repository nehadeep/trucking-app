import React, { useState, useEffect } from "react";
import {Box,Button, TextField, Card, CardContent, Typography, Chip, Grid, InputAdornment, Paper} from "@mui/material";
import { collection, getDocs } from "firebase/firestore";
import { db, auth } from "../../../firebaseConfig";
import DriverModal from "../../modals/DriverModal";
import SearchIcon from "@mui/icons-material/Search";

const Drivers: React.FC = () => {
    const [openAdd, setOpenAdd] = useState(false);
    const [drivers, setDrivers] = useState<any[]>([]);
    const [search, setSearch] = useState("");

    // ✅ Get logged-in adminId
    const adminId = auth.currentUser?.uid;
    console.log("admins id", adminId)

    // 🔍 Load drivers from Firestore
    useEffect(() => {
        const fetchDrivers = async () => {
            if (!adminId) return;
            const snapshot = await getDocs(collection(db, "admins", adminId, "drivers"));
            const list = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
            setDrivers(list);
        };

        fetchDrivers();
    }, [adminId, openAdd]); // re-fetch after modal closes

    // 🔍 Filter by search
    const filteredDrivers = drivers.filter(
        (d) =>
            d.fullName?.toLowerCase().includes(search.toLowerCase()) ||
            d.licenseNumber?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div style={{ padding: 24 }}>
            {/* Header Row */}
            <Box
                display="flex"
                justifyContent="space-between"
                alignItems="center"
                mb={3}
            >
                <Box>
                    <Typography variant="h5" fontWeight={700}>
                        Driver Management
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Manage your fleet drivers and their information
                    </Typography>
                </Box>

                <Button
                    variant="contained"
                    color="primary" // 👈 will use your theme’s primary color
                    sx={{
                        textTransform: "none",
                        borderRadius: "8px",
                        px: 3,
                        py: 1,
                        fontWeight: 600,
                    }}
                    onClick={() => setOpenAdd(true)}
                    disabled={!adminId}
                >
                    + Add Driver
                </Button>
            </Box>


            {/* Search Bar */}
            <Paper
                elevation={1}
                sx={{
                    p: 2.5,
                    borderRadius: "12px",
                    mb: 3,
                }}
            >
                <TextField
                    placeholder="Search drivers by name or license number..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    fullWidth
                    variant="outlined"
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <SearchIcon color="action" />
                            </InputAdornment>
                        ),
                    }}
                />
            </Paper>

            <Grid container spacing={2}>
                {filteredDrivers.map((driver) => (
                    <Grid item xs={12} md={4} key={driver.id} {...({} as any)} >
                        <Card>
                            <CardContent>
                                <Typography variant="h6">{driver.fullName}</Typography>
                                <Typography variant="body2">ID #{driver.licenseNumber}</Typography>
                                <Typography variant="body2">{driver.phone}</Typography>
                                <Typography variant="body2">
                                    {driver.totalMiles?.toLocaleString()} miles driven
                                </Typography>
                                <Typography variant="body2">Hired: {driver.hireDate}</Typography>
                                <Typography variant="body2">
                                    License expires: {driver.licenseExpiry}
                                </Typography>
                                <Chip
                                    label={driver.status}
                                    color={
                                        driver.status === "Active"
                                            ? "success"
                                            : driver.status === "On Trip"
                                            ? "info"
                                            : "default"
                                    }
                                    size="small"
                                    style={{ marginTop: 8 }}
                                />
                            </CardContent>
                        </Card>
                    </Grid>
                ))}
            </Grid>

            {/* Add Driver Modal */}
            {adminId && (
                <DriverModal
                    open={openAdd}
                    onClose={() => setOpenAdd(false)}
                    adminId={adminId}
                />
            )}
        </div>
    );
};

export default Drivers;
