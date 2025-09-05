import React, { useState, useEffect } from "react";
import {
    Box,
    Button,
    TextField,
    Card,
    CardContent,
    Typography,
    Chip,
    Avatar,
    InputAdornment,
    Paper,
    Divider, Grid
} from "@mui/material";

import PhoneIcon from "@mui/icons-material/Phone";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import AssignmentIndIcon from "@mui/icons-material/AssignmentInd";
import EditIcon from "@mui/icons-material/Edit";
import SearchIcon from "@mui/icons-material/Search";
import { collection, getDocs } from "firebase/firestore";
import { db, auth } from "../../../firebaseConfig";
import DriverModal from "../../modals/DriverModal";
import {formatDate} from "../../../utils/dateFormatter"

const Drivers: React.FC = () => {
    const [openAdd, setOpenAdd] = useState(false);
    const [drivers, setDrivers] = useState<any[]>([]);
    const [search, setSearch] = useState("");
    const [editDriver, setEditDriver] = useState<any | null>(null);

    const adminId = auth.currentUser?.uid;

    // 🔍 Load drivers from Firestore
    const fetchDrivers = async () => {
        if (!adminId) return;
        const snapshot = await getDocs(collection(db, "admins", adminId, "drivers"));
        const list = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        setDrivers(list);
    };

    useEffect(() => {
        fetchDrivers();
    }, [adminId]);

    // 🔍 Filter by search
    const filteredDrivers = drivers.filter(
        (d) =>
            d.fullName?.toLowerCase().includes(search.toLowerCase()) ||
            d.licenseNumber?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div style={{ padding: 24 }}>
            {/* Header Row */}
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
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
                    color="primary"
                    sx={{
                        textTransform: "none",
                        borderRadius: "8px",
                        px: 3,
                        py: 1,
                        fontWeight: 600,
                    }}
                    onClick={() => {
                        setEditDriver(null); // ensure blank form for Add
                        setOpenAdd(true);
                    }}
                    disabled={!adminId}
                >
                    + Add Driver
                </Button>
            </Box>

            {/* Search Bar */}
            <Paper elevation={1} sx={{ p: 2.5, borderRadius: "12px", mb: 3 }}>
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

            {/* Driver cards */}
            <Grid container spacing={4} sx={{ mt: 2, pl:5 }} gap={3}>
                {filteredDrivers.map((driver) => (
                    <Grid key={driver.id} xs={12} sm={6} md={3}>
                        <Card sx={{ borderRadius: 3, boxShadow: 3, height: "100%", display: "flex",
                            flexDirection: "column" }}>
                            <CardContent sx={{ p: 3 }}>
                                {/* Header row: Avatar + name + status */}
                                <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                                    <Box display="flex" alignItems="center" gap={1.5}>
                                        <Avatar sx={{ bgcolor: "primary.main" }}>
                                            {driver.fullName?.charAt(0).toUpperCase()}
                                        </Avatar>
                                        <Box>
                                            <Typography variant="subtitle1" sx={{ fontWeight: "bold" }}>
                                                {driver.fullName}
                                            </Typography>
                                            <Typography variant="body2" color="textSecondary">
                                                ID #{driver.licenseNumber}
                                            </Typography>
                                        </Box>
                                    </Box>
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
                                        sx={{ textTransform: "lowercase", fontWeight: 500 }}
                                    />
                                </Box>

                                {/* Details */}
                                <Typography variant="body2" sx={{ mt: 2, display: "flex", alignItems: "center", gap: 1 }}>
                                    <PhoneIcon fontSize="small" /> {driver.phone}
                                </Typography>
                                <Typography variant="body2" sx={{ mt: 1, display: "flex", alignItems: "center", gap: 1 }}>
                                    <LocationOnIcon fontSize="small" /> {driver.totalMiles?.toLocaleString()} miles driven
                                </Typography>
                                <Typography variant="body2" sx={{ mt: 1, display: "flex", alignItems: "center", gap: 1 }}>
                                    <CalendarTodayIcon fontSize="small" /> Hired: {formatDate(driver.hireDate)}
                                </Typography>
                                <Typography variant="body2" sx={{ mt: 1, display: "flex", alignItems: "center", gap: 1 }}>
                                    <AssignmentIndIcon fontSize="small" /> License expires: {formatDate(driver.licenseExpiry)}
                                </Typography>

                                <Divider sx={{ my: 2 }} />

                                {/* Edit button */}
                                <Button
                                    variant="outlined"
                                    fullWidth
                                    startIcon={<EditIcon />}
                                    onClick={() => {
                                        setEditDriver(driver);
                                        setOpenAdd(true);
                                    }}
                                >
                                    Edit Driver
                                </Button>
                            </CardContent>
                        </Card>
                    </Grid>
                ))}
            </Grid>

            {/* Add/Edit Driver Modal */}
            {adminId && (
                <DriverModal
                    open={openAdd}
                    onClose={() => {
                        setOpenAdd(false);
                        setEditDriver(null); // reset after closing
                    }}
                    adminId={adminId}
                    driverData={editDriver}
                    onSaved={fetchDrivers}
                />
            )}
        </div>
    );
};

export default Drivers;
