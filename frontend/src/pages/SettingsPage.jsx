import React, { useEffect, useState } from 'react';
import { Settings as SettingsIcon, Server, Database, Cpu, Sliders, ShieldCheck, Code2, Globe2, Save, CheckCircle2, AlertTriangle } from 'lucide-react';
import { securityApi } from '../services/api';

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
  const [upstreamUrl, setUpstreamUrl] = useState('');
  const [upstreamSource, setUpstreamSource] = useState(null);
  const [saveState, setSaveState] = useState('idle');
  const [saveMessage, setSaveMessage] = useState('');

  useEffect(() => {
    securityApi.getUpstream()
      .then((data) => {
        setUpstreamUrl(data.url || '');
        setUpstreamSource(data.source || null);
      })
      .catch(() => setSaveMessage('Unable to load the current upstream URL.'));
  }, []);

  const handleSaveUpstream = async (event) => {
    event.preventDefault();
    setSaveState('saving');
    setSaveMessage('');
    try {
      const data = await securityApi.setUpstream(upstreamUrl);
      setUpstreamUrl(data.url);
      setUpstreamSource(data.source);
      setSaveState('saved');
      setSaveMessage('Saved. New proxy requests will use this URL immediately.');
    } catch (error) {
      setSaveState('error');
      setSaveMessage(error.response?.data?.error || 'Unable to save this upstream URL.');
    }
  };

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
            <Globe2 className="w-4 h-4 text-indigo-400" />
            <span>Protected Application</span>
          </h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Add the deployed URL of the application you want to protect. API Shield will forward requests from <code className="font-mono text-indigo-300">/proxy/*</code> to this application after evaluating them.
          </p>
          <form onSubmit={handleSaveUpstream} className="flex flex-col sm:flex-row gap-3">
            <input
              value={upstreamUrl}
              onChange={(event) => setUpstreamUrl(event.target.value)}
              placeholder="https://your-resume-analyzer.com"
              type="url"
              required
              className="flex-1 px-3 py-2.5 rounded-lg bg-[#0A0E1A] border border-[#1E293B] text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
            <button
              type="submit"
              disabled={saveState === 'saving'}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-sm font-semibold text-white transition-colors"
            >
              <Save className="w-4 h-4" />
              {saveState === 'saving' ? 'Saving…' : 'Save URL'}
            </button>
          </form>
          {upstreamSource && (
            <div className="flex items-center gap-2 text-[11px] text-slate-400">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Active runtime target ({upstreamSource === 'dashboard' ? 'dashboard setting' : 'environment setting'})</span>
            </div>
          )}
          {saveMessage && (
            <div className={`flex items-center gap-2 text-[11px] ${saveState === 'error' ? 'text-rose-400' : 'text-emerald-400'}`}>
              {saveState === 'error' ? <AlertTriangle className="w-3.5 h-3.5" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
              <span>{saveMessage}</span>
            </div>
          )}
          <p className="text-[11px] text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
            Only allow trusted application URLs. Keep this dashboard behind authentication because this setting controls where gateway traffic is sent.
          </p>
        </div>

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
            Add your application URL above and send client traffic through <code className="font-mono text-indigo-300">/proxy/*</code>. The gateway forwards the request after evaluation and records the real upstream response. Your users must open the API Shield gateway URL for requests to be inspected.
          </p>
          <pre className="p-4 rounded-xl bg-[#0A0E1A] border border-[#1E293B] overflow-x-auto text-[11px] text-slate-300"><code>{'curl -H "X-API-Key: $SENTINEL_API_KEY" \\\n  https://gateway.example.com/proxy/v1/resource'}</code></pre>
        </div>
      </div>
    </div>
  );
}
