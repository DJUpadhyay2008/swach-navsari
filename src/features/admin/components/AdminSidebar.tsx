import { NavLink, Link } from 'react-router-dom';
import {
  LayoutDashboard,
  ClipboardList,
  UserCheck,
  CheckCircle2,
  MapPin,
  BarChart3,
  Users,
  History,
  Settings,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Leaf,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/features/auth';

interface AdminSidebarProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

export function AdminSidebar({
  isCollapsed,
  onToggleCollapse,
  mobileOpen,
  onCloseMobile,
}: AdminSidebarProps) {
  const { profile } = useAuth();
  const displayName = profile?.full_name || 'Rakesh Desai';

  const navItems = [
    { label: 'Dashboard', path: '/admin', end: true, icon: <LayoutDashboard className="w-4 h-4" /> },
    { label: 'Reports', path: '/admin/reports', end: false, icon: <ClipboardList className="w-4 h-4" /> },
    { label: 'Assignments', path: '/admin/assignments', end: false, icon: <UserCheck className="w-4 h-4" /> },
    { label: 'Verifications', path: '/admin/verifications', end: false, icon: <CheckCircle2 className="w-4 h-4" /> },
    { label: 'City Map', path: '/admin/map', end: false, icon: <MapPin className="w-4 h-4" /> },
    { label: 'Analytics', path: '/admin/analytics', end: false, icon: <BarChart3 className="w-4 h-4" /> },
    { label: 'Staff & Roles', path: '/admin/staff', end: false, icon: <Users className="w-4 h-4" /> },
    { label: 'Audit Log', path: '/admin/audit', end: false, icon: <History className="w-4 h-4" /> },
    { label: 'Settings', path: '/profile', end: false, icon: <Settings className="w-4 h-4" /> },
  ];

  const content = (
    <div className="h-full flex flex-col justify-between bg-slate-900 border-r border-slate-800 text-slate-300">
      {/* Top Brand Identity */}
      <div>
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-800">
          <Link to="/admin" className="flex items-center gap-2.5 overflow-hidden group">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
              <Leaf className="w-4 h-4 fill-emerald-400/20" />
            </div>
            {!isCollapsed && (
              <div className="flex flex-col min-w-0">
                <span className="font-bold text-sm text-white tracking-tight truncate group-hover:text-emerald-300 transition-colors">
                  My Clean Navsari
                </span>
                <span className="text-[10px] font-semibold text-emerald-400 uppercase tracking-wider">
                  NMC Portal
                </span>
              </div>
            )}
          </Link>

          {/* Collapse button on desktop */}
          <button
            type="button"
            onClick={onToggleCollapse}
            className="hidden lg:flex p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="p-3 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.end}
              onClick={onCloseMobile}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-colors group',
                  isActive
                    ? 'bg-slate-800 text-white font-bold border border-slate-700 shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                )
              }
              title={isCollapsed ? item.label : undefined}
            >
              <div className="shrink-0">{item.icon}</div>
              {!isCollapsed && <span className="truncate">{item.label}</span>}
            </NavLink>
          ))}
        </nav>
      </div>

      {/* Bottom Authority & Return to Citizen Portal */}
      <div className="p-3 border-t border-slate-800 space-y-2">
        {!isCollapsed && (
          <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 text-xs flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold shrink-0">
              {displayName.charAt(0)}
            </div>
            <div className="min-w-0">
              <p className="font-bold truncate text-white leading-tight">{displayName}</p>
              <p className="text-[10px] text-slate-400">Ward Officer</p>
            </div>
          </div>
        )}

        <Link
          to="/"
          className={cn(
            'flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors',
            isCollapsed && 'justify-center'
          )}
          title="Exit to Citizen Portal"
        >
          <ExternalLink className="w-3.5 h-3.5 shrink-0" />
          {!isCollapsed && <span>Public Portal</span>}
        </Link>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={cn(
          'hidden lg:block shrink-0 transition-all duration-200 z-30',
          isCollapsed ? 'w-20' : 'w-64'
        )}
      >
        <div
          className="fixed top-0 bottom-0 left-0 transition-all duration-200 z-30 overflow-hidden"
          style={{ width: isCollapsed ? '5rem' : '16rem' }}
        >
          {content}
        </div>
      </aside>

      {/* Mobile Drawer Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/80 backdrop-blur-sm lg:hidden animate-fade-in"
          onClick={onCloseMobile}
        />
      )}

      {/* Mobile Drawer */}
      <div
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-72 bg-slate-900 border-r border-slate-800 shadow-2xl transform transition-transform duration-200 lg:hidden',
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {content}
      </div>
    </>
  );
}
