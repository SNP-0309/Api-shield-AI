import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  ShieldAlert, 
  Activity, 
  Users, 
  Binary, 
  Network, 
  Settings, 
  Cpu, 
  Database, 
  Lock,
  ExternalLink
} from 'lucide-react';

export default function Sidebar({ overview }) {
  const isMlOnline = overview?.mlEngineOnline ?? false;
  const isRedisOnline = overview?.redisOnline ?? false;

  const navItems = [
    { name: 'Overview', path: '/dashboard', icon: Activity, exact: true },
    { name: 'Live Traffic', path: '/dashboard/traffic', icon: Binary },
    { name: 'Clients', path: '/dashboard/clients', icon: Users },
    { name: 'Threat Intelligence', path: '/dashboard/threat-intel', icon: ShieldAlert },
    { name: 'Architecture', path: '/dashboard/architecture', icon: Network },
    { name: 'Settings', path: '/dashboard/settings', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-[#0A0E1A] border-r border-[#1E293B] flex flex-col justify-between h-screen sticky top-0 shrink-0 select-none z-30 shadow-[4px_0_20px_rgba(35,45,80,0.03)]">
      <div>
        {/* Brand Header */}
        <div className="p-5 border-b border-[#1E293B]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400 shadow-sm shadow-indigo-500/20">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base font-bold tracking-tight text-white flex items-center gap-1.5">
                API Shield
              </h1>
              <p className="text-[11px] text-slate-400 font-medium tracking-wide">
                Adaptive API Defense
              </p>
            </div>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="p-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.exact}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-colors ${
                    isActive
                      ? 'bg-indigo-600/15 text-indigo-300 border border-indigo-500/30'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  }`
                }
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.name}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Footer System Status Pills */}
      <div className="p-4 border-t border-[#1E293B] space-y-2 bg-[#080C14]/60">
        <div className="text-[10px] uppercase font-bold tracking-wider text-slate-500 px-1 mb-1">
          Gateway Telemetry
        </div>

        {/* ML Engine */}
        <div className="flex items-center justify-between px-2.5 py-1.5 rounded-md bg-[#0E1422] border border-[#1E293B] text-[11px]">
          <div className="flex items-center gap-2 text-slate-300">
            <Cpu className="w-3.5 h-3.5 text-indigo-400" />
            <span>ML Engine</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className={`w-1.5 h-1.5 rounded-full ${isMlOnline ? 'bg-emerald-400 shadow-sm shadow-emerald-400 animate-pulse' : 'bg-rose-400'}`} />
            <span className={isMlOnline ? 'text-emerald-400 font-medium' : 'text-rose-400 font-medium'}>
              {isMlOnline ? 'Online' : 'Offline'}
            </span>
          </div>
        </div>

        {/* Redis */}
        <div className="flex items-center justify-between px-2.5 py-1.5 rounded-md bg-[#0E1422] border border-[#1E293B] text-[11px]">
          <div className="flex items-center gap-2 text-slate-300">
            <Database className="w-3.5 h-3.5 text-cyan-400" />
            <span>Redis State</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className={`w-1.5 h-1.5 rounded-full ${isRedisOnline ? 'bg-emerald-400 shadow-sm shadow-emerald-400' : 'bg-amber-400'}`} />
            <span className={isRedisOnline ? 'text-emerald-400 font-medium' : 'text-amber-400 font-medium'}>
              {isRedisOnline ? 'Connected' : 'Unavailable'}
            </span>
          </div>
        </div>

        {/* Gateway */}
        <div className="flex items-center justify-between px-2.5 py-1.5 rounded-md bg-[#0E1422] border border-[#1E293B] text-[11px]">
          <div className="flex items-center gap-2 text-slate-300">
            <Lock className="w-3.5 h-3.5 text-emerald-400" />
            <span>API Gateway</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span className="text-emerald-400 font-medium">Protected</span>
          </div>
        </div>

        {/* Landing link */}
        <div className="pt-2 text-center">
          <NavLink
            to="/"
            className="text-[11px] text-slate-400 hover:text-indigo-300 inline-flex items-center gap-1 transition-colors"
          >
            <span>Landing Page</span>
            <ExternalLink className="w-3 h-3" />
          </NavLink>
        </div>
      </div>
    </aside>
  );
}
