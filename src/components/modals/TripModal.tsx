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
    Card,
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
    query,
    orderBy,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useTheme } from "@mui/material/styles";

interface TripModalProps {
    open: boolean;
    onClose: () => void;
    adminId: string;
    tripData?: any; // edit mode if passed
    onSaved?: () => void;
}

interface RouteDetails {
    pickup: {
        address: string;
        city: string;
        state: string;
    };
    dropoff: {
        address: string;
        city: string;
        state: string;
    };
}

interface TripForm {
    tripNumber: string;
    status: string;
    route: string;
    driver: string;
    truck: string;
    trailer: string;
    startDate: string;
    endDate: string;
    startingMiles: string;
    endingMiles: string;
    totalTripDrivenMiles: string;
    fuelCost: string;
    driverPayment: string;
    totalRevenue: string;
    otherExpenses: string;
    notes: string;
    route_details: RouteDetails;
}

const TripModal: React.FC<TripModalProps> = ({
                                                 open,
                                                 onClose,
                                                 adminId,
                                                 tripData,
                                                 onSaved,
                                             }) => {
    const [form, setForm] = useState<TripForm>({
        tripNumber: "",
        status: "Scheduled",
        route: "",
        driver: "",
        truck: "",
        trailer: "",
        startDate: "",
        endDate: "",
        startingMiles: "",
        endingMiles: "",
        totalTripDrivenMiles: "",
        fuelCost: "",
        driverPayment: "",
        totalRevenue: "",
        otherExpenses: "",
        notes: "",
        route_details: {
            pickup: { address: "", city: "", state: "" },
            dropoff: { address: "", city: "", state: "" },
        },
    });


    const [drivers, setDrivers] = useState<any[]>([]);
    const [trucks, setTrucks] = useState<any[]>([]);
    const [trailers, setTrailers] = useState<any[]>([]);
    const [routes, setRoutes] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState<any>({});
    const [isNewRoute, setIsNewRoute] = useState(false);
    const [rateDoc, setRateDoc] = useState<File | null>(null);

    const theme = useTheme();

    // ✅ Get next sequential trip number
    const getNextTripNumber = async (adminId: string) => {
        const q = query(collection(db, "admins", adminId, "trips"), orderBy("createdAt", "desc"));
        const tripsSnapshot = await getDocs(q);
        if (tripsSnapshot.empty) return `FP-${new Date().getFullYear()}-1`;

        const count = tripsSnapshot.size;
        return `FP-${new Date().getFullYear()}-${count + 1}`;
    };

    // ✅ Preload form
    useEffect(() => {
        const prepareForm = async () => {
            if (tripData) {
                setForm({
                    ...tripData,
                    route_details: tripData.route_details || {
                        pickup: { address: "", city: "", state: "" },
                        dropoff: { address: "", city: "", state: "" },
                    },
                });
            } else if (open && adminId) {
                const nextTripNumber = await getNextTripNumber(adminId);
                setForm({
                    tripNumber: nextTripNumber,
                    status: "Scheduled",
                    route: "",
                    driver: "",
                    truck: "",
                    trailer: "",
                    startDate: "",
                    endDate: "",
                    startingMiles: "",
                    endingMiles: "",
                    totalTripDrivenMiles: "",
                    fuelCost: "",
                    driverPayment: "",
                    totalRevenue: "",
                    otherExpenses: "",
                    notes: "",
                    route_details: {
                        pickup: { address: "", city: "", state: "" },
                        dropoff: { address: "", city: "", state: "" },
                    },
                });
                setIsNewRoute(false);
                setRateDoc(null);
                setErrors({});
            }
        };
        prepareForm();
    }, [tripData, open, adminId]);

    // ✅ Load dropdowns
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

        setForm((prev: any) => {
            // make a copy of the previous form values
            const updated = { ...prev, [name]: value };

            // Auto-calc when startingMiles or endingMiles change
            if (name === "startingMiles" || name === "endingMiles") {
                const start =
                    name === "startingMiles" ? Number(value) : Number(prev.startingMiles || 0);
                const end =
                    name === "endingMiles" ? Number(value) : Number(prev.endingMiles || 0);

                if (!isNaN(start) && !isNaN(end) && end >= start) {
                    updated.totalTripDrivenMiles = end - start;
                } else {
                    updated.totalTripDrivenMiles = "";
                }
            }

            return updated;
        });
    };


    const handleRouteSelect = (routeId: string) => {
        if (routeId === "__new__") {
            setIsNewRoute(true);
            setForm((prev) => ({ ...prev, route: "" }));
            return;
        }

        const selected = routes.find((r) => r.id === routeId);
        if (selected) {
            setForm((prev) => ({
                ...prev,
                route: routeId, // store the route id
                route_details: {
                    pickup: {
                        address: selected.pickupAddress || "",
                        city: selected.pickupCity || "",
                        state: selected.pickupState || "",
                    },
                    dropoff: {
                        address: selected.dropoffAddress || "",
                        city: selected.dropoffCity || "",
                        state: selected.dropoffState || "",
                    },
                },
            }));
        }
    };


    const validate = () => {
        const newErrors: any = {};
        if (!form.tripNumber.trim()) newErrors.tripNumber = "Trip number is required";
        if (!form.driver.trim()) newErrors.driver = "Driver is required";
        if (!form.truck.trim()) newErrors.truck = "Truck is required";
        if (!form.route.trim()) newErrors.route = "Route is required";

        if (!form.startDate) newErrors.startDate = "Start date is required";
        if (!form.endDate) newErrors.endDate = "End date is required";
        if (form.startDate && form.endDate && form.startDate > form.endDate) {
            newErrors.endDate = "End date cannot be before start date";
        }
        if (!form.startingMiles?.toString().trim()) {
            newErrors.startingMiles = "Starting Trip miles is required";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const uploadFile = async (file: File, path: string) => {
        const fileRef = ref(storage, `${adminId}/trips/${form.tripNumber}/${path}`);
        await uploadBytes(fileRef, file);
        return await getDownloadURL(fileRef);
    };

    const handleDriverSelect = (driverId: string) => { //driverID is the license number of driver
        const selectedDriver = drivers.find((d) => d.id === driverId);

        setForm((prev) => ({
            ...prev,
            driver: driverId, // store driver ID
            truck: "",
            trailer: "",
        }));

        if (!selectedDriver) return;

        // ✅ Find truck assigned to this driver (by licenseNumber)
        const assignedTruck = trucks.find(
            (t) => t.assignedDriverId === selectedDriver.licenseNumber
        );

        if (assignedTruck) {
            const truckName = `${assignedTruck.make} ${assignedTruck.model}`;

            // Save truck info
            setForm((prev) => ({
                ...prev,
                truck: truckName,
            }));

            // ✅ Find trailer assigned to this truck (by truckNumber)
            const assignedTrailer = trailers.find(
                (tr) => tr.assignedTruckNumber === assignedTruck.truckNumber
            );

            if (assignedTrailer) {
                setForm((prev) => ({
                    ...prev,
                    trailer: assignedTrailer
                }));
            }
        }
    };

    const handleSave = async () => {
        if (!validate()) return;
        setLoading(true);

        try {
            let rateDocUrl = tripData?.rateDocUrl || "";
            if (rateDoc) rateDocUrl = await uploadFile(rateDoc, "rateConfirmation");

            let routeId = form.route;
            let routeDetails = form.route_details;

            // 🆕 If user is creating a new route
            if (isNewRoute && routeDetails?.pickup && routeDetails?.dropoff) {
                const newRouteRef = await addDoc(collection(db, "admins", adminId, "routes"), {
                    pickupAddress: routeDetails.pickup.address,
                    pickupCity: routeDetails.pickup.city,
                    pickupState: routeDetails.pickup.state,
                    dropoffAddress: routeDetails.dropoff.address,
                    dropoffCity: routeDetails.dropoff.city,
                    dropoffState: routeDetails.dropoff.state,
                    routeName: `${routeDetails.pickup.city} → ${routeDetails.dropoff.city}`,
                    createdAt: serverTimestamp(),
                });

                routeId = newRouteRef.id; // assign new routeId
            }

            // Save Trip
            if (tripData?.id) {
                await updateDoc(doc(db, "admins", adminId, "trips", tripData.id), {
                    ...form,
                    route: routeId,
                    route_details: routeDetails,
                    rateDocUrl,
                    updatedAt: serverTimestamp(),
                });
            } else {
                await addDoc(collection(db, "admins", adminId, "trips"), {
                    ...form,
                    route: routeId,
                    route_details: routeDetails,
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
                    background: "linear-gradient(90deg, #2e7d32, #4caf50)",
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

            <DialogContent>
                <Grid container spacing={2} sx={{ mt: 1 }}>
                    {/* Trip Number */}
                    <Grid item xs={12} sm={6}>
                        <TextField label="Trip Number *" value={form.tripNumber} fullWidth disabled />
                    </Grid>

                    {/* Status */}
                    <Grid item xs={12} sm={6}>
                        <TextField select label="Status" name="status" value={form.status} onChange={handleChange} fullWidth>
                            <MenuItem value="Scheduled">Scheduled</MenuItem>
                            <MenuItem value="In Progress">In Progress</MenuItem>
                            <MenuItem value="Completed">Completed</MenuItem>
                            <MenuItem value="Cancelled">Cancelled</MenuItem>
                        </TextField>
                    </Grid>

                    {/* Route */}
                    <Grid item xs={12}>
                        <TextField
                            select
                            label="Route *"
                            value={form.route} // 👈 now stores routeId
                            onChange={(e) => {
                                if (e.target.value === "__new__") {
                                    setIsNewRoute(true);

                                    // ✅ clear out the route details when creating a new one
                                    setForm((prev) => ({
                                        ...prev,
                                        route: "",
                                        route_details: {
                                            pickup: { address: "", city: "", state: "" },
                                            dropoff: { address: "", city: "", state: "" },
                                        },
                                    }));
                                } else {
                                    handleRouteSelect(e.target.value); // your existing handler
                                }
                            }}
                            fullWidth
                            error={!!errors.route}
                            helperText={errors.route}
                        >
                            <MenuItem value="">-- Select Saved Route --</MenuItem>
                            {routes.map((r) => (
                                <MenuItem key={r.id} value={r.id}>
                                    {r.pickupCity}, {r.pickupState} → {r.dropoffCity}, {r.dropoffState}
                                </MenuItem>
                            ))}
                            <MenuItem value="__new__">+ Create New Route</MenuItem>
                        </TextField>
                    </Grid>

                    {/* Existing Route Details */}
                    {form.route && !isNewRoute && (
                        <Card variant="outlined" sx={{ mt: 2, p: 2 , backgroundColor: "#f5f5f5"}}>
                            <Typography fontWeight={600} mb={2}>Route Details (from DB)</Typography>
                            <Grid container spacing={2}>
                                {/* Pickup */}
                                <Grid item xs={12} sm={4}>
                                    <TextField
                                        label="Pickup Address"
                                        value={form.route_details.pickup.address}
                                        fullWidth
                                        InputProps={{ readOnly: true }}
                                    />
                                </Grid>
                                <Grid item xs={6} sm={4}>
                                    <TextField
                                        label="Pickup City"
                                        value={form.route_details.pickup.city}
                                        fullWidth
                                        InputProps={{ readOnly: true }}
                                    />
                                </Grid>
                                <Grid item xs={6} sm={4}>
                                    <TextField
                                        label="Pickup State"
                                        value={form.route_details.pickup.state}
                                        fullWidth
                                        InputProps={{ readOnly: true }}
                                    />
                                </Grid>

                                {/* Dropoff */}
                                <Grid item xs={12} sm={4}>
                                    <TextField
                                        label="Dropoff Address"
                                        value={form.route_details.dropoff.address}
                                        fullWidth
                                        InputProps={{ readOnly: true }}
                                    />
                                </Grid>
                                <Grid item xs={6} sm={4}>
                                    <TextField
                                        label="Dropoff City"
                                        value={form.route_details.dropoff.city}
                                        fullWidth
                                        InputProps={{ readOnly: true }}
                                    />
                                </Grid>
                                <Grid item xs={6} sm={4}>
                                    <TextField
                                        label="Dropoff State"
                                        value={form.route_details.dropoff.state}
                                        fullWidth
                                        InputProps={{ readOnly: true }}
                                    />
                                </Grid>
                            </Grid>
                        </Card>
                    )}


                    {/* Create New Route Section */}
                    {isNewRoute && (
                        <Card variant="outlined" sx={{ mt: 2, p: 2,backgroundColor: "#f5f5f5", }}>
                            <Typography fontWeight={600} mb={2}>Create New Route</Typography>
                            <Grid container spacing={2}>
                                <Grid item xs={12} sm={6}>
                                    <TextField label="Pickup Address" value={form.route_details.pickup.address} onChange={(e) => setForm((prev:any)=>({...prev,route_details:{...prev.route_details,pickup:{...prev.route_details.pickup,address:e.target.value}}}))} fullWidth />
                                </Grid>
                                <Grid item xs={6} sm={3}>
                                    <TextField label="Pickup City *" value={form.route_details.pickup.city} onChange={(e) => setForm((prev:any)=>({...prev,route_details:{...prev.route_details,pickup:{...prev.route_details.pickup,city:e.target.value}}}))} fullWidth />
                                </Grid>
                                <Grid item xs={6} sm={3}>
                                    <TextField label="Pickup State *" value={form.route_details.pickup.state} onChange={(e) => setForm((prev:any)=>({...prev,route_details:{...prev.route_details,pickup:{...prev.route_details.pickup,state:e.target.value}}}))} fullWidth />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <TextField label="Dropoff Address" value={form.route_details.dropoff.address} onChange={(e) => setForm((prev:any)=>({...prev,route_details:{...prev.route_details,dropoff:{...prev.route_details.dropoff,address:e.target.value}}}))} fullWidth />
                                </Grid>
                                <Grid item xs={6} sm={3}>
                                    <TextField label="Dropoff City *" value={form.route_details.dropoff.city} onChange={(e) => setForm((prev:any)=>({...prev,route_details:{...prev.route_details,dropoff:{...prev.route_details.dropoff,city:e.target.value}}}))} fullWidth />
                                </Grid>
                                <Grid item xs={6} sm={3}>
                                    <TextField label="Dropoff State *" value={form.route_details.dropoff.state} onChange={(e) => setForm((prev:any)=>({...prev,route_details:{...prev.route_details,dropoff:{...prev.route_details.dropoff,state:e.target.value}}}))} fullWidth />
                                </Grid>
                            </Grid>
                        </Card>
                    )}

                    {/* Driver / Truck / Trailer */}
                    <Grid item xs={12} sm={4}>
                        <TextField
                            select
                            label="Driver *"
                            name="driver"
                            value={form.driver}
                            onChange={(e) => handleDriverSelect(e.target.value)}
                            fullWidth
                            error={!!errors.driver}
                            helperText={errors.driver}
                        >
                            <MenuItem value="">-- Select Driver --</MenuItem>
                            {drivers.map((d) => (
                                <MenuItem key={d.id} value={d.licenseNumber}>
                                    {d.fullName}
                                </MenuItem>
                            ))}
                        </TextField>
                    </Grid>
                    <Grid item xs={12} sm={4}>
                        <TextField select label="Truck *" name="truck" value={form.truck} onChange={handleChange} fullWidth>
                            <MenuItem value="">-- Select Truck --</MenuItem>
                            {trucks.map((t) => (
                                <MenuItem key={t.id} value={`${t.make} ${t.model}`}>{t.make} {t.model}</MenuItem>
                            ))}
                        </TextField>
                    </Grid>
                    <Grid item xs={12} sm={4}>
                        <TextField select label="Trailer" name="trailer" value={form.trailer} onChange={handleChange} fullWidth>
                            <MenuItem value="">-- Select Trailer --</MenuItem>
                            {trailers.map((tr) => (
                                <MenuItem key={tr.id} value={tr.trailerNumber}>{tr.trailerNumber} ({tr.trailerType})</MenuItem>
                            ))}
                        </TextField>
                    </Grid>

                    {/* Dates */}
                    <Grid item xs={12} sm={6}>
                        <TextField type="datetime-local" label="Scheduled Start *" name="startDate" value={form.startDate} onChange={handleChange} fullWidth InputLabelProps={{ shrink: true }} />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <TextField type="datetime-local" label="Scheduled End *" name="endDate" value={form.endDate} onChange={handleChange} fullWidth InputLabelProps={{ shrink: true }} />
                    </Grid>

                    {/* Odometer & Mileage */}
                    <Grid item xs={12}>
                        <Card
                            variant="outlined"
                            sx={{ p: 2, backgroundColor: "#f5f5f5", borderRadius: 2 }}
                        >
                            <Typography variant="subtitle1" fontWeight={600} mb={2}>
                                Odometer & Mileage
                            </Typography>

                            <Grid container spacing={2}>
                                {/* Starting Odometer */}
                                <Grid item xs={12} sm={4}>
                                    <TextField
                                        label="Starting Odometer *"
                                        placeholder="e.g., 150000"
                                        name="startingMiles"
                                        value={form.startingMiles || ""}
                                        onChange={handleChange}
                                        fullWidth
                                        error={!!errors.startingMiles}
                                        helperText={errors.startingMiles}
                                    />
                                </Grid>

                                {/* Ending Odometer */}
                                <Grid item xs={12} sm={4}>
                                    <TextField
                                        label="Ending Odometer"
                                        placeholder="e.g., 150500"
                                        name="endingMiles"
                                        value={form.endingMiles || ""}
                                        onChange={handleChange}
                                        fullWidth
                                    />
                                </Grid>

                                {/* Total Trip Miles */}
                                <Grid item xs={12} sm={4}>
                                    <TextField
                                        label="Total Trip Miles"
                                        name="milesDriven"
                                        value={form.totalTripDrivenMiles || "Auto-calculated"}
                                        fullWidth
                                        disabled
                                        InputProps={{
                                            style: { backgroundColor: "#f4f6f8", fontStyle: "italic" },
                                        }}
                                    />
                                </Grid>
                            </Grid>
                        </Card>
                    </Grid>

                    <Grid item xs={12} sm={3}><TextField label="Fuel Cost ($)" name="fuelCost" value={form.fuelCost} onChange={handleChange} fullWidth /></Grid>
                    <Grid item xs={12} sm={3}><TextField label="Driver Payment ($)" name="driverPayment" value={form.driverPayment} onChange={handleChange} fullWidth /></Grid>
                    <Grid item xs={12} sm={3}><TextField label="Total Revenue ($)" name="totalRevenue" value={form.totalRevenue} onChange={handleChange} fullWidth /></Grid>
                    <Grid item xs={12} sm={3}><TextField label="Other Expenses ($)" name="otherExpenses" value={form.otherExpenses} onChange={handleChange} fullWidth /></Grid>

                    {/* Notes */}
                    <Grid item xs={12}>
                        <TextField label="Notes" name="notes" value={form.notes} onChange={handleChange} fullWidth multiline minRows={3} />
                    </Grid>

                    {/* Rate Doc */}
                    <Grid item xs={12}>
                        <Typography variant="body2" fontWeight={500} mb={1}>Upload Rate Confirmation</Typography>
                        <input type="file" accept="image/*,.pdf" onChange={(e) => setRateDoc(e.target.files?.[0] || null)} />
                        {(rateDoc || tripData?.rateDocUrl) && (
                            <Typography variant="caption">{rateDoc ? rateDoc.name : "Existing file uploaded"}</Typography>
                        )}
                    </Grid>
                </Grid>
            </DialogContent>

            <DialogActions>
                <Button onClick={onClose}>Cancel</Button>
                <Button variant="contained" sx={{ bgcolor: "#2e7d32", "&:hover": { bgcolor: "#256628" } }} onClick={handleSave} disabled={loading}>
                    {loading ? <CircularProgress size={20} sx={{ color: theme.palette.primary.main }} /> : tripData ? "Update Trip" : "Create Trip"}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default TripModal;
