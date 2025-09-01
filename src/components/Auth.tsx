import React, { useState } from "react";
import { auth } from "../firebaseConfig";
import {
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    RecaptchaVerifier,
    signInWithPhoneNumber,
    GoogleAuthProvider,
    signInWithPopup
} from "firebase/auth";

import {
    Box,
    Button,
    Card,
    CardContent,
    Divider,
    Tab,
    Tabs,
    TextField,
    Typography,
} from "@mui/material";
import GoogleIcon from "@mui/icons-material/Google";


const Auth: React.FC = () => {
    const [mode, setMode] = useState<"email" | "phone">("email"); // switch between email/phone login
    const [isSignup, setIsSignup] = useState(false);

    // Email/password state
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    // Phone login state
    const [phone, setPhone] = useState("");
    const [otp, setOtp] = useState("");
    const [confirmationResult, setConfirmationResult] = useState<any>(null);

    // Email/Password auth
    const handleEmailAuth = async () => {
        try {
            if (isSignup) {
                await createUserWithEmailAndPassword(auth, email, password);
                alert("User registered successfully ✅");
            } else {
                await signInWithEmailAndPassword(auth, email, password);
                alert("Login successful ✅");
            }
        } catch (error) {
            console.error(error);
            alert("Authentication failed ❌");
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
                    callback: () => {
                        console.log("reCAPTCHA solved");
                    },
                }
            );
        }
    };


    // Step 1: Send OTP
    const sendOtp = async () => {
        setupRecaptcha();
        try {
            const appVerifier = (window as any).recaptchaVerifier;
            const result = await signInWithPhoneNumber(auth, phone, appVerifier);
            setConfirmationResult(result);
            alert("OTP sent to phone ✅");
        } catch (error) {
            console.error(error);
            alert("Failed to send OTP ❌");
        }
    };

    // Step 2: Verify OTP
    const verifyOtp = async () => {
        try {
            if (confirmationResult) {
                await confirmationResult.confirm(otp);
                alert("Phone verified & user logged in ✅");
            }
        } catch (error) {
            console.error(error);
            alert("Invalid OTP ❌");
        }
    };

    const handleGoogleAuth = async () => {
        try {
            const provider = new GoogleAuthProvider();
            await signInWithPopup(auth, provider);
            alert("Logged in with Google ✅");
        } catch (error) {
            console.error(error);
            alert("Google login failed ❌");
        }
    };


    return (
        <div style={{ padding: "2rem" }}>
            <h2>
                {mode === "email"
                    ? isSignup
                        ? "Sign Up with Email"
                        : "Login with Email"
                    : "Login with Phone"}
            </h2>

            {/* Toggle between Email/Phone mode */}
            <div style={{ marginBottom: "1rem" }}>
                <button onClick={() => setMode("email")}>Use Email</button>
                <button onClick={() => setMode("phone")}>Use Phone</button>
            </div>

            {mode === "email" ? (
                <>
                    <input
                        type="email"
                        placeholder="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                    <br />
                    <input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                    <br />
                    <button onClick={handleEmailAuth}>
                        {isSignup ? "Sign Up" : "Login"}
                    </button>
                    <p
                        onClick={() => setIsSignup(!isSignup)}
                        style={{ cursor: "pointer" }}
                    >
                        {isSignup ? "Already have an account? Login" : "New user? Sign up"}
                    </p>
                </>
            ) : (
                <>
                    <input
                        type="text"
                        placeholder="+1 555 555 5555"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                    />
                    <button onClick={sendOtp}>Send OTP</button>
                    <br />
                    <input
                        type="text"
                        placeholder="Enter OTP"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value)}
                    />
                    <button onClick={verifyOtp}>Verify OTP</button>
                    <div id="recaptcha-container"></div>
                </>
            )}
            <hr style={{ margin: "2rem 0" }} />
            <button onClick={handleGoogleAuth}>Sign in with Google</button>
        </div>
    );
};

export default Auth;
