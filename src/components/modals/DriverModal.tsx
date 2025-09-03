import React, { useState } from "react";
import {
    Dialog,
    DialogTitle,
    DialogContent,
    TextField,
    MenuItem,
    Button,
} from "@mui/material";
import { db, storage } from "../../firebaseConfig"; // adjust path
import { collection, addDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

interface AddDriverModalProps {
    open: boolean;
    onClose: () => void;
    adminId: string; // parent admin UID
}

const DriverModal: React.FC<AddDriverModalProps> = ({ open, onClose, adminId }) => {
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

    const [driverPhoto, setDriverPhoto] = useState<File | null>(null);
    const [licenseFront, setLicenseFront] = useState<File | null>(null);
    const [licenseBack, setLicenseBack] = useState<File | null>(null);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const uploadFile = async (file: File, path: string) => {
        const fileRef = ref(storage, `${adminId}/drivers/${form.licenseNumber}/${path}`);
        await uploadBytes(fileRef, file);
        return await getDownloadURL(fileRef);
    };

    const handleSave = async () => {
        try {
            let driverPhotoUrl = "";
            let licenseFrontUrl = "";
            let licenseBackUrl = "";

            if (driverPhoto) driverPhotoUrl = await uploadFile(driverPhoto, "driverPhoto");
            if (licenseFront) licenseFrontUrl = await uploadFile(licenseFront, "licenseFront");
            if (licenseBack) licenseBackUrl = await uploadFile(licenseBack, "licenseBack");

            await addDoc(collection(db, "admins", adminId, "drivers"), {
                ...form,
                totalMiles: Number(form.totalMiles),
                createdAt: new Date(),
                driverPhotoUrl,
                licenseFrontUrl,
                licenseBackUrl,
            });

            onClose();
        } catch (error) {
            console.error("Error saving driver:", error);
        }
    };

    return (
        <Dialog open={open} onClose={onClose} fullWidth>
            <DialogTitle>Add Driver</DialogTitle>
            <DialogContent>
                <TextField fullWidth margin="dense" label="Full Name" name="fullName" value={form.fullName} onChange={handleChange} />
                <TextField fullWidth margin="dense" label="Phone" name="phone" value={form.phone} onChange={handleChange} />
                <TextField fullWidth margin="dense" label="Email" name="email" value={form.email} onChange={handleChange} />
                <TextField fullWidth margin="dense" label="Address" name="address" value={form.address} onChange={handleChange} />
                <TextField fullWidth margin="dense" label="SSN" name="ssn" value={form.ssn} onChange={handleChange} />

                <TextField fullWidth margin="dense" label="License Number" name="licenseNumber" value={form.licenseNumber} onChange={handleChange} />
                <TextField fullWidth margin="dense" type="date" label="License Expiry" name="licenseExpiry" InputLabelProps={{ shrink: true }} value={form.licenseExpiry} onChange={handleChange} />
                <TextField fullWidth margin="dense" type="date" label="Hire Date" name="hireDate" InputLabelProps={{ shrink: true }} value={form.hireDate} onChange={handleChange} />
                <TextField fullWidth margin="dense" label="Total Miles" name="totalMiles" value={form.totalMiles} onChange={handleChange} />

                <TextField select fullWidth margin="dense" label="Status" name="status" value={form.status} onChange={handleChange}>
                    <MenuItem value="Active">Active</MenuItem>
                    <MenuItem value="On Trip">On Trip</MenuItem>
                    <MenuItem value="Inactive">Inactive</MenuItem>
                </TextField>

                <div style={{ marginTop: 16 }}>
                    <label>Driver Photo:</label>
                    <input type="file" accept="image/*" onChange={(e) => setDriverPhoto(e.target.files?.[0] || null)} />
                    <label>License Front:</label>
                    <input type="file" accept="image/*" onChange={(e) => setLicenseFront(e.target.files?.[0] || null)} />
                    <label>License Back:</label>
                    <input type="file" accept="image/*" onChange={(e) => setLicenseBack(e.target.files?.[0] || null)} />
                </div>

                <Button variant="contained" color="primary" fullWidth style={{ marginTop: 16 }} onClick={handleSave}>
                    Save Driver
                </Button>
            </DialogContent>
        </Dialog>
    );
};

export default DriverModal;
