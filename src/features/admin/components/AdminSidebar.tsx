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
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react';
import { cn } from '@/lib/utils';

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
  const navItems = [
    { label: 'Overview', path: '/admin', end: true, icon: <LayoutDashboard className="w-4 h-4" /> },
    { label: 'Complaint Queue', path: '/admin/reports', end: false, icon: <ClipboardList className="w-4 h-4" /> },
    { label: 'Worker Assignments', path: '/admin/assignments', end: false, icon: <UserCheck className="w-4 h-4" /> },
    { label: 'Resolution Verifications', path: '/admin/verifications', end: false, icon: <CheckCircle2 className="w-4 h-4" /> },
    { label: 'Ward Geo Map', path: '/admin/map', end: false, icon: <MapPin className="w-4 h-4" /> },
    { label: 'Operational Analytics', path: '/admin/analytics', end: false, icon: <BarChart3 className="w-4 h-4" /> },
    { label: 'Staff Directory', path: '/admin/staff', end: false, icon: <Users className="w-4 h-4" /> },
    { label: 'Civic Audit Trail', path: '/admin/audit', end: false, icon: <History className="w-4 h-4" /> },
  ];

  const content = (
    <div className="h-full flex flex-col justify-between bg-slate-950/95 backdrop-blur-xl border-r border-slate-800/80">
      {/* Top Brand Identity */}
      <div>
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-800">
          <Link to="/admin" className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-swach-600 via-swach-500 to-gujarat-400 p-0.5 shadow-md shadow-swach-500/20 shrink-0">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <span className="font-extrabold text-swach-400 text-sm tracking-tighter">S</span>
              </div>
            </div>
            {!isCollapsed && (
              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-sm text-white tracking-tight truncate">
                    S.W.A.C.H.
                  </span>
                  <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-swach-500/10 text-swach-400 border border-swach-500/20">
                    Navsari
                  </span>
                </div>
                <span className="text-[10px] font-semibold text-slate-400 tracking-wide uppercase truncate">
                  Municipal Operations
                </span>
              </div>
            )}
          </Link>

          {/* Collapse button on desktop */}
          <button
            type="button"
            onClick={onToggleCollapse}
            className="hidden lg:flex p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-900 transition-colors"
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
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-colors group',
                  isActive
                    ? 'bg-swach-500/10 text-swach-400 font-bold border border-swach-500/30 shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
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
          <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-[11px] text-slate-300 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 shrink-0 text-swach-400" />
            <div className="min-w-0">
              <p className="font-bold truncate text-white">Navsari Municipal Corp</p>
              <p className="text-[10px] text-slate-400">Zone Operations Station</p>
            </div>
          </div>
        )}

        <Link
          to="/"
          className={cn(
            'flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-900/60 transition-colors',
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
          'fixed inset-y-0 left-0 z-50 w-72 bg-slate-950 border-r border-slate-800 shadow-2xl transform transition-transform duration-200 lg:hidden',
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {content}
      </div>
    </>
  );
}
