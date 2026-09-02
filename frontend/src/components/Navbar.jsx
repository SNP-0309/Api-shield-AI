import React from 'react';
import { Radio } from 'lucide-react';

export default function Navbar({ title, subtitle }) {
  return (
    <header className="h-[72px] px-8 border-b border-[#1E293B] bg-[#0A0E1A]/90 backdrop-blur-md flex items-center justify-between sticky top-0 z-20 shadow-[0_4px_18px_rgba(35,45,80,0.03)]">
      <div>
        <h2 className="text-base font-bold text-white tracking-tight">{title}</h2>
        {subtitle && <p className="text-xs text-slate-400">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-4">
        {/* Live sync pill */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900 border border-[#1E293B] text-[11px] text-slate-400">
          <Radio className="w-3 h-3 text-emerald-400 animate-pulse" />
          <span>Live Telemetry (2s Poll)</span>
        </div>

      </div>
    </header>
  );
}
