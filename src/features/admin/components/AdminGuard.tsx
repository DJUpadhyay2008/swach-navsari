import React from 'react';
import { Navigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '@/features/auth';
import { ShieldAlert, LogIn, HardHat, Home, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface AdminGuardProps {
  children?: React.ReactNode;
}

export function AdminGuard({ children }: AdminGuardProps) {
  const { user, roles, isLoading, signOut } = useAuth();
  const location = useLocation();

  // 1. Loading state — strictly prevent premature redirects or flashes of protected UI
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F7FAFC] flex flex-col items-center justify-center p-4">
        <div className="w-12 h-12 rounded-2xl bg-teal-50 border border-teal-200 flex items-center justify-center text-[#087F7B] animate-spin mb-4">
          <RefreshCw className="w-6 h-6" />
        </div>
        <p className="text-sm font-semibold text-[#172B3A]">Verifying Municipal Credentials...</p>
        <p className="text-xs text-[#64748B] mt-1">Checking cryptographic session against public.user_roles</p>
      </div>
    );
  }

  // 2. Unauthenticated — redirect to /auth with return path
  if (!user) {
    const returnTo = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/auth?returnTo=${returnTo}`} replace />;
  }

  // 3. Authenticated but lacks municipal_official role — render secure Access Denied view
  const isOfficial = roles.includes('municipal_official');
  const isWorker = roles.includes('sanitation_worker');

  if (!isOfficial) {
    return (
      <div className="min-h-screen bg-[#F7FAFC] flex items-center justify-center p-4 sm:p-6">
        <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200 shadow-xl shadow-slate-200/50 p-6 sm:p-8 text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center mx-auto text-rose-600">
            <ShieldAlert className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800">
              403 Forbidden — Restricted Authority
            </div>
            <h1 className="text-2xl font-bold text-[#172B3A] tracking-tight">
              Municipal Official Access Required
            </h1>
            <p className="text-xs text-[#64748B] leading-relaxed">
              Your account <span className="font-semibold text-slate-700 font-mono">({user.email})</span> is authenticated with role:
            </p>
            <div className="flex justify-center gap-2 pt-1">
              {roles.map((r) => (
                <span
                  key={r}
                  className="px-2.5 py-1 rounded-md text-xs font-mono font-medium bg-slate-100 text-slate-700 border border-slate-200"
                >
                  {r}
                </span>
              ))}
            </div>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-left text-xs text-slate-600 space-y-1">
            <p className="font-semibold text-[#172B3A]">Security Enforcement Notice:</p>
            <p>
              Under Gujarat Municipalities Act regulations, administrative triage and worker dispatching are restricted to designated municipal officers. Database Row Level Security (RLS) blocks unauthorized queries.
            </p>
          </div>

          <div className="flex flex-col gap-2 pt-2">
            {isWorker && (
              <Link to="/worker" className="w-full">
                <Button variant="primary" className="w-full bg-[#087F7B] hover:bg-[#066461]" leftIcon={<HardHat className="w-4 h-4" />}>
                  Go to Worker Sanitation Portal
                </Button>
              </Link>
            )}
            <Link to="/" className="w-full">
              <Button variant="outline" className="w-full" leftIcon={<Home className="w-4 h-4" />}>
                Return to Citizen Portal
              </Button>
            </Link>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => signOut()}
              className="text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50"
              leftIcon={<LogIn className="w-3.5 h-3.5" />}
            >
              Sign Out & Switch Account
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // 4. Authorized official
  return <>{children}</>;
}
