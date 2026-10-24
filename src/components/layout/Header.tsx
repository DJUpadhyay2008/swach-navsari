import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { isSupabaseConfigured } from '@/lib/supabase/client';
import {
  Sparkles,
  MapPin,
  ClipboardList,
  Search,
  ShieldCheck,
  HardHat,
  Users,
  Menu,
  X,
  Database,
} from 'lucide-react';

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const backendConfigured = isSupabaseConfigured();

  const navLinks = [
    { label: 'Home', path: '/', icon: <Sparkles className="w-4 h-4" /> },
    { label: 'Report Issue', path: '/report', icon: <ClipboardList className="w-4 h-4" /> },
    { label: 'Track Status', path: '/track', icon: <Search className="w-4 h-4" /> },
    { label: 'Community', path: '/community', icon: <Users className="w-4 h-4" /> },
    { label: 'Municipal Portal', path: '/admin', icon: <ShieldCheck className="w-4 h-4" /> },
    { label: 'Worker Portal', path: '/worker', icon: <HardHat className="w-4 h-4" /> },
  ];

  return (
    <header className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur-lg border-b border-slate-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Civic Branding */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-swach-600 via-swach-500 to-gujarat-400 p-0.5 shadow-lg shadow-swach-500/20 group-hover:shadow-swach-500/40 transition-shadow">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <span className="font-extrabold text-swach-400 text-lg tracking-tighter">
                  S
                </span>
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-base tracking-tight text-white group-hover:text-swach-300 transition-colors">
                  S.W.A.C.H.
                </span>
                <span className="text-xs font-semibold px-1.5 py-0.5 rounded bg-swach-500/10 text-swach-400 border border-swach-500/20">
                  Navsari
                </span>
              </div>
              <div className="flex items-center gap-1 text-[11px] text-slate-400 font-medium">
                <MapPin className="w-2.5 h-2.5 text-gujarat-400" />
                <span>Report. Resolve. Revive.</span>
              </div>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    'flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-swach-500/10 text-swach-400 border border-swach-500/30'
                      : 'text-slate-300 hover:text-white hover:bg-slate-900/60'
                  )}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Right Action & Backend indicator */}
          <div className="hidden lg:flex items-center gap-3">
            <div
              className={cn(
                'flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs border font-medium transition-colors',
                backendConfigured
                  ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300'
                  : 'bg-slate-900 border-slate-800 text-slate-400'
              )}
              title={
                backendConfigured
                  ? 'Supabase backend configured'
                  : 'Local frontend mode (no live backend credentials)'
              }
            >
              <Database className="w-3 h-3 text-current" />
              <span>{backendConfigured ? 'Connected' : 'Local Prep'}</span>
              <span
                className={cn(
                  'w-1.5 h-1.5 rounded-full',
                  backendConfigured ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'
                )}
              />
            </div>
            <Link
              to="/report"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-swach-600 to-swach-500 text-white shadow-md shadow-swach-500/20 hover:from-swach-500 hover:to-swach-400 transition-all active:scale-95"
            >
              <ClipboardList className="w-3.5 h-3.5" />
              <span>Report Waste</span>
            </Link>
          </div>

          {/* Mobile menu button */}
          <div className="flex md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-900 focus:outline-none"
              aria-label="Toggle mobile menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-slate-800 bg-slate-950/95 backdrop-blur-xl px-4 pt-2 pb-4 space-y-1">
          {navLinks.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMobileMenuOpen(false)}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-swach-500/10 text-swach-400 border border-swach-500/30'
                    : 'text-slate-300 hover:text-white hover:bg-slate-900'
                )}
              >
                {item.icon}
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      )}
    </header>
  );
}
