import React, { useState } from 'react';
import { 
  Activity, 
  Users, 
  ShieldAlert, 
  Slash, 
  Cpu, 
  TrendingUp, 
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid,
  PieChart, 
  Pie, 
  Cell, 
} from 'recharts';
import { getStatusBadge, getRiskBar, getActionBadge, formatTimeAgo } from '../utils/statusUtils';
import ClientDrawer from '../components/ClientDrawer';

const PIE_COLORS = {
  Safe: '#10B981',
  Suspicious: '#F59E0B',
  'High Risk': '#F97316',
  Critical: '#EF4444'
};

export default function OverviewPage({ overview, clients, timeseries, onClientClick }) {
  const [selectedClientId, setSelectedClientId] = useState(null);

  const handleRowClick = (clientId) => {
    setSelectedClientId(clientId);
    if (onClientClick) onClientClick(clientId);
  };

  const threatCount = (overview?.suspiciousClients || 0) + (overview?.highRiskClients || 0) + (overview?.blockedClients || 0);

  const pieData = [
    { name: 'Safe', value: overview?.safeClients || 0 },
    { name: 'Suspicious', value: overview?.suspiciousClients || 0 },
    { name: 'High Risk', value: overview?.highRiskClients || 0 },
    { name: 'Critical', value: overview?.blockedClients || 0 },
  ];

  const hasPieData = pieData.some(d => d.value > 0);
  const displayPieData = hasPieData ? pieData : [];
  const hasTrafficData = (timeseries || []).some((point) =>
    Number(point.normalTraffic || 0) > 0 || Number(point.threatTraffic || 0) > 0
  );

  return (
    <div className="p-6 lg:p-8 space-y-8 max-w-[1600px] mx-auto">
      
      {/* Top Header */}
      <div>
        <h2 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
          <span>Autonomous API Security</span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
            Active Protection
          </span>
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Behavior-aware anomaly detection and adaptive rate limiting in real time.
        </p>
      </div>

      {/* Bento Top Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        
        {/* Total Requests */}
        <div className="p-4 rounded-xl bg-[#0E1422] border border-[#1E293B] hover:border-[#2D3D58] transition-all">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Total Requests</span>
            <Activity className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-white">
            {overview?.totalRequests || 0}
          </div>
          <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
            <TrendingUp className="w-3 h-3 text-emerald-400" />
            <span>Recorded by gateway</span>
          </div>
        </div>

        {/* Active Clients */}
        <div className="p-4 rounded-xl bg-[#0E1422] border border-[#1E293B] hover:border-[#2D3D58] transition-all">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Active Clients</span>
            <Users className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-white">
            {overview?.activeClients || 0}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            <span>Sliding window sessions</span>
          </div>
        </div>

        {/* Threats Detected */}
        <div className="p-4 rounded-xl bg-[#0E1422] border border-[#1E293B] hover:border-[#2D3D58] transition-all">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Threats Detected</span>
            <ShieldAlert className="w-4 h-4 text-orange-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-orange-400">
            {threatCount}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            <span>Risk score ≥ 0.30</span>
          </div>
        </div>

        {/* Blocked Requests */}
        <div className="p-4 rounded-xl bg-[#0E1422] border border-[#1E293B] hover:border-[#2D3D58] transition-all">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Blocked Requests</span>
            <Slash className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-rose-400">
            {overview?.blockedRequests || 0}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            <span>HTTP 429 throttles</span>
          </div>
        </div>

        {/* Average Risk */}
        <div className="p-4 rounded-xl bg-[#0E1422] border border-[#1E293B] hover:border-[#2D3D58] transition-all">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Average Risk</span>
            <TrendingUp className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-white">
            {(overview?.averageRisk ?? 0).toFixed(2)}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            <span>Normalized (0.0 - 1.0)</span>
          </div>
        </div>

        {/* ML Engine Status */}
        <div className="p-4 rounded-xl bg-[#0E1422] border border-[#1E293B] hover:border-[#2D3D58] transition-all">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">ML Engine</span>
            <Cpu className={`w-4 h-4 ${overview?.mlEngineOnline ? 'text-emerald-400' : 'text-rose-400'}`} />
          </div>
          <div className="text-sm font-bold flex items-center gap-2 mt-1">
            <span className={`w-2.5 h-2.5 rounded-full ${overview?.mlEngineOnline ? 'bg-emerald-400 shadow-sm shadow-emerald-400 animate-pulse' : 'bg-rose-400'}`} />
            <span className={overview?.mlEngineOnline ? 'text-emerald-400' : 'text-rose-400'}>
              {overview?.mlEngineOnline ? 'Ready' : 'Unavailable'}
            </span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            <span>{overview?.mlEngineOnline ? 'Model-backed decisions' : 'Degraded decisions active'}</span>
          </div>
        </div>

      </div>

      {/* Middle Grid: Live Traffic Graph & Threat Donut */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Live Traffic Graph (2 cols) */}
        <div className="lg:col-span-2 p-5 rounded-2xl bg-[#0E1422] border border-[#1E293B] space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white tracking-wide">Live Traffic Velocity</h3>
              <p className="text-xs text-slate-400">Normal vs Threat requests over sliding intervals (2s auto-refresh)</p>
            </div>
            <div className="flex items-center gap-4 text-xs font-mono">
              <span className="flex items-center gap-1.5 text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-400" /> Normal Traffic
              </span>
              <span className="flex items-center gap-1.5 text-rose-400">
                <span className="w-2 h-2 rounded-full bg-rose-400" /> Threat Traffic
              </span>
            </div>
          </div>

          <div className="h-64 w-full relative">
            {!hasTrafficData && (
              <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
                <span className="rounded-full bg-slate-100 px-3 py-1.5 text-[11px] font-medium text-slate-500 border border-slate-200">
                  Waiting for live gateway telemetry
                </span>
              </div>
            )}
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={timeseries || []}>
                <XAxis 
                  dataKey="time" 
                  stroke="#475569" 
                  fontSize={10} 
                  tickLine={false} 
                />
                <YAxis 
                  stroke="#475569" 
                  fontSize={10} 
                  tickLine={false} 
                  allowDecimals={false}
                />
                <CartesianGrid stroke="#eef0f4" vertical={false} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#ffffff', 
                    borderColor: '#e6e9f0', 
                    borderRadius: '10px', 
                    fontSize: '11px',
                    color: '#172033',
                    boxShadow: '0 8px 24px rgba(30, 43, 75, 0.10)'
                  }} 
                />
                <Line 
                  type="monotone" 
                  dataKey="normalTraffic" 
                  stroke="#10B981" 
                  strokeWidth={2} 
                  dot={false}
                  isAnimationActive={false}
                />
                <Line 
                  type="monotone" 
                  dataKey="threatTraffic" 
                  stroke="#EF4444" 
                  strokeWidth={2} 
                  dot={false}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Threat Distribution Donut */}
        <div className="p-5 rounded-2xl bg-[#0E1422] border border-[#1E293B] space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-white tracking-wide">Threat Posture Distribution</h3>
            <p className="text-xs text-slate-400">Client risk distribution breakdown</p>
          </div>

          <div className="h-52 w-full flex items-center justify-center relative">
            {!hasPieData && <span className="absolute text-xs text-slate-500">No observed clients</span>}
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={displayPieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {displayPieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[entry.name] || '#64748B'} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#ffffff', 
                    borderColor: '#e6e9f0', 
                    borderRadius: '10px', 
                    fontSize: '11px',
                    color: '#172033',
                    boxShadow: '0 8px 24px rgba(30, 43, 75, 0.10)'
                  }} 
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[11px] font-mono pt-2 border-t border-[#1E293B]">
            <div className="flex items-center gap-1.5 text-slate-300">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>Safe: {overview?.safeClients || 0}</span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-300">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              <span>Suspicious: {overview?.suspiciousClients || 0}</span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-300">
              <span className="w-2 h-2 rounded-full bg-orange-400" />
              <span>High Risk: {overview?.highRiskClients || 0}</span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-300">
              <span className="w-2 h-2 rounded-full bg-rose-400" />
              <span>Critical: {overview?.blockedClients || 0}</span>
            </div>
          </div>
        </div>

      </div>

      {/* Live Client Table */}
      <div className="rounded-2xl bg-[#0E1422] border border-[#1E293B] overflow-hidden">
        <div className="p-5 border-b border-[#1E293B] flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-white tracking-wide">Live Client Directory</h3>
            <p className="text-xs text-slate-400">Click any row to inspect deep behavioral telemetry and deterministic reasoning</p>
          </div>
          <span className="text-xs text-slate-500 font-mono">
            {clients?.length || 0} client(s) online
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-[#0A0E1A] text-slate-400 uppercase tracking-wider text-[10px] border-b border-[#1E293B]">
              <tr>
                <th className="py-3 px-4 font-semibold">Client Identity</th>
                <th className="py-3 px-4 font-semibold">Requests</th>
                <th className="py-3 px-4 font-semibold">Risk Score</th>
                <th className="py-3 px-4 font-semibold">Dynamic Limit</th>
                <th className="py-3 px-4 font-semibold">Behavior Pattern</th>
                <th className="py-3 px-4 font-semibold">Status</th>
                <th className="py-3 px-4 font-semibold">Action</th>
                <th className="py-3 px-4 font-semibold">Last Seen</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1E293B]">
              {(!clients || clients.length === 0) ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-500">
                    No active clients in the sliding window. Route live traffic through /proxy/* to begin collecting telemetry.
                  </td>
                </tr>
              ) : (
                clients.map((c) => (
                  <tr
                    key={c.clientId}
                    onClick={() => handleRowClick(c.clientId)}
                    className="hover:bg-[#161F32] cursor-pointer transition-colors"
                  >
                    <td className="py-3.5 px-4 font-mono font-medium text-white flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                      <span className="truncate max-w-[160px]">{c.clientId}</span>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-300">{c.requests}</td>
                    <td className="py-3.5 px-4">{getRiskBar(c.riskScore)}</td>
                    <td className="py-3.5 px-4 font-mono text-indigo-300 font-semibold">
                      {c.dynamicLimit} / min
                    </td>
                    <td className="py-3.5 px-4 text-slate-300 font-medium">
                      {c.dominantBehavior || 'Human-like'}
                    </td>
                    <td className="py-3.5 px-4">{getStatusBadge(c.status)}</td>
                    <td className="py-3.5 px-4">{getActionBadge(c.action)}</td>
                    <td className="py-3.5 px-4 text-slate-400">{formatTimeAgo(c.lastSeen)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Client Details Drawer */}
      <ClientDrawer
        clientId={selectedClientId}
        onClose={() => setSelectedClientId(null)}
      />

    </div>
  );
}
