import { Menu, LogOut, Search } from 'lucide-react';
import { useAuth } from '@/features/auth';
import { Link } from 'react-router-dom';

interface AdminHeaderProps {
  onOpenMobileNav: () => void;
}

export function AdminHeader({ onOpenMobileNav }: AdminHeaderProps) {
  const { user, profile, signOut } = useAuth();
  const displayName = profile?.full_name || user?.email?.split('@')[0] || 'Official';

  return (
    <header className="sticky top-0 z-20 h-16 bg-slate-950/80 backdrop-blur-md border-b border-slate-800/80 px-4 sm:px-6 flex items-center justify-between">
      {/* Left: Mobile hamburger & breadcrumb */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onOpenMobileNav}
          className="lg:hidden p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-900 transition-colors"
          aria-label="Open Navigation Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400">
          <span className="font-semibold text-slate-200">Navsari Municipality</span>
          <span>/</span>
          <span className="font-medium text-swach-400">Command & Operations</span>
        </div>
      </div>

      {/* Right: Quick actions & Official Identity */}
      <div className="flex items-center gap-3">
        {/* Quick Search */}
        <Link
          to="/admin/reports"
          className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 transition-colors"
        >
          <Search className="w-3.5 h-3.5 text-slate-500" />
          <span>Search Complaints...</span>
          <kbd className="text-[10px] bg-slate-800 border border-slate-700 rounded px-1 text-slate-400 font-mono">
            NAV-
          </kbd>
        </Link>

        {/* Official User Profile */}
        <div className="flex items-center gap-2.5 pl-2 border-l border-slate-800">
          <div className="w-8 h-8 rounded-full bg-swach-500/10 border border-swach-500/30 flex items-center justify-center text-swach-400 font-bold text-xs">
            {displayName.charAt(0).toUpperCase()}
          </div>
          <div className="hidden sm:block text-left">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-slate-200 leading-none">
                {displayName}
              </span>
              <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded-full bg-swach-500/10 text-swach-400 border border-swach-500/20 leading-tight">
                Official
              </span>
            </div>
            <span className="text-[10px] text-slate-400 font-mono leading-none">
              {user?.email}
            </span>
          </div>

          {/* Sign Out Button */}
          <button
            type="button"
            onClick={() => signOut()}
            title="Sign Out of Municipal Operations"
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors ml-1"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
