import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert, Cpu, Activity, Lock, Zap, Database, ArrowRight, ChevronRight } from 'lucide-react';

const capabilities = [
  {
    icon: Activity,
    title: 'Observed behavior',
    text: 'Builds a short-lived behavioral profile from real request timing, routes, payloads, response codes, and user-agent changes.'
  },
  {
    icon: Cpu,
    title: 'Model-assisted decisions',
    text: 'Combines the deployed Isolation Forest model with transparent rules so every enforcement decision has an inspectable rationale.'
  },
  {
    icon: Zap,
    title: 'Adaptive enforcement',
    text: 'Tightens the per-client request budget as risk increases and returns standard rate-limit headers and HTTP 429 responses.'
  }
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#080C14] text-slate-200 selection:bg-indigo-500/30">
      <nav className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between border-b border-[#1E293B]/60">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400 shadow-md shadow-indigo-500/10">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <span className="text-lg font-extrabold text-white tracking-tight flex items-center gap-1.5">
              API Shield
            </span>
            <span className="block text-[11px] text-slate-400 font-medium">Adaptive API defense</span>
          </div>
        </div>
        <Link to="/dashboard" className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/20 transition-all flex items-center gap-2">
          <span>Open Operations</span>
          <ChevronRight className="w-4 h-4" />
        </Link>
      </nav>

      <main>
        <section className="max-w-6xl mx-auto px-6 pt-24 pb-20 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-950/60 border border-indigo-800/50 text-indigo-300 text-xs font-medium mb-6">
            <Lock className="w-3.5 h-3.5 text-indigo-400" />
            <span>Production API gateway protection</span>
          </div>
          <h1 className="text-4xl sm:text-6xl font-extrabold text-white tracking-tight leading-tight max-w-4xl mx-auto">
            Protect APIs by understanding <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">how clients behave.</span>
          </h1>
          <p className="mt-6 text-base sm:text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
            API Shield sits in front of your existing API, evaluates live traffic, and adapts access limits when a client’s behavior departs from the baseline.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link to="/dashboard" className="px-6 py-3 rounded-xl text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-xl shadow-indigo-600/25 transition-all flex items-center gap-2">
              <span>Open Security Dashboard</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link to="/dashboard/architecture" className="px-6 py-3 rounded-xl text-sm font-semibold bg-[#111827] hover:bg-[#1A2438] text-slate-200 border border-[#1F2937] transition-all flex items-center gap-2">
              <span>View Integration Flow</span>
              <ChevronRight className="w-4 h-4 text-cyan-400" />
            </Link>
          </div>
        </section>

        <section className="max-w-5xl mx-auto px-6 pb-20">
          <div className="p-6 sm:p-8 rounded-2xl bg-[#0E1422] border border-[#1E293B] shadow-2xl">
            <div className="flex items-center gap-2 text-xs uppercase font-bold tracking-wider text-slate-400 mb-6">
              <Database className="w-4 h-4 text-cyan-400" />
              <span>Request path</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center text-center">
              <div className="p-5 rounded-xl bg-[#090D16] border border-[#1E293B]">
                <div className="text-sm font-bold text-white">Your clients</div>
                <div className="text-xs text-slate-500 mt-1">Authenticated API traffic</div>
              </div>
              <div className="text-indigo-400 text-sm font-mono">→ /proxy/* →</div>
              <div className="p-5 rounded-xl bg-indigo-950/30 border border-indigo-500/30">
                <div className="text-sm font-bold text-white">Your upstream API</div>
                <div className="text-xs text-slate-500 mt-1">Configured with UPSTREAM_URL</div>
              </div>
            </div>
            <p className="mt-5 text-xs text-slate-400 text-center leading-relaxed">
              Redis stores the sliding-window state and the dashboard exposes only the telemetry generated by actual requests.
            </p>
          </div>
        </section>

        <section className="max-w-6xl mx-auto px-6 py-16 border-t border-[#1E293B]/60">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Designed for live traffic</h2>
            <p className="mt-2 text-sm text-slate-400">A deployable control plane for teams that need adaptive API protection.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {capabilities.map(({ icon: Icon, title, text }) => (
              <div key={title} className="p-6 rounded-2xl bg-[#0E1422] border border-[#1E293B] space-y-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-white">{title}</h3>
                <p className="text-xs text-slate-400 leading-relaxed">{text}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t border-[#1E293B] py-8 text-center text-xs text-slate-500">
        <p>API Shield — adaptive API rate limiting and behavioral threat mitigation</p>
      </footer>
    </div>
  );
}
