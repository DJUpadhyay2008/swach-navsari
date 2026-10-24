import { ReactNode } from 'react';
import { Navigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '@/features/auth';
import { ShieldAlert, LogIn, HardHat, FileText, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface AdminGuardProps {
  children?: ReactNode;
}

export function AdminGuard({ children }: AdminGuardProps) {
  const { user, roles, isLoading, signOut } = useAuth();
  const location = useLocation();

  // 1. Loading state — strictly prevent premature redirects or flashes of protected UI
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
        <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-swach-400 animate-spin mb-4">
          <RefreshCw className="w-6 h-6" />
        </div>
        <p className="text-sm font-semibold text-white">Verifying Municipal Credentials...</p>
        <p className="text-xs text-slate-400 mt-1">Checking cryptographic session against public.user_roles</p>
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
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 sm:p-6 text-slate-100">
        <div className="max-w-md w-full bg-slate-900 rounded-2xl border border-slate-800 shadow-2xl p-6 sm:p-8 text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center mx-auto text-rose-400">
            <ShieldAlert className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
              403 Forbidden — Restricted Authority
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Municipal Official Access Required
            </h1>
            <p className="text-xs text-slate-400 leading-relaxed">
              Your account <span className="font-semibold text-slate-200 font-mono">({user.email})</span> is authenticated with role:
            </p>
            <div className="flex justify-center gap-2 pt-1">
              {roles.map((r) => (
                <span
                  key={r}
                  className="px-2.5 py-1 rounded-md text-xs font-mono font-medium bg-slate-800 text-slate-300 border border-slate-700"
                >
                  {r}
                </span>
              ))}
            </div>
          </div>

          <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 text-left text-xs text-slate-400 space-y-1">
            <p className="font-semibold text-slate-200">Security Enforcement Notice:</p>
            <p>
              Under Gujarat Municipalities Act regulations, administrative triage and worker dispatching are restricted to designated municipal officers. Database Row Level Security (RLS) blocks unauthorized queries.
            </p>
          </div>

          <div className="flex flex-col gap-2 pt-2">
            {isWorker && (
              <Link to="/worker" className="w-full">
                <Button variant="primary" className="w-full" leftIcon={<HardHat className="w-4 h-4" />}>
                  Go to Worker Sanitation Portal
                </Button>
              </Link>
            )}
            <Link to="/my-reports" className="w-full">
              <Button variant={isWorker ? "outline" : "primary"} className="w-full" leftIcon={<FileText className="w-4 h-4" />}>
                Go to My Reports
              </Button>
            </Link>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => signOut()}
              className="text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-500/10"
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
