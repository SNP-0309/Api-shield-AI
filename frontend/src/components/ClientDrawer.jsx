import React, { useEffect, useState } from 'react';
import { X, ShieldAlert, Activity } from 'lucide-react';
import { securityApi } from '../services/api';
import { getStatusBadge, getRiskBar, getActionBadge } from '../utils/statusUtils';

export default function ClientDrawer({ clientId, onClose }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!clientId) return;
    let isMounted = true;
    setLoading(true);

    securityApi.getClientDetails(clientId)
      .then((res) => {
        if (isMounted) {
          setData(res);
          setLoading(false);
        }
      })
      .catch(() => {
        if (isMounted) setLoading(false);
      });

    return () => { isMounted = false; };
  }, [clientId]);

  if (!clientId) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-[#0A0E1A] border-l border-[#1E293B] shadow-2xl flex flex-col justify-between">
          
          {/* Header */}
          <div className="p-5 border-b border-[#1E293B] flex items-center justify-between bg-[#0E1422]">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                <Activity className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white tracking-wide">Client Telemetry Profile</h3>
                <p className="text-xs font-mono text-slate-400 truncate max-w-[240px]">{clientId}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body */}
          <div className="p-5 overflow-y-auto space-y-5 flex-1 text-slate-300 text-xs">
            {loading ? (
              <div className="py-20 flex flex-col items-center justify-center space-y-3 text-slate-400">
                <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                <p>Loading behavioral telemetry...</p>
              </div>
            ) : data ? (
              <>
                {/* Status & Risk Banner */}
                <div className="p-4 rounded-xl bg-[#0E1422] border border-[#1E293B] space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Threat Posture</span>
                    {getStatusBadge(data.securityLevel)}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Risk Score</span>
                    {getRiskBar(data.riskScore)}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Gateway Action</span>
                    {getActionBadge(data.action)}
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-[#1E293B]/70 font-mono">
                    <span className="text-slate-400">Dynamic Rate Limit</span>
                    <span className="text-indigo-300 font-bold">{data.dynamicLimit} req / min</span>
                  </div>
                </div>

                {/* Deterministic Explanation Card: "Why was this client flagged?" */}
                <div className="p-4 rounded-xl bg-[#111827] border border-[#2D3748] space-y-2.5">
                  <div className="flex items-center gap-2 text-indigo-300 font-semibold text-xs uppercase tracking-wider">
                    <ShieldAlert className="w-4 h-4 text-indigo-400" />
                    <span>Deterministic Threat Rationale</span>
                  </div>
                  <p className="text-slate-200 font-medium">
                    {data.explanation?.summary}
                  </p>
                  <ul className="space-y-1.5 pt-1">
                    {(data.explanation?.details || []).map((detail, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-slate-400 text-[11px]">
                        <span className="text-indigo-400 font-bold mt-0.5">•</span>
                        <span>{detail}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="text-[10px] text-slate-500 pt-1 font-mono">
                    * Evaluated via sliding-window feature extractor & Isolation Forest inference.
                  </div>
                </div>

                {/* Behavioral Telemetry Metrics Grid */}
                <div>
                  <h4 className="text-[11px] uppercase tracking-wider text-slate-400 font-bold mb-2">
                    Behavioral Sliding Window (60s)
                  </h4>
                  <div className="grid grid-cols-2 gap-2.5">
                    <div className="p-2.5 rounded-lg bg-[#0E1422] border border-[#1E293B]">
                      <div className="text-[10px] text-slate-400">Interval Variance</div>
                      <div className="text-xs font-mono font-bold text-white mt-1">
                        {data.features?.intervalVariation || 'N/A'}
                      </div>
                    </div>

                    <div className="p-2.5 rounded-lg bg-[#0E1422] border border-[#1E293B]">
                      <div className="text-[10px] text-slate-400">Average Interval</div>
                      <div className="text-xs font-mono font-bold text-white mt-1">
                        {data.features?.averageInterval || 'N/A'}
                      </div>
                    </div>

                    <div className="p-2.5 rounded-lg bg-[#0E1422] border border-[#1E293B]">
                      <div className="text-[10px] text-slate-400">Endpoint Repetition</div>
                      <div className="text-xs font-mono font-bold text-white mt-1">
                        {data.features?.endpointRepetition || 'N/A'}
                      </div>
                    </div>

                    <div className="p-2.5 rounded-lg bg-[#0E1422] border border-[#1E293B]">
                      <div className="text-[10px] text-slate-400">Error Rate</div>
                      <div className="text-xs font-mono font-bold text-white mt-1">
                        {data.features?.errorRate || 'N/A'}
                      </div>
                    </div>

                    <div className="p-2.5 rounded-lg bg-[#0E1422] border border-[#1E293B]">
                      <div className="text-[10px] text-slate-400">Avg Payload Size</div>
                      <div className="text-xs font-mono font-bold text-white mt-1 truncate">
                        {data.features?.averagePayload || 'N/A'}
                      </div>
                    </div>

                    <div className="p-2.5 rounded-lg bg-[#0E1422] border border-[#1E293B]">
                      <div className="text-[10px] text-slate-400">Endpoint Entropy</div>
                      <div className="text-xs font-mono font-bold text-white mt-1">
                        {data.features?.entropy ?? 'N/A'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Client Metadata Details */}
                <div className="p-3.5 rounded-xl bg-[#0E1422] border border-[#1E293B] space-y-2 text-[11px]">
                  <div className="flex justify-between">
                    <span className="text-slate-400">IP Address</span>
                    <span className="font-mono text-slate-200">{data.ip}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Top Endpoint</span>
                    <span className="font-mono text-slate-200 truncate max-w-[200px]">{data.topEndpoint}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">User Agent</span>
                    <span className="font-mono text-slate-200 truncate max-w-[200px]">{data.userAgent}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Last Seen</span>
                    <span className="font-mono text-slate-200">{new Date(data.lastSeen).toLocaleTimeString()}</span>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center text-slate-400 py-10">Client telemetry not found</div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-[#1E293B] bg-[#0E1422] flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-lg text-xs font-medium bg-slate-800 text-slate-200 hover:bg-slate-700 transition-colors"
            >
              Close Drawer
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
