import React from 'react';
import { Link } from 'react-router-dom';
import {
  Activity,
  ArrowRight,
  BarChart3,
  CheckCircle2,
  ChevronRight,
  Database,
  LockKeyhole,
  ShieldCheck,
  Sparkles,
  Zap
} from 'lucide-react';

const capabilities = [
  {
    icon: Activity,
    eyebrow: '01 / Observe',
    title: 'Learn normal traffic',
    text: 'API Shield builds a short-lived profile from real routes, request timing, response codes, and client behavior.'
  },
  {
    icon: BarChart3,
    eyebrow: '02 / Decide',
    title: 'Score every request',
    text: 'The ML model and transparent rules combine to explain why a request is safe, suspicious, or high risk.'
  },
  {
    icon: Zap,
    eyebrow: '03 / Enforce',
    title: 'Adapt protection',
    text: 'Risk-aware limits protect your upstream API while legitimate clients continue to receive normal responses.'
  }
];

export default function LandingPage() {
  return (
    <div className="landing-page">
      <div className="landing-shell">
        <nav className="landing-nav">
          <Link to="/" className="landing-brand">
            <span className="landing-brand-mark"><ShieldCheck size={19} /></span>
            <span><strong>API Shield</strong><small>Adaptive API defense</small></span>
          </Link>

          <div className="landing-nav-links" aria-label="Primary navigation">
            <a href="#how-it-works">How it works</a>
            <a href="#protection">Protection</a>
            <Link to="/login">Sign in</Link>
          </div>

          <Link to="/login" className="landing-nav-cta">Open console <ChevronRight size={15} /></Link>
        </nav>

        <main>
          <section className="landing-hero">
            <div className="landing-hero-copy">
              <div className="landing-kicker"><span className="landing-kicker-dot" /> Production API gateway protection</div>
              <h1>Make every API request <span>more trustworthy.</span></h1>
              <p>API Shield sits in front of your existing API, learns how clients behave, and responds when live traffic departs from the baseline.</p>
              <div className="landing-actions">
                <Link to="/login" className="landing-primary-button">Open security dashboard <ArrowRight size={16} /></Link>
                <a href="#how-it-works" className="landing-secondary-button">See how it works</a>
              </div>
              <div className="landing-proof-row">
                <span><CheckCircle2 size={15} /> ML-assisted decisions</span>
                <span><CheckCircle2 size={15} /> Transparent enforcement</span>
              </div>
            </div>

            <div className="landing-hero-visual" aria-label="API request protection overview">
              <div className="landing-visual-glow" />
              <div className="landing-visual-topline"><span>LIVE PROTECTION</span><span className="landing-live-label"><i /> Online</span></div>
              <div className="landing-visual-score">
                <div><small>Protection score</small><strong>98.4</strong><span>+12.8% this week</span></div>
                <div className="landing-score-ring"><span>API<br />SAFE</span></div>
              </div>
              <div className="landing-visual-chart" aria-hidden="true">
                <span style={{ height: '35%' }} /><span style={{ height: '54%' }} /><span className="is-active" style={{ height: '78%' }} /><span style={{ height: '45%' }} /><span style={{ height: '64%' }} /><span style={{ height: '38%' }} /><span style={{ height: '70%' }} />
              </div>
              <div className="landing-visual-footer"><span><i className="is-blue" /> Safe traffic</span><span><i className="is-orange" /> Risk detected</span><strong>24h</strong></div>
            </div>
          </section>

          <section className="landing-path-card" id="how-it-works">
            <div className="landing-section-label"><Database size={15} /> Request path</div>
            <div className="landing-path-flow">
              <div className="landing-path-node"><span className="landing-node-icon"><LockKeyhole size={17} /></span><span><strong>Your clients</strong><small>Authenticated API traffic</small></span></div>
              <div className="landing-path-connector"><span>evaluate</span><ArrowRight size={17} /></div>
              <div className="landing-path-node landing-path-node-accent"><span className="landing-node-icon"><ShieldCheck size={17} /></span><span><strong>API Shield</strong><small>ML + behavior engine</small></span></div>
              <div className="landing-path-connector"><span>forward</span><ArrowRight size={17} /></div>
              <div className="landing-path-node"><span className="landing-node-icon"><Database size={17} /></span><span><strong>Your upstream API</strong><small>Existing application</small></span></div>
            </div>
            <p>Connect your application once, then send requests through <code>/proxy/*</code> to inspect real traffic and preserve the upstream response.</p>
          </section>

          <section className="landing-section" id="protection">
            <div className="landing-section-heading">
              <div><span className="landing-overline">Built for live traffic</span><h2>Protection that gets clearer as traffic grows.</h2></div>
              <p>Everything you need to understand, test, and control API behavior from one operations console.</p>
            </div>
            <div className="landing-capability-grid">
              {capabilities.map(({ icon: Icon, eyebrow, title, text }) => (
                <article key={title} className="landing-capability-card">
                  <div className="landing-capability-icon"><Icon size={18} /></div>
                  <span className="landing-card-eyebrow">{eyebrow}</span>
                  <h3>{title}</h3>
                  <p>{text}</p>
                  <span className="landing-card-link">Learn more <ArrowRight size={14} /></span>
                </article>
              ))}
            </div>
          </section>
        </main>

        <footer className="landing-footer">
          <span>API Shield <small>Adaptive API rate limiting and behavioral threat mitigation</small></span>
          <span className="landing-footer-status"><Sparkles size={14} /> Built for responsible production traffic</span>
        </footer>
      </div>
    </div>
  );
}
