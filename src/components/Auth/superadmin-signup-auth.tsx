// components/auth/SuperadminSignupAuth.tsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    Box, Button, Card, CardContent, TextField, Typography, IconButton, InputAdornment, Tabs, Tab
} from "@mui/material";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import { useSnackbar } from "notistack";
import {createUserWithEmailAndPassword, RecaptchaVerifier, signInWithPhoneNumber} from "firebase/auth";
import { auth, db } from "../../firebaseConfig";
import {doc, getDoc, setDoc} from "firebase/firestore";

const SuperadminSignupAuth: React.FC = () => {
    const navigate = useNavigate();
    const { enqueueSnackbar } = useSnackbar();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [mode, setMode] = useState<"email" | "phone">("email");
    const [phone, setPhone] = useState("");
    const [otp, setOtp] = useState("");
    const [confirmationResult, setConfirmationResult] = useState<any>(null);


    const validateEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
    const validatePassword = (p: string) => p.length >= 6;
    // Step 1: Send OTP
    const sendOtp = async () => {
        try {
            // 🔍 Check if phone exists in Firestore (e.g., in "drivers" collection)
            const driverRef = doc(db, "drivers", phone);
            const driverSnap = await getDoc(driverRef);

            if (!driverSnap.exists()) {
                enqueueSnackbar("This phone number is not registered ❌", {variant: "error"});
                return; // stop here, don't send OTP
            }

            setupRecaptcha();

            const appVerifier = (window as any).recaptchaVerifier;
            const result = await signInWithPhoneNumber(auth, phone, appVerifier);
            setConfirmationResult(result);
            enqueueSnackbar("OTP sent to phone ✅", {variant: "success"});
        } catch (error) {
            console.error(error);
            enqueueSnackbar("Failed to send OTP ❌", {variant: "error"});
        }
    };

    // Setup reCAPTCHA verifier for phone login
    const setupRecaptcha = () => {
        if (!(window as any).recaptchaVerifier) {
            (window as any).recaptchaVerifier = new RecaptchaVerifier(
                auth,
                "recaptcha-container",
                {
                    size: "invisible",
                    callback: () => console.log("reCAPTCHA solved"),
                }
            );
        }
    };

    // Step 2: Verify OTP
    const verifyOtp = async () => {
        try {
            if (confirmationResult) {
                await confirmationResult.confirm(otp);
                enqueueSnackbar("Phone verified & user logged in ✅", { variant: "success" });
            }
        } catch (error:any) {
            console.error(error);
            enqueueSnackbar("Invalid OTP ❌", { variant: "error" });
            switch (error.code) {
                case "auth/invalid-verification-code":
                    enqueueSnackbar("Invalid OTP ❌", { variant: "error" });
                    break;
                case "auth/invalid-phone-number":
                    enqueueSnackbar("Phone number format is incorrect ❌", { variant: "error" });
                    break;
                default:
                    enqueueSnackbar("Failed to verify phone ❌", { variant: "error" });
            }
        }
    };

    // 👇 separate function
    const handleAlreadyHaveAccountClick = () => {
        localStorage.setItem("fromSuperadminLogin", "true");
        navigate("/");
    };

    const handleSignup = async () => {
        try {
            if (!validateEmail(email)) return enqueueSnackbar("Please enter a valid email.", { variant: "error" });
            if (!validatePassword(password)) return enqueueSnackbar("Password must be at least 6 characters.", { variant: "error" });

            const { user } = await createUserWithEmailAndPassword(auth, email, password);
            await setDoc(doc(db, "superadmin", user.uid), {
                email: user.email,
                role: "superadmin",
                createdAt: new Date(),
                company_name: "Drive Sphere"
            });

            enqueueSnackbar("Superadmin registered. You can now log in.", { variant: "success" });
            navigate("/"); // they’ll use / to login or you can push to /console/superadmin after you add login
        } catch (e: any) {
            enqueueSnackbar("Signup failed.", { variant: "error" });
        }
    };

    return (
        <Box display="flex" justifyContent="center" alignItems="start" minHeight="100vh" bgcolor="#f4f6f8" py={8}>
            <Card sx={{ width: 420, p: 2, borderRadius: 3, boxShadow: 3 }}>
                <CardContent>
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

                    <Tabs
                        value={mode}
                        onChange={(_, val) => setMode(val)}
                        variant="fullWidth"
                        sx={{ mb: 2 }}
                    >
                        <Tab label="Email" value="email" />
                        <Tab label="Phone" value="phone" />
                    </Tabs>

                    {/* Email form */}
                    {mode === "email" && (
                        <>
                            <TextField
                                fullWidth
                                label="Email"
                                type="email"
                                margin="normal"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                            <TextField
                                fullWidth
                                label="Password"
                                type={showPassword ? "text" : "password"}
                                margin="normal"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                InputProps={{
                                    endAdornment: (
                                        <InputAdornment position="end">
                                            <IconButton
                                                aria-label="toggle password visibility"
                                                onClick={() => setShowPassword(!showPassword)}
                                                edge="end"
                                            >
                                                {showPassword ? <VisibilityOff /> : <Visibility />}
                                            </IconButton>
                                        </InputAdornment>
                                    ),
                                }}
                            />
                            <Button
                                fullWidth
                                variant="contained"
                                sx={{ mt: 2 }}
                                onClick={handleSignup}
                            >
                                Create Superadmin Account
                            </Button>

                        </>
                    )}

                    {/* Phone form */}
                    {mode === "phone" && (
                        <>
                            <TextField
                                fullWidth
                                label="Phone number"
                                placeholder="+1 555 555 5555"
                                margin="normal"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                            />
                            <Button fullWidth variant="outlined" onClick={sendOtp}>
                                Send OTP
                            </Button>
                            <TextField
                                fullWidth
                                label="OTP"
                                placeholder="Enter OTP"
                                margin="normal"
                                value={otp}
                                onChange={(e) => setOtp(e.target.value)}
                            />
                            <Button fullWidth variant="contained" sx={{ mt: 1 }} onClick={verifyOtp}>
                                Create Superadmin Account
                            </Button>
                            <div id="recaptcha-container"></div>
                        </>
                    )}

                    {/* Footer */}
                    <Box
                        textAlign="center"
                        mt={2}
                        sx={{ cursor: "pointer" }}

                    >
                        <Typography variant="body2" color="primary"  sx={{ cursor: "pointer" }} onClick={handleAlreadyHaveAccountClick}>

                            Already have an account? Login

                        </Typography>
                    </Box>



                </CardContent>
            </Card>
        </Box>
    );
};

export default SuperadminSignupAuth;
