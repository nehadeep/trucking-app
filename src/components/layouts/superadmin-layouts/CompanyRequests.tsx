// components/layouts/superadmin-layouts/CompanyRequests.tsx
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
    IconButton,
} from "@mui/material";
import {
    doc,
    collection,
    onSnapshot,
    query,
    orderBy,
    updateDoc,
} from "firebase/firestore";
import { db } from "../../../firebaseConfig";

import BusinessIcon from "@mui/icons-material/Business";
import EmailIcon from "@mui/icons-material/Email";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import EventIcon from "@mui/icons-material/Event";
import PhoneIcon from "@mui/icons-material/Phone";
import PeopleIcon from "@mui/icons-material/People";
import EditIcon from "@mui/icons-material/Edit";

import { formatDate } from "../../../utils/dateFormatter";
import EditCompanyRequestModal, {CompanyRequest} from "../../modals/EditCompanyRequestModal";

type Request = {
    id: string;
    companyName: string;
    dotNumber?: string;
    employerIdentificationNumber?: string;
    status: string;
    createdAt?: any;
    numEmployees?: number;
    address?: {
        address1?: string;
        address2?: string | null;
        city?: string;
        state?: string;
        zip?: string;
        country?: string;
    };
    requestedBy?: {
        firstName?: string;
        lastName?: string;
        email?: string;
        phone?: string;
    };
};

const statusTabs = ["New", "In Review", "Quoted", "Accepted", "Rejected", "Completed"];

