import React, { useState, useEffect } from "react";
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    MenuItem,
    Button,
    Grid,
    Box, CircularProgress,
} from "@mui/material";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";
import CloseIcon from "@mui/icons-material/Close";
import { db } from "../../firebaseConfig";
import {
    collection,
    addDoc,
    updateDoc,
    doc,
    getDocs,
    serverTimestamp,
} from "firebase/firestore";
import { useTheme } from "@mui/material/styles";

interface TruckModalProps {
    open: boolean;
    onClose: () => void;
    adminId: string;
    truckData?: any; // edit mode if passed
    onSaved?: () => void;
}

const TruckModal: React.FC<TruckModalProps> = ({
                                                   open,
                                                   onClose,
                                                   adminId,
                                                   truckData,
                                                   onSaved,
                                               }) => {
    const [form, setForm] = useState({
        make: "",
        model: "",
        year: "",
        plateNumber: "",
        vin: "",
        color: "",
        mileage: "",
        fuelType: "Diesel",
        status: "Active",
        lastService: "",
        insuranceExpiry: "",
        assignedDriver: "",
    });

    const [drivers, setDrivers] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState<any>({});
    const theme = useTheme();
    // ✅ Preload edit data or reset on open
    useEffect(() => {
        if (truckData) {
            setForm({
                make: truckData.make || "",
                model: truckData.model || "",
                year: truckData.year || "",
                plateNumber: truckData.plateNumber || "",
                vin: truckData.vin || "",
                color: truckData.color || "",
                mileage: truckData.mileage || "",
                fuelType: truckData.fuelType || "Diesel",
                status: truckData.status || "Active",
                lastService: truckData.lastService || "",
                insuranceExpiry: truckData.insuranceExpiry || "",
                assignedDriver: truckData.assignedDriver || "",
            });
        } else if (open) {
            setForm({
                make: "",
                model: "",
                year: "",
                plateNumber: "",
                vin: "",
                color: "",
                mileage: "",
                fuelType: "Diesel",
                status: "Active",
                lastService: "",
                insuranceExpiry: "",
                assignedDriver: "",
            });
            setErrors({});
        }
    }, [truckData, open]);

    // ✅ Validation function
    const validate = () => {
        const newErrors: any = {};

        if (!form.make.trim()) newErrors.make = "Make is required";
        if (!form.model.trim()) newErrors.model = "Model is required";

        if (!form.year.trim()) {
            newErrors.year = "Year is required";
        } else if (!/^\d{4}$/.test(form.year)) {
            newErrors.year = "Year must be a 4-digit number";
        }

        if (!form.plateNumber.trim())
            newErrors.plateNumber = "Plate number is required";

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // ✅ Load drivers for dropdown
    useEffect(() => {
        const fetchDrivers = async () => {
            if (!adminId) return;
            const snapshot = await getDocs(
                collection(db, "admins", adminId, "drivers")
            );
            const list = snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            }));
            setDrivers(list);
        };
        fetchDrivers();
    }, [adminId]);


    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setForm({ ...form, [name]: value });
    };


    const handleSave = async () => {
        if (!validate()) return;
        setLoading(true);
        try {
            if (truckData?.id) {
                await updateDoc(doc(db, "admins", adminId, "trucks", truckData.id), {
                    ...form,
                    updatedAt: serverTimestamp(),
                });
            } else {
                await addDoc(collection(db, "admins", adminId, "trucks"), {
                    ...form,
                    createdAt: serverTimestamp(),
                });
            }
            onClose();
            if (onSaved) onSaved();
        } catch (err) {
            console.error("❌ Error saving truck:", err);
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
                    bgcolor: "linear-gradient(90deg, #FF6B00, #FF8533)",
                    color: "white",
                    fontWeight: 600,
                }}
            >
                <Box display="flex" alignItems="center" gap={1}>
                    <LocalShippingIcon />
                    {truckData ? "Edit Truck" : "Add New Truck"}
                </Box>
                <CloseIcon
                    onClick={onClose}
                    sx={{ cursor: "pointer", fontSize: 22 }}
                />
            </DialogTitle>

            {/* Form */}
            <DialogContent>
                <Grid container spacing={2} sx={{ mt: 1 }}>
                    {/* Row 1 */}
                    <Grid item xs={12} sm={4}>
                        <TextField
                            label="Make *"
                            name="make"
                            value={form.make}
                            onChange={handleChange}
                            fullWidth
                            error={!!errors.make}
                            helperText={errors.make}
                        />
                    </Grid>
                    <Grid item xs={12} sm={4}>
                        <TextField
                            label="Model *"
                            name="model"
                            value={form.model}
                            onChange={handleChange}
                            fullWidth
                            error={!!errors.model}
                            helperText={errors.model}
                        />
                    </Grid>
                    <Grid item xs={12} sm={4}>
                        <TextField
                            label="Year *"
                            name="year"
                            value={form.year}
                            onChange={handleChange}
                            fullWidth
                            error={!!errors.year}
                            helperText={errors.year}
                        />
                    </Grid>

                    {/* Row 2 */}
                    <Grid item xs={12} sm={4}>
                        <TextField
                            label="Plate Number *"
                            name="plateNumber"
                            value={form.plateNumber}
                            onChange={handleChange}
                            fullWidth
                            error={!!errors.plateNumber}
                            helperText={errors.plateNumber}
                        />
                    </Grid>
                    <Grid item xs={12} sm={4}>
                        <TextField
                            label="VIN"
                            name="vin"
                            value={form.vin}
                            onChange={handleChange}
                            fullWidth
                            placeholder="17-character VIN"
                        />
                    </Grid>

                    {/* New Color Field */}
                    <Grid item xs={12} sm={4}>
                        <TextField
                            label="Color"
                            name="color"
                            value={form.color}
                            onChange={handleChange}
                            fullWidth
                            placeholder="e.g., Red, Blue, White"
                        />
                    </Grid>

                    {/* Row 3 */}
                    <Grid item xs={12} sm={6}>
                        <TextField
                            label="Current Mileage"
                            name="mileage"
                            value={form.mileage}
                            onChange={handleChange}
                            fullWidth
                        />
                    </Grid>
                    <Grid item xs={12} sm={3}>
                        <TextField
                            select
                            label="Fuel Type"
                            name="fuelType"
                            value={form.fuelType}
                            onChange={handleChange}
                            fullWidth
                        >
                            <MenuItem value="Diesel">Diesel</MenuItem>
                            <MenuItem value="Petrol">Petrol</MenuItem>
                            <MenuItem value="Electric">Electric</MenuItem>
                        </TextField>
                    </Grid>
                    <Grid item xs={12} sm={3}>
                        <TextField
                            select
                            label="Status"
                            name="status"
                            value={form.status}
                            onChange={handleChange}
                            fullWidth
                        >
                            <MenuItem value="Active">Active</MenuItem>
                            <MenuItem value="On Trip">On Trip</MenuItem>
                            <MenuItem value="Maintenance">Maintenance</MenuItem>
                        </TextField>
                    </Grid>

                    {/* Row 4 */}
                    <Grid item xs={12} sm={6}>
                        <TextField
                            type="date"
                            label="Last Maintenance"
                            name="lastService"
                            value={form.lastService}
                            onChange={handleChange}
                            fullWidth
                            InputLabelProps={{ shrink: true }}
                        />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <TextField
                            type="date"
                            label="Insurance Expiry"
                            name="insuranceExpiry"
                            value={form.insuranceExpiry}
                            onChange={handleChange}
                            fullWidth
                            InputLabelProps={{ shrink: true }}
                        />
                    </Grid>

                    {/* Row 5 - Driver Dropdown */}
                    <Grid item xs={12}>
                        <TextField
                            select
                            label="Assigned Driver"
                            name="assignedDriver"
                            value={form.assignedDriver || ""}
                            onChange={handleChange}
                            fullWidth
                        >
                            <MenuItem value="">-- None --</MenuItem>
                            {drivers.map((d) => (
                                <MenuItem key={d.id}
                                          value={d.fullName}
                                >
                                    {d.fullName} ({d.licenseNumber})
                                </MenuItem>
                            ))}
                        </TextField>
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
                        bgcolor: "#FF6B00",
                        "&:hover": { bgcolor: "#e65c00" },
                        textTransform: "none",
                    }}
                    onClick={handleSave}
                    disabled={loading}
                >
                    {loading ? (
                        <CircularProgress size={20} sx={{ color: theme.palette.primary.main }} />
                    ) : truckData ? (
                        "Update Truck"
                    ) : (
                        "Save Truck"
                    )}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default TruckModal;
