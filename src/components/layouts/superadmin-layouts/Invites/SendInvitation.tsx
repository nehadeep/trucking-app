import React, { useState } from "react";
import {
    Box,
    Card,
    CardContent,
    Typography,
    TextField,
    Button,
    Stack,
} from "@mui/material";

import { collection, addDoc, doc, setDoc } from "firebase/firestore";
import { db, auth } from "../../../../firebaseConfig";
import { v4 as uuidv4 } from "uuid";
import {sendInvite} from "../../../../servics/inviteService";


const SendInvitation: React.FC = () => {
    const [companyName, setCompanyName] = useState("");
    const [companyEmail, setCompanyEmail] = useState("");
    const [customMessage, setCustomMessage] = useState(
        "You are welcome to sign up with FleetPro. Please click the link below to sign up and complete the admin process."
    );

    const [emailError, setEmailError] = useState("");
    const [companyError, setCompanyError] = useState("");

    const validateEmail = (email: string) => {
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return regex.test(email);
    };

    const handleSendInvite = async () => {
        try {
            // 1️⃣ Generate IDs
            const randomId = Math.floor(100000 + Math.random() * 900000);
            const companyId = "company_" + randomId.toString();

            const inviteToken = uuidv4();
            const currentUser = auth.currentUser;

            if (!currentUser) {
                alert("You must be logged in as Superadmin to send invites");
                return;
            }
            // 2️⃣ Create company doc
            await setDoc(doc(db, "companies", companyId), {
                name: companyName,
                email: companyEmail,
                role: "admin",
                createdAt: new Date(),
                companyId : randomId,
                createdBy: currentUser.uid, // later replace with actual UID from auth
            });

            // 3️⃣ Save invitation
            const inviteRef = await addDoc(collection(db, "invitations"), {
                email: companyEmail,
                companyId,
                token: inviteToken,
                role: "admin",
                customMessage,
                status: "pending",
                createdAt: new Date(),
            });

            // 4️⃣ Generate invite link
            const inviteLink = `https://trucking-app-3e473.web.app/signup?companyId=${companyId}&token=${inviteToken}`;


            try {
                await sendInvite(companyEmail, companyName, inviteLink, customMessage);
                await setDoc(
                    doc(db, "invitations", inviteRef.id),
                    { status: "sent" },
                    { merge: true }
                );

            } catch (emailError: any) {
                await setDoc(
                    doc(db, "invitations", inviteRef.id),
                    { status: "failed", error: emailError.message },
                    { merge: true }
                );
            }

            console.log("Invite created:", inviteRef.id, inviteLink);

            alert(`Invite sent to ${companyEmail}\nLink: ${inviteLink}`);

            // reset form
            setCompanyName("");
            setCompanyEmail("");
            setCustomMessage(
                "You are welcome to sign up with FleetPro. Please click the link below to sign up and complete the admin process."
            );
        } catch (error) {
            console.error("Error sending invite:", error);
            alert("Failed to send invite ❌");
        }
    };
    const isFormValid =
        companyName.trim().length > 0 && validateEmail(companyEmail);

    return (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
            <Card sx={{ width: "100%", maxWidth: 500, boxShadow: 3, borderRadius: 3 }}>
                <CardContent>
                    <Typography variant="h5" gutterBottom sx={{ textAlign: "center" }}>
                        Invite a Company Admin
                    </Typography>
                    <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ textAlign: "center", mb: 3 }}
                    >
                        Fill in the details and add a custom welcome message for the invite
                    </Typography>

                    <Stack spacing={2}>
                        <TextField
                            label="Company Name"
                            variant="outlined"
                            fullWidth
                            value={companyName}
                            onChange={(e) => {
                                setCompanyName(e.target.value);
                                if (!e.target.value.trim()) {
                                    setCompanyError("Company name is required");
                                } else {
                                    setCompanyError("");
                                }
                            }}
                            error={!!companyError}
                            helperText={companyError}
                        />

                        <TextField
                            label="Company Admin Email"
                            type="email"
                            variant="outlined"
                            fullWidth
                            value={companyEmail}
                            onChange={(e) => {
                                setCompanyEmail(e.target.value);
                                if (!validateEmail(e.target.value)) {
                                    setEmailError("Enter a valid email address");
                                } else {
                                    setEmailError("");
                                }
                            }}
                            error={!!emailError}
                            helperText={emailError}
                        />

                        <TextField
                            label="Custom Message"
                            multiline
                            rows={4}
                            variant="outlined"
                            fullWidth
                            value={customMessage}
                            onChange={(e) => setCustomMessage(e.target.value)}
                        />

                        <Button
                            variant="contained"
                            color="primary"
                            fullWidth
                            disabled={!isFormValid}
                            onClick={handleSendInvite}
                            sx={{ py: 1.2, fontWeight: "bold" }}
                        >
                            Send Invite
                        </Button>
                    </Stack>
                </CardContent>
            </Card>
        </Box>
    );
};

export default SendInvitation;
