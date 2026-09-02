import React, { useState } from 'react';
import { 
  Network, 
  Cpu, 
  Database, 
  Lock, 
  Radio,
  CheckCircle2
} from 'lucide-react';

const PIPELINE_STEPS = [
  {
    step: '01',
    title: 'Client Interception',
    actor: 'Express Security Gateway',
    desc: 'Every incoming request to /proxy/* is evaluated by securityMiddleware before it is sent to the configured upstream API.',
    color: 'text-indigo-400',
    border: 'border-indigo-500/30'
  },
  {
    step: '02',
    title: 'Client Identification',
    actor: 'Identity Resolver',
    desc: 'Determines a stable identity from the authenticated principal, API-key fingerprint, or trusted client IP.',
    color: 'text-cyan-400',
    border: 'border-cyan-500/30'
  },
  {
    step: '03',
    title: 'Sliding-Window Memory',
    actor: 'Redis Shared State',
    desc: 'Maintains short-term timestamps, endpoints, payload sizes, response outcomes, client state, and retention TTLs.',
    color: 'text-emerald-400',
    border: 'border-emerald-500/30'
  },
  {
    step: '04',
    title: 'Feature Extraction',
    actor: 'Behavior Telemetry Engine',
    desc: 'Calculates 13 real-time mathematical signals: interval std dev, endpoint entropy, repetition ratio, burst score.',
    color: 'text-amber-400',
    border: 'border-amber-500/30'
  },
  {
    step: '05',
    title: 'Isolation Forest Inference',
    actor: 'Python ML Microservice',
    desc: 'Unsupervised ML model scales behavioral vectors and calculates normalized anomaly score (0.0 safe to 1.0 anomalous).',
    color: 'text-purple-400',
    border: 'border-purple-500/30'
  },
  {
    step: '06',
    title: 'Hybrid Risk Synthesis',
    actor: 'Risk Engine',
    desc: 'Combines ML anomaly score (65%), behavioral heuristic rules (20%), and rate velocity (15%) into final threat posture.',
    color: 'text-rose-400',
    border: 'border-rose-500/30'
  },
  {
    step: '07',
    title: 'Dynamic Rate Clamping',
    actor: 'Adaptive Limiter',
    desc: 'Adjusts the per-client threshold (100 -> 50 -> 15 -> 5 req/min) and returns HTTP 429 when enforcement is triggered.',
    color: 'text-rose-400',
    border: 'border-rose-500/30'
  },
  {
    step: '08',
    title: 'Upstream API Response',
    actor: 'Application Service',
    desc: 'Allowed requests are forwarded to your upstream API with API Shield headers attached; rejected requests receive HTTP 429.',
    color: 'text-emerald-400',
    border: 'border-emerald-500/30'
  }
];

