import React from 'react';
import { Award, Terminal, CheckCircle2, FileCode, BookOpen, Layers, Plus, LogOut } from 'lucide-react';
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
    <header className="sticky top-0 z-40 bg-slate-900 border-b border-slate-800 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-8 h-16">
          {/* Zone 1: Single Brand Wordmark */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Award className="w-4 h-4" />
            </div>
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                setActiveTab('overview');
              }}
              className="text-lg font-bold tracking-tight text-white whitespace-nowrap hover:text-amber-400 transition-colors"
            >
              CertifyBulk API
            </a>
          </div>

          {/* Zone 2: Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1 overflow-x-auto py-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                    isActive
                      ? 'bg-slate-800 text-white border border-slate-700 shadow-xs'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Zone 3: Primary Action & Authentication */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={onNewJobClick}
              className="flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-slate-900 bg-amber-400 rounded-lg hover:bg-amber-300 transition-colors whitespace-nowrap shrink-0 shadow-xs active:scale-[0.98] cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>New Batch Job</span>
            </button>

            {user ? (
              <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
                {user.user_metadata?.avatar_url ? (
                  <img
                    src={user.user_metadata.avatar_url}
                    alt={user.email || 'User'}
                    className="w-7 h-7 rounded-full border border-slate-700 object-cover"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 text-xs font-semibold">
                    {(user.email?.[0] || 'U').toUpperCase()}
                  </div>
                )}
                <span className="hidden xl:inline-block text-xs text-slate-300 max-w-[130px] truncate" title={user.email}>
                  {user.user_metadata?.full_name || user.email}
                </span>
                {onSignOut && (
                  <button
                    onClick={onSignOut}
                    title="Sign Out"
                    className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-md transition-colors cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                )}
              </div>
            ) : onSignIn ? (
              <button
                onClick={onSignIn}
                className="text-xs text-amber-400 hover:text-amber-300 font-medium px-2.5 py-1.5 rounded-md hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Sign In
              </button>
            ) : null}
          </div>
        </div>

        {/* Mobile Navigation bar */}
        <div className="lg:hidden flex items-center gap-1 overflow-x-auto py-2 border-t border-slate-800/80 no-scrollbar">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md whitespace-nowrap shrink-0 ${
                  isActive
                    ? 'bg-slate-800 text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Icon className="w-3 h-3" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
