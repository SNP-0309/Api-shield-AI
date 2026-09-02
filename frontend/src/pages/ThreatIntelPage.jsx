import React from 'react';
import { 
  ShieldAlert, 
  Clock, 
  Search, 
  Key, 
  Zap, 
  Compass, 
  Cpu, 
} from 'lucide-react';

const THREAT_PROFILES = [
  {
    id: 'low_and_slow',
    title: 'Low-and-Slow Stealth Bot',
    icon: Clock,
    color: 'text-rose-400',
    borderColor: 'border-rose-500/30',
    bgBadge: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
    description: 'Sends requests at low frequency (<15 req/min) deliberately staying below standard thresholds, but exhibits machine-precise interval standard deviation (<0.04s) and repeated targeting.',
    detectionMechanism: 'Flagged via request interval variance analysis and Isolation Forest outlier scoring.'
  },
  {
    id: 'scraper',
    title: 'Automated API Scraper',
    icon: Search,
    color: 'text-amber-400',
    borderColor: 'border-amber-500/30',
    bgBadge: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    description: 'Systematically crawls multiple endpoints in rapid sequential succession with high GET ratio (>95%) and uniform payload consumption.',
    detectionMechanism: 'Identified by elevated endpoint entropy (>3.0) and high request density in sliding window.'
  },
  {
    id: 'brute_force',
    title: 'Credential Stuffing Bot',
    icon: Key,
    color: 'text-rose-400',
    borderColor: 'border-rose-500/30',
    bgBadge: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
    description: 'Repeatedly hits authentication endpoints with varying credentials resulting in elevated 401/403 failure rates (>50%) and 100% POST ratio.',
    detectionMechanism: 'Flagged by failure-rate velocity spike and single-endpoint repetition ratio (>0.95).'
  },
  {
    id: 'burst_attack',
    title: 'High-Velocity Burst Bot',
    icon: Zap,
    color: 'text-orange-400',
    borderColor: 'border-orange-500/30',
    bgBadge: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
    description: 'Unloads rapid-fire batches of concurrent requests in sub-second intervals (<100ms) attempting to exhaust server compute or race database transactions.',
    detectionMechanism: 'Detected by burst score calculation (fraction of sub-250ms arrivals) and sudden velocity surges.'
  },
  {
    id: 'probe',
    title: 'Endpoint Vulnerability Prober',
    icon: Compass,
    color: 'text-purple-400',
    borderColor: 'border-purple-500/30',
    bgBadge: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    description: 'Scans non-existent sensitive administrative or debug paths (/api/.env, /api/actuator, /api/backup) generating rapid 404 response anomalies.',
    detectionMechanism: 'Identified by abnormal 404 response proportion and high unique unknown endpoint ratio.'
  },
  {
    id: 'automation',
    title: 'Suspicious Headless Automation',
    icon: Cpu,
    color: 'text-cyan-400',
    borderColor: 'border-cyan-500/30',
    bgBadge: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
    description: 'Employs automated headless browser frameworks (Puppeteer, Selenium, Scrapy) or rotating User-Agent headers with unnatural navigation sequences.',
    detectionMechanism: 'Flagged by User-Agent churn rate and multi-dimensional feature space deviations.'
  }
];

export default function ThreatIntelPage({ clients }) {
  // Derive real statistics from active clients
  const getStats = (profileId) => {
    let affected = 0;
    let totalRisk = 0;

    (clients || []).forEach((c) => {
      const b = (c.dominantBehavior || '').toLowerCase();
      let match = false;
      if (profileId === 'low_and_slow' && b.includes('slow')) match = true;
      if (profileId === 'scraper' && b.includes('scraper')) match = true;
      if (profileId === 'brute_force' && b.includes('brute')) match = true;
      if (profileId === 'burst_attack' && b.includes('burst')) match = true;
      if (profileId === 'probe' && b.includes('probing')) match = true;
      if (profileId === 'automation' && b.includes('automation')) match = true;

      if (match) {
        affected++;
        totalRisk += c.riskScore || 0;
      }
    });

    const avgRisk = affected > 0 ? (totalRisk / affected).toFixed(2) : '—';
    const detections = affected;

    return { affected, avgRisk, detections };
  };

  return (
    <div className="p-8 space-y-6 max-w-[1600px] mx-auto">
      <div>
        <h2 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-orange-400" />
          <span>Threat Intelligence Profiles</span>
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Behavioral attack taxonomies classified by API Shield Isolation Forest & Risk Engine.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {THREAT_PROFILES.map((tp) => {
          const Icon = tp.icon;
          const stats = getStats(tp.id);

          return (
            <div
              key={tp.id}
              className={`p-6 rounded-2xl bg-[#0E1422] border ${tp.borderColor} flex flex-col justify-between space-y-4 hover:bg-[#121A2D] transition-all`}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-slate-900 border border-[#1E293B] flex items-center justify-center">
                    <Icon className={`w-5 h-5 ${tp.color}`} />
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${tp.bgBadge}`}>
                    DETECTION RULE
                  </span>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-white tracking-wide">{tp.title}</h3>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    {tp.description}
                  </p>
                </div>
              </div>

              <div className="space-y-3 pt-3 border-t border-[#1E293B]">
                {/* Stats Row */}
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="p-2 rounded-lg bg-[#0A0E1A] border border-[#1E293B]">
                    <div className="text-[10px] text-slate-400">Active Clients</div>
                    <div className="text-xs font-mono font-bold text-white mt-0.5">{stats.detections}</div>
                  </div>
                  <div className="p-2 rounded-lg bg-[#0A0E1A] border border-[#1E293B]">
                    <div className="text-[10px] text-slate-400">Avg Risk</div>
                    <div className={`text-xs font-mono font-bold mt-0.5 ${tp.color}`}>{stats.avgRisk}</div>
                  </div>
                  <div className="p-2 rounded-lg bg-[#0A0E1A] border border-[#1E293B]">
                    <div className="text-[10px] text-slate-400">Affected</div>
                    <div className="text-xs font-mono font-bold text-white mt-0.5">{stats.affected}</div>
                  </div>
                </div>

                {/* Detection mechanism pill */}
                <div className="text-[11px] text-slate-400 bg-[#0A0E1A] p-2.5 rounded-lg border border-[#1E293B]/60">
                  <span className="font-semibold text-slate-300">Defense Logic: </span>
                  {tp.detectionMechanism}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
