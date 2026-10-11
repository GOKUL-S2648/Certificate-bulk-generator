
import React from 'react';
import {
  Award,
  Terminal,
  CheckCircle2,
  FileCode,
  BookOpen,
  Layers,
  Plus,
  LogOut,
} from 'lucide-react';
import type { User } from '@supabase/supabase-js';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onNewJobClick: () => void;
  user?: User | null;
  onSignOut?: () => void;
  onSignIn?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  onNewJobClick,
  user,
  onSignOut,
  onSignIn,
}) => {
  const navItems = [
    { id: 'overview', label: 'Overview', icon: Layers },
    { id: 'create', label: 'Create Batch', icon: Plus },
    { id: 'jobs', label: 'Jobs & Certs', icon: Award },
    { id: 'playground', label: 'API Playground', icon: Terminal },
    { id: 'tests', label: 'Automated Tests', icon: CheckCircle2 },
    { id: 'python', label: 'Python Backend', icon: FileCode },
    { id: 'docs', label: 'Architecture & Docs', icon: BookOpen },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-[#e5e3d9] bg-[#fffdf8]/95 text-[#26352b] backdrop-blur-xl">
      <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8">
        <div className="flex h-[72px] items-center justify-between gap-4">
          {/* Brand */}
          <button
            type="button"
            onClick={() => setActiveTab('overview')}
            className="flex shrink-0 items-center gap-3 text-left"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#dce4d2] bg-[#e9eddf] text-[#405b43]">
              <Award className="h-5 w-5" />
            </span>

            <span>
              <span className="block whitespace-nowrap text-base font-bold tracking-tight text-[#26352b] sm:text-lg">
                Certify<span className="text-[#607c60]">Bulk</span>
              </span>
              <span className="hidden text-[9px] uppercase tracking-[0.16em] text-[#898b80] sm:block">
                Certificates, simplified
              </span>
            </span>
          </button>

          {/* Desktop navigation */}
          <nav className="hidden items-center gap-1 overflow-x-auto py-1 xl:flex">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveTab(item.id)}
                  className={`flex shrink-0 items-center gap-2 whitespace-nowrap rounded-xl border px-3 py-2 text-xs font-medium transition-all ${
                    isActive
                      ? 'border-[#dce4d2] bg-[#e9eddf] text-[#405b43]'
                      : 'border-transparent text-[#77796e] hover:border-[#e8e6dc] hover:bg-[#f6f3eb] hover:text-[#26352b]'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Actions and user profile */}
          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={onNewJobClick}
              className="flex items-center gap-2 whitespace-nowrap rounded-xl bg-[#405b43] px-3 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-[#304a35] active:scale-[0.98] sm:px-4"
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">New Batch Job</span>
              <span className="sm:hidden">New Batch</span>
            </button>

            {user ? (
              <div className="flex items-center gap-2 border-l border-[#e5e3d9] pl-2 sm:pl-3">
                {user.user_metadata?.avatar_url ? (
                  <img
                    src={user.user_metadata.avatar_url}
                    alt={user.email || 'User'}
                    className="h-8 w-8 rounded-full border border-[#dce4d2] object-cover"
                  />
                ) : (
                  <span className="flex h-8 w-8 items-center justify-center rounded-full border border-[#dce4d2] bg-[#e9eddf] text-xs font-semibold text-[#405b43]">
                    {(user.email?.[0] || 'U').toUpperCase()}
                  </span>
                )}

                <span
                  className="hidden max-w-[125px] truncate text-xs text-[#60685c] 2xl:inline-block"
                  title={user.email}
                >
                  {user.user_metadata?.full_name || user.email}
                </span>

                {onSignOut && (
                  <button
                    type="button"
                    onClick={onSignOut}
                    title="Sign Out"
                    aria-label="Sign out"
                    className="rounded-lg p-2 text-[#77796e] transition hover:bg-[#f8e9e5] hover:text-[#b5473c]"
                  >
                    <LogOut className="h-4 w-4" />
                  </button>
                )}
              </div>
            ) : onSignIn ? (
              <button
                type="button"
                onClick={onSignIn}
                className="rounded-xl px-3 py-2 text-xs font-semibold text-[#405b43] transition hover:bg-[#e9eddf]"
              >
                Sign In
              </button>
            ) : null}
          </div>
        </div>

        {/* Responsive navigation */}
        <nav className="no-scrollbar flex gap-1 overflow-x-auto border-t border-[#eeece3] py-2 xl:hidden">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                className={`flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-2 text-xs font-medium transition ${
                  isActive
                    ? 'bg-[#e9eddf] text-[#405b43]'
                    : 'text-[#77796e] hover:bg-[#f6f3eb] hover:text-[#26352b]'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