export default function ArchitecturePage() {
  const [activeStep, setActiveStep] = useState(0);

  return (
    <div className="p-8 space-y-8 max-w-[1600px] mx-auto">
      <div>
        <h2 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
          <Network className="w-5 h-5 text-indigo-400" />
          <span>API Shield System Architecture</span>
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          End-to-end request lifecycle from edge interception to adaptive rate enforcement.
        </p>
      </div>

      {/* Main Architecture Flow Diagram */}
      <div className="p-8 rounded-2xl bg-[#0E1422] border border-[#1E293B] shadow-2xl relative overflow-hidden">
        <div className="text-xs uppercase font-bold tracking-wider text-slate-400 mb-8 flex items-center justify-between">
          <span>Execution Pipeline Flow</span>
          <span className="text-indigo-400 font-mono text-[11px]">Live request path</span>
        </div>

        {/* Pipeline Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {PIPELINE_STEPS.map((step, idx) => (
            <div
              key={step.step}
              onClick={() => setActiveStep(idx)}
              className={`p-4 rounded-xl bg-[#0A0E1A] border transition-all cursor-pointer ${
                activeStep === idx
                  ? 'border-indigo-500 shadow-lg shadow-indigo-500/10 bg-[#121A2D]'
                  : `${step.border} hover:border-slate-600`
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                  STEP {step.step}
                </span>
                <span className={`text-xs font-mono font-bold ${step.color}`}>
                  {step.actor}
                </span>
              </div>
              <h4 className="text-xs font-bold text-white tracking-wide">{step.title}</h4>
              <p className="text-[11px] text-slate-400 mt-1.5 leading-relaxed">
                {step.desc}
              </p>
            </div>
          ))}
        </div>

        {/* Dashboard Sidecar Feed Explanation */}
        <div className="mt-8 p-4 rounded-xl bg-[#080C14] border border-[#1E293B] flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Radio className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="text-xs font-bold text-white">Parallel Observability Channel</div>
              <p className="text-[11px] text-slate-400">
                While requests are processed, non-blocking telemetry events stream to Redis and are polled live by the React Dashboard every 2 seconds.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs font-mono text-emerald-400 shrink-0">
            <CheckCircle2 className="w-4 h-4" />
            <span>Telemetry persistence is non-blocking</span>
          </div>
        </div>
      </div>

      {/* Deep-Dive Specifications */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        <div className="p-5 rounded-2xl bg-[#0E1422] border border-[#1E293B] space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-white">
            <Database className="w-4 h-4 text-emerald-400" />
            <span>Redis Behavioral Schema</span>
          </div>
          <ul className="text-xs text-slate-400 space-y-2 font-mono">
            <li className="p-2 rounded bg-[#0A0E1A] border border-[#1E293B]">
              <span className="text-emerald-400 font-bold">metrics:*</span> - durable counters
            </li>
            <li className="p-2 rounded bg-[#0A0E1A] border border-[#1E293B]">
              <span className="text-cyan-400 font-bold">timestamps:&#123;id&#125;</span> - sliding list
            </li>
            <li className="p-2 rounded bg-[#0A0E1A] border border-[#1E293B]">
              <span className="text-amber-400 font-bold">endpoints:&#123;id&#125;</span> - resource history
            </li>
            <li className="p-2 rounded bg-[#0A0E1A] border border-[#1E293B]">
              <span className="text-indigo-400 font-bold">status:&#123;id&#125;</span> - client state hash
            </li>
          </ul>
        </div>

        <div className="p-5 rounded-2xl bg-[#0E1422] border border-[#1E293B] space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-white">
            <Cpu className="w-4 h-4 text-purple-400" />
            <span>ML Isolation Forest Features</span>
          </div>
          <p className="text-[11px] text-slate-400">
            13 sliding-window features normalized via StandardScaler:
          </p>
          <div className="grid grid-cols-2 gap-1.5 text-[10px] font-mono text-slate-300">
            <span className="p-1 rounded bg-[#0A0E1A]">interval_std</span>
            <span className="p-1 rounded bg-[#0A0E1A]">avg_interval</span>
            <span className="p-1 rounded bg-[#0A0E1A]">endpoint_rep</span>
            <span className="p-1 rounded bg-[#0A0E1A]">entropy</span>
            <span className="p-1 rounded bg-[#0A0E1A]">error_rate</span>
            <span className="p-1 rounded bg-[#0A0E1A]">burst_score</span>
            <span className="p-1 rounded bg-[#0A0E1A]">payload_std</span>
            <span className="p-1 rounded bg-[#0A0E1A]">GET_ratio</span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-[#0E1422] border border-[#1E293B] space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-white">
            <Lock className="w-4 h-4 text-rose-400" />
            <span>Dynamic Rate Limiting Tiers</span>
          </div>
          <div className="space-y-2 text-xs font-mono">
            <div className="p-2 rounded bg-[#0A0E1A] border border-emerald-500/20 flex justify-between">
              <span className="text-emerald-400 font-bold">SAFE (&lt;0.30)</span>
              <span className="text-white">100 req/min (ALLOW)</span>
            </div>
            <div className="p-2 rounded bg-[#0A0E1A] border border-amber-500/20 flex justify-between">
              <span className="text-amber-400 font-bold">SUSPICIOUS</span>
              <span className="text-white">50 req/min (MONITOR)</span>
            </div>
            <div className="p-2 rounded bg-[#0A0E1A] border border-orange-500/20 flex justify-between">
              <span className="text-orange-400 font-bold">HIGH RISK</span>
              <span className="text-white">15 req/min (THROTTLE)</span>
            </div>
            <div className="p-2 rounded bg-[#0A0E1A] border border-rose-500/20 flex justify-between">
              <span className="text-rose-400 font-bold">CRITICAL (&ge;0.80)</span>
              <span className="text-rose-400 font-bold">5 req/min (HTTP 429)</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
