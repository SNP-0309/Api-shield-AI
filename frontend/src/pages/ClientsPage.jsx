import React, { useState } from 'react';
import { Users, Search } from 'lucide-react';
import { getStatusBadge, getRiskBar, getActionBadge, formatTimeAgo } from '../utils/statusUtils';
import ClientDrawer from '../components/ClientDrawer';

export default function ClientsPage({ clients }) {
  const [filterLevel, setFilterLevel] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClientId, setSelectedClientId] = useState(null);

  const filtered = (clients || []).filter((c) => {
    const matchesSearch = c.clientId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.dominantBehavior.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterLevel === 'ALL' || c.status === filterLevel;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="p-8 space-y-6 max-w-[1600px] mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-400" />
            <span>Client Registry & Telemetry</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Real-time behavioral profiles tracked in Redis sliding memory.
          </p>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search client ID or behavior..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-1.5 rounded-lg bg-[#0E1422] border border-[#1E293B] text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 w-60"
            />
          </div>

          {/* Filter Pills */}
          <div className="flex items-center bg-[#0E1422] p-1 rounded-lg border border-[#1E293B] text-xs">
            {['ALL', 'SAFE', 'SUSPICIOUS', 'HIGH_RISK', 'CRITICAL'].map((lvl) => (
              <button
                key={lvl}
                onClick={() => setFilterLevel(lvl)}
                className={`px-3 py-1 rounded-md text-[11px] font-medium transition-colors ${
                  filterLevel === lvl
                    ? 'bg-indigo-600 text-white font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {lvl.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl bg-[#0E1422] border border-[#1E293B] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-[#0A0E1A] text-slate-400 uppercase tracking-wider text-[10px] border-b border-[#1E293B]">
              <tr>
                <th className="py-3 px-4 font-semibold">Client Identity</th>
                <th className="py-3 px-4 font-semibold">IP Address</th>
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
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-500">
                    No clients matching current filter.
                  </td>
                </tr>
              ) : (
                filtered.map((c) => (
                  <tr
                    key={c.clientId}
                    onClick={() => setSelectedClientId(c.clientId)}
                    className="hover:bg-[#161F32] cursor-pointer transition-colors"
                  >
                    <td className="py-3.5 px-4 font-mono font-medium text-white flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                      <span>{c.clientId}</span>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-400">{c.ip}</td>
                    <td className="py-3.5 px-4 font-mono">{c.requests}</td>
                    <td className="py-3.5 px-4">{getRiskBar(c.riskScore)}</td>
                    <td className="py-3.5 px-4 font-mono text-indigo-300 font-semibold">
                      {c.dynamicLimit} / min
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-200">
                      {c.dominantBehavior}
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

      <ClientDrawer
        clientId={selectedClientId}
        onClose={() => setSelectedClientId(null)}
      />
    </div>
  );
}
