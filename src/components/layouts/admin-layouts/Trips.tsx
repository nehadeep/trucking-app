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
    Avatar,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import DirectionsCarIcon from "@mui/icons-material/DirectionsCar";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";
import Inventory2Icon from "@mui/icons-material/Inventory2";
import RouteIcon from "@mui/icons-material/AltRoute";
import EditIcon from "@mui/icons-material/Edit";
import { collection, getDocs, doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db, auth } from "../../../firebaseConfig";
import TripModal from "../../modals/TripModal";
import { formatDate } from "../../../utils/dateFormatter";
import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";


const Trips: React.FC = () => {
    const [openAdd, setOpenAdd] = useState(false);
    const [trips, setTrips] = useState<any[]>([]);
    const [search, setSearch] = useState("");
    const [editTrip, setEditTrip] = useState<any | null>(null);
    const [tab, setTab] = useState("in progress");

    // ✅ Odometer editing states
    const [editingTripId, setEditingTripId] = useState<string | null>(null);
    const [endMilesDraft, setEndMilesDraft] = useState<string>("");

    const adminId = auth.currentUser?.uid;

    // ---------- Odometer Functions ----------
    const handleStartEditing = (trip: any) => {
        setEditingTripId(trip.id);
        setEndMilesDraft(trip.endingMiles || "");
    };

    const handleCancelEditing = () => {
        setEditingTripId(null);
        setEndMilesDraft("");
    };

    const handleSaveOdometer = async (trip: any) => {
        try {
            const startMiles = Number(trip.startingMiles || 0);
            const endMiles = Number(endMilesDraft || 0);

            if (isNaN(endMiles) || endMiles < startMiles) {
                alert("❌ End odometer must be greater than start odometer.");
                return;
            }

            const totalMiles = endMiles - startMiles;

            // ✅ Update Firestore
            await updateDoc(doc(db, "admins", adminId!, "trips", trip.id), {
                endingMiles: endMiles,
                totalTripDrivenMiles: totalMiles,
                updatedAt: serverTimestamp(),
            });

            // ✅ Update local state
            setTrips((prev) =>
                prev.map((t) =>
                    t.id === trip.id
                        ? { ...t, endingMiles: endMiles, totalTripDrivenMiles: totalMiles }
                        : t
                )
            );

            setEditingTripId(null);
            setEndMilesDraft("");

            alert(`✅ End odometer updated. Final trip miles: ${totalMiles}`);
        } catch (error) {
            console.error("❌ Error updating odometer:", error);
            alert("Failed to update odometer. Please try again.");
        }
    };

    // ---------- Trips Fetch ----------
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
            t.status?.toLowerCase() === tab &&
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
                        bgcolor: "#2e7d32",
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
            <Paper elevation={1} sx={{ p: 2.5, borderRadius: "12px", mb: 3 }}>
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
                    const startMiles = Number(trip.startingMiles || 0);
                    const endMiles = Number(trip.endingMiles || 0);
                    const milesDriven = Number(trip.totalTripDrivenMiles || 0);
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

                                    {/* Route Info */}
                                    {trip.route_details && (
                                        <Box sx={{ mt: 1, p: 1.5, bgcolor: "#F5F9FF", borderRadius: 2 }}>
                                            <Typography
                                                variant="body2"
                                                sx={{ display: "flex", alignItems: "center", gap: 1, fontWeight: 600 }}
                                            >
                                                <RouteIcon fontSize="small" color="primary" /> Route:{" "}
                                                {trip.route_details.pickup.city}, {trip.route_details.pickup.state} →{" "}
                                                {trip.route_details.dropoff.city}, {trip.route_details.dropoff.state}
                                            </Typography>
                                        </Box>
                                    )}

                                    {/* Progress */}
                                    <Box sx={{ mt: 1, mb: 1 }}>
                                        <LinearProgress variant="determinate" value={progress} />
                                        <Typography variant="caption" color="text.secondary">
                                            Progress: {milesDriven} / {plannedMiles} mi
                                        </Typography>
                                    </Box>

                                    {/* Driver / Truck / Trailer */}
                                    <Box sx={{ mt: 1, display: "flex", alignItems: "center", gap: 1.5 }}>
                                        <Avatar sx={{ bgcolor: "#1565c0", width: 28, height: 28 }}>
                                            <DirectionsCarIcon fontSize="small" />
                                        </Avatar>
                                        <Typography variant="body2">Driver: {trip.driver || "Not Assigned"}</Typography>
                                    </Box>
                                    <Box sx={{ mt: 1, display: "flex", alignItems: "center", gap: 1.5 }}>
                                        <Avatar sx={{ bgcolor: "#FF6B00", width: 28, height: 28 }}>
                                            <LocalShippingIcon fontSize="small" />
                                        </Avatar>
                                        <Typography variant="body2">Truck: {trip.truck || "Not Assigned"}</Typography>
                                    </Box>
                                    <Box sx={{ mt: 1, display: "flex", alignItems: "center", gap: 1.5 }}>
                                        <Avatar sx={{ bgcolor: "#9C27B0", width: 28, height: 28 }}>
                                            <Inventory2Icon fontSize="small" />
                                        </Avatar>
                                        <Typography variant="body2">Trailer: {trip.trailer || "Not Assigned"}</Typography>
                                    </Box>

                                    {/* Odometer Readings */}
                                    <Card
                                        variant="outlined"
                                        sx={{
                                            mt: 2,
                                            p: 2,
                                            borderRadius: 2,
                                            backgroundColor: "#f0fdf4",
                                            border: "1px solid #bbf7d0",
                                        }}
                                    >
                                        <Typography variant="subtitle1" fontWeight={600} mb={1}>
                                            Odometer Readings
                                        </Typography>

                                        <Grid container spacing={2}>
                                            {/* Start Odometer */}
                                            <Grid item xs={4}>
                                                <Typography variant="body2" color="text.secondary">
                                                    Start Odometer
                                                </Typography>
                                                <Typography fontWeight={600}>
                                                    {trip.startingMiles ? trip.startingMiles : "Not set"}
                                                </Typography>
                                            </Grid>

                                            {/* End Odometer (inline editable) */}
                                            <Grid item xs={4}>
                                                <Typography variant="body2" color="text.secondary">
                                                    End Odometer
                                                </Typography>

                                                {editingTripId === trip.id ? (
                                                    <Box display="flex" alignItems="center" gap={1} sx={{ width: "100%" }}>
                                                        <TextField
                                                            size="small"
                                                            type="number"
                                                            value={endMilesDraft}
                                                            onChange={(e) => setEndMilesDraft(e.target.value)}
                                                            fullWidth
                                                        />
                                                      <CheckIcon  color="success" fontSize="small" onClick={() => handleSaveOdometer(trip)} />

                                                        <CloseIcon fontSize="small" color="error" onClick={handleCancelEditing} />

                                                    </Box>
                                                ) : (
                                                    <Box display="flex" alignItems="center" justifyContent="flex-start" gap={0.5}>
                                                        <Typography fontWeight={600}>
                                                            {trip.endingMiles ? trip.endingMiles : "Not set"}
                                                        </Typography>

                                                        {trip.status?.toLowerCase() === "completed" && (
                                                            <EditIcon fontSize="small" color="primary" sx={{ cursor: "pointer" }}
                                                                      onClick={() => handleStartEditing(trip)} />
                                                        )}
                                                    </Box>
                                                )}
                                            </Grid>

                                            {/* Trip Miles */}
                                            <Grid item xs={4}>
                                                <Typography variant="body2" color="text.secondary">
                                                    Trip Miles
                                                </Typography>
                                                <Typography fontWeight={600} color="success.main">
                                                    {trip.totalTripDrivenMiles ? `${trip.totalTripDrivenMiles} mi` : "0 mi"}
                                                </Typography>
                                            </Grid>
                                        </Grid>
                                    </Card>

                                    {/* Revenue */}
                                    {trip.totalRevenue && (
                                        <Typography
                                            variant="body2"
                                            sx={{ mt: 1, fontWeight: 600, color: "#2e7d32" }}
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
