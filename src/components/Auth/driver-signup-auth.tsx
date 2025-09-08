// components/auth/DriverSignupAuth.tsx
import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import {
    Box, Button, Card, CardContent, TextField, Typography, IconButton, InputAdornment
} from "@mui/material";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import { useSnackbar } from "notistack";
import { auth, db } from "../../firebaseConfig";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from "firebase/firestore";

const DriverSignupAuth: React.FC = () => {
    const [params] = useSearchParams();
    const navigate = useNavigate();
    const { enqueueSnackbar } = useSnackbar();

    const token = params.get("token");

    const [inviteValid, setInviteValid] = useState<boolean | null>(null);
    const [inviteData, setInviteData] = useState<any>(null);

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);

    useEffect(() => {
        const loadInvite = async () => {
            if (!token) { setInviteValid(false); return; }
            const snap = await getDoc(doc(db, "driver_invites", token));
            if (!snap.exists() || snap.data().used) {
                setInviteValid(false);
            } else {
                setInviteValid(true);
                setInviteData(snap.data());
            }
        };
        loadInvite();
    }, [token]);

    const validateEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
    const validatePassword = (p: string) => p.length >= 6;

    const handleSignup = async () => {
        try {
            if (!inviteValid || !inviteData) return enqueueSnackbar("Invalid or expired invite.", { variant: "error" });
            if (!validateEmail(email)) return enqueueSnackbar("Enter a valid email.", { variant: "error" });
            if (!validatePassword(password)) return enqueueSnackbar("Password must be at least 6 characters.", { variant: "error" });

            const { user } = await createUserWithEmailAndPassword(auth, email, password);

            // create driver record
            await setDoc(doc(db, "drivers", user.uid), {
                email: user.email,
                companyId: inviteData.companyId,
                invitedBy: inviteData.invitedBy || null,
                createdAt: serverTimestamp(),
            });

            // mark invite used
            await updateDoc(doc(db, "driver_invites", token as string), {
                used: true,
                usedAt: serverTimestamp(),
                usedByUid: user.uid,
            });

            enqueueSnackbar("Driver account created. You can now log in.", { variant: "success" });
            navigate("/");
        } catch (e: any) {
            enqueueSnackbar("Signup failed.", { variant: "error" });
        }
    };

    if (inviteValid === null) return null;

    return (
        <Box display="flex" justifyContent="center" alignItems="start" minHeight="100vh" bgcolor="#f4f6f8" py={8}>
            <Card sx={{ width: 420, p: 2, borderRadius: 3, boxShadow: 3 }}>
                <CardContent>
                    <Box textAlign="center" mb={2}>
                        <img src="/logo.png" alt="DriveSphere" style={{ width: 60, height: 60 }} />
                        <Typography variant="h5" fontWeight="bold" mt={1}>Driver Sign Up</Typography>
                        {inviteValid ? (
                            <Typography variant="body2" color="text.secondary">
                                You’re joining company: <strong>{inviteData?.companyName || inviteData?.companyId}</strong>
                            </Typography>
                        ) : (
                            <Typography variant="body2" color="error">Invalid or expired invite link.</Typography>
                        )}
                    </Box>

                    {inviteValid && (
                        <>
                            <TextField fullWidth label="Email" type="email" margin="normal" value={email} onChange={e => setEmail(e.target.value)} />
                            <TextField
                                fullWidth
                                label="Password"
                                type={showPassword ? "text" : "password"}
                                margin="normal"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                InputProps={{
                                    endAdornment: (
                                        <InputAdornment position="end">
                                            <IconButton onClick={() => setShowPassword(s => !s)} edge="end">
                                                {showPassword ? <VisibilityOff /> : <Visibility />}
                                            </IconButton>
                                        </InputAdornment>
                                    ),
                                }}
                            />
                            <Button fullWidth variant="contained" sx={{ mt: 2 }} onClick={handleSignup}>
                                Create Driver Account
                            </Button>
                        </>
                    )}
                </CardContent>
            </Card>
        </Box>
    );
};

export default DriverSignupAuth;
