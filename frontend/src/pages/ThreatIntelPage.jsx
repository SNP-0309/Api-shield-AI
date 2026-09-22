import React, { useMemo, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  Clock3,
  Compass,
  Cpu,
  KeyRound,
  Search,
  ShieldAlert,
  ShieldCheck,
  Target,
  Zap
} from 'lucide-react';
import ClientDrawer from '../components/ClientDrawer';
import { formatTimeAgo } from '../utils/statusUtils';

const THREAT_PROFILES = [
  {
    id: 'low_and_slow',
    title: 'Low-and-slow bot',
    icon: Clock3,
    tone: 'blue',
    description: 'Machine-precise timing and repeated access designed to stay below obvious rate thresholds.',
    detectionMechanism: 'Interval variance, endpoint repetition, and sliding-window velocity.'
  },
  {
    id: 'scraper',
    title: 'Automated scraper',
    icon: Search,
    tone: 'yellow',
    description: 'Systematically crawls resources with a high GET ratio and limited navigation variety.',
    detectionMechanism: 'Endpoint entropy, request density, and repetitive resource access.'
  },
  {
    id: 'brute_force',
    title: 'Credential stuffing',
    icon: KeyRound,
    tone: 'red',
    description: 'Repeated authentication attempts that create an elevated failure rate on one route.',
    detectionMechanism: 'POST ratio, repeated login endpoint, and 4xx response rate.'
  },
  {
    id: 'burst_attack',
    title: 'High-velocity burst',
    icon: Zap,
    tone: 'orange',
    description: 'Rapid-fire request bursts that can exhaust application or database capacity.',
    detectionMechanism: 'Sub-250ms arrivals, burst score, and current request velocity.'
  },
  {
    id: 'probe',
    title: 'Endpoint prober',
    icon: Compass,
    tone: 'purple',
    description: 'Scans missing or sensitive paths and produces a high proportion of failed responses.',
    detectionMechanism: 'Error rate, endpoint diversity, and unknown route behavior.'
  },
  {
    id: 'automation',
    title: 'Headless automation',
    icon: Cpu,
    tone: 'teal',
    description: 'Automated clients with unnatural navigation or changing user-agent signals.',
    detectionMechanism: 'User-agent churn and multi-feature model deviation.'
  }
];

const EMPTY_CLIENTS = [];

function profileMatches(profileId, behavior = '') {
  const value = behavior.toLowerCase();
  return (profileId === 'low_and_slow' && value.includes('slow'))
    || (profileId === 'scraper' && value.includes('scraper'))
    || (profileId === 'brute_force' && value.includes('brute'))
    || (profileId === 'burst_attack' && value.includes('burst'))
    || (profileId === 'probe' && value.includes('probing'))
    || (profileId === 'automation' && value.includes('automation'));
}

function levelCount(clients, level) {
  return clients.filter((client) => client.status === level).length;
}

function riskTone(status) {
  if (status === 'CRITICAL') return 'critical';
  if (status === 'HIGH_RISK') return 'high';
  if (status === 'SUSPICIOUS') return 'suspicious';
  return 'safe';
}