const CompanyRequests: React.FC = () => {
    const [requests, setRequests] = useState<Request[]>([]);
    const [tab, setTab] = useState("New");
    const [search, setSearch] = useState("");
    const [editOpen, setEditOpen] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState<CompanyRequest | null>(null);

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
            ((tab === "New" && r.status === "pending") ||
                (tab === "In Review" && r.status === "in_review") ||
                (tab === "Quoted" && r.status === "quoted") ||
                (tab === "Accepted" && r.status === "accepted") ||
                (tab === "Rejected" && r.status === "rejected") ||
                (tab === "Completed" && r.status === "completed")) &&
            (r.companyName?.toLowerCase().includes(search.toLowerCase()) ||
                r.requestedBy?.firstName?.toLowerCase().includes(search.toLowerCase()) ||
                r.requestedBy?.lastName?.toLowerCase().includes(search.toLowerCase()))
    );

    const updateRequestStatus = async (id: string, status: string, autoTab?: string) => {
        try {
            await updateDoc(doc(db, "company_requests", id), { status });
            console.log(`Request ${id} marked as ${status}`);
            if (autoTab) setTab(autoTab); // switch to target tab
        } catch (err) {
            console.error("Failed to update request:", err);
        }
    };

    const getStatusChip = (status: string) => {
        switch (status) {
            case "pending":
                return <Chip label="NEW" color="primary" size="small" />;
            case "in_review":
                return <Chip label="IN REVIEW" color="info" size="small" />;
            case "quoted":
                return <Chip label="QUOTED" color="secondary" size="small" />;
            case "accepted":
                return <Chip label="ACCEPTED" color="success" size="small" />;
            case "rejected":
                return <Chip label="REJECTED" color="error" size="small" />;
            case "completed":
                return <Chip label="COMPLETED" color="default" size="small" />;
            default:
                return null;
        }
    };

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
                placeholder="Search by company name or contact..."
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
                    <Grid item xs={12} md={4} key={r.id}>
                        <Card sx={{ borderRadius: 3, boxShadow: 2 }}>
                            <CardContent>
                                {/* Top Row: Company + Status */}
                                <Box
                                    display="flex"
                                    justifyContent="space-between"
                                    alignItems="center"
                                >
                                    <Box>
                                        <Typography variant="h6" fontWeight="bold">
                                            {r.companyName}
                                        </Typography>
                                        {r.requestedBy?.firstName && (
                                            <Typography variant="subtitle2" color="text.secondary">
                                                {r.requestedBy.firstName} {r.requestedBy.lastName}
                                            </Typography>
                                        )}
                                    </Box>
                                    <Stack direction="row" spacing={1} alignItems="center">
                                        <IconButton
                                            size="small"
                                            color="default"
                                            onClick={() => {
                                                setSelectedRequest(r);
                                                setEditOpen(true);
                                            }}
                                        >
                                            <EditIcon fontSize="small" />
                                        </IconButton>
                                        {getStatusChip(r.status)}
                                    </Stack>
                                </Box>

                                {/* Details */}
                                <Stack spacing={1} mt={2}>
                                    <Box display="flex" alignItems="center" gap={1}>
                                        <EmailIcon fontSize="small" />
                                        <Typography variant="body2">{r.requestedBy?.email}</Typography>
                                    </Box>
                                    {r.requestedBy?.phone && (
                                        <Box display="flex" alignItems="center" gap={1}>
                                            <PhoneIcon fontSize="small" />
                                            <Typography variant="body2">{r.requestedBy.phone}</Typography>
                                        </Box>
                                    )}
                                    <Box display="flex" alignItems="center" gap={1}>
                                        <BusinessIcon fontSize="small" />
                                        <Typography variant="body2">
                                            DOT: {r.dotNumber || "—"} | EIN:{" "}
                                            {r.employerIdentificationNumber || "—"}
                                        </Typography>
                                    </Box>
                                    {(r.address?.address1 || r.address?.city) && (
                                        <Box display="flex" alignItems="center" gap={1}>
                                            <LocationOnIcon fontSize="small" />
                                            <Typography variant="body2">
                                                {r.address?.address1}{" "}
                                                {r.address?.address2
                                                    ? `, ${r.address?.address2}`
                                                    : ""}
                                                , {r.address?.city}, {r.address?.state}{" "}
                                                {r.address?.zip}, {r.address?.country}
                                            </Typography>
                                        </Box>
                                    )}
                                    {r.numEmployees && (
                                        <Box display="flex" alignItems="center" gap={1}>
                                            <PeopleIcon fontSize="small" />
                                            <Typography variant="body2">
                                                {r.numEmployees} Employees
                                            </Typography>
                                        </Box>
                                    )}
                                    {r.createdAt && (
                                        <Box display="flex" alignItems="center" gap={1}>
                                            <EventIcon fontSize="small" />
                                            <Typography variant="body2">
                                                {formatDate(r.createdAt.toDate())}
                                            </Typography>
                                        </Box>
                                    )}
                                </Stack>

                                {/* Action buttons */}
                                <Stack direction="row" spacing={1} mt={2}>
                                    {r.status === "pending" && (
                                        <Chip
                                            label="Mark In Review"
                                            color="success"
                                            clickable
                                            onClick={() => {
                                                if (
                                                    window.confirm(
                                                        "Have you verified all the details with admin?"
                                                    )
                                                ) {
                                                    updateRequestStatus(r.id, "in_review", "In Review");
                                                }
                                            }}
                                        />
                                    )}
                                    {r.status === "in_review" && (
                                        <Chip
                                            label="Mark Quoted"
                                            color="secondary"
                                            clickable
                                            onClick={() =>
                                                updateRequestStatus(r.id, "quoted", "Quoted")
                                            }
                                        />
                                    )}
                                    {r.status === "quoted" && (
                                        <Chip
                                            label="Mark Accepted"
                                            color="success"
                                            clickable
                                            onClick={() =>
                                                updateRequestStatus(r.id, "accepted", "Accepted")
                                            }
                                        />
                                    )}
                                </Stack>
                            </CardContent>
                        </Card>
                    </Grid>
                ))}
            </Grid>
            {/* Modal lives here, outside the Box */}
            <EditCompanyRequestModal
                open={editOpen}
                onClose={() => setEditOpen(false)}
                request={selectedRequest}
            />
        </Box>


);
};

export default CompanyRequests;
