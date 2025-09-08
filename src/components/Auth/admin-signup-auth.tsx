// components/auth/AdminSignupAuth.tsx
import React, { useState } from "react";
import {
    Box, Button, Card, CardContent, Grid, Tab, Tabs, TextField, Typography,
    InputAdornment, IconButton, Stack, Paper
} from "@mui/material";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import { useSnackbar } from "notistack";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../../firebaseConfig";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { addDoc, collection, doc, serverTimestamp, setDoc } from "firebase/firestore";
import {
    formatPhoneNumber,
    isValidEmail,
} from "../../utils/validators";

const CONTACT_PHONE = "+1-555-123-4567";
const CONTACT_EMAIL = "hello@drivesphere.com";


const phoneOk = (p: string) => /^\+?[0-9()\-\s]{7,}$/.test(p); // simple but flexible
const isInt = (v: string) => /^\d+$/.test(v);

const AdminSignupAuth: React.FC = () => {
    const { enqueueSnackbar } = useSnackbar();
    const navigate = useNavigate();

    const [tab, setTab] = useState<"request" | "self">("request");

    // Shared / Request tab state
    const [companyName, setCompanyName] = useState("");
    const [dotNumber, setDotNumber] = useState("");
    const [employerNumber, setEmployerNumber] = useState(""); // optional

    // Contact person
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [adminEmail, setAdminEmail] = useState("");
    const [adminPhone, setAdminPhone] = useState("");

    // Self-serve specific
    const [numEmployees, setNumEmployees] = useState(""); // required (self-serve)
    const [password, setPassword] = useState("");
    const [confirm, setConfirm] = useState("");
    const [showPw, setShowPw] = useState(false);
    const [showConfirmPw, setShowConfirmPw] = useState(false);

    // Validation display control
    const [wasSubmittedRequest, setWasSubmittedRequest] = useState(false);
    const [wasSubmittedSelf, setWasSubmittedSelf] = useState(false);
    const [errorsRequest, setErrorsRequest] = useState<Record<string, string>>({});
    const [errorsSelf, setErrorsSelf] = useState<Record<string, string>>({});

    const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let raw = e.target.value.replace(/\D/g, ""); // strip all non-digits

        // Limit to 10 digits max
        if (raw.length > 10) {
            raw = raw.slice(0, 10);
        }
        const formatted = formatPhoneNumber(raw); // your util
        setAdminPhone(formatted);
    };
    // ---------- Validation ----------
    const validateRequestForm = () => {
        const errors: Record<string, string> = {};
        if (!companyName.trim()) errors.companyName = "The company name is required";
        if (!firstName.trim()) errors.firstName = "The first name is required";
        if (!lastName.trim()) errors.lastName = "The last name is required";

        if (!adminEmail.trim() || !isValidEmail(adminEmail)) errors.adminEmail = "A valid email is required";
        if (!adminPhone.trim() || !phoneOk(adminPhone)) errors.adminPhone = "A valid phone is required";
        return errors;
    };

    const validateSelfServeForm = () => {
        const errors: Record<string, string> = {};
        if (!companyName.trim()) errors.companyName = "The company name is required";
        if (!dotNumber.trim()) errors.dotNumber = "The dot name is required";
        if (!numEmployees.trim() || !isInt(numEmployees)) errors.numEmployees = "Please Enter a whole number of employees";
        if (!firstName.trim()) errors.firstName = "The first name is required";
        if (!lastName.trim()) errors.lastName = "The last name is required";
        if (!adminEmail.trim() || !isValidEmail(adminEmail)) errors.adminEmail = "A valid email is required";
        if (password.length < 6) errors.password = "Password must be at least 6 characters";
        if (confirm !== password) errors.confirm = "Passwords do not match";
        // Phone optional: validate only if provided
        if (adminPhone && !phoneOk(adminPhone)) errors.adminPhone = "Please Enter a valid phone number";
        return errors;
    };

    // ---------- Actions ----------
    const submitCompanyRequest = async () => {
        setWasSubmittedRequest(true);
        const errs = validateRequestForm();
        setErrorsRequest(errs);
        if (Object.keys(errs).length > 0) {
            enqueueSnackbar(Object.values(errs)[0], { variant: "error" });
            return;
        }

        try {
            await addDoc(collection(db, "company_requests"), {
                companyName,
                dotNumber: dotNumber || null,
                employerNumber: employerNumber || null,
                requestedBy: {
                    firstName,
                    lastName: lastName || null,
                    email: adminEmail,
                    phone: adminPhone,
                },
                status: "pending",
                createdAt: serverTimestamp(),
            });

            enqueueSnackbar("Request submitted. Our team will contact you shortly.", { variant: "success" });
            // optional: reset request fields
            // setCompanyName(""); setDotNumber(""); setEmployerNumber("");
            // setFirstName(""); setLastName(""); setAdminEmail(""); setAdminPhone("");
            // setWasSubmittedRequest(false); setErrorsRequest({});
        } catch (e: any) {
            enqueueSnackbar("Failed to submit request.", { variant: "error" });
        }
    };

    const handleSelfServeSignup = async () => {
        setWasSubmittedSelf(true);
        const errs = validateSelfServeForm();
        setErrorsSelf(errs);
        if (Object.keys(errs).length > 0) {
            enqueueSnackbar(Object.values(errs)[0], { variant: "error" });
            return;
        }

        try {
            // 1) Create admin auth user
            const { user } = await createUserWithEmailAndPassword(auth, adminEmail, password);

            // 2) Create company doc
            const companyDoc = await addDoc(collection(db, "companies"), {
                name: companyName,
                dotNumber: dotNumber || null,
                employerNumber: employerNumber || null,
                numEmployees: Number(numEmployees),
                createdAt: serverTimestamp(),
                createdByUid: user.uid,
            });

            // 3) Create admin profile (role = admin)
            await setDoc(doc(db, "admins", user.uid), {
                uid: user.uid,
                role: "admin",
                firstName,
                lastName,
                email: adminEmail,
                phone: adminPhone || null,
                companyId: companyDoc.id,
                createdAt: serverTimestamp(),
            });

            enqueueSnackbar("Admin account created. Redirecting to your console…", { variant: "success" });
            navigate("/console/admin");
        } catch (error: any) {
            const map: Record<string, string> = {
                "auth/email-already-in-use": "This email is already in use.",
                "auth/invalid-email": "Invalid email address.",
                "auth/weak-password": "Password must be at least 6 characters.",
            };
            enqueueSnackbar(map[error?.code] || "Failed to create account.", { variant: "error" });
        }
    };

    return (
        <Box display="flex" justifyContent="center" alignItems="start" minHeight="100vh" bgcolor="#f4f6f8" py={8}>
            <Card sx={{ width: 780, p: 2, borderRadius: 3, boxShadow: 3 }}>
                <CardContent>
                    {/* Header (matches Superadmin header style) */}
                    <Box textAlign="center" mb={2}>
                        <img src="/logo.png" alt="Drive Sphere" style={{ width: 60, height: 60 }} />
                        <Typography variant="h5" fontWeight="bold" mt={1}>
                            Welcome to DriveSphere
                        </Typography>
                        <Typography variant="caption" color="text.secondary" display="block" mt={0.5}>
                            Manage your fleet, drivers, and expenses all in one place
                        </Typography>
                        <Typography variant="body2" color="text.secondary" mt={0.5}>
                            Sign Up to continue
                        </Typography>
                    </Box>

                    {/* Tabs */}
                    <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }} variant="fullWidth">
                        <Tab value="request" label="Submit request to DriveSphere" />
                        <Tab value="self" label="Create account for immediate access" />
                    </Tabs>

                    {/* TAB 1: Submit request */}
                    {tab === "request" && (
                        <Stack spacing={2}>
                            <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                                <Typography variant="subtitle1" fontWeight={700} gutterBottom>
                                    Company Admin — Request Access
                                </Typography>
                                <Typography variant="body2" color="text.secondary" gutterBottom>
                                    Tell us about your company. We’ll review and activate your admin access.
                                </Typography>

                                <Grid container spacing={2}>
                                    <Grid item xs={12} md={6}>
                                        <TextField
                                            fullWidth
                                            required
                                            label="Company Name *"
                                            value={companyName}
                                            onChange={(e) => setCompanyName(e.target.value)}
                                            error={wasSubmittedRequest && !!errorsRequest.companyName}
                                            helperText={wasSubmittedRequest ? (errorsRequest.companyName || "") : ""}
                                        />
                                    </Grid>

                                    <Grid item xs={12} md={6}>
                                        <TextField
                                            fullWidth
                                            label="USDOT Number (optional)"
                                            value={dotNumber}
                                            onChange={(e) => setDotNumber(e.target.value)}
                                        />
                                    </Grid>

                                    <Grid item xs={12} md={6}>
                                        <TextField
                                            fullWidth
                                            label="Employer Number (optional)"
                                            value={employerNumber}
                                            onChange={(e) => setEmployerNumber(e.target.value)}
                                        />
                                    </Grid>

                                    <Grid item xs={12} md={6}>
                                        <TextField
                                            fullWidth
                                            required
                                            label="First Name *"
                                            value={firstName}
                                            onChange={(e) => setFirstName(e.target.value)}
                                            error={wasSubmittedRequest && !!errorsRequest.firstName}
                                            helperText={wasSubmittedRequest ? (errorsRequest.firstName || "") : ""}
                                        />
                                    </Grid>

                                    <Grid item xs={12} md={6}>
                                        <TextField
                                            fullWidth
                                            required
                                            label="Last Name *"
                                            value={lastName}
                                            onChange={(e) => setLastName(e.target.value)}
                                            error={wasSubmittedRequest && !!errorsRequest.lastName}
                                            helperText={wasSubmittedRequest ? (errorsRequest.lastName || "") : ""}
                                        />
                                    </Grid>

                                    <Grid item xs={12} md={6}>
                                        <TextField
                                            fullWidth
                                            required
                                            label="Contact Email *"
                                            value={adminEmail}
                                            onChange={(e) => setAdminEmail(e.target.value)}
                                            error={wasSubmittedRequest && !!errorsRequest.adminEmail}
                                            helperText={wasSubmittedRequest ? (errorsRequest.adminEmail || "") : ""}
                                        />
                                    </Grid>

                                    <Grid item xs={12} md={6}>
                                        <TextField
                                            fullWidth
                                            required
                                            label="Contact Phone *"
                                            value={adminPhone}
                                            onChange={handlePhoneChange}
                                            inputProps={{ inputMode: "numeric" }} // mobile keyboards show digits
                                            error={wasSubmittedRequest && !!errorsRequest.adminPhone}
                                            helperText={wasSubmittedRequest ? (errorsRequest.adminPhone || "") : ""}
                                        />
                                    </Grid>
                                </Grid>

                                <Stack direction="column" spacing={1.5} alignItems="center" sx={{ mt: 2 }}>
                                    <Button
                                        variant="contained"
                                        onClick={submitCompanyRequest}
                                        sx={{ width: "100%", maxWidth: 300 }}
                                    >
                                        Submit request
                                    </Button>

                                    <Button
                                        variant="outlined"
                                        fullWidth
                                        sx={{ maxWidth: 300 }}
                                        onClick={() => (window.location.href = `tel:${CONTACT_PHONE}`)}
                                    >
                                        Call {CONTACT_PHONE}
                                    </Button>
                                </Stack>
                            </Paper>
                        </Stack>
                    )}

                    {/* TAB 2: Self-serve admin signup */}
                    {tab === "self" && (
                        <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                            <Typography variant="subtitle1" fontWeight={700} gutterBottom>
                                Create your company & admin account (instant access)
                            </Typography>

                            <Grid container spacing={2}>
                                {/* Company */}
                                <Grid item xs={12} md={6}>
                                    <TextField
                                        fullWidth
                                        required
                                        label="Company Name *"
                                        value={companyName}
                                        onChange={(e) => setCompanyName(e.target.value)}
                                        error={wasSubmittedSelf && !!errorsSelf.companyName}
                                        helperText={wasSubmittedSelf ? (errorsSelf.companyName || "") : ""}
                                    />
                                </Grid>
                                <Grid item xs={12} md={3}>
                                    <TextField
                                        fullWidth
                                        required
                                        label="USDOT Number *"
                                        value={dotNumber}
                                        onChange={(e) => setDotNumber(e.target.value)}
                                        error={wasSubmittedSelf && !!errorsSelf.dotNumber}
                                        helperText={wasSubmittedSelf ? (errorsSelf.dotNumber || "") : ""}
                                    />
                                </Grid>
                                <Grid item xs={12} md={3}>
                                    <TextField
                                        fullWidth
                                        label="Employer Number (optional)"
                                        value={employerNumber}
                                        onChange={(e) => setEmployerNumber(e.target.value)}
                                    />
                                </Grid>
                                <Grid item xs={12} md={4}>
                                    <TextField
                                        fullWidth
                                        required
                                        label="Number of Employees *"
                                        value={numEmployees}
                                        onChange={(e) => setNumEmployees(e.target.value)}
                                        inputProps={{ inputMode: "numeric", pattern: "\\d*" }}
                                        error={wasSubmittedSelf && !!errorsSelf.numEmployees}
                                        helperText={wasSubmittedSelf ? (errorsSelf.numEmployees || "") : ""}
                                    />
                                </Grid>

                                {/* Admin user */}
                                <Grid item xs={12} md={4}>
                                    <TextField
                                        fullWidth
                                        required
                                        label="First Name *"
                                        value={firstName}
                                        onChange={(e) => setFirstName(e.target.value)}
                                        error={wasSubmittedSelf && !!errorsSelf.firstName}
                                        helperText={wasSubmittedSelf ? (errorsSelf.firstName || "") : ""}
                                    />
                                </Grid>
                                <Grid item xs={12} md={4}>
                                    <TextField
                                        fullWidth
                                        required
                                        label="Last Name *"
                                        value={lastName}
                                        onChange={(e) => setLastName(e.target.value)}
                                        error={wasSubmittedSelf && !!errorsSelf.lastName}
                                        helperText={wasSubmittedSelf ? (errorsSelf.lastName || "") : ""}
                                    />
                                </Grid>
                                <Grid item xs={12} md={6}>
                                    <TextField
                                        fullWidth
                                        required
                                        label="Company Email *"
                                        value={adminEmail}
                                        onChange={(e) => setAdminEmail(e.target.value)}
                                        error={wasSubmittedSelf && !!errorsSelf.adminEmail}
                                        helperText={wasSubmittedSelf ? (errorsSelf.adminEmail || "") : ""}
                                    />
                                </Grid>
                                <Grid item xs={12} md={6}>
                                    <TextField
                                        fullWidth
                                        required
                                        label="Phone"
                                        value={adminPhone}
                                        onChange={handlePhoneChange}
                                        inputProps={{ inputMode: "numeric" }} // mobile keyboards show digits
                                        error={wasSubmittedSelf && !!errorsSelf.adminPhone}
                                        helperText={wasSubmittedSelf ? (errorsSelf.adminPhone || "") : ""}
                                    />
                                </Grid>
                                <Grid item xs={12} md={6}>
                                    <TextField
                                        fullWidth
                                        required
                                        label="Password *"
                                        type={showPw ? "text" : "password"}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        error={wasSubmittedSelf && !!errorsSelf.password}
                                        helperText={wasSubmittedSelf ? (errorsSelf.password || "") : ""}
                                        InputProps={{
                                            endAdornment: (
                                                <InputAdornment position="end">
                                                    <IconButton onClick={() => setShowPw((s) => !s)} edge="end">
                                                        {showPw ? <VisibilityOff /> : <Visibility />}
                                                    </IconButton>
                                                </InputAdornment>
                                            ),
                                        }}
                                    />
                                </Grid>
                                <Grid item xs={12} md={6}>
                                    <TextField
                                        fullWidth
                                        required
                                        label="Confirm Password *"
                                        type={showConfirmPw ? "text" : "password"}
                                        value={confirm}
                                        onChange={(e) => setConfirm(e.target.value)}
                                        error={wasSubmittedSelf && !!errorsSelf.confirm}
                                        helperText={wasSubmittedSelf ? (errorsSelf.confirm || "") : ""}
                                        InputProps={{
                                            endAdornment: (
                                                <InputAdornment position="end">
                                                    <IconButton onClick={() => setShowConfirmPw((s) => !s)} edge="end">
                                                        {showConfirmPw ? <VisibilityOff /> : <Visibility />}
                                                    </IconButton>
                                                </InputAdornment>
                                            ),
                                        }}
                                    />
                                </Grid>
                            </Grid>

                            <Stack direction="column" spacing={1.5} sx={{ mt: 2 }}>
                                <Button variant="contained" onClick={handleSelfServeSignup}>
                                    Create my company & admin account
                                </Button>
                                <Button variant="text" onClick={() => setTab("request")}>
                                    Prefer DriveSphere to set it up? Submit a request
                                </Button>
                            </Stack>
                        </Paper>
                    )}

                    <Box textAlign="center" mt={3}>
                        <Typography
                            variant="body2"
                            color="primary"
                            sx={{ cursor: "pointer" }}
                            onClick={() => navigate("/")}
                        >
                            Already have an account? Login instead
                        </Typography>
                    </Box>
                </CardContent>
            </Card>
        </Box>
    );
};

export default AdminSignupAuth;
