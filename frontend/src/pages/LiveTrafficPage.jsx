import React, { useState } from 'react';
import { Binary, Search } from 'lucide-react';
import { getStatusBadge, getRiskBar, getActionBadge } from '../utils/statusUtils';
import ClientDrawer from '../components/ClientDrawer';

export default function LiveTrafficPage({ traffic }) {
  const [filter, setFilter] = useState('');
  const [selectedClientId, setSelectedClientId] = useState(null);

  const filteredTraffic = (traffic || []).filter((evt) => {
    if (!filter) return true;
    const term = filter.toLowerCase();
    return (
      evt.clientId?.toLowerCase().includes(term) ||
      evt.endpoint?.toLowerCase().includes(term) ||
      evt.securityLevel?.toLowerCase().includes(term) ||
      evt.statusCode?.toString().includes(term)
    );
  });

  return (
    <div className="p-8 space-y-6 max-w-[1600px] mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <Binary className="w-5 h-5 text-cyan-400" />
            <span>Live Request Stream</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Real-time API traffic intercepted by API Shield security middleware.
          </p>
        </div>

        {/* Filter Input */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Filter endpoint, client, status..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="pl-9 pr-4 py-1.5 rounded-lg bg-[#0E1422] border border-[#1E293B] text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 w-64"
          />
        </div>
      </div>

      {/* Traffic Table */}
      <div className="rounded-2xl bg-[#0E1422] border border-[#1E293B] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-[#0A0E1A] text-slate-400 uppercase tracking-wider text-[10px] border-b border-[#1E293B]">
              <tr>
                <th className="py-3 px-4 font-semibold">Timestamp</th>
                <th className="py-3 px-4 font-semibold">Client Identity</th>
                <th className="py-3 px-4 font-semibold">Method & Endpoint</th>
                <th className="py-3 px-4 font-semibold">Status Code</th>
                <th className="py-3 px-4 font-semibold">Risk Score</th>
                <th className="py-3 px-4 font-semibold">Security Level</th>
                <th className="py-3 px-4 font-semibold">Dynamic Limit</th>
                <th className="py-3 px-4 font-semibold">Action</th>
                <th className="py-3 px-4 font-semibold">Latency</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1E293B]">
              {filteredTraffic.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-500">
                    No intercepted traffic matching criteria. Route live traffic through /proxy/* to collect telemetry.
                  </td>
                </tr>
              ) : (
                filteredTraffic.map((evt) => {
                  const isBlocked = evt.statusCode === 429 || evt.action === 'BLOCKED' || evt.action === 'THROTTLED';
                  return (
                    <tr
                      key={evt.id || `${evt.clientId}-${evt.timestamp}-${evt.endpoint}`}
                      onClick={() => setSelectedClientId(evt.clientId)}
                      className={`hover:bg-[#161F32] cursor-pointer transition-colors ${
                        isBlocked ? 'bg-rose-950/10' : ''
                      }`}
                    >
                      <td className="py-3 px-4 font-mono text-slate-400 text-[11px]">
                        {new Date(evt.timestamp).toLocaleTimeString()}
                      </td>
                      <td className="py-3 px-4 font-mono text-indigo-300 font-medium">
                        {evt.clientId}
                      </td>
                      <td className="py-3 px-4 font-mono">
                        <span className={`font-bold mr-1.5 ${evt.method === 'POST' ? 'text-amber-400' : 'text-cyan-400'}`}>
                          {evt.method}
                        </span>
                        <span className="text-slate-200">{evt.endpoint}</span>
                      </td>
                      <td className="py-3 px-4 font-mono font-bold">
                        <span className={evt.statusCode >= 200 && evt.statusCode < 400 ? 'text-emerald-400' : 'text-rose-400'}>
                          {evt.statusCode}
                        </span>
                      </td>
                      <td className="py-3 px-4">{getRiskBar(evt.riskScore)}</td>
                      <td className="py-3 px-4">{getStatusBadge(evt.securityLevel)}</td>
                      <td className="py-3 px-4 font-mono text-slate-300">
                        {evt.dynamicLimit} / min
                      </td>
                      <td className="py-3 px-4">{getActionBadge(evt.action)}</td>
                      <td className="py-3 px-4 font-mono text-slate-400 text-[11px]">
                        {evt.responseTimeMs !== undefined ? `${evt.responseTimeMs}ms` : '—'}
                      </td>
                    </tr>
                  );
                })
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
