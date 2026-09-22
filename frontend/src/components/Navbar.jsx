import React, { useState } from 'react';
import { Bell, ChevronDown, LogOut, Mail, Search, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { authApi } from '../services/api';

export default function Navbar({ user, overview, title, subtitle }) {
  const navigate = useNavigate();
  const [profileOpen, setProfileOpen] = useState(false);

  const displayName = user?.name || 'Administrator';
  const initials = displayName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('') || 'A';

  const handleLogout = async () => {
    try {
      await authApi.logout();
    } finally {
      setProfileOpen(false);
      navigate('/login', { replace: true });
    }
  };

  return (
    <header className="dashboard-topbar px-5 sm:px-7 lg:px-8 py-4 flex items-center justify-between gap-4">
      <div className="flex items-center gap-4 min-w-0">
        <div className="dashboard-mobile-brand lg:hidden">API Shield</div>
        <div className="dashboard-search hidden md:flex items-center gap-2">
          <Search className="w-4 h-4 text-[#9aa0a8]" />
          <span>Search dashboard...</span>
        </div>
        <div className="hidden lg:block min-w-0">
          <p className="text-sm font-semibold text-[#24272b] truncate">{title}</p>
          <p className="text-[11px] text-[#92979d] truncate">{subtitle}</p>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <div className="dashboard-live-pill hidden xl:flex">
          <span className={`dashboard-live-dot ${overview?.mlEngineOnline ? 'is-online' : ''}`} />
          {overview?.mlEngineOnline ? 'Protection live' : 'ML unavailable'}
        </div>

        <button type="button" aria-label="Notifications" className="dashboard-icon-button">
          <Bell className="w-4 h-4" />
        </button>

        <div className="relative">
          <button
            type="button"
            aria-label="Open admin profile"
            aria-expanded={profileOpen}
            onClick={() => setProfileOpen((open) => !open)}
            className="dashboard-profile-button"
          >
            <span className="dashboard-avatar">{initials}</span>
            <span className="hidden sm:block leading-tight">
              <span className="block max-w-[130px] truncate text-xs font-semibold text-[#30343a]">{displayName}</span>
              <span className="block text-[10px] text-[#969ba1]">Administrator</span>
            </span>
            <ChevronDown className={`w-3.5 h-3.5 text-[#858b92] transition-transform ${profileOpen ? 'rotate-180' : ''}`} />
          </button>

          {profileOpen && (
            <div className="dashboard-profile-menu absolute right-0 top-full mt-3 w-72 p-4 z-50">
              <div className="flex items-center gap-3 pb-4 border-b border-[#e2e6e9]">
                <span className="dashboard-avatar dashboard-avatar-large">{initials}</span>
                <div className="min-w-0">
                  <p className="font-semibold text-[#25282c] truncate">{displayName}</p>
                  <p className="text-xs text-[#5c7ca1]">Administrator</p>
                </div>
              </div>
              <div className="py-4 space-y-3 text-xs text-[#747b83]">
                <div className="flex items-start gap-3">
                  <Mail className="w-4 h-4 shrink-0 text-[#9aa0a8]" />
                  <span className="break-all">{user?.email || 'Email unavailable'}</span>
                </div>
                <div className="flex items-center gap-3">
                  <ShieldCheck className="w-4 h-4 shrink-0 text-[#3d9b71]" />
                  <span>Dashboard access: protected</span>
                </div>
              </div>
              <button
                type="button"
                onClick={handleLogout}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-[#e0e4e7] bg-[#f5f7f8] px-3 py-2.5 text-xs font-medium text-[#687078] transition hover:border-rose-300 hover:text-rose-500"
              >
                <LogOut className="w-3.5 h-3.5" />
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
