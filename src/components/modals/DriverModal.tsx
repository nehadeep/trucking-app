import React, { useState,useEffect } from "react";
import {
    Dialog,
    DialogTitle,
    DialogContent,
    TextField,
    MenuItem,
    Button, DialogActions, Typography, Grid,
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
    isValidSSN,
} from "../../utils/validators";

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
    const [form, setForm] = useState({
        fullName: "",
        phone: "",
        email: "",
        address: "",
        licenseNumber: "",
        licenseExpiry: "",
        hireDate: "",
        totalMiles: "",
        status: "Active",
        ssn: "",
    });

    const [errors, setErrors] = useState<any>({});
    const [driverPhoto, setDriverPhoto] = useState<File | null>(null);
    const [licenseFront, setLicenseFront] = useState<File | null>(null);
    const [licenseBack, setLicenseBack] = useState<File | null>(null);
    const [ssnDoc, setSsnDoc] = useState<File | null>(null);

    // Prefill form if editing
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
                totalMiles: driverData.totalMiles || "",
                status: driverData.status || "Active",
                ssn: driverData.ssn || "",
            });
        }
    }, [driverData]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let { name, value } = e.target;
        if (name === "phone") value = formatPhoneNumber(value);
        if (name === "licenseNumber") value = value.toUpperCase();
        setForm({ ...form, [name]: value });
    };

    const validate = () => {
        let newErrors: any = {};
        if (!form.fullName) newErrors.fullName = "Full name is required";
        if (!form.phone || form.phone.length < 14)
            newErrors.phone = "Valid phone number is required";
        if (!form.email || !isValidEmail(form.email))
            newErrors.email = "Enter a valid email";
        if (!form.ssn || !isValidSSN(form.ssn))
            newErrors.ssn = "Enter SSN as ###-##-####";
        if (!form.licenseNumber || !isValidLicenseNumber(form.licenseNumber))
            newErrors.licenseNumber =
                "License number must be uppercase alphanumeric";
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
                // 🔄 Update existing driver
                const driverRef = doc(db, "admins", adminId, "drivers", driverData.id);
                await updateDoc(driverRef, {
                    ...form,
                    totalMiles: Number(form.totalMiles),
                    updatedAt: serverTimestamp(),
                    driverPhotoUrl,
                    licenseFrontUrl,
                    licenseBackUrl,
                    ssnDocUrl,
                });
            } else {
                // ➕ Add new driver
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
            if (onSaved) onSaved(); // refresh parent
        } catch (error) {
            console.error("❌ Error saving driver:", error);
        }
    };

    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
            <DialogTitle>{driverData ? "Edit Driver" : "Add Driver"}</DialogTitle>
            <DialogContent>
                <Grid container spacing={2} sx={{ mt: 1 }} {...({} as any)}>
                    {/* Basic Info */}
                    <Grid item xs={12} sm={6} {...({} as any)}>
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
                    <Grid item xs={12} sm={6} {...({} as any)}>
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

                    <Grid item xs={12} {...({} as any)}>
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

                    <Grid item xs={12} {...({} as any)}>
                        <TextField
                            label="Address"
                            name="address"
                            value={form.address}
                            onChange={handleChange}
                            fullWidth
                            multiline
                            minRows={2}
                        />
                    </Grid>

                    <Grid item xs={12} sm={6} {...({} as any)}>
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
                    <Grid item xs={12} sm={6} {...({} as any)}>
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

                    {/* Dates */}
                    <Grid item xs={12} sm={6} {...({} as any)}>
                        <TextField
                            label="License Expiry"
                            name="licenseExpiry"
                            type="date"
                            value={form.licenseExpiry}
                            onChange={handleChange}
                            fullWidth
                            InputLabelProps={{ shrink: true }}
                        />
                    </Grid>
                    <Grid item xs={12} sm={6} {...({} as any)}>
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

                    {/* Other Info */}
                    <Grid item xs={12} sm={6} {...({} as any)}>
                        <TextField
                            label="Total Miles"
                            name="totalMiles"
                            value={form.totalMiles}
                            onChange={handleChange}
                            fullWidth
                        />
                    </Grid>

                    <Grid item xs={12} sm={6} {...({} as any)}>
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

                    {/* File Uploads with Previews */}
                    <Grid item xs={12} sm={6} {...({} as any)}>
                        <Typography variant="body2" sx={{ mb: 1, fontWeight: 500 }}>
                            Driver Photo
                        </Typography>
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
                                style={{
                                    width: "100%",
                                    marginTop: 8,
                                    borderRadius: 8,
                                    border: "1px solid #ccc",
                                }}
                            />
                        )}
                    </Grid>

                    <Grid item xs={12} sm={6} {...({} as any)}>
                        <Typography variant="body2" sx={{ mb: 1, fontWeight: 500 }}>
                            License Front
                        </Typography>
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
                                alt="License Front Preview"
                                style={{
                                    width: "100%",
                                    marginTop: 8,
                                    borderRadius: 8,
                                    border: "1px solid #ccc",
                                }}
                            />
                        )}
                    </Grid>

                    <Grid item xs={12} sm={6} {...({} as any)}>
                        <Typography variant="body2" sx={{ mb: 1, fontWeight: 500 }}>
                            License Back
                        </Typography>
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
                                alt="License Back Preview"
                                style={{
                                    width: "100%",
                                    marginTop: 8,
                                    borderRadius: 8,
                                    border: "1px solid #ccc",
                                }}
                            />
                        )}
                    </Grid>

                    <Grid item xs={12} sm={6} {...({} as any)}>
                        <Typography variant="body2" sx={{ mb: 1, fontWeight: 500 }}>
                            SSN Document
                        </Typography>
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
                                style={{
                                    width: "100%",
                                    marginTop: 8,
                                    borderRadius: 8,
                                    border: "1px solid #ccc",
                                }}
                            />
                        )}
                    </Grid>
                </Grid>
            </DialogContent>

            <DialogActions>
                <Button onClick={onClose} sx={{ textTransform: "none" }}>Cancel</Button>
                <Button variant="contained" color="primary" onClick={handleSave} sx={{ textTransform: "none" }}>
                    {driverData ? "Update Driver" : "Save Driver"}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default DriverModal;
