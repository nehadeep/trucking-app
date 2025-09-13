
import React, { useEffect, useState } from "react";
import {
    Box,
    Card,
    CardContent,
    Chip,
    Grid,
    Tab,
    Tabs,
    TextField,
    Typography,
    Stack,
} from "@mui/material";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { db } from "../../../firebaseConfig";

import BusinessIcon from "@mui/icons-material/Business";
import EmailIcon from "@mui/icons-material/Email";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import EventIcon from "@mui/icons-material/Event";

type Request = {
    id: string;
    companyName: string;
    contactName: string;
    requestType: string;
    adminEmail: string;
    location?: string;
    status: string;
    priority?: string;
    createdAt?: any;
    notes?: string;
};

const statusTabs = ["New", "In Review", "Quoted", "Accepted", "Rejected", "Completed"];

const CompanyRequests: React.FC = () => {
    const [requests, setRequests] = useState<Request[]>([]);
    const [tab, setTab] = useState("New");
    const [search, setSearch] = useState("");

    useEffect(() => {
        const q = query(collection(db, "company_requests"), orderBy("createdAt", "desc"));
        const unsub = onSnapshot(q, (snap) => {
            const data = snap.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            })) as Request[];
            setRequests(data);
        });
        return () => unsub();
    }, []);

    const filtered = requests.filter(
        (r) =>
            r.status?.toLowerCase() === tab.toLowerCase() &&
            (r.companyName?.toLowerCase().includes(search.toLowerCase()) ||
                r.contactName?.toLowerCase().includes(search.toLowerCase()) ||
                r.requestType?.toLowerCase().includes(search.toLowerCase()))
    );

    return (
        <Box p={3}>
            {/* Header */}
            <Typography variant="h5" fontWeight="bold">
                Company Requests
            </Typography>
            <Typography variant="body2" color="text.secondary" mb={3}>
                Manage incoming requests from potential clients
            </Typography>

            {/* Search */}
            <TextField
                placeholder="Search by company name, contact, or request type..."
                fullWidth
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                sx={{ mb: 3 }}
            />

            {/* Tabs */}
            <Tabs
                value={tab}
                onChange={(_, v) => setTab(v)}
                sx={{ mb: 3 }}
                variant="scrollable"
            >
                {statusTabs.map((s) => (
                    <Tab key={s} value={s} label={s} />
                ))}
            </Tabs>

            {/* Request cards */}
            <Grid container spacing={2}>
                {filtered.length === 0 && (
                    <Typography variant="body2" color="text.secondary" sx={{ ml: 2 }}>
                        No {tab} requests found.
                    </Typography>
                )}

                {filtered.map((r) => (
                    <Grid item xs={12} md={6} key={r.id}>
                        <Card sx={{ borderRadius: 3, boxShadow: 2 }}>
                            <CardContent>
                                <Typography variant="h6" fontWeight="bold">
                                    {r.companyName}
                                </Typography>
                                <Typography variant="subtitle2" color="text.secondary">
                                    {r.contactName}
                                </Typography>

                                {/* Chips */}
                                <Stack direction="row" spacing={1} sx={{ my: 1 }}>
                                    {r.priority && (
                                        <Chip
                                            label={r.priority}
                                            color={r.priority === "urgent" ? "error" : "warning"}
                                            size="small"
                                        />
                                    )}
                                    <Chip label="new" color="primary" size="small" />
                                </Stack>

                                {/* Details */}
                                <Stack spacing={1} mt={1}>
                                    <Box display="flex" alignItems="center" gap={1}>
                                        <BusinessIcon fontSize="small" />
                                        <Typography variant="body2">{r.requestType}</Typography>
                                    </Box>
                                    <Box display="flex" alignItems="center" gap={1}>
                                        <EmailIcon fontSize="small" />
                                        <Typography variant="body2">{r.adminEmail}</Typography>
                                    </Box>
                                    {r.location && (
                                        <Box display="flex" alignItems="center" gap={1}>
                                            <LocationOnIcon fontSize="small" />
                                            <Typography variant="body2">{r.location}</Typography>
                                        </Box>
                                    )}
                                    {r.createdAt && (
                                        <Box display="flex" alignItems="center" gap={1}>
                                            <EventIcon fontSize="small" />
                                            <Typography variant="body2">
                                                {r.createdAt.toDate().toLocaleString()}
                                            </Typography>
                                        </Box>
                                    )}
                                </Stack>

                                {/* Notes */}
                                {r.notes && (
                                    <Typography variant="body2" color="text.secondary" mt={1}>
                                        {r.notes}
                                    </Typography>
                                )}
                            </CardContent>
                        </Card>
                    </Grid>
                ))}
            </Grid>
        </Box>
    );
};

export default CompanyRequests;
