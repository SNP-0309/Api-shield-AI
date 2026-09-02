import React from 'react';
import { Settings as SettingsIcon, Server, Database, Cpu, Sliders, ShieldCheck, Code2 } from 'lucide-react';

function ServiceCard({ icon: Icon, label, detail, online, status }) {
  return (
    <div className="p-4 rounded-xl bg-[#0A0E1A] border border-[#1E293B] space-y-2">
      <div className="flex items-center gap-2 text-slate-300">
        <Icon className="w-4 h-4 text-indigo-400" />
        <span className="text-xs font-semibold">{label}</span>
      </div>
      <div className="text-[11px] text-slate-500">{detail}</div>
      <div className={`text-[11px] font-medium flex items-center gap-1.5 ${online ? 'text-emerald-400' : 'text-rose-400'}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${online ? 'bg-emerald-400' : 'bg-rose-400'}`} />
        {status}
      </div>
    </div>
  );
}

export default function SettingsPage({ overview }) {
  const backendUrl = import.meta.env.VITE_BACKEND_URL || window.location.origin;

  return (
    <div className="p-8 space-y-8 max-w-[1200px] mx-auto">
      <div>
        <h2 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
          <SettingsIcon className="w-5 h-5 text-indigo-400" />
          <span>System Settings & Configuration</span>
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Operational health and deployment requirements for this gateway.
        </p>
      </div>

      <div className="space-y-6">
        <div className="p-6 rounded-2xl bg-[#0E1422] border border-[#1E293B] space-y-4">
          <h3 className="text-sm font-bold text-white tracking-wide flex items-center gap-2">
            <Server className="w-4 h-4 text-indigo-400" />
            <span>Service Health</span>
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <ServiceCard icon={ShieldCheck} label="API Gateway" detail={backendUrl} online status="Serving dashboard requests" />
            <ServiceCard
              icon={Cpu}
              label="ML Inference"
              detail="Configured Isolation Forest service"
              online={Boolean(overview?.mlEngineOnline)}
              status={overview?.mlEngineOnline ? 'Ready' : 'Unavailable'}
            />
            <ServiceCard
              icon={Database}
              label="Redis Telemetry"
              detail="Required shared state and counters"
              online={Boolean(overview?.redisOnline)}
              status={overview?.redisOnline ? 'Connected' : 'Unavailable'}
            />
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-[#0E1422] border border-[#1E293B] space-y-4">
          <h3 className="text-sm font-bold text-white tracking-wide flex items-center gap-2">
            <Sliders className="w-4 h-4 text-cyan-400" />
            <span>Enforcement Policy</span>
          </h3>
          <p className="text-xs text-slate-400">
            Every request is evaluated using the deployed model, observed behavior, and sliding-window request velocity.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs font-mono">
            {[
              ['SAFE', '< 0.30', '100 req/min', 'text-emerald-400'],
              ['SUSPICIOUS', '0.30 – 0.59', '50 req/min', 'text-amber-400'],
              ['HIGH RISK', '0.60 – 0.79', '15 req/min', 'text-orange-400'],
              ['CRITICAL', '≥ 0.80', '5 req/min', 'text-rose-400']
            ].map(([level, range, limit, color]) => (
              <div key={level} className="p-3 rounded-lg bg-[#0A0E1A] border border-[#1E293B]">
                <div className={`font-bold ${color}`}>{level}</div>
                <div className="text-slate-400 mt-1">Risk {range}</div>
                <div className="text-slate-200 mt-1">{limit}</div>
              </div>
            ))}
          </div>
          <div className="p-3 rounded-lg bg-[#0A0E1A] border border-[#1E293B] text-xs font-mono text-slate-300">
            finalRisk = 0.65 × model + 0.20 × behavior + 0.15 × request velocity
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-[#0E1422] border border-[#1E293B] space-y-4">
          <h3 className="text-sm font-bold text-white tracking-wide flex items-center gap-2">
            <Code2 className="w-4 h-4 text-indigo-400" />
            <span>Application Integration</span>
          </h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Point <code className="font-mono text-indigo-300">UPSTREAM_URL</code> at your API and send client traffic through <code className="font-mono text-indigo-300">/proxy/*</code>. The gateway forwards the request after evaluation and records the real upstream response.
          </p>
          <pre className="p-4 rounded-xl bg-[#0A0E1A] border border-[#1E293B] overflow-x-auto text-[11px] text-slate-300"><code>{'curl -H "X-API-Key: $SENTINEL_API_KEY" \\\n  https://gateway.example.com/proxy/v1/resource'}</code></pre>
        </div>
      </div>
    </div>
  );
}

