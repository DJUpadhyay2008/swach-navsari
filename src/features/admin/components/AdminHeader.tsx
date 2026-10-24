import { Menu, LogOut, Search, Bell } from 'lucide-react';
import { useAuth } from '@/features/auth';
import { Link } from 'react-router-dom';

interface AdminHeaderProps {
  onOpenMobileNav: () => void;
}

export function AdminHeader({ onOpenMobileNav }: AdminHeaderProps) {
  const { user, profile, signOut } = useAuth();
  const displayName = profile?.full_name || 'Rakesh Desai';

  return (
    <header className="sticky top-0 z-20 h-16 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between shadow-xs">
      {/* Left: Mobile hamburger & breadcrumb */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onOpenMobileNav}
          className="lg:hidden p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
          aria-label="Open Navigation Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="hidden sm:flex items-center gap-2 text-xs text-slate-500">
          <span className="font-semibold text-slate-900">Dashboard</span>
          <span>/</span>
          <span className="font-medium text-emerald-600">NMC Command Operations</span>
        </div>
      </div>

      {/* Right: Quick actions & Official Identity */}
      <div className="flex items-center gap-3">
        {/* Quick Search */}
        <Link
          to="/admin/reports"
          className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
        >
          <Search className="w-3.5 h-3.5 text-slate-400" />
          <span>Search by ID, location, category...</span>
          <kbd className="text-[10px] bg-white border border-slate-200 rounded px-1.5 text-slate-500 font-mono shadow-xs">
            /
          </kbd>
        </Link>

        {/* Notifications Icon */}
        <button
          type="button"
          className="p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors relative"
          title="Notifications"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-white" />
        </button>

        {/* Official User Profile */}
        <div className="flex items-center gap-2.5 pl-2 border-l border-slate-200">
          <div className="w-8 h-8 rounded-full bg-emerald-100 border border-emerald-300 flex items-center justify-center text-emerald-800 font-bold text-xs">
            {displayName.charAt(0).toUpperCase()}
          </div>
          <div className="hidden sm:block text-left">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-slate-900 leading-none">
                {displayName}
              </span>
              <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 leading-tight">
                Ward Officer
              </span>
            </div>
            <span className="text-[10px] text-slate-500 font-mono leading-none">
              {user?.email || 'ward.officer@navsari.gov.in'}
            </span>
          </div>

          {/* Sign Out Button */}
          <button
            type="button"
            onClick={() => signOut()}
            title="Sign Out of Municipal Operations"
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors ml-1"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