export default function ThreatIntelPage({ clients }) {
  const [selectedClientId, setSelectedClientId] = useState(null);
  const activeClients = Array.isArray(clients) ? clients : EMPTY_CLIENTS;

  const intelligence = useMemo(() => {
    const counts = {
      SAFE: levelCount(activeClients, 'SAFE'),
      SUSPICIOUS: levelCount(activeClients, 'SUSPICIOUS'),
      HIGH_RISK: levelCount(activeClients, 'HIGH_RISK'),
      CRITICAL: levelCount(activeClients, 'CRITICAL')
    };
    const totalRisk = activeClients.reduce((total, client) => total + Number(client.riskScore || 0), 0);
    const averageRisk = activeClients.length ? totalRisk / activeClients.length : 0;
    const elevated = counts.SUSPICIOUS + counts.HIGH_RISK + counts.CRITICAL;
    const pressure = activeClients.length ? Math.round((elevated / activeClients.length) * 100) : 0;
    const priorityClients = [...activeClients].sort((a, b) => Number(b.riskScore || 0) - Number(a.riskScore || 0)).slice(0, 5);
    const profileStats = THREAT_PROFILES.map((profile) => {
      const matched = activeClients.filter((client) => profileMatches(profile.id, client.dominantBehavior));
      const total = matched.reduce((sum, client) => sum + Number(client.riskScore || 0), 0);
      return { ...profile, affected: matched.length, averageRisk: matched.length ? total / matched.length : 0 };
    });
    return { counts, averageRisk, pressure, priorityClients, profileStats, elevated };
  }, [activeClients]);

  return (
    <div className="threat-page">
      <div className="threat-page-header">
        <div>
          <span className="threat-eyebrow"><ShieldAlert size={14} /> Security intelligence</span>
          <h1>Threat intelligence</h1>
          <p>Understand why API Shield is flagging clients and where the current pressure is coming from.</p>
        </div>
        <div className="threat-header-status"><span /> Live sliding-window analysis</div>
      </div>

      <section className="threat-hero-card">
        <div className="threat-hero-copy">
          <div className="threat-hero-label"><Target size={15} /> Current threat posture</div>
          <div className="threat-hero-number">{intelligence.pressure}<small>%</small></div>
          <p>{intelligence.elevated ? `${intelligence.elevated} of ${activeClients.length} active clients need attention.` : 'No elevated-risk clients are active in the current window.'}</p>
          <div className="threat-hero-note"><Activity size={14} /> Updated from real gateway traffic</div>
        </div>
        <div className="threat-hero-breakdown">
          {[
            ['SAFE', intelligence.counts.SAFE, 'safe'],
            ['SUSPICIOUS', intelligence.counts.SUSPICIOUS, 'suspicious'],
            ['HIGH RISK', intelligence.counts.HIGH_RISK, 'high'],
            ['CRITICAL', intelligence.counts.CRITICAL, 'critical']
          ].map(([label, count, tone]) => (
            <div key={label} className="threat-hero-stat"><span className={`threat-tone-dot ${tone}`} /><strong>{count}</strong><small>{label}</small></div>
          ))}
        </div>
      </section>

      <section className="threat-summary-grid">
        <article className="threat-summary-card"><span className="threat-summary-icon blue"><ShieldCheck size={17} /></span><div><small>Active clients</small><strong>{activeClients.length}</strong><span>60-second window</span></div></article>
        <article className="threat-summary-card"><span className="threat-summary-icon yellow"><AlertTriangle size={17} /></span><div><small>Average risk</small><strong>{intelligence.averageRisk.toFixed(2)}</strong><span>Normalized score</span></div></article>
        <article className="threat-summary-card"><span className="threat-summary-icon purple"><BarChart3 size={17} /></span><div><small>Threat patterns</small><strong>{intelligence.profileStats.filter((profile) => profile.affected > 0).length}</strong><span>Observed profiles</span></div></article>
      </section>

      <section className="threat-overview-grid">
        <article className="threat-panel threat-distribution-panel">
          <div className="threat-panel-heading"><div><span className="threat-panel-kicker">Risk distribution</span><h2>Client posture</h2></div><span className="threat-panel-caption">Current window</span></div>
          <div className="threat-stacked-bar" aria-label="Risk distribution">
            {['SAFE', 'SUSPICIOUS', 'HIGH_RISK', 'CRITICAL'].map((level) => <span key={level} className={riskTone(level)} style={{ width: `${activeClients.length ? (intelligence.counts[level] / activeClients.length) * 100 : 0}%` }} />)}
          </div>
          <div className="threat-distribution-list">
            {[
              ['SAFE', intelligence.counts.SAFE, 'safe', 'Normal client behavior'],
              ['SUSPICIOUS', intelligence.counts.SUSPICIOUS, 'suspicious', 'Needs observation'],
              ['HIGH RISK', intelligence.counts.HIGH_RISK, 'high', 'Rate limited'],
              ['CRITICAL', intelligence.counts.CRITICAL, 'critical', 'Blocked by gateway']
            ].map(([label, count, tone, description]) => (
              <div key={label} className="threat-distribution-row"><span className={`threat-tone-dot ${tone}`} /><div><strong>{label}</strong><small>{description}</small></div><b>{count}</b></div>
            ))}
          </div>
        </article>

        <article className="threat-panel threat-priority-panel">
          <div className="threat-panel-heading"><div><span className="threat-panel-kicker">Priority queue</span><h2>Clients to review</h2></div><span className="threat-panel-caption">Top risk</span></div>
          {intelligence.priorityClients.length ? (
            <div className="threat-priority-list">
              {intelligence.priorityClients.map((client) => (
                <button type="button" key={client.clientId} className="threat-priority-row" onClick={() => setSelectedClientId(client.clientId)}>
                  <span className={`threat-priority-icon ${riskTone(client.status)}`}>{client.status === 'CRITICAL' ? <ShieldAlert size={15} /> : <AlertTriangle size={15} />}</span>
                  <span className="threat-priority-identity"><strong>{client.clientId}</strong><small>{client.dominantBehavior || 'Behavior under analysis'} · {formatTimeAgo(client.lastSeen)}</small></span>
                  <span className={`threat-priority-score ${riskTone(client.status)}`}>{Number(client.riskScore || 0).toFixed(2)}</span>
                </button>
              ))}
            </div>
          ) : <div className="threat-empty-state"><CheckCircle2 size={21} /><strong>No active threats</strong><span>Route traffic through /proxy/* to begin collecting intelligence.</span></div>}
        </article>
      </section>

      <section className="threat-profiles-section">
        <div className="threat-section-heading"><div><span className="threat-panel-kicker">Detection library</span><h2>Behavioral threat profiles</h2></div><p>These profiles explain the signals used by the rules engine and Isolation Forest model.</p></div>
        <div className="threat-profile-grid">
          {intelligence.profileStats.map((profile) => {
            const Icon = profile.icon;
            return (
              <article key={profile.id} className={`threat-profile-card ${profile.tone}`}>
                <div className="threat-profile-top"><span className="threat-profile-icon"><Icon size={17} /></span><span className="threat-profile-tag">PROFILE</span></div>
                <h3>{profile.title}</h3>
                <p>{profile.description}</p>
                <div className="threat-profile-metrics"><span><small>Active</small><strong>{profile.affected}</strong></span><span><small>Avg risk</small><strong>{profile.affected ? profile.averageRisk.toFixed(2) : '—'}</strong></span></div>
                <div className="threat-profile-logic"><span>Detection logic</span>{profile.detectionMechanism}</div>
              </article>
            );
          })}
        </div>
      </section>

      <ClientDrawer clientId={selectedClientId} onClose={() => setSelectedClientId(null)} />
    </div>
  );
}
