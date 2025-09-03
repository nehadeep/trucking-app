import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    Box,
    Button,
    Card,
    CardContent,
    Divider,
    Tab,
    Tabs,
    TextField,
    Typography, IconButton, InputAdornment
} from "@mui/material";
import GoogleIcon from "@mui/icons-material/Google";
import { useSnackbar } from "notistack";
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    RecaptchaVerifier,
    signInWithPhoneNumber,
    GoogleAuthProvider,
    signInWithPopup, fetchSignInMethodsForEmail
} from "firebase/auth";
import { auth } from "../firebaseConfig";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { db } from "../firebaseConfig";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";


const Auth: React.FC = () => {
    const navigate = useNavigate();

    const { enqueueSnackbar } = useSnackbar();

    const [mode, setMode] = useState<"email" | "phone">("email");
    const [isSignup, setIsSignup] = useState(false);

    // Email/password state
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    // Phone login state
    const [phone, setPhone] = useState("");
    const [otp, setOtp] = useState("");
    const [confirmationResult, setConfirmationResult] = useState<any>(null);
    const [showPassword, setShowPassword] = useState(false);


    const validateEmail = (email: string) => {
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return regex.test(email);
    };

    const validatePassword = (password: string) => {
        return password.length >= 6; // Firebase minimum
        // You can add more rules: e.g. /^(?=.*[A-Z])(?=.*\d).{6,}$/ for uppercase+number
    };


    // Email/Password auth
    const handleEmailAuth = async () => {
        try {
            if (isSignup) {
                // ✅ Frontend validation
                if (!validateEmail(email)) {
                    enqueueSnackbar("Please enter a valid email address ❌", { variant: "error" });
                    return;
                }
                if (!validatePassword(password)) {
                    enqueueSnackbar("Password must be at least 6 characters ❌", { variant: "error" });
                    return;
                }


                const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                const user = userCredential.user;

                type SuperAdmin = {
                    email: string | null;
                    role: string;
                    createdAt: Date;
                };

                const superAdminConverter = {
                    toFirestore: (data: SuperAdmin) => data,
                    fromFirestore: (snap: any) => snap.data() as SuperAdmin,
                };
                // Then use it:
                const ref = doc(db, "superadmin", user.uid).withConverter(superAdminConverter);

                await setDoc(ref, {
                    email: user.email,
                    role: "admin",
                    createdAt: new Date(),
                });

                enqueueSnackbar(`${user.email} registered successfully. Please Sign In Now.`, { variant: "success" });
                setIsSignup(false);

            } else {
                // const methods = await fetchSignInMethodsForEmail(auth, email);
                // console.log("mehodas email", methods)
                // if (!methods || methods.length === 0) {
                //     enqueueSnackbar("This email is not registered. Please Sign Up first.", { variant: "error" });
                //     return;
                // }

                const userCredential = await signInWithEmailAndPassword(auth, email, password);
                const user = userCredential.user;

                // 🔍 Check Firestore for superadmin role
                const docRef = doc(db, "superadmin", user.uid); //this only pulls
                const snap = await getDoc(docRef);
                console.log("snap data", snap)

                if (snap.exists() && snap.data().role === "superadmin") {
                    enqueueSnackbar("Superadmin login successful ✅", { variant: "success" });

                    navigate("/console/superadmin");
                }  else if (snap.exists() && snap.data().role === "admin") {
                    enqueueSnackbar("Admin login successful ✅", { variant: "success" });

                    navigate("/console/admin");
                } else {
                    enqueueSnackbar("You are not authorized as superadmin, admin or Driver ❌", { variant: "error" });
                    await auth.signOut();
                }
            }
        } catch (error:any) {
            switch (error.code) {
                case "auth/invalid-email":
                    enqueueSnackbar("Invalid email format ❌", { variant: "error" });
                    break;
                case "auth/weak-password":
                    enqueueSnackbar("Password must be at least 6 characters ❌", { variant: "error" });
                    break;
                case "auth/wrong-password":
                    enqueueSnackbar("Incorrect password ❌", { variant: "error" });
                    break;
                case "auth/user-not-found":
                    enqueueSnackbar("This email is not registered ❌", { variant: "error" });
                    break;
                case "auth/email-already-in-use":
                    enqueueSnackbar("This email is already registered ❌", { variant: "error" });
                    break;
                default:
                    enqueueSnackbar("Something went wrong, try again ❌", { variant: "error" });
            }
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

    // Google Login
    const handleGoogleAuth = async () => {
        try {
            const provider = new GoogleAuthProvider();
            await signInWithPopup(auth, provider);
            enqueueSnackbar("Logged in with Google ✅", { variant: "success" });
        } catch (error) {
            console.error(error);
            enqueueSnackbar("Google login failed ❌", { variant: "error" });
        }
    };



    return (
        <Box
            display="flex"
            justifyContent="center"
            alignItems="center"
            minHeight="100vh"
            bgcolor="#f4f6f8"
        >
            <Card sx={{ width: 380, p: 2, borderRadius: 3, boxShadow: 3 }}>
                <CardContent>
                    {/* Logo + Heading */}
                    <Box textAlign="center" mb={2}>
                        <img src="/logo.png" alt="FleetPro" style={{ width: 60, height: 60 }} />
                        <Typography variant="h5" fontWeight="bold" mt={1}>
                            Welcome to FleetPro
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Sign in to continue
                        </Typography>
                    </Box>

                    {/* Google login */}
                    <Button
                        fullWidth
                        variant="outlined"
                        startIcon={<GoogleIcon />}
                        sx={{ mb: 2, textTransform: "none" }}
                        onClick={handleGoogleAuth}
                    >
                        Continue with Google
                    </Button>

                    <Divider sx={{ my: 2 }}>OR</Divider>

                    {/* Toggle Email/Phone */}
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
                                onClick={handleEmailAuth}
                            >
                                {isSignup ? "Sign Up" : "Sign In"}
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
                                {isSignup? "Verify & Sign Up": "Verify & Sign In"}
                            </Button>
                            <div id="recaptcha-container"></div>
                        </>
                    )}

                    {/* Footer */}
                    <Box
                        textAlign="center"
                        mt={2}
                        sx={{ cursor: "pointer" }}
                        onClick={() => setIsSignup(!isSignup)}
                    >
                        <Typography variant="body2" color="primary">
                            {isSignup
                                ? "Already have an account? Login"
                                : "Need an account? Sign up"}
                        </Typography>
                    </Box>

                    <Box display="flex" justifyContent="space-between" mt={2}>
                        <Typography variant="body2" color="primary" sx={{ cursor: "pointer" }}>
                            Forgot password?
                        </Typography>
                    </Box>
                </CardContent>
            </Card>
        </Box>
    );
};

export default Auth;
