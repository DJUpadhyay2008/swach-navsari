import { useState, useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { isSupabaseConfigured } from '@/lib/supabase/client';
import { useAuth } from '@/features/auth';
import { DemoToggle } from '@/lib/demo';
import {
  Sparkles,
  ClipboardList,
  Search,
  ShieldCheck,
  HardHat,
  Users,
  Menu,
  X,
  Database,
  FileText,
  LogIn,
  LogOut,
  User,
  Leaf,
  Map,
} from 'lucide-react';

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const backendConfigured = isSupabaseConfigured();
  const { user, profile, roles, isLoading, signOut } = useAuth();

  const isOfficial = !isLoading && !!user && roles.includes('municipal_official');
  const isWorker = !isLoading && !!user && roles.includes('sanitation_worker');
  const isCitizen = !isLoading && !!user && !isOfficial && !isWorker;

  // Build role-appropriate navigation items
  const navLinks = useMemo(() => {
    if (isLoading) {
      return [
        { label: 'Home', path: '/', icon: <Sparkles className="w-4 h-4" /> },
        { label: 'Map', path: '/map', icon: <Map className="w-4 h-4" /> },
        { label: 'Track Status', path: '/track', icon: <Search className="w-4 h-4" /> },
      ];
    }

    if (!user) {
      return [
        { label: 'Home', path: '/', icon: <Sparkles className="w-4 h-4" /> },
        { label: 'Map', path: '/map', icon: <Map className="w-4 h-4" /> },
        { label: 'Community', path: '/community', icon: <Users className="w-4 h-4" /> },
        { label: 'Track Status', path: '/track', icon: <Search className="w-4 h-4" /> },
      ];
    }

    if (isOfficial) {
      return [
        { label: 'Municipal Portal', path: '/admin', icon: <ShieldCheck className="w-4 h-4" /> },
        { label: 'City Map', path: '/admin/map', icon: <Map className="w-4 h-4" /> },
        { label: 'Community', path: '/community', icon: <Users className="w-4 h-4" /> },
        { label: 'Track Status', path: '/track', icon: <Search className="w-4 h-4" /> },
      ];
    }

    if (isWorker) {
      return [
        { label: 'Worker Portal', path: '/worker', icon: <HardHat className="w-4 h-4" /> },
        { label: 'Track Status', path: '/track', icon: <Search className="w-4 h-4" /> },
      ];
    }

    // Default: Citizen
    return [
      { label: 'Home', path: '/', icon: <Sparkles className="w-4 h-4" /> },
      { label: 'Map', path: '/map', icon: <Map className="w-4 h-4" /> },
      { label: 'My Reports', path: '/my-reports', icon: <FileText className="w-4 h-4" /> },
      { label: 'Community', path: '/community', icon: <Users className="w-4 h-4" /> },
      { label: 'Track Status', path: '/track', icon: <Search className="w-4 h-4" /> },
    ];
  }, [isLoading, user, isOfficial, isWorker]);

  const roleLabel = isOfficial
    ? 'Official'
    : isWorker
    ? 'Worker'
    : 'Citizen';

  const displayName = profile?.full_name || user?.email?.split('@')[0] || roleLabel;

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Civic Branding */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-sm shadow-emerald-500/20 group-hover:bg-emerald-500 transition-colors">
              <Leaf className="w-5 h-5 fill-white/20 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-base tracking-tight text-slate-900 group-hover:text-emerald-600 transition-colors">
                  My Clean Navsari
                </span>
                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                  NMC
                </span>
              </div>
              <div className="flex items-center gap-1 text-[11px] text-slate-500 font-medium">
                <span>Clean City • Stronger Community</span>
              </div>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1">
            {navLinks.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    'flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-colors',
                    isActive
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  )}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Right Action & Backend / Auth indicators */}
          <div className="hidden md:flex items-center gap-3">
            <DemoToggle />

            <div
              className={cn(
                'flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs border font-medium transition-colors',
                backendConfigured
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                  : 'bg-slate-100 border-slate-200 text-slate-500'
              )}
            >
              <Database className="w-3 h-3 text-current" />
              <span>{backendConfigured ? 'Connected' : 'Local Prep'}</span>
              <span
                className={cn(
                  'w-1.5 h-1.5 rounded-full',
                  backendConfigured ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
                )}
              />
            </div>

            {/* Auth Session Status */}
            {user ? (
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-100 border border-slate-200 text-xs text-slate-800">
                  <User className="w-3 h-3 text-emerald-600" />
                  <span className="max-w-[100px] truncate font-medium">{displayName}</span>
                  <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-white text-slate-600 border border-slate-200 uppercase">
                    {roleLabel}
                  </span>
                </span>
                <button
                  onClick={() => signOut()}
                  className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                  title="Sign out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <Link
                to="/auth"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-colors"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </Link>
            )}

            {/* Report Waste button for citizen & signed-out users */}
            {(!user || isCitizen) && (
              <Link
                to="/report"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs transition-all active:scale-95"
              >
                <ClipboardList className="w-3.5 h-3.5" />
                <span>Report Waste</span>
              </Link>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="flex lg:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 focus:outline-none"
              aria-label="Toggle mobile menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu dropdown */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-b border-slate-200 bg-white px-4 pt-2 pb-4 space-y-2">
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
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100'
                )}
              >
                {item.icon}
                <span>{item.label}</span>
              </Link>
            );
          })}

          {(!user || isCitizen) && (
            <Link
              to="/report"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-center gap-2 w-full py-2.5 text-xs font-semibold rounded-xl bg-emerald-600 text-white shadow-xs"
            >
              <ClipboardList className="w-4 h-4" />
              <span>Report Waste</span>
            </Link>
          )}

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-500 font-medium">Demo Dataset:</span>
            <DemoToggle />
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
            {user ? (
              <div className="flex items-center justify-between w-full">
                <span className="text-xs text-slate-700">
                  {displayName} ({roleLabel})
                </span>
                <button
                  onClick={() => {
                    signOut();
                    setMobileMenuOpen(false);
                  }}
                  className="text-xs text-rose-600 font-medium hover:underline flex items-center gap-1"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Sign Out
                </button>
              </div>
            ) : (
              <Link
                to="/auth"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center py-2 text-xs font-semibold rounded-xl bg-slate-100 border border-slate-200 text-slate-800"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
