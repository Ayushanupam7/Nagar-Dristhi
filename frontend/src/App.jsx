import React, { useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { FleetProvider } from "./context/FleetContext";

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

function RouteLoadingWatcher() {
  const { pathname } = useLocation();
  let fleet = null;
  try {
    fleet = useFleet();
  } catch {
    fleet = null;
  }

  useEffect(() => {
    if (fleet?.setIsPageLoading) {
      fleet.setIsPageLoading(true);
      const timer = setTimeout(() => {
        fleet.setIsPageLoading(false);
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [pathname]);

  return null;
}
import Navbar from "./components/Navbar";
import Sidebar from "./components/Sidebar";
import ToastContainer from "./components/Toast";
import EventDetailModal from "./components/EventDetailModal";
import BusCameraModal from "./components/BusCameraModal";
import FleetDemoModal from "./components/FleetDemoModal";
import IncidentAlarmModal from "./components/IncidentAlarmModal";

// Public Pages
import PublicPortal from "./pages/PublicPortal";
import AuthPage from "./pages/AuthPage";

// Command Center Operational Pages
import CommandCenter from "./pages/CommandCenter";
import LiveBuses from "./pages/LiveBuses";
import RoadIntelligence from "./pages/RoadIntelligence";
import TrafficIntelligence from "./pages/TrafficIntelligence";
import EventsPage from "./pages/EventsPage";
import IncidentsPage from "./pages/IncidentsPage";
import MaintenancePage from "./pages/MaintenancePage";
import AnalyticsPage from "./pages/AnalyticsPage";
import SettingsPage from "./pages/SettingsPage";

import { useFleet } from "./context/FleetContext";

function CommandLayout() {
  const { isAuthenticated } = useFleet();

  // Strict Authentication Guard: Direct dashboard access is forbidden without signing in
  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <div className="min-h-screen bg-command-bg text-command-text flex flex-col font-sans">
      {/* Top Command Bar */}
      <Navbar />

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar Navigation */}
        <Sidebar />

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto bg-command-bg h-[calc(100vh-3.25rem)]">
          <Routes>
            <Route path="/command" element={<CommandCenter />} />
            <Route path="/buses" element={<LiveBuses />} />
            <Route path="/roads" element={<RoadIntelligence />} />
            <Route path="/traffic" element={<TrafficIntelligence />} />
            <Route path="/events" element={<EventsPage />} />
            <Route path="/incidents" element={<IncidentsPage />} />
            <Route path="/maintenance" element={<MaintenancePage />} />
            <Route path="/analytics" element={<AnalyticsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            {/* Fallback to /command */}
            <Route path="*" element={<Navigate to="/command" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <FleetProvider>
      <Router>
        <ScrollToTop />
        <RouteLoadingWatcher />
        <Routes>
          {/* Public One-Page Portal Route (Home, About Us, Sign In option) */}
          <Route path="/" element={<PublicPortal />} />
          <Route path="/home" element={<PublicPortal />} />

          {/* Official Gov Auth Route */}
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/login" element={<AuthPage />} />

          {/* Central Command Operations Subsystem */}
          <Route path="/*" element={<CommandLayout />} />
        </Routes>

        {/* Persistent Global Modals & Notifications */}
        <EventDetailModal />
        <BusCameraModal />
        <FleetDemoModal />
        <IncidentAlarmModal />
        <ToastContainer />
      </Router>
    </FleetProvider>
  );
}

