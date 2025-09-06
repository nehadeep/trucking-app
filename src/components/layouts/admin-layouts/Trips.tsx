// src/components/layouts/admin-layouts/Trips.tsx
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
    Tabs,
    Tab,
    LinearProgress,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import DirectionsCarIcon from "@mui/icons-material/DirectionsCar";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";
import Inventory2Icon from "@mui/icons-material/Inventory2"; // trailer
import EditIcon from "@mui/icons-material/Edit";
import { collection, getDocs } from "firebase/firestore";
import { db, auth } from "../../../firebaseConfig";
import TripModal from "../../modals/TripModal";
import { formatDate } from "../../../utils/dateFormatter";

const Trips: React.FC = () => {
    const [openAdd, setOpenAdd] = useState(false);
    const [trips, setTrips] = useState<any[]>([]);
    const [search, setSearch] = useState("");
    const [editTrip, setEditTrip] = useState<any | null>(null);
    const [tab, setTab] = useState("in progress");

    const adminId = auth.currentUser?.uid;

    const fetchTrips = async () => {
        if (!adminId) return;
        const snapshot = await getDocs(collection(db, "admins", adminId, "trips"));
        const list = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        setTrips(list);
    };

    useEffect(() => {
        fetchTrips();
    }, [adminId, openAdd]);

    const filteredTrips = trips.filter(
        (t) =>
            (t.status?.toLowerCase() === tab) &&
            (t.tripNumber?.toLowerCase().includes(search.toLowerCase()) ||
                t.driver?.toLowerCase().includes(search.toLowerCase()) ||
                t.route?.toLowerCase().includes(search.toLowerCase()))
    );

    return (
        <div style={{ padding: 24 }}>
            {/* Header Row */}
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Box>
                    <Typography variant="h5" fontWeight={700}>
                        Trip Management
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Oversee all scheduled, active, and completed trips
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
                        bgcolor: "#2e7d32", // greenish button
                        "&:hover": { bgcolor: "#256628" },
                    }}
                    onClick={() => {
                        setEditTrip(null);
                        setOpenAdd(true);
                    }}
                    disabled={!adminId}
                >
                    + Create New Trip
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
                    placeholder="Search by trip #, driver name, or route..."
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

            {/* Tabs */}
            <Tabs
                value={tab}
                onChange={(_, newValue) => setTab(newValue)}
                textColor="primary"
                indicatorColor="primary"
                sx={{ mb: 3 }}
            >
                <Tab label="In Progress" value="in progress" />
                <Tab label="Scheduled" value="scheduled" />
                <Tab label="Completed" value="completed" />
                <Tab label="Cancelled" value="cancelled" />
            </Tabs>

            {/* Trip cards */}
            <Grid container spacing={4} sx={{ mt: 2 }}>
                {filteredTrips.map((trip) => {
                    const milesDriven = Number(trip.milesDriven || 0);
                    const plannedMiles = Number(trip.plannedMiles || 0);
                    const progress = plannedMiles > 0 ? (milesDriven / plannedMiles) * 100 : 0;

                    return (
                        <Grid key={trip.id} item xs={12} sm={6} md={4}>
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
                                        <Box>
                                            <Typography variant="subtitle1" sx={{ fontWeight: "bold" }}>
                                                Trip #{trip.tripNumber}
                                            </Typography>
                                            <Typography variant="body2" color="textSecondary">
                                                Scheduled: {formatDate(trip.startDate)} – {formatDate(trip.endDate)}
                                            </Typography>
                                        </Box>
                                        <Chip
                                            label={trip.status || "scheduled"}
                                            size="small"
                                            sx={{
                                                fontWeight: 500,
                                                textTransform: "lowercase",
                                                bgcolor:
                                                    trip.status === "in progress"
                                                        ? "#e3f2fd"
                                                        : trip.status === "completed"
                                                        ? "#d4f5dd"
                                                        : trip.status === "cancelled"
                                                            ? "#fcefc7"
                                                            : "#ede7f6",
                                                color:
                                                    trip.status === "in progress"
                                                        ? "#1565c0"
                                                        : trip.status === "completed"
                                                        ? "#2e7d32"
                                                        : trip.status === "cancelled"
                                                            ? "#b26a00"
                                                            : "#5e35b1",
                                            }}
                                        />
                                    </Box>

                                    {/* Progress */}
                                    <Box sx={{ mt: 1, mb: 1 }}>
                                        <LinearProgress variant="determinate" value={progress} />
                                        <Typography variant="caption" color="text.secondary">
                                            Progress: {milesDriven} / {plannedMiles} mi
                                        </Typography>
                                    </Box>

                                    {/* Driver / Truck / Trailer */}
                                    <Typography variant="body2" sx={{ mt: 1, display: "flex", alignItems: "center", gap: 1 }}>
                                        <DirectionsCarIcon fontSize="small" /> Driver: {trip.driver || "Not Assigned"}
                                    </Typography>
                                    <Typography variant="body2" sx={{ mt: 1, display: "flex", alignItems: "center", gap: 1 }}>
                                        <LocalShippingIcon fontSize="small" /> Truck: {trip.truck || "Not Assigned"}
                                    </Typography>
                                    <Typography variant="body2" sx={{ mt: 1, display: "flex", alignItems: "center", gap: 1 }}>
                                        <Inventory2Icon fontSize="small" /> Trailer: {trip.trailer || "Not Assigned"}
                                    </Typography>

                                    {/* Revenue */}
                                    {trip.totalRevenue && (
                                        <Typography
                                            variant="body2"
                                            sx={{
                                                mt: 1,
                                                fontWeight: 600,
                                                color: "#2e7d32",
                                            }}
                                        >
                                            Total Revenue: ${Number(trip.totalRevenue).toLocaleString()}
                                        </Typography>
                                    )}

                                    <Divider sx={{ my: 2 }} />

                                    {/* Edit button */}
                                    <Button
                                        variant="outlined"
                                        fullWidth
                                        startIcon={<EditIcon />}
                                        onClick={() => {
                                            setEditTrip(trip);
                                            setOpenAdd(true);
                                        }}
                                    >
                                        Edit Trip
                                    </Button>
                                </CardContent>
                            </Card>
                        </Grid>
                    );
                })}
            </Grid>

            {/* Add/Edit Trip Modal */}
            {adminId && (
                <TripModal
                    open={openAdd}
                    onClose={() => setOpenAdd(false)}
                    adminId={adminId}
                    tripData={editTrip}
                    onSaved={fetchTrips}
                />
            )}
        </div>
    );
};

export default Trips;
