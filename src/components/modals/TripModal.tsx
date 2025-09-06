// src/components/modals/TripModal.tsx
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
    Typography,
    InputAdornment,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import RouteIcon from "@mui/icons-material/AltRoute";
import { db, storage } from "../../firebaseConfig";
import {
    collection,
    addDoc,
    updateDoc,
    doc,
    getDocs,
    serverTimestamp,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useTheme } from "@mui/material/styles";

// Example US cities (extend with API later if needed)
const usCities = [
    "Houston",
    "Phoenix",
    "Dallas",
    "Atlanta",
    "New York",
    "Los Angeles",
    "Chicago",
    "Miami",
    "Denver",
    "Seattle",
];

interface TripModalProps {
    open: boolean;
    onClose: () => void;
    adminId: string;
    tripData?: any; // edit mode if passed
    onSaved?: () => void;
}

const TripModal: React.FC<TripModalProps> = ({
                                                 open,
                                                 onClose,
                                                 adminId,
                                                 tripData,
                                                 onSaved,
                                             }) => {
    const [form, setForm] = useState({
        tripNumber: "",
        status: "Scheduled",
        route: "",
        driver: "",
        truck: "",
        trailer: "",
        startDate: "",
        endDate: "",
        milesDriven: "",
        fuelCost: "",
        driverPayment: "",
        totalRevenue: "",
        otherExpenses: "",
        notes: "",
    });

    const [drivers, setDrivers] = useState<any[]>([]);
    const [trucks, setTrucks] = useState<any[]>([]);
    const [trailers, setTrailers] = useState<any[]>([]);
    const [routes, setRoutes] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState<any>({});
    const [isNewRoute, setIsNewRoute] = useState(false);
    const [fromCity, setFromCity] = useState("");
    const [toCity, setToCity] = useState("");
    const [rateDoc, setRateDoc] = useState<File | null>(null);

    const theme = useTheme();

    // Load existing trip data in edit mode
    useEffect(() => {
        if (tripData) {
            setForm({
                tripNumber: tripData.tripNumber || "",
                status: tripData.status || "Scheduled",
                route: tripData.route || "",
                driver: tripData.driver || "",
                truck: tripData.truck || "",
                trailer: tripData.trailer || "",
                startDate: tripData.startDate || "",
                endDate: tripData.endDate || "",
                milesDriven: tripData.milesDriven || "",
                fuelCost: tripData.fuelCost || "",
                driverPayment: tripData.driverPayment || "",
                totalRevenue: tripData.totalRevenue || "",
                otherExpenses: tripData.otherExpenses || "",
                notes: tripData.notes || "",
            });
        } else if (open) {
            // Reset when opening add new trip
            setForm({
                tripNumber: `FP-${new Date().getFullYear()}-${Math.floor(
                    Math.random() * 1000000
                )}`,
                status: "Scheduled",
                route: "",
                driver: "",
                truck: "",
                trailer: "",
                startDate: "",
                endDate: "",
                milesDriven: "",
                fuelCost: "",
                driverPayment: "",
                totalRevenue: "",
                otherExpenses: "",
                notes: "",
            });
            setIsNewRoute(false);
            setFromCity("");
            setToCity("");
            setRateDoc(null);
            setErrors({});
        }
    }, [tripData, open]);

    // Load dropdown data
    useEffect(() => {
        const fetchData = async () => {
            if (!adminId) return;

            const driverSnap = await getDocs(collection(db, "admins", adminId, "drivers"));
            setDrivers(driverSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() })));

            const truckSnap = await getDocs(collection(db, "admins", adminId, "trucks"));
            setTrucks(truckSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() })));

            const trailerSnap = await getDocs(collection(db, "admins", adminId, "trailers"));
            setTrailers(trailerSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() })));

            const routeSnap = await getDocs(collection(db, "admins", adminId, "routes"));
            setRoutes(routeSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
        };

        fetchData();
    }, [adminId]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setForm({ ...form, [name]: value });
    };

    const validate = () => {
        const newErrors: any = {};
        if (!form.tripNumber.trim()) newErrors.tripNumber = "Trip number is required";
        if (!form.driver.trim()) newErrors.driver = "Driver is required";
        if (!form.truck.trim()) newErrors.truck = "Truck is required";

        if (!isNewRoute && !form.route.trim())
            newErrors.route = "Route is required";
        if (isNewRoute && (!fromCity || !toCity))
            newErrors.route = "From and To cities required";

        if (!form.startDate) newErrors.startDate = "Start date is required";
        if (!form.endDate) newErrors.endDate = "End date is required";
        if (form.startDate && form.endDate && form.startDate > form.endDate) {
            newErrors.endDate = "End date cannot be before start date";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const uploadFile = async (file: File, path: string) => {
        const fileRef = ref(storage, `${adminId}/trips/${form.tripNumber}/${path}`);
        await uploadBytes(fileRef, file);
        return await getDownloadURL(fileRef);
    };

    const handleSave = async () => {
        if (!validate()) return;
        setLoading(true);

        try {
            let routeValue = form.route;
            if (isNewRoute && fromCity && toCity) {
                routeValue = `${fromCity} → ${toCity}`;
                await addDoc(collection(db, "admins", adminId, "routes"), {
                    name: routeValue,
                    createdAt: serverTimestamp(),
                });
            }

            let rateDocUrl = tripData?.rateDocUrl || "";
            if (rateDoc) rateDocUrl = await uploadFile(rateDoc, "rateConfirmation");

            if (tripData?.id) {
                await updateDoc(doc(db, "admins", adminId, "trips", tripData.id), {
                    ...form,
                    route: routeValue,
                    rateDocUrl,
                    updatedAt: serverTimestamp(),
                });
            } else {
                await addDoc(collection(db, "admins", adminId, "trips"), {
                    ...form,
                    route: routeValue,
                    rateDocUrl,
                    createdAt: serverTimestamp(),
                });
            }

            onClose();
            if (onSaved) onSaved();
        } catch (error) {
            console.error("❌ Error saving trip:", error);
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
                    bgcolor: "linear-gradient(90deg, #2e7d32, #4caf50)", // green gradient
                    color: "white",
                    fontWeight: 600,
                }}
            >
                <Box display="flex" alignItems="center" gap={1}>
                    <RouteIcon />
                    {tripData ? "Edit Trip" : "Create New Trip"}
                </Box>
                <CloseIcon onClick={onClose} sx={{ cursor: "pointer", fontSize: 22 }} />
            </DialogTitle>

            {/* Form */}
            <DialogContent>
                <Grid container spacing={2} sx={{ mt: 1 }}>
                    {/* Trip Number */}
                    <Grid item xs={12} sm={6}>
                        <TextField
                            label="Trip Number *"
                            name="tripNumber"
                            value={form.tripNumber}
                            onChange={handleChange}
                            fullWidth
                            error={!!errors.tripNumber}
                            helperText={errors.tripNumber}
                        />
                    </Grid>

                    {/* Status */}
                    <Grid item xs={12} sm={6}>
                        <TextField
                            select
                            label="Status"
                            name="status"
                            value={form.status}
                            onChange={handleChange}
                            fullWidth
                        >
                            <MenuItem value="Scheduled">Scheduled</MenuItem>
                            <MenuItem value="In Progress">In Progress</MenuItem>
                            <MenuItem value="Completed">Completed</MenuItem>
                            <MenuItem value="Cancelled">Cancelled</MenuItem>
                        </TextField>
                    </Grid>

                    {/* Route Selection */}
                    <Grid item xs={12}>
                        {!isNewRoute ? (
                            <TextField
                                select
                                label="Route *"
                                name="route"
                                value={form.route}
                                onChange={handleChange}
                                fullWidth
                                error={!!errors.route}
                                helperText={errors.route}
                            >
                                <MenuItem value="">-- Select Saved Route --</MenuItem>
                                {routes.map((r) => (
                                    <MenuItem key={r.id} value={r.name}>
                                        {r.name}
                                    </MenuItem>
                                ))}
                                <MenuItem value="__new__" onClick={() => setIsNewRoute(true)}>
                                    + Create New Route
                                </MenuItem>
                            </TextField>
                        ) : (
                            <Box display="flex" gap={2}>
                                <TextField
                                    select
                                    label="From *"
                                    value={fromCity}
                                    onChange={(e) => setFromCity(e.target.value)}
                                    fullWidth
                                    error={!!errors.route}
                                >
                                    {usCities.map((city) => (
                                        <MenuItem key={city} value={city}>
                                            {city}
                                        </MenuItem>
                                    ))}
                                </TextField>
                                <TextField
                                    select
                                    label="To *"
                                    value={toCity}
                                    onChange={(e) => setToCity(e.target.value)}
                                    fullWidth
                                    error={!!errors.route}
                                >
                                    {usCities.map((city) => (
                                        <MenuItem key={city} value={city}>
                                            {city}
                                        </MenuItem>
                                    ))}
                                </TextField>
                            </Box>
                        )}
                    </Grid>

                    {/* Driver / Truck / Trailer */}
                    <Grid item xs={12} sm={4}>
                        <TextField
                            select
                            label="Driver *"
                            name="driver"
                            value={form.driver}
                            onChange={handleChange}
                            fullWidth
                            error={!!errors.driver}
                            helperText={errors.driver}
                        >
                            <MenuItem value="">-- Select Driver --</MenuItem>
                            {drivers.map((d) => (
                                <MenuItem key={d.id} value={d.fullName}>
                                    {d.fullName}
                                </MenuItem>
                            ))}
                        </TextField>
                    </Grid>
                    <Grid item xs={12} sm={4}>
                        <TextField
                            select
                            label="Truck *"
                            name="truck"
                            value={form.truck}
                            onChange={handleChange}
                            fullWidth
                            error={!!errors.truck}
                            helperText={errors.truck}
                        >
                            <MenuItem value="">-- Select Truck --</MenuItem>
                            {trucks.map((t) => (
                                <MenuItem key={t.id} value={`${t.make} ${t.model}`}>
                                    {t.make} {t.model}
                                </MenuItem>
                            ))}
                        </TextField>
                    </Grid>
                    <Grid item xs={12} sm={4}>
                        <TextField
                            select
                            label="Trailer"
                            name="trailer"
                            value={form.trailer}
                            onChange={handleChange}
                            fullWidth
                        >
                            <MenuItem value="">-- Select Trailer --</MenuItem>
                            {trailers.map((tr) => (
                                <MenuItem key={tr.id} value={tr.trailerNumber}>
                                    {tr.trailerNumber} ({tr.trailerType})
                                </MenuItem>
                            ))}
                        </TextField>
                    </Grid>

                    {/* Dates */}
                    <Grid item xs={12} sm={6}>
                        <TextField
                            type="date"
                            label="Scheduled Start *"
                            name="startDate"
                            value={form.startDate}
                            onChange={handleChange}
                            fullWidth
                            InputLabelProps={{ shrink: true }}
                            error={!!errors.startDate}
                            helperText={errors.startDate}
                        />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <TextField
                            type="date"
                            label="Scheduled End *"
                            name="endDate"
                            value={form.endDate}
                            onChange={handleChange}
                            fullWidth
                            InputLabelProps={{ shrink: true }}
                            error={!!errors.endDate}
                            helperText={errors.endDate}
                        />
                    </Grid>

                    {/* Revenue & Expenses */}
                    <Grid item xs={12} sm={3}>
                        <TextField
                            label="Miles Driven"
                            name="milesDriven"
                            value={form.milesDriven}
                            onChange={handleChange}
                            fullWidth
                        />
                    </Grid>
                    <Grid item xs={12} sm={3}>
                        <TextField
                            label="Fuel Cost ($)"
                            name="fuelCost"
                            value={form.fuelCost}
                            onChange={handleChange}
                            fullWidth
                        />
                    </Grid>
                    <Grid item xs={12} sm={3}>
                        <TextField
                            label="Driver Payment ($)"
                            name="driverPayment"
                            value={form.driverPayment}
                            onChange={handleChange}
                            fullWidth
                        />
                    </Grid>
                    <Grid item xs={12} sm={3}>
                        <TextField
                            label="Total Revenue ($)"
                            name="totalRevenue"
                            value={form.totalRevenue}
                            onChange={handleChange}
                            fullWidth
                        />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <TextField
                            label="Other Expenses ($)"
                            name="otherExpenses"
                            value={form.otherExpenses}
                            onChange={handleChange}
                            fullWidth
                        />
                    </Grid>

                    {/* Notes */}
                    <Grid item xs={12}>
                        <TextField
                            label="Notes"
                            name="notes"
                            value={form.notes}
                            onChange={handleChange}
                            fullWidth
                            multiline
                            minRows={3}
                            placeholder="Any additional notes about this trip..."
                        />
                    </Grid>

                    {/* Rate Confirmation Upload */}
                    <Grid item xs={12}>
                        <Typography variant="body2" fontWeight={500} mb={1}>
                            Upload Rate Confirmation
                        </Typography>
                        <input
                            type="file"
                            accept="image/*,.pdf"
                            onChange={(e) => setRateDoc(e.target.files?.[0] || null)}
                        />
                        {(rateDoc || tripData?.rateDocUrl) && (
                            <Typography variant="caption" color="text.secondary">
                                {rateDoc ? rateDoc.name : "Existing file uploaded"}
                            </Typography>
                        )}
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
                        bgcolor: "#2e7d32",
                        "&:hover": { bgcolor: "#256628" },
                        textTransform: "none",
                    }}
                    onClick={handleSave}
                    disabled={loading}
                >
                    {loading ? (
                        <CircularProgress size={20} sx={{ color: theme.palette.primary.main }} />
                    ) : tripData ? (
                        "Update Trip"
                    ) : (
                        "Create Trip"
                    )}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default TripModal;
