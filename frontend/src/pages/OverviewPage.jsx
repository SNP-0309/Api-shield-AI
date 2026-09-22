import React, { useState } from 'react';
import { 
  Activity, 
  Users, 
  Slash, 
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
      
      {/* Reference-inspired command-center hero */}
      <div className="grid grid-cols-1 xl:grid-cols-[1.18fr_0.82fr] gap-6 items-end">
        <div className="px-1 sm:px-3 pt-2">
          <p className="text-[11px] uppercase tracking-[0.22em] text-[#8b6c1e] font-semibold">Security operations / live command center</p>
          <h2 className="mt-3 text-4xl sm:text-5xl font-light tracking-[-0.06em] text-[#20201e]">Welcome back, API Shield</h2>
          <p className="mt-4 max-w-xl text-sm leading-6 text-[#7c786f]">
            Monitor real traffic, understand client behavior, and stop suspicious API activity before it reaches your application.
          </p>

          <div className="mt-7 max-w-2xl">
            <div className="flex items-center justify-between text-[11px] font-medium text-[#77736a]">
              <span>Protection coverage</span>
              <span className="text-[#4f8b68]">Live monitoring</span>
            </div>
            <div className="mt-2 h-3 rounded-full bg-[#e4dfd2] p-0.5 overflow-hidden">
              <div className="h-full w-[78%] rounded-full bg-[#2d2d2b] relative overflow-hidden">
                <span className="absolute inset-y-0 right-0 w-1/3 bg-[#f4cd4d]" />
              </div>
            </div>
            <div className="mt-2 flex items-center gap-5 text-[10px] text-[#8a857b]">
              <span><i className="inline-block w-2 h-2 rounded-full bg-[#2d2d2b] mr-1" />Observed traffic</span>
              <span><i className="inline-block w-2 h-2 rounded-full bg-[#f4cd4d] mr-1" />Threat review</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {[
            ['Requests', overview?.totalRequests || 0, Activity],
            ['Clients', overview?.activeClients || 0, Users],
            ['Blocked', overview?.blockedRequests || 0, Slash]
          ].map(([label, value, Icon]) => (
            <div key={label} className="reference-stat-card">
              <div className="flex items-center justify-between text-[#89857b]">
                <span className="text-[11px]">{label}</span>
                <Icon className="w-3.5 h-3.5" />
              </div>
              <div className="mt-4 text-3xl sm:text-4xl font-light tracking-[-0.06em] text-[#20201e]">{value}</div>
              <div className="mt-1 text-[10px] text-[#a09b90]">Live gateway data</div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="reference-mini-card"><span>Threats detected</span><strong className="text-[#b97524]">{threatCount}</strong><small>Risk score ≥ 0.30</small></div>
        <div className="reference-mini-card"><span>Average risk</span><strong>{(overview?.averageRisk ?? 0).toFixed(2)}</strong><small>Normalized score from 0.0 to 1.0</small></div>
        <div className="reference-mini-card"><span>ML engine</span><strong className={overview?.mlEngineOnline ? 'text-[#4f8b68]' : 'text-[#c65255]'}>{overview?.mlEngineOnline ? 'Ready' : 'Offline'}</strong><small>{overview?.mlEngineOnline ? 'Model-backed decisions' : 'Degraded decisions active'}</small></div>
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
