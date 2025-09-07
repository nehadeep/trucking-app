import React, { useState,useEffect } from "react";
import {
    Dialog,
    DialogTitle,
    DialogContent,
    TextField,
    MenuItem, IconButton,
    Button, DialogActions, Typography, Grid, Box, CircularProgress,
} from "@mui/material";

import { db, storage } from "../../firebaseConfig"; // adjust path
import { collection,
    addDoc,
    doc,
    updateDoc,
    serverTimestamp,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

// ✅ Import reusable validators
import {
    formatPhoneNumber,
    isValidEmail,
    isValidLicenseNumber,
    isValidSSN, formatSSN
} from "../../utils/validators";
import CloseIcon from "@mui/icons-material/Close";
import { useTheme } from "@mui/material/styles";
import PersonIcon from "@mui/icons-material/Person";
import {isFutureOrToday} from "../../utils/dateValidators";


interface DriverModalProps {
    open: boolean;
    onClose: () => void;
    adminId: string;
    driverData?: any; // pass driver object when editing
    onSaved?: () => void; // callback to refresh parent list
}


const DriverModal: React.FC<DriverModalProps> = ({
                                                     open,
                                                     onClose,
                                                     adminId,
                                                     driverData,
                                                     onSaved,
                                                 }) => {
    const theme = useTheme();
    const [form, setForm] = useState({
        fullName: "",
        phone: "",
        email: "",
        address: "",
        licenseNumber: "",
        licenseExpiry: "",
        hireDate: "",
        payPerMile: "",
        totalMiles: "",
        status: "Active",
        ssn: "",
    });

    const [errors, setErrors] = useState<any>({});
    const [driverPhoto, setDriverPhoto] = useState<File | null>(null);
    const [licenseFront, setLicenseFront] = useState<File | null>(null);
    const [licenseBack, setLicenseBack] = useState<File | null>(null);
    const [ssnDoc, setSsnDoc] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);

    // ✅ preload data in edit mode
    useEffect(() => {
        if (driverData) {
            setForm({
                fullName: driverData.fullName || "",
                phone: driverData.phone || "",
                email: driverData.email || "",
                address: driverData.address || "",
                licenseNumber: driverData.licenseNumber || "",
                licenseExpiry: driverData.licenseExpiry || "",
                hireDate: driverData.hireDate || "",
                payPerMile: driverData.payPerMile || "",
                totalMiles: driverData.totalMiles || "",
                status: driverData.status || "Active",
                ssn: driverData.ssn || "",
            });
        } else if (open) {
            // Reset form in add mode
            setForm({
                fullName: "",
                phone: "",
                email: "",
                address: "",
                licenseNumber: "",
                licenseExpiry: "",
                hireDate: "",
                payPerMile: "",
                totalMiles: "",
                status: "Active",
                ssn: "",
            });

            setDriverPhoto(null);
            setLicenseFront(null);
            setLicenseBack(null);
            setSsnDoc(null);
            setErrors({});
        }
    }, [driverData, open]);

    // Reset file states whenever modal closes
    useEffect(() => {
        if (!open) {
            setDriverPhoto(null);
            setLicenseFront(null);
            setLicenseBack(null);
            setSsnDoc(null);
        }
    }, [open]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let { name, value } = e.target;
        if (name === "phone") value = formatPhoneNumber(value);
        if (name === "licenseNumber") value = value.toUpperCase();
        if (name === "ssn") value = formatSSN(value);
        setForm({ ...form, [name]: value });
    };

    const validate = () => {
        let newErrors: any = {};
        if (!form.fullName) newErrors.fullName = "Full name is required";
        if (!form.phone || form.phone.length < 14)
            newErrors.phone = "Valid phone number is required";
        if (!form.email || !isValidEmail(form.email))
            newErrors.email = "Enter a valid email";
        if (!form.payPerMile)
            newErrors.payPerMile = "Driver pay per mile is required";
        if (!form.ssn || !isValidSSN(form.ssn))
            newErrors.ssn = "Enter SSN as ###-##-####";
        if (!form.licenseNumber || !isValidLicenseNumber(form.licenseNumber))
            newErrors.licenseNumber =
                "License number must be uppercase alphanumeric";
        if (!form.licenseExpiry) {
            newErrors.licenseExpiry = "License expiry date is required";
        }
        if (form.licenseExpiry && !isFutureOrToday(form.licenseExpiry)) {
            newErrors.insuranceExpiry = "License expiry must be in a future date";
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const uploadFile = async (file: File, path: string) => {
        const fileRef = ref(
            storage,
            `${adminId}/drivers/${form.licenseNumber}/${path}`
        );
        await uploadBytes(fileRef, file);
        return await getDownloadURL(fileRef);
    };

    const handleSave = async () => {
        if (!validate()) return;
        setLoading(true);
        try {
            let driverPhotoUrl = driverData?.driverPhotoUrl || "";
            let licenseFrontUrl = driverData?.licenseFrontUrl || "";
            let licenseBackUrl = driverData?.licenseBackUrl || "";
            let ssnDocUrl = driverData?.ssnDocUrl || "";

            if (driverPhoto)
                driverPhotoUrl = await uploadFile(driverPhoto, "driverPhoto");
            if (licenseFront)
                licenseFrontUrl = await uploadFile(licenseFront, "licenseFront");
            if (licenseBack)
                licenseBackUrl = await uploadFile(licenseBack, "licenseBack");
            if (ssnDoc) ssnDocUrl = await uploadFile(ssnDoc, "ssnDoc");

            if (driverData?.id) {
                await updateDoc(doc(db, "admins", adminId, "drivers", driverData.id), {
                    ...form,
                    totalMiles: Number(form.totalMiles),
                    updatedAt: serverTimestamp(),
                    driverPhotoUrl,
                    licenseFrontUrl,
                    licenseBackUrl,
                    ssnDocUrl,
                });
            } else {
                await addDoc(collection(db, "admins", adminId, "drivers"), {
                    ...form,
                    totalMiles: Number(form.totalMiles),
                    createdAt: serverTimestamp(),
                    driverPhotoUrl,
                    licenseFrontUrl,
                    licenseBackUrl,
                    ssnDocUrl,
                });
            }
            onClose();
            if (onSaved) onSaved();
        } catch (error) {
            console.error("❌ Error saving driver:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
            <DialogTitle
                sx={{
                    bgcolor: theme.palette.primary.main,
                    color: theme.palette.primary.contrastText,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                }}
            >
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <PersonIcon sx={{ color: theme.palette.primary.contrastText }} />
                    {driverData ? "Edit Driver" : "Add Driver"}
                </Box>
                <IconButton
                    onClick={onClose}
                    sx={{ color: theme.palette.primary.contrastText }}
                >
                    <CloseIcon />
                </IconButton>
            </DialogTitle>
            <DialogContent>
                <Grid container spacing={2} sx={{ mt: 1 }}>
                    {/* Row 1 */}
                    <Grid item xs={12} sm={6}>
                        <TextField
                            label="Full Name *"
                            name="fullName"
                            value={form.fullName}
                            onChange={handleChange}
                            fullWidth
                            error={!!errors.fullName}
                            helperText={errors.fullName}
                        />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <TextField
                            label="Phone Number *"
                            name="phone"
                            value={form.phone}
                            onChange={handleChange}
                            fullWidth
                            error={!!errors.phone}
                            helperText={errors.phone}
                        />
                    </Grid>

                    {/* Row 2 */}
                    <Grid item xs={12}>
                        <TextField
                            label="Email Address *"
                            name="email"
                            value={form.email}
                            onChange={handleChange}
                            fullWidth
                            error={!!errors.email}
                            helperText={errors.email}
                        />
                    </Grid>

                    {/* Row 3 */}
                    <Grid item xs={12}>
                        <TextField
                            label="Address"
                            name="address"
                            value={form.address}
                            onChange={handleChange}
                            fullWidth
                            multiline
                            minRows={3}
                        />
                    </Grid>

                    {/* Row 4 */}
                    <Grid item xs={12} sm={6}>
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
                            <MenuItem value="Inactive">Inactive</MenuItem>
                        </TextField>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <TextField
                            label="Hire Date"
                            name="hireDate"
                            type="date"
                            value={form.hireDate}
                            onChange={handleChange}
                            fullWidth
                            InputLabelProps={{ shrink: true }}
                        />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <TextField
                            label="Driver Pay / Per Mile *"
                            name="payPerMile"
                            type="number"
                            value={form.payPerMile}
                            onChange={handleChange}
                            fullWidth
                            required
                            error={!form.payPerMile}
                            helperText={!form.payPerMile}
                        />
                    </Grid>


                    <Grid item xs={12} sm={6}>
                        <TextField
                            label="Total Miles"
                            name="totalMiles"
                            value={form.totalMiles}
                            onChange={handleChange}
                            fullWidth
                        />
                    </Grid>

                    {/* Row 5 */}
                    <Grid item xs={12} sm={6}>
                        <TextField
                            label="License Number *"
                            name="licenseNumber"
                            value={form.licenseNumber}
                            onChange={handleChange}
                            fullWidth
                            error={!!errors.licenseNumber}
                            helperText={errors.licenseNumber}
                        />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <TextField
                            label="License Expiry"
                            name="licenseExpiry"
                            type="date"
                            value={form.licenseExpiry}
                            onChange={handleChange}
                            fullWidth
                            InputLabelProps={{ shrink: true }}
                            error={!!errors.licenseExpiry}
                            helperText={errors.licenseExpiry}
                        />
                    </Grid>

                    {/* Row 6 */}
                    <Grid item xs={12} sm={6}>
                        <Typography variant="body2" sx={{ mb: 1, fontWeight: 500 }}>
                            License Front
                        </Typography>
                        <Box
                            sx={{
                                border: "1px dashed #aaa",
                                borderRadius: 2,
                                p: 2,
                                textAlign: "center",
                            }}
                        >
                            <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => setLicenseFront(e.target.files?.[0] || null)}
                            />
                            {(licenseFront || driverData?.licenseFrontUrl) && (
                                <img
                                    src={
                                        licenseFront
                                            ? URL.createObjectURL(licenseFront)
                                            : driverData.licenseFrontUrl
                                    }
                                    alt="License Front"
                                    style={{ width: "100%", marginTop: 8, borderRadius: 8 }}
                                />
                            )}
                        </Box>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <Typography variant="body2" sx={{ mb: 1, fontWeight: 500 }}>
                            License Back
                        </Typography>
                        <Box
                            sx={{
                                border: "1px dashed #aaa",
                                borderRadius: 2,
                                p: 2,
                                textAlign: "center",
                            }}
                        >
                            <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => setLicenseBack(e.target.files?.[0] || null)}
                            />
                            {(licenseBack || driverData?.licenseBackUrl) && (
                                <img
                                    src={
                                        licenseBack
                                            ? URL.createObjectURL(licenseBack)
                                            : driverData.licenseBackUrl
                                    }
                                    alt="License Back"
                                    style={{ width: "100%", marginTop: 8, borderRadius: 8 }}
                                />
                            )}
                        </Box>
                    </Grid>

                    {/* Row 7 */}
                    <Grid item xs={12} sm={6}>
                        <Typography variant="body2" sx={{ mb: 1, fontWeight: 500 }}>
                            Social Security Number
                        </Typography>
                        <TextField
                            label="SSN *"
                            name="ssn"
                            value={form.ssn}
                            onChange={handleChange}
                            fullWidth
                            error={!!errors.ssn}
                            helperText={errors.ssn}
                        />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <Typography variant="body2" sx={{ mb: 1, fontWeight: 500 }}>
                            SSN Document
                        </Typography>
                        <Box
                            sx={{
                                border: "1px dashed #aaa",
                                borderRadius: 2,
                                p: 2,
                                textAlign: "center",
                            }}
                        >
                            <input
                                type="file"
                                accept="image/*,.pdf"
                                onChange={(e) => setSsnDoc(e.target.files?.[0] || null)}
                            />
                            {(ssnDoc || driverData?.ssnDocUrl) && (
                                <img
                                    src={
                                        ssnDoc
                                            ? URL.createObjectURL(ssnDoc)
                                            : driverData.ssnDocUrl
                                    }
                                    alt="SSN Preview"
                                    style={{ width: "100%", marginTop: 8, borderRadius: 8 }}
                                />
                            )}
                        </Box>
                    </Grid>

                    {/* Row 8 */}
                    <Grid item xs={12}>
                        <Typography variant="body2" sx={{ mb: 1, fontWeight: 500 }}>
                            Driver Photo
                        </Typography>
                        <Box
                            sx={{
                                border: "1px dashed #aaa",
                                borderRadius: 2,
                                p: 2,
                                textAlign: "center", display: "flex",
                                justifyContent: "center",
                                alignItems: "center", flexDirection: "column"
                            }}
                        >
                            <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => setDriverPhoto(e.target.files?.[0] || null)}
                            />
                            {(driverPhoto || driverData?.driverPhotoUrl) && (
                                <img
                                    src={
                                        driverPhoto
                                            ? URL.createObjectURL(driverPhoto)
                                            : driverData.driverPhotoUrl
                                    }
                                    alt="Driver Preview"
                                    style={{ width: "30%", marginTop: 8, borderRadius: 8 , height: 300}}
                                />
                            )}
                        </Box>
                    </Grid>
                </Grid>
            </DialogContent>

            <DialogActions>
                <Button onClick={onClose}>
                    Cancel
                </Button>
                <Button
                    variant="contained"
                    color="primary"
                    onClick={handleSave}
                    sx={{ textTransform: "none" }} disabled={loading}
                >
                    {loading ? (
                        <CircularProgress size={20} sx={{ color: theme.palette.primary.main }}/>
                    ) : driverData ? (
                        "Update Driver"
                    ) : (
                        "Save Driver"
                    )}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default DriverModal;
