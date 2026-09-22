import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useOutletContext } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import AuthPage from './pages/AuthPage';
import ProtectedRoute from './components/ProtectedRoute';
import OverviewPage from './pages/OverviewPage';
import LiveTrafficPage from './pages/LiveTrafficPage';
import ClientsPage from './pages/ClientsPage';
import ThreatIntelPage from './pages/ThreatIntelPage';
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

        {/* Dashboard authentication */}
        <Route path="/login" element={<AuthPage mode="login" />} />
        <Route path="/register" element={<AuthPage mode="register" />} />

        {/* SaaS Cybersecurity Dashboard */}
        <Route path="/dashboard" element={<ProtectedRoute />}>
          <Route index element={<OverviewWrapper />} />
          <Route path="traffic" element={<LiveTrafficWrapper />} />
          <Route path="clients" element={<ClientsWrapper />} />
          <Route path="threat-intel" element={<ThreatIntelWrapper />} />
          <Route path="settings" element={<SettingsWrapper />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
