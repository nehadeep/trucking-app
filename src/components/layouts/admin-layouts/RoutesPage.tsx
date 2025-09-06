import React, { useState, useEffect } from "react";
import {
    Box,
    Button,
    TextField,
    Card,
    CardContent,
    Typography,
    Grid,
    InputAdornment,
    Paper,
    Divider, Avatar,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import RoomIcon from "@mui/icons-material/Room";
import TimelineIcon from "@mui/icons-material/Timeline";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import { collection, getDocs, deleteDoc, doc } from "firebase/firestore";
import { db, auth } from "../../../firebaseConfig";
import RouteModal from "../../modals/RouteModal";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import SpeedIcon from "@mui/icons-material/Speed";


const RoutesPage: React.FC = () => {
    const [openModal, setOpenModal] = useState(false);
    const [routes, setRoutes] = useState<any[]>([]);
    const [search, setSearch] = useState("");
    const [editRoute, setEditRoute] = useState<any | null>(null);

    const adminId = auth.currentUser?.uid;

    const fetchRoutes = async () => {
        if (!adminId) return;
        const snapshot = await getDocs(collection(db, "admins", adminId, "routes"));
        const list = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        setRoutes(list);
    };

    useEffect(() => {
        fetchRoutes();
    }, [adminId, openModal]);

    const filteredRoutes = routes.filter(
        (r) =>
            r.routeName?.toLowerCase().includes(search.toLowerCase()) ||
            r.pickupCity?.toLowerCase().includes(search.toLowerCase()) ||
            r.dropoffCity?.toLowerCase().includes(search.toLowerCase())
    );

    const handleDelete = async (id: string) => {
        if (!adminId) return;
        await deleteDoc(doc(db, "admins", adminId, "routes", id));
        fetchRoutes();
    };

    return (
        <div style={{ padding: 24 }}>
            {/* Header */}
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Box>
                    <Typography variant="h5" fontWeight={700}>
                        Route Management
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Create and manage your shipping routes
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
                        background: "linear-gradient(90deg, #009688, #4CAF50)", // 💚 teal-green gradient
                        "&:hover": { background: "linear-gradient(90deg, #00796B, #388E3C)" },
                    }}
                    onClick={() => {
                        setEditRoute(null);
                        setOpenModal(true);
                    }}
                    disabled={!adminId}
                >
                    + Create Route
                </Button>
            </Box>

            {/* Search */}
            <Paper elevation={1} sx={{ p: 2.5, borderRadius: "12px", mb: 3 }}>
                <TextField
                    placeholder="Search routes by name or city..."
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

            {/* Route Cards */}
            <Grid container spacing={4} sx={{ mt: 2 }}>
                {filteredRoutes.map((route) => (
                    <Grid item xs={12} sm={6} md={4} key={route.id}>
                        <Card sx={{
                            borderRadius: 3,
                            boxShadow: 3,
                            height: "100%",
                            display: "flex",
                            flexDirection: "column",
                        }}>
                            <CardContent sx={{ p: 3 }}>
                                {/* Title */}
                                <Box display="flex" alignItems="center" gap={1.5} mb={2}>
                                    <Avatar
                                        sx={{
                                            bgcolor: "#4CAF50", // green theme background
                                            width: 40,
                                            height: 40,
                                        }}
                                    >
                                        <LocationOnIcon sx={{ color: "white" }} />
                                    </Avatar>
                                    <Box>
                                        <Typography variant="subtitle1" sx={{ fontWeight: "bold" }}>
                                            {route.routeName}
                                        </Typography>
                                        <Typography variant="body2" color="textSecondary">
                                            Route ID #{route.id}
                                        </Typography>
                                    </Box>
                                </Box>

                                {/* City/State Row */}
                                <Box
                                    sx={{
                                        bgcolor: "#E8F0FE",   // darker light blue
                                        border: "1px solid #D0DAE9",  // subtle border
                                        p: 1,
                                        borderRadius: 1,
                                        mb: 2,
                                    }}
                                >
                                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                        {route.pickupCity}, {route.pickupState} → {route.dropoffCity}, {route.dropoffState}
                                    </Typography>
                                </Box>

                                {/* Distance + Duration */}
                                <Typography variant="body2" sx={{ display: "flex", alignItems: "center", gap: 1, mt: 1 }}>
                                    <SpeedIcon fontSize="small" /> Distance: {route.distance?.toLocaleString()} miles
                                </Typography>
                                <Typography variant="body2" sx={{ display: "flex", alignItems: "center", gap: 1, mt: 1 }}>
                                    ⏱ Est. Duration: {route.duration} hours
                                </Typography>

                                {/* Rate */}
                                <Typography
                                    variant="body2"
                                    sx={{
                                        mt: 2,
                                        fontWeight: 600,
                                        color: "#2e7d32",
                                        bgcolor: "#d4f5dd",
                                        display: "inline-block",
                                        px: 1.5,
                                        py: 0.5,
                                        borderRadius: "12px",
                                    }}
                                >
                                    ${route.ratePerMile} per mile
                                </Typography>

                                <Divider sx={{ my: 2 }} />

                                {/* Actions */}
                                <Box display="flex" gap={2}>
                                    <Button
                                        variant="outlined"
                                        startIcon={<EditIcon />}
                                        fullWidth
                                        onClick={() => {
                                            setEditRoute(route);
                                            setOpenModal(true);
                                        }}
                                    >
                                        Edit
                                    </Button>
                                    <Button
                                        variant="outlined"
                                        color="error"
                                        startIcon={<DeleteIcon />}
                                        fullWidth
                                        onClick={() => handleDelete(route.id)}
                                    >
                                        Delete
                                    </Button>
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>
                ))}
            </Grid>

            {/* Modal */}
            {adminId && (
                <RouteModal
                    open={openModal}
                    onClose={() => setOpenModal(false)}
                    adminId={adminId}
                    routeData={editRoute}
                    onSaved={fetchRoutes}
                />
            )}
        </div>
    );
};

export default RoutesPage;
