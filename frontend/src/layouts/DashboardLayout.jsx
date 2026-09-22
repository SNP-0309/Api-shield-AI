import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { useLocation } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import { securityApi } from '../services/api';

export default function DashboardLayout({ user }) {
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

  const pageInfo = location.pathname.includes('/traffic')
    ? { title: 'Live request telemetry', subtitle: 'Monitor every request crossing the gateway' }
    : location.pathname.includes('/clients')
      ? { title: 'Client behavior', subtitle: 'Review active client profiles and risk scores' }
      : location.pathname.includes('/threat-intel')
        ? { title: 'Threat intelligence', subtitle: 'Understand the patterns behind detected risk' }
        : location.pathname.includes('/settings')
          ? { title: 'Settings', subtitle: 'Configure your protected application and services' }
          : { title: 'Realtime overview', subtitle: 'Behavior-aware protection for your API' };

  return (
    <div className="dashboard-canvas min-h-screen p-3 sm:p-5 lg:p-8">
      <div className="dashboard-frame dashboard-frame-analytics min-h-[calc(100vh-1.5rem)] sm:min-h-[calc(100vh-2.5rem)] lg:min-h-[calc(100vh-4rem)] overflow-hidden rounded-[24px] sm:rounded-[30px] flex">
        <Sidebar overview={overview} />
        <div className="flex-1 min-w-0 flex flex-col">
          <Navbar user={user} overview={overview} title={pageInfo.title} subtitle={pageInfo.subtitle} />
          <main className="dashboard-content overflow-y-auto">
            <Outlet context={{ overview, clients, traffic, timeseries, refetch: fetchData }} />
          </main>
        </div>
      </div>
    </div>
  );
}
