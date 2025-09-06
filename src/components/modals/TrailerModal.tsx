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
    Box,
    CircularProgress,
} from "@mui/material";
import { db } from "../../firebaseConfig";
import {
    collection,
    addDoc,
    updateDoc,
    doc,
    getDocs,
    serverTimestamp,
} from "firebase/firestore";
import CloseIcon from "@mui/icons-material/Close";
import Inventory2Icon from "@mui/icons-material/Inventory2";
import { useTheme } from "@mui/material/styles";
import { isPastOrToday, isFutureOrToday } from "../../utils/dateValidators";

interface TrailerModalProps {
    open: boolean;
    onClose: () => void;
    adminId: string;
    trailerData?: any;
    onSaved?: () => void;
}

const TrailerModal: React.FC<TrailerModalProps> = ({
                                                       open,
                                                       onClose,
                                                       adminId,
                                                       trailerData,
                                                       onSaved,
                                                   }) => {
    const [form, setForm] = useState({
        make: "",
        model: "",
        year: "",
        trailerNumber: "",
        trailerType: "",
        plateNumber: "",
        vin: "",
        length: "",
        capacity: "",
        operatingHours: "",
        status: "Available",
        lastMaintenance: "",
        lastInspection: "",
        insuranceExpiry: "",
        assignedTruck: "",
    });

    const [errors, setErrors] = useState<any>({});
    const [loading, setLoading] = useState(false);
    const [trucks, setTrucks] = useState<any[]>([]);

    const theme = useTheme();

    useEffect(() => {
        if (trailerData) {
            setForm({ ...form, ...trailerData });
        } else if (open) {
            setForm({
                make: "",
                model: "",
                year: "",
                trailerNumber: "",
                trailerType: "",
                plateNumber: "",
                vin: "",
                length: "",
                capacity: "",
                operatingHours: "",
                status: "Available",
                lastMaintenance: "",
                lastInspection: "",
                insuranceExpiry: "",
                assignedTruck: "",
            });
        }
    }, [trailerData, open]);

    useEffect(() => {
        const fetchTrucks = async () => {
            if (!adminId) return;
            const snapshot = await getDocs(collection(db, "admins", adminId, "trucks"));
            const list = snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            }));
            setTrucks(list);
        };
        fetchTrucks();
    }, [adminId]);

    const validate = () => {
        const newErrors: any = {};
        if (!form.make.trim()) newErrors.make = "Make is required";
        if (!form.model.trim()) newErrors.model = "Model is required";
        if (!form.year.trim() || !/^\d{4}$/.test(form.year))
            newErrors.year = "Valid year required";
        if (!form.trailerNumber.trim()) newErrors.trailerNumber = "Trailer number is required";
        if (!form.trailerType.trim()) newErrors.trailerType = "Trailer type is required";
        if (!form.plateNumber.trim()) newErrors.plateNumber = "Plate number is required";
        if (!form.length.trim()) newErrors.length = "Length is required";
        if (!form.capacity.trim()) newErrors.capacity = "Capacity is required";
        if (form.lastMaintenance && !isPastOrToday(form.lastMaintenance)) {
            newErrors.lastMaintenance = "Last maintenance must be today or a past date";
        }
        if (form.lastInspection && !isPastOrToday(form.lastInspection)) {
            newErrors.lastInspection = "Last inspection must be today or a past date";
        }
        if (form.insuranceExpiry && !isFutureOrToday(form.insuranceExpiry)) {
            newErrors.insuranceExpiry = "Insurance expiry must be today or a future date";
        }
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
            if (trailerData?.id) {
                await updateDoc(doc(db, "admins", adminId, "trailers", trailerData.id), {
                    ...form,
                    updatedAt: serverTimestamp(),
                });
            } else {
                await addDoc(collection(db, "admins", adminId, "trailers"), {
                    ...form,
                    createdAt: serverTimestamp(),
                });
            }
            onClose();
            if (onSaved) onSaved();
        } catch (err) {
            console.error("Error saving trailer:", err);
        }
        setLoading(false);
    };

    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
            <DialogTitle
                sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    background: "linear-gradient(90deg, #9C27B0, #BA68C8)", // Purple gradient
                    color: "white",
                    fontWeight: 600,
                }}
            >
                <Box display="flex" alignItems="center" gap={1}>
                    <Inventory2Icon />
                    {trailerData ? "Edit Trailer" : "Add New Trailer"}
                </Box>
                <CloseIcon onClick={onClose} sx={{ cursor: "pointer", fontSize: 22 }} />
            </DialogTitle>

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
                    <Grid item xs={12} sm={6}>
                        <TextField
                            label="Trailer Number *"
                            name="trailerNumber"
                            value={form.trailerNumber}
                            onChange={handleChange}
                            fullWidth
                            error={!!errors.trailerNumber}
                            helperText={errors.trailerNumber}
                        />
                    </Grid>
                    <Grid item xs={12} sm={6}>
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

                    {/* Row 3 */}
                    <Grid item xs={12} sm={6}>
                        <TextField
                            select
                            label="Trailer Type *"
                            name="trailerType"
                            value={form.trailerType}
                            onChange={handleChange}
                            fullWidth
                            error={!!errors.trailerType}
                            helperText={errors.trailerType}
                        >
                            <MenuItem value="Dry Van">Dry Van</MenuItem>
                            <MenuItem value="Flatbed">Flatbed</MenuItem>
                            <MenuItem value="Refrigerated (Reefer)">Refrigerated (Reefer)</MenuItem>
                            <MenuItem value="Tanker">Tanker</MenuItem>
                            <MenuItem value="Lowboy">Lowboy</MenuItem>
                        </TextField>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <TextField
                            label="VIN"
                            name="vin"
                            value={form.vin}
                            onChange={handleChange}
                            fullWidth
                            placeholder="17-character VIN"
                        />
                    </Grid>

                    {/* Row 4 */}
                    <Grid item xs={12} sm={4}>
                        <TextField
                            label="Length (feet) *"
                            name="length"
                            value={form.length}
                            onChange={handleChange}
                            fullWidth
                            error={!!errors.length}
                            helperText={errors.length}
                        />
                    </Grid>
                    <Grid item xs={12} sm={4}>
                        <TextField
                            label="Capacity (lbs) *"
                            name="capacity"
                            value={form.capacity}
                            onChange={handleChange}
                            fullWidth
                            error={!!errors.capacity}
                            helperText={errors.capacity}
                        />
                    </Grid>
                    <Grid item xs={12} sm={4}>
                        <TextField
                            label="Operating Hours"
                            name="operatingHours"
                            value={form.operatingHours}
                            onChange={handleChange}
                            fullWidth
                        />
                    </Grid>

                    {/* Row 5 */}
                    <Grid item xs={12} sm={6}>
                        <TextField
                            select
                            label="Status"
                            name="status"
                            value={form.status}
                            onChange={handleChange}
                            fullWidth
                        >
                            <MenuItem value="Available">Available</MenuItem>
                            <MenuItem value="In Use">In Use</MenuItem>
                        </TextField>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <TextField
                            select
                            label="Assigned Truck"
                            name="assignedTruck"
                            value={form.assignedTruck}
                            onChange={handleChange}
                            fullWidth
                        >
                            <MenuItem value="">-- Select Truck --</MenuItem>
                            {trucks.map((t) => (
                                <MenuItem key={t.id} value={t.make + " " + t.model}>
                                    {t.make} {t.model} ({t.plateNumber})
                                </MenuItem>
                            ))}
                        </TextField>
                    </Grid>

                    {/* Row 6 */}
                    <Grid item xs={12} sm={4}>
                        <TextField
                            type="date"
                            label="Last Maintenance"
                            name="lastMaintenance"
                            value={form.lastMaintenance}
                            onChange={handleChange}
                            fullWidth
                            InputLabelProps={{ shrink: true }}
                            error={!!errors.lastMaintenance}
                            helperText={errors.lastMaintenance}
                        />
                    </Grid>
                    <Grid item xs={12} sm={4}>
                        <TextField
                            type="date"
                            label="Last Inspection"
                            name="lastInspection"
                            value={form.lastInspection}
                            onChange={handleChange}
                            fullWidth
                            InputLabelProps={{ shrink: true }}
                            error={!!errors.lastInspection}
                            helperText={errors.lastInspection}
                        />
                    </Grid>
                    <Grid item xs={12} sm={4}>
                        <TextField
                            type="date"
                            label="Insurance Expiry"
                            name="insuranceExpiry"
                            value={form.insuranceExpiry}
                            onChange={handleChange}
                            fullWidth
                            InputLabelProps={{ shrink: true }}
                            error={!!errors.insuranceExpiry}
                            helperText={errors.insuranceExpiry}
                        />
                    </Grid>
                </Grid>
            </DialogContent>

            <DialogActions>
                <Button onClick={onClose} sx={{ textTransform: "none" }}>
                    Cancel
                </Button>
                <Button
                    variant="contained"
                    sx={{
                        bgcolor: "#9C27B0",
                        "&:hover": { bgcolor: "#7B1FA2" },
                        textTransform: "none",
                    }}
                    onClick={handleSave}
                    disabled={loading}
                >
                    {loading ? (
                        <CircularProgress size={20} sx={{ color: theme.palette.primary.main }} />
                    ) : trailerData ? (
                        "Update Trailer"
                    ) : (
                        "Save Trailer"
                    )}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default TrailerModal;
