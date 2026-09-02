import React, { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import { securityApi } from '../services/api';

export default function DashboardLayout() {
  const location = useLocation();
  const [overview, setOverview] = useState(null);
  const [clients, setClients] = useState([]);
  const [traffic, setTraffic] = useState([]);
  const [timeseries, setTimeseries] = useState([]);

  // Fetch all real-time security data
  const fetchData = async () => {
    try {
      const [ov, cl, tr, ts] = await Promise.all([
        securityApi.getOverview(),
        securityApi.getClients(),
        securityApi.getTraffic(60),
        securityApi.getTimeseries()
      ]);
      setOverview(ov);
      setClients(cl || []);
      setTraffic(tr || []);
      setTimeseries(ts || []);
    } catch {
      // Gracefully maintain last state
    }
  };

  useEffect(() => {
    fetchData();
    // 2-second polling interval as specified
    const interval = setInterval(fetchData, 2000);
    return () => clearInterval(interval);
  }, []);

  // Compute title based on current path
  const getPageInfo = () => {
    const p = location.pathname;
    if (p.includes('/traffic')) {
      return { title: 'Live Request Telemetry', subtitle: 'Real-time HTTP traffic and adaptive rate actions' };
    }
    if (p.includes('/clients')) {
      return { title: 'Client Behavioral Registry', subtitle: 'Active clients tracked across 60-second sliding windows' };
    }
    if (p.includes('/threat-intel')) {
      return { title: 'Threat Intelligence Profiles', subtitle: 'Classified behavioral attack patterns and affected endpoints' };
    }
    if (p.includes('/architecture')) {
      return { title: 'System Architecture', subtitle: 'End-to-end request lifecycle and rate clamping pipeline' };
    }
    if (p.includes('/settings')) {
      return { title: 'Settings & Configuration', subtitle: 'Service health, enforcement policy, and deployment configuration' };
    }
    return { title: 'Autonomous API Security Operations', subtitle: 'Behavior-aware anomaly detection and adaptive rate limiting' };
  };

  const pageInfo = getPageInfo();

  return (
    <div className="analytics-shell flex min-h-screen bg-[#080C14] text-slate-200">
      <Sidebar overview={overview} />
      
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar
          title={pageInfo.title}
          subtitle={pageInfo.subtitle}
        />
        
        <main className="flex-1 overflow-y-auto">
          <Outlet context={{ overview, clients, traffic, timeseries, refetch: fetchData }} />
        </main>
      </div>
    </div>
  );
}
