import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useOutletContext } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import DashboardLayout from './layouts/DashboardLayout';
import OverviewPage from './pages/OverviewPage';
import LiveTrafficPage from './pages/LiveTrafficPage';
import ClientsPage from './pages/ClientsPage';
import ThreatIntelPage from './pages/ThreatIntelPage';
import ArchitecturePage from './pages/ArchitecturePage';
import SettingsPage from './pages/SettingsPage';

// Context consumer wrappers
function OverviewWrapper() {
  const { overview, clients, timeseries } = useOutletContext();
  return <OverviewPage overview={overview} clients={clients} timeseries={timeseries} />;
}

function LiveTrafficWrapper() {
  const { traffic } = useOutletContext();
  return <LiveTrafficPage traffic={traffic} />;
}

function ClientsWrapper() {
  const { clients } = useOutletContext();
  return <ClientsPage clients={clients} />;
}

function ThreatIntelWrapper() {
  const { clients } = useOutletContext();
  return <ThreatIntelPage clients={clients} />;
}

function SettingsWrapper() {
  const { overview } = useOutletContext();
  return <SettingsPage overview={overview} />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Landing Page */}
        <Route path="/" element={<LandingPage />} />

        {/* SaaS Cybersecurity Dashboard */}
        <Route path="/dashboard" element={<DashboardLayout />}>
          <Route index element={<OverviewWrapper />} />
          <Route path="traffic" element={<LiveTrafficWrapper />} />
          <Route path="clients" element={<ClientsWrapper />} />
          <Route path="threat-intel" element={<ThreatIntelWrapper />} />
          <Route path="architecture" element={<ArchitecturePage />} />
          <Route path="settings" element={<SettingsWrapper />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
