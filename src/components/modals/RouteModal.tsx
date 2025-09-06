import React, { useState, useEffect } from "react";
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Button,
    Grid,
    Box,
    CircularProgress,
} from "@mui/material";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import CloseIcon from "@mui/icons-material/Close";
import { db } from "../../firebaseConfig";
import { collection, addDoc, updateDoc, doc, serverTimestamp } from "firebase/firestore";

interface RouteModalProps {
    open: boolean;
    onClose: () => void;
    adminId: string;
    routeData?: any; // edit mode if passed
    onSaved?: () => void;
}

const RouteModal: React.FC<RouteModalProps> = ({
                                                   open,
                                                   onClose,
                                                   adminId,
                                                   routeData,
                                                   onSaved,
                                               }) => {
    const [form, setForm] = useState({
        routeName: "",
        pickupCity: "",
        pickupState: "",
        pickupAddress: "",
        dropoffCity: "",
        dropoffState: "",
        dropoffAddress: "",
        distance: "",
        duration: "",
        ratePerMile: "",
    });

    const [errors, setErrors] = useState<any>({});
    const [loading, setLoading] = useState(false);

    // ✅ preload edit data or reset
    useEffect(() => {
        if (routeData) {
            setForm({
                routeName: routeData.routeName || "",
                pickupCity: routeData.pickupCity || "",
                pickupState: routeData.pickupState || "",
                pickupAddress: routeData.pickupAddress || "",
                dropoffCity: routeData.dropoffCity || "",
                dropoffState: routeData.dropoffState || "",
                dropoffAddress: routeData.dropoffAddress || "",
                distance: routeData.distance || "",
                duration: routeData.duration || "",
                ratePerMile: routeData.ratePerMile || "",
            });
        } else if (open) {
            setForm({
                routeName: "",
                pickupCity: "",
                pickupState: "",
                pickupAddress: "",
                dropoffCity: "",
                dropoffState: "",
                dropoffAddress: "",
                distance: "",
                duration: "",
                ratePerMile: "",
            });
            setErrors({});
        }
    }, [routeData, open]);

    // ✅ Auto-generate Route Name
    useEffect(() => {
        if (form.pickupCity && form.dropoffCity) {
            setForm((prev) => ({
                ...prev,
                routeName: `${form.pickupCity} → ${form.dropoffCity}`,
            }));
        }
    }, [form.pickupCity, form.dropoffCity]);

    // ✅ validation
    const validate = () => {
        const newErrors: any = {};
        if (!form.pickupCity.trim()) newErrors.pickupCity = "Pickup City is required";
        if (!form.pickupState.trim()) newErrors.pickupState = "Pickup State is required";
        if (!form.dropoffCity.trim()) newErrors.dropoffCity = "Drop-off City is required";
        if (!form.dropoffState.trim()) newErrors.dropoffState = "Drop-off State is required";
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setForm({ ...form, [name]: value });
    };

    const handleSave = async () => {
        if (!validate()) return;
        setLoading(true);
        try {
            if (routeData?.id) {
                await updateDoc(doc(db, "admins", adminId, "routes", routeData.id), {
                    ...form,
                    updatedAt: serverTimestamp(),
                });
            } else {
                await addDoc(collection(db, "admins", adminId, "routes"), {
                    ...form,
                    createdAt: serverTimestamp(),
                });
            }
            onClose();
            if (onSaved) onSaved();
        } catch (err) {
            console.error("❌ Error saving route:", err);
        }
        setLoading(false);
    };

    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
            {/* Header */}
            <DialogTitle
                sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    background: "linear-gradient(90deg, #009688, #4CAF50)", // 💚 teal-green
                    color: "white",
                    fontWeight: 600,
                }}
            >
                <Box display="flex" alignItems="center" gap={1}>
                    <LocationOnIcon />
                    {routeData ? "Edit Route" : "Create New Route"}
                </Box>
                <CloseIcon onClick={onClose} sx={{ cursor: "pointer", fontSize: 22 }} />
            </DialogTitle>

            {/* Form */}
            <DialogContent>
                <Grid container spacing={2} sx={{ mt: 1 }}>
                    {/* Route Name (disabled) */}
                    <Grid item xs={12}>
                        <TextField
                            label="Route Name"
                            name="routeName"
                            value={form.routeName}
                            disabled
                            fullWidth
                            InputProps={{
                                sx: { bgcolor: "#f5f5f5" }, // lighter grey bg for disabled look
                            }}
                        />
                    </Grid>

                    {/* Pickup Location */}
                    <Grid item xs={12}>
                        <Box fontWeight={600}>Pickup Location</Box>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <TextField
                            label="Address"
                            name="pickupAddress"
                            value={form.pickupAddress}
                            onChange={handleChange}
                            fullWidth
                        />
                    </Grid>
                    <Grid item xs={12} sm={3}>
                        <TextField
                            label="City *"
                            name="pickupCity"
                            value={form.pickupCity}
                            onChange={handleChange}
                            fullWidth
                            error={!!errors.pickupCity}
                            helperText={errors.pickupCity}
                        />
                    </Grid>
                    <Grid item xs={12} sm={3}>
                        <TextField
                            label="State *"
                            name="pickupState"
                            value={form.pickupState}
                            onChange={handleChange}
                            fullWidth
                            error={!!errors.pickupState}
                            helperText={errors.pickupState}
                        />
                    </Grid>

                    {/* Drop-off Location */}
                    <Grid item xs={12}>
                        <Box fontWeight={600}>Drop-off Location</Box>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <TextField
                            label="Address"
                            name="dropoffAddress"
                            value={form.dropoffAddress}
                            onChange={handleChange}
                            fullWidth
                        />
                    </Grid>
                    <Grid item xs={12} sm={3}>
                        <TextField
                            label="City *"
                            name="dropoffCity"
                            value={form.dropoffCity}
                            onChange={handleChange}
                            fullWidth
                            error={!!errors.dropoffCity}
                            helperText={errors.dropoffCity}
                        />
                    </Grid>
                    <Grid item xs={12} sm={3}>
                        <TextField
                            label="State *"
                            name="dropoffState"
                            value={form.dropoffState}
                            onChange={handleChange}
                            fullWidth
                            error={!!errors.dropoffState}
                            helperText={errors.dropoffState}
                        />
                    </Grid>

                    {/* Other Info */}
                    <Grid item xs={12} sm={4}>
                        <TextField
                            label="Distance (miles)"
                            name="distance"
                            value={form.distance}
                            onChange={handleChange}
                            fullWidth
                        />
                    </Grid>
                    <Grid item xs={12} sm={4}>
                        <TextField
                            label="Est. Duration (hours)"
                            name="duration"
                            value={form.duration}
                            onChange={handleChange}
                            fullWidth
                        />
                    </Grid>
                    <Grid item xs={12} sm={4}>
                        <TextField
                            label="Rate per Mile ($)"
                            name="ratePerMile"
                            value={form.ratePerMile}
                            onChange={handleChange}
                            fullWidth
                        />
                    </Grid>
                </Grid>
            </DialogContent>

            {/* Actions */}
            <DialogActions>
                <Button onClick={onClose} sx={{ textTransform: "none" }}>
                    Cancel
                </Button>
                <Button
                    variant="contained"
                    sx={{
                        background: "linear-gradient(90deg, #009688, #4CAF50)",
                        "&:hover": { background: "linear-gradient(90deg, #00796B, #388E3C)" },
                        textTransform: "none",
                    }}
                    onClick={handleSave}
                    disabled={loading}
                >
                    {loading ? <CircularProgress size={20} sx={{ color: "white" }} /> : routeData ? "Update Route" : "Create Route"}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default RouteModal;
