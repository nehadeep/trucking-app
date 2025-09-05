import React, { useState, useEffect } from "react";
import {
    Box,
    Button,
    TextField,
    Card,
    CardContent,
    Typography,
    Chip,
    Grid,
    InputAdornment,
    Paper,
    Divider,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import SpeedIcon from "@mui/icons-material/Speed";
import ConfirmationNumberIcon from "@mui/icons-material/ConfirmationNumber";
import BuildIcon from "@mui/icons-material/Build";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";
import EditIcon from "@mui/icons-material/Edit";
import { collection, getDocs } from "firebase/firestore";
import { db, auth } from "../../../firebaseConfig";
import TruckModal from "../../modals/TruckModal";
import {formatDate} from "../../../utils/dateFormatter"; // you’ll create like DriverModal

const Trucks: React.FC = () => {
    const [openAdd, setOpenAdd] = useState(false);
    const [trucks, setTrucks] = useState<any[]>([]);
    const [search, setSearch] = useState("");
    const [editTruck, setEditTruck] = useState<any | null>(null);

    const adminId = auth.currentUser?.uid;

    const fetchTrucks = async () => {
        if (!adminId) return;
        const snapshot = await getDocs(collection(db, "admins", adminId, "trucks"));
        const list = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        setTrucks(list);
    };

    useEffect(() => {
        fetchTrucks();
    }, [adminId, openAdd]);

    const filteredTrucks = trucks.filter(
        (t) =>
            t.make?.toLowerCase().includes(search.toLowerCase()) ||
            t.model?.toLowerCase().includes(search.toLowerCase()) ||
            t.plateNumber?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div style={{ padding: 24 }}>
            {/* Header Row */}
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Box>
                    <Typography variant="h5" fontWeight={700}>
                        Fleet Management
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Manage your truck fleet and vehicle information
                    </Typography>
                </Box>

                <Button
                    variant="contained"
                    sx={{
                        textTransform: "none",
                        borderRadius: "8px",
                        px: 3,
                        py: 1,
                        fontWeight: 600,
                        bgcolor: "#FF6B00", // 👈 orangish button
                        "&:hover": { bgcolor: "#e65c00" },
                    }}
                    onClick={() => {
                        setEditTruck(null);
                        setOpenAdd(true);
                    }}
                    disabled={!adminId}
                >
                    + Add Truck
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
                    placeholder="Search trucks by make, model, or plate number..."
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

            {/* Truck cards */}
            <Grid container spacing={4} sx={{ mt: 2 }}>
                {filteredTrucks.map((truck) => (
                    <Grid key={truck.id} xs={12} sm={6} md={3}>
                        <Card
                            sx={{
                                borderRadius: 3,
                                boxShadow: 3,
                                height: "100%",
                                display: "flex",
                                flexDirection: "column",
                            }}
                        >
                            <CardContent sx={{ p: 3 }}>
                                {/* Header */}
                                <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                                    <Box display="flex" alignItems="center" gap={1.5}>
                                        <LocalShippingIcon sx={{ color: "primary.main" }} />
                                        <Box>
                                            <Typography variant="subtitle1" sx={{ fontWeight: "bold" }}>
                                                {truck.make} {truck.model}
                                            </Typography>
                                            <Typography variant="body2" color="textSecondary">
                                                {truck.year} • {truck.code}
                                            </Typography>
                                        </Box>
                                    </Box>
                                    <Chip
                                        label={truck.status || "inactive"}
                                        color={
                                            truck.status === "active"
                                                ? "success"
                                                : truck.status === "maintenance"
                                                ? "warning"
                                                : truck.status === "on trip"
                                                    ? "info"
                                                    : "default"
                                        }
                                        size="small"
                                        sx={{ fontWeight: 500 }}
                                    />
                                </Box>

                                {/* Details */}
                                <Typography variant="body2" sx={{ mt: 2, display: "flex", alignItems: "center", gap: 1 }}>
                                    <SpeedIcon fontSize="small" /> {truck.mileage?.toLocaleString()} miles
                                </Typography>
                                <Typography variant="body2" sx={{ mt: 1, display: "flex", alignItems: "center", gap: 1 }}>
                                    <ConfirmationNumberIcon fontSize="small" /> VIN: {truck.vin}
                                </Typography>
                                <Typography variant="body2" sx={{ mt: 1, display: "flex", alignItems: "center", gap: 1 }}>
                                    <BuildIcon fontSize="small" /> Last service: {formatDate(truck.lastService)}
                                </Typography>
                                <Typography variant="body2" sx={{ mt: 1, display: "flex", alignItems: "center", gap: 1 }}>
                                    <CalendarTodayIcon fontSize="small" /> Insurance expires: {formatDate(truck.insuranceExpiry)}
                                </Typography>

                                {truck.assignedDriver && (
                                    <Typography
                                        variant="body2"
                                        sx={{
                                            mt: 1,
                                            display: "flex",
                                            alignItems: "center",
                                            gap: 1,
                                            bgcolor: "#F5F9FF",
                                            p: 1,
                                            borderRadius: 1,
                                            fontSize: "0.85rem",
                                        }}
                                    >
                                        Assigned to Driver: {truck.assignedDriver}
                                    </Typography>
                                )}

                                <Divider sx={{ my: 2 }} />

                                {/* Edit button */}
                                <Button
                                    variant="outlined"
                                    fullWidth
                                    startIcon={<EditIcon />}
                                    onClick={() => {
                                        setEditTruck(truck);
                                        setOpenAdd(true);
                                    }}
                                >
                                    Edit Truck
                                </Button>
                            </CardContent>
                        </Card>
                    </Grid>
                ))}
            </Grid>

            {/* Add/Edit Truck Modal */}
            {adminId && (
                <TruckModal
                    open={openAdd}
                    onClose={() => setOpenAdd(false)}
                    adminId={adminId}
                    truckData={editTruck}
                    onSaved={fetchTrucks}
                />
            )}
        </div>
    );
};

export default Trucks;
