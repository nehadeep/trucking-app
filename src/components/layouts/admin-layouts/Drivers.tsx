import React, { useState, useEffect } from "react";
import { Button, TextField, Card, CardContent, Typography, Chip,Grid } from "@mui/material";
import { collection, getDocs } from "firebase/firestore";
import { db, auth } from "../../../firebaseConfig";
import DriverModal from "../../modals/DriverModal";

const Drivers: React.FC = () => {
    const [openAdd, setOpenAdd] = useState(false);
    const [drivers, setDrivers] = useState<any[]>([]);
    const [search, setSearch] = useState("");

    // ✅ Get logged-in adminId
    const adminId = auth.currentUser?.uid;

    // 🔍 Load drivers from Firestore
    useEffect(() => {
        const fetchDrivers = async () => {
            if (!adminId) return;
            const snapshot = await getDocs(collection(db, "admins", adminId, "drivers"));
            const list = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
            setDrivers(list);
        };

        fetchDrivers();
    }, [adminId, openAdd]); // re-fetch after modal closes

    // 🔍 Filter by search
    const filteredDrivers = drivers.filter(
        (d) =>
            d.fullName?.toLowerCase().includes(search.toLowerCase()) ||
            d.licenseNumber?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div style={{ padding: 24 }}>
            <Typography variant="h4" gutterBottom>
                Driver Management
            </Typography>

            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
                <TextField
                    placeholder="Search drivers by name or license number..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    fullWidth
                    style={{ marginRight: 16 }}
                />
                <Button
                    variant="contained"
                    color="primary"
                    onClick={() => setOpenAdd(true)}
                    disabled={!adminId} // prevent adding until we know adminId
                >
                    + Add Driver
                </Button>
            </div>

            <Grid container spacing={2}>
                {filteredDrivers.map((driver) => (
                    <Grid item xs={12} md={4} key={driver.id} {...({} as any)} >
                        <Card>
                            <CardContent>
                                <Typography variant="h6">{driver.fullName}</Typography>
                                <Typography variant="body2">ID #{driver.licenseNumber}</Typography>
                                <Typography variant="body2">{driver.phone}</Typography>
                                <Typography variant="body2">
                                    {driver.totalMiles?.toLocaleString()} miles driven
                                </Typography>
                                <Typography variant="body2">Hired: {driver.hireDate}</Typography>
                                <Typography variant="body2">
                                    License expires: {driver.licenseExpiry}
                                </Typography>
                                <Chip
                                    label={driver.status}
                                    color={
                                        driver.status === "Active"
                                            ? "success"
                                            : driver.status === "On Trip"
                                            ? "info"
                                            : "default"
                                    }
                                    size="small"
                                    style={{ marginTop: 8 }}
                                />
                            </CardContent>
                        </Card>
                    </Grid>
                ))}
            </Grid>

            {/* Add Driver Modal */}
            {adminId && (
                <DriverModal
                    open={openAdd}
                    onClose={() => setOpenAdd(false)}
                    adminId={adminId}
                />
            )}
        </div>
    );
};

export default Drivers;
