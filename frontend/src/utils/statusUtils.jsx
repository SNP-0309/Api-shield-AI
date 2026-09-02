import React from 'react';
import { ShieldCheck, AlertTriangle, ShieldAlert } from 'lucide-react';

export function getStatusBadge(status) {
  switch (status) {
    case 'SAFE':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          SAFE
        </span>
      );
    case 'SUSPICIOUS':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
          SUSPICIOUS
        </span>
      );
    case 'HIGH_RISK':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-500/15 text-orange-400 border border-orange-500/25">
          <AlertTriangle className="w-3.5 h-3.5 text-orange-400" />
          HIGH RISK
        </span>
      );
    case 'CRITICAL':
    case 'BLOCKED':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-500/15 text-rose-400 border border-rose-500/30">
          <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
          CRITICAL
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-500/10 text-slate-300 border border-slate-500/20">
          {status}
        </span>
      );
  }
}

export function getActionBadge(action) {
  if (action === 'BLOCKED') {
    return <span className="text-xs font-mono font-bold text-rose-400">BLOCKED</span>;
  }
  if (action === 'THROTTLED') {
    return <span className="text-xs font-mono font-bold text-orange-400">THROTTLED</span>;
  }
  return <span className="text-xs font-mono text-emerald-400">ALLOWED</span>;
}

export function getRiskBar(risk) {
  const pct = Math.min(100, Math.max(0, Math.round(risk * 100)));
  let barColor = 'bg-emerald-500';
  let textColor = 'text-emerald-400';

  if (risk >= 0.80) {
    barColor = 'bg-rose-500';
    textColor = 'text-rose-400';
  } else if (risk >= 0.60) {
    barColor = 'bg-orange-500';
    textColor = 'text-orange-400';
  } else if (risk >= 0.30) {
    barColor = 'bg-amber-500';
    textColor = 'text-amber-400';
  }

  return (
    <div className="flex items-center gap-2">
      <div className="w-16 bg-slate-800 rounded-full h-1.5 overflow-hidden">
        <div
          className={`h-full ${barColor} transition-all duration-300`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className={`text-xs font-mono font-semibold ${textColor}`}>
        {risk.toFixed(2)}
      </span>
    </div>
  );
}

export function formatTimeAgo(isoString) {
  if (!isoString) return 'Just now';
  const diffSec = Math.floor((Date.now() - new Date(isoString).getTime()) / 1000);
  if (diffSec < 5) return 'Just now';
  if (diffSec < 60) return `${diffSec}s ago`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  return new Date(isoString).toLocaleTimeString();
}
