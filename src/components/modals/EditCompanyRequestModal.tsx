// components/modals/EditCompanyRequestModal.tsx
import React, { useEffect, useState } from "react";
import {
    Box,
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Grid,
    TextField,
} from "@mui/material";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../../firebaseConfig";
import { useSnackbar } from "notistack";
import {useTheme} from "@mui/material/styles";

type Address = {
    address1?: string;
    address2?: string | null;
    city?: string;
    state?: string;
    zip?: string;
    country?: string;
};

type RequestedBy = {
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
};

export type CompanyRequest = {
    id: string;
    companyName: string;
    dotNumber?: string;
    employerIdentificationNumber?: string;
    numEmployees?: number;
    address?: Address;
    requestedBy?: RequestedBy;
    status: string;
};

type Props = {
    open: boolean;
    onClose: () => void;
    request: CompanyRequest | null;
};

const EditCompanyRequestModal: React.FC<Props> = ({ open, onClose, request }) => {
    const { enqueueSnackbar } = useSnackbar();
    const theme = useTheme();
    const [form, setForm] = useState<CompanyRequest | null>(null);

    useEffect(() => {
        if (request) {
            setForm({ ...request }); // clone so edits don’t mutate original
        }
    }, [request]);

    if (!form) return null;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;

        if (name.startsWith("address.")) {
            const addrField = name.replace("address.", "");
            setForm((prev) => ({
                ...prev!,
                address: { ...prev!.address, [addrField]: value },
            }));
        } else if (name.startsWith("requestedBy.")) {
            const contactField = name.replace("requestedBy.", "");
            setForm((prev) => ({
                ...prev!,
                requestedBy: { ...prev!.requestedBy, [contactField]: value },
            }));
        } else {
            setForm((prev) => ({ ...prev!, [name]: value }));
        }
    };

    const handleSave = async () => {
        if (!form?.id) return;
        try {
            await updateDoc(doc(db, "company_requests", form.id), {
                companyName: form.companyName,
                dotNumber: form.dotNumber || null,
                employerIdentificationNumber: form.employerIdentificationNumber || null,
                numEmployees: form.numEmployees ? Number(form.numEmployees) : null,
                address: form.address || {},
                requestedBy: form.requestedBy || {},
            });
            enqueueSnackbar("Company request updated ✅", { variant: "success" });
            onClose();
        } catch (err) {
            console.error("Update failed:", err);
            enqueueSnackbar("Failed to update company request ❌", { variant: "error" });
        }
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle sx={{
                bgcolor: theme.palette.primary.main,
                color: theme.palette.primary.contrastText,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
            }}>Edit Company Detail</DialogTitle>
            <DialogContent>
                <Box mt={2}>
                    <Grid container spacing={2}>
                        {/* Company */}
                        <Grid item xs={12} md={3}>
                            <TextField
                                fullWidth
                                name="companyName"
                                label="Company Name"
                                value={form.companyName}
                                onChange={handleChange}
                            />
                        </Grid>
                        <Grid item xs={12} md={3}>
                            <TextField
                                fullWidth
                                name="dotNumber"
                                label="USDOT Number"
                                value={form.dotNumber || ""}
                                onChange={handleChange}
                            />
                        </Grid>
                        <Grid item xs={12} md={3}>
                            <TextField
                                fullWidth
                                name="employerIdentificationNumber"
                                label="EIN"
                                value={form.employerIdentificationNumber || ""}
                                onChange={handleChange}
                            />
                        </Grid>
                        <Grid item xs={12} md={3}>
                            <TextField
                                fullWidth
                                name="numEmployees"
                                label="Number of Employees"
                                value={form.numEmployees || ""}
                                onChange={handleChange}
                            />
                        </Grid>

                        {/* Address */}
                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                name="address.address1"
                                label="Address Line 1"
                                value={form.address?.address1 || ""}
                                onChange={handleChange}
                            />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                name="address.address2"
                                label="Address Line 2"
                                value={form.address?.address2 || ""}
                                onChange={handleChange}
                            />
                        </Grid>
                        <Grid item xs={12} md={4}>
                            <TextField
                                fullWidth
                                name="address.city"
                                label="City"
                                value={form.address?.city || ""}
                                onChange={handleChange}
                            />
                        </Grid>
                        <Grid item xs={12} md={4}>
                            <TextField
                                fullWidth
                                name="address.state"
                                label="State"
                                value={form.address?.state || ""}
                                onChange={handleChange}
                            />
                        </Grid>
                        <Grid item xs={12} md={4}>
                            <TextField
                                fullWidth
                                name="address.zip"
                                label="Zip"
                                value={form.address?.zip || ""}
                                onChange={handleChange}
                            />
                        </Grid>

                        {/* Contact */}
                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                name="requestedBy.firstName"
                                label="Contact First Name"
                                value={form.requestedBy?.firstName || ""}
                                onChange={handleChange}
                            />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                name="requestedBy.lastName"
                                label="Contact Last Name"
                                value={form.requestedBy?.lastName || ""}
                                onChange={handleChange}
                            />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                name="requestedBy.email"
                                label="Contact Email"
                                value={form.requestedBy?.email || ""}
                                onChange={handleChange}
                            />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                name="requestedBy.phone"
                                label="Contact Phone"
                                value={form.requestedBy?.phone || ""}
                                onChange={handleChange}
                            />
                        </Grid>
                    </Grid>
                </Box>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Cancel</Button>
                <Button onClick={handleSave} variant="contained">
                    Update
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default EditCompanyRequestModal;
