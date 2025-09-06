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
    Avatar,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import StraightenIcon from "@mui/icons-material/Straighten"; // length icon
import ScaleIcon from "@mui/icons-material/Scale"; // capacity icon
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import LocalShippingIcon from "@mui/icons-material/LocalShipping"; // used for trailer avatar
import AcUnitIcon from "@mui/icons-material/AcUnit"; // refrigerated trailer
import Inventory2Icon from "@mui/icons-material/Inventory2"; // dry van
import LayersIcon from "@mui/icons-material/Layers"; // flatbed
import EditIcon from "@mui/icons-material/Edit";
import { collection, getDocs } from "firebase/firestore";
import { db, auth } from "../../../firebaseConfig";
import TrailerModal from "../../modals/TrailerModal";
import { formatDate } from "../../../utils/dateFormatter";
import { formatLbs } from "../../../utils/numberFormatter";

const Trailers: React.FC = () => {
    const [openAdd, setOpenAdd] = useState(false);
    const [trailers, setTrailers] = useState<any[]>([]);
    const [search, setSearch] = useState("");
    const [editTrailer, setEditTrailer] = useState<any | null>(null);

    const adminId = auth.currentUser?.uid;

    const fetchTrailers = async () => {
        if (!adminId) return;
        const snapshot = await getDocs(collection(db, "admins", adminId, "trailers"));
        const list = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        setTrailers(list);
    };

    useEffect(() => {
        fetchTrailers();
    }, [adminId, openAdd]);

    const filteredTrailers = trailers.filter(
        (t) =>
            t.make?.toLowerCase().includes(search.toLowerCase()) ||
            t.model?.toLowerCase().includes(search.toLowerCase()) ||
            t.trailerNumber?.toLowerCase().includes(search.toLowerCase())
    );

    const renderTrailerIcon = (type: string) => {
        switch (type?.toLowerCase()) {
            case "refrigerated":
                return <AcUnitIcon />;
            case "dry van":
                return <Inventory2Icon />;
            case "flatbed":
                return <LayersIcon />;
            default:
                return <LocalShippingIcon />;
        }
    };

    return (
        <div style={{ padding: 24 }}>
            {/* Header */}
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Box>
                    <Typography variant="h5" fontWeight={700}>
                        Trailer Management
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Manage your fleet trailers and their assignments
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
                        bgcolor: "#9C27B0", // Purple color
                        "&:hover": { bgcolor: "#7B1FA2" },
                    }}
                    onClick={() => {
                        setEditTrailer(null);
                        setOpenAdd(true);
                    }}
                    disabled={!adminId}
                >
                    + Add Trailer
                </Button>
            </Box>

            {/* Search */}
            <Paper
                elevation={1}
                sx={{
                    p: 2.5,
                    borderRadius: "12px",
                    mb: 3,
                }}
            >
                <TextField
                    placeholder="Search trailers by make, model, plate number, or type..."
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

            {/* Trailer Cards */}
            <Grid container spacing={4} sx={{ mt: 2, pl: 5 }} gap={3}>
                {filteredTrailers.map((trailer) => (
                    <Grid key={trailer.id} xs={12} sm={6} md={3}>
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
                                        <Avatar sx={{ bgcolor: "#9C27B0", width: 40, height: 40 }}>
                                            {renderTrailerIcon(trailer.trailerType)}
                                        </Avatar>
                                        <Box>
                                            <Typography variant="subtitle1" sx={{ fontWeight: "bold" }}>
                                                {trailer.model}
                                            </Typography>
                                            <Typography variant="body2" color="textSecondary">
                                                • {trailer.trailerNumber}
                                            </Typography>
                                        </Box>
                                    </Box>
                                    <Chip
                                        label={trailer.status || "available"}
                                        size="small"
                                        sx={{
                                            fontWeight: 500,
                                            textTransform: "lowercase",
                                            bgcolor: trailer.status === "in use" ? "#e3f2fd" : "#d4f5dd",
                                            color: trailer.status === "in use" ? "#1565c0" : "#2e7d32",
                                        }}
                                    />
                                </Box>

                                {/* Details */}
                                <Typography variant="body2" sx={{ mt: 1, display: "flex", alignItems: "center", gap: 1 }}>
                                    {trailer.trailerType?.toLowerCase() === "refrigerated" && <AcUnitIcon fontSize="small" />}
                                    {trailer.trailerType?.toLowerCase() === "dry van" && <Inventory2Icon fontSize="small" />}
                                    {trailer.trailerType?.toLowerCase() === "flatbed" && <LayersIcon fontSize="small" />}
                                    {trailer.trailerType} trailer
                                </Typography>

                                <Typography variant="body2" sx={{ mt: 1, display: "flex", alignItems: "center", gap: 1 }}>
                                    <StraightenIcon fontSize="small" /> {trailer.length}′ long • {formatLbs(trailer.capacity)} lbs capacity
                                </Typography>

                                <Typography variant="body2" sx={{ mt: 1, display: "flex", alignItems: "center", gap: 1 }}>
                                    <CalendarTodayIcon fontSize="small" /> Last inspection: {formatDate(trailer.lastInspection)}
                                </Typography>

                                <Chip
                                    label="Available for assignment"
                                    size="small"
                                    sx={{
                                        mt: 2,
                                        bgcolor: "#d4f5dd",
                                        color: "#2e7d32",
                                        fontWeight: 500,
                                    }}
                                />

                                <Divider sx={{ my: 2 }} />

                                <Button
                                    variant="outlined"
                                    fullWidth
                                    startIcon={<EditIcon />}
                                    onClick={() => {
                                        setEditTrailer(trailer);
                                        setOpenAdd(true);
                                    }}
                                >
                                    Edit Trailer
                                </Button>
                            </CardContent>
                        </Card>
                    </Grid>
                ))}
            </Grid>

            {/* Add/Edit Trailer Modal */}
            {adminId && (
                <TrailerModal
                    open={openAdd}
                    onClose={() => setOpenAdd(false)}
                    adminId={adminId}
                    trailerData={editTrailer}
                    onSaved={fetchTrailers}
                />
            )}
        </div>
    );
};

export default Trailers;
