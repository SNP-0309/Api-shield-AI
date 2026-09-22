import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  ShieldAlert, 
  Activity, 
  Users, 
  Binary, 
  Settings, 
  Cpu, 
  Database, 
  Lock
} from 'lucide-react';

export default function Sidebar({ overview }) {
  const isMlOnline = overview?.mlEngineOnline ?? false;
  const isRedisOnline = overview?.redisOnline ?? false;
  const isRedisFallback = overview?.redisFallback ?? false;
  const isRedisReady = isRedisOnline || isRedisFallback;

  const navItems = [
    { name: 'Overview', path: '/dashboard', icon: Activity, exact: true },
    { name: 'Live Traffic', path: '/dashboard/traffic', icon: Binary },
    { name: 'Clients', path: '/dashboard/clients', icon: Users },
    { name: 'Threat Intelligence', path: '/dashboard/threat-intel', icon: ShieldAlert },
    { name: 'Settings', path: '/dashboard/settings', icon: Settings },
  ];

  return (
    <aside className="dashboard-sidebar w-60 flex flex-col justify-between shrink-0 select-none z-30">
      <div>
        {/* Brand Header */}
        <div className="dashboard-sidebar-brand p-5">
          <div className="flex items-center gap-3">
            <div className="dashboard-logo w-9 h-9 rounded-xl flex items-center justify-center">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base font-bold tracking-tight text-[#202020] flex items-center gap-1.5">
                API Shield
              </h1>
              <p className="text-[10px] text-[#8a8d94] font-medium tracking-wide">
                Adaptive API Defense
              </p>
            </div>
          </div>
        </div>

        {/* Navigation Items */}
        <div className="px-5 pt-6 pb-2 text-[10px] uppercase tracking-[0.16em] font-semibold text-[#a0a3a8]">Workspace</div>
        <nav className="px-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.exact}
                className={({ isActive }) =>
                    `dashboard-sidebar-link flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-colors ${
                    isActive
                      ? 'dashboard-sidebar-link-active'
                      : ''
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
      <div className="dashboard-sidebar-footer p-4 space-y-2">
        <div className="text-[10px] uppercase font-bold tracking-wider text-[#a0a3a8] px-1 mb-1">
          System health
        </div>

        {/* ML Engine */}
        <div className="dashboard-health-row flex items-center justify-between px-2.5 py-1.5 rounded-lg text-[11px]">
          <div className="flex items-center gap-2 text-[#646a73]">
            <Cpu className="w-3.5 h-3.5 text-[#607fa3]" />
            <span>ML Engine</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className={`w-1.5 h-1.5 rounded-full ${isMlOnline ? 'bg-emerald-400 shadow-sm shadow-emerald-400 animate-pulse' : 'bg-rose-400'}`} />
            <span className={isMlOnline ? 'text-[#3b9b72] font-medium' : 'text-[#cf5a57] font-medium'}>
              {isMlOnline ? 'Online' : 'Offline'}
            </span>
          </div>
        </div>

        {/* Redis */}
        <div className="dashboard-health-row flex items-center justify-between px-2.5 py-1.5 rounded-lg text-[11px]">
          <div className="flex items-center gap-2 text-[#646a73]">
            <Database className="w-3.5 h-3.5 text-[#607fa3]" />
            <span>Redis State</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className={`w-1.5 h-1.5 rounded-full ${isRedisOnline ? 'bg-emerald-400 shadow-sm shadow-emerald-400' : isRedisFallback ? 'bg-amber-400' : 'bg-rose-400'}`} />
            <span className={isRedisOnline ? 'text-[#3b9b72] font-medium' : isRedisFallback ? 'text-[#c28c2d] font-medium' : 'text-[#cf5a57] font-medium'}>
              {isRedisOnline ? 'Connected' : isRedisReady ? 'Local fallback' : 'Unavailable'}
            </span>
          </div>
        </div>

        {/* Gateway */}
        <div className="dashboard-health-row flex items-center justify-between px-2.5 py-1.5 rounded-lg text-[11px]">
          <div className="flex items-center gap-2 text-[#646a73]">
            <Lock className="w-3.5 h-3.5 text-[#3b9b72]" />
            <span>API Gateway</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span className="text-[#3b9b72] font-medium">Protected</span>
          </div>
        </div>

      </div>
    </aside>
  );
}
