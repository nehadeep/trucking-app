import React from "react";
import { BrowserRouter as Router, Routes, Route ,Navigate } from "react-router-dom";
import Auth from "./components/Auth";
import ConsoleLayout from "./components/layouts/console-layouts/ConsoleLayout";
import SuperadminLayout from "./components/layouts/superadmin-layouts/SuperadminLayout";
import Settings from "./components/layouts/superadmin-layouts/Settings";
import Invites from "./components/layouts/superadmin-layouts/Invites";

import AdminLayout from "./components/layouts/admin-layouts/AdminLayout";
import AdminDashboard from "./components/layouts/admin-layouts/Dashboard";
import Drivers from "./components/layouts/admin-layouts/Drivers";
import Trucks from "./components/layouts/admin-layouts/Trucks";
import Trailers from "./components/layouts/admin-layouts/Trailers";
import RoutesPage from "./components/layouts/admin-layouts/RoutesPage";
import Trips from "./components/layouts/admin-layouts/Trips";
import AdminSettings from "./components/layouts/admin-layouts/Settings";

import SendInvitation from "./components/layouts/superadmin-layouts/Invites/SendInvitation";
import InvitationStatus from "./components/layouts/superadmin-layouts/Invites/InvitationStatus";

const App: React.FC = () => {
  return (
      <Router>
        <Routes>
          <Route path="/" element={<Auth />} />
            {/* Shared console wrapper */}
            <Route path="/console" element={<ConsoleLayout />}>

            {/* Superadmin routes */}

            <Route path="superadmin" element={<SuperadminLayout />}>
                <Route index element={<Navigate to="settings" />} />
                <Route path="settings" element={<Settings />} />
                <Route path="invites" element={<Invites />} >
                    <Route index element={<SendInvitation />} /> {/* default tab */}
                    <Route path="send" element={<SendInvitation />} />
                    <Route path="status" element={<InvitationStatus />} />
                </Route>
            </Route>

            {/* Admin routes */}
            <Route path="admin" element={<AdminLayout />}>
                <Route index element={<Navigate to="dashboard" />} />
                <Route path="dashboard" element={<AdminDashboard />} />
                <Route path="drivers" element={<Drivers />} />
                <Route path="trucks" element={<Trucks />} />
                <Route path="trailers" element={<Trailers />} />
                <Route path="routes" element={<RoutesPage />} />
                <Route path="trips" element={<Trips />} />
                <Route path="settings" element={<AdminSettings />} />
            </Route>
            </Route>
        </Routes>
      </Router>
  );
};

export default App;
