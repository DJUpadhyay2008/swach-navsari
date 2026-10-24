import { ReactNode } from 'react';
import { Navigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '@/features/auth';
import { ShieldAlert, LogIn, FileText, ShieldCheck, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface WorkerGuardProps {
  children?: ReactNode;
}

export function WorkerGuard({ children }: WorkerGuardProps) {
  const { user, roles, isLoading, signOut } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 animate-spin mb-4">
          <RefreshCw className="w-6 h-6" />
        </div>
        <p className="text-sm font-semibold text-slate-900">Verifying Worker Session...</p>
        <p className="text-xs text-slate-500 mt-1">Checking field worker assignment authorization</p>
      </div>
    );
  }

  if (!user) {
    const returnTo = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/auth?returnTo=${returnTo}`} replace />;
  }

  const isWorker = roles.includes('sanitation_worker');
  const isOfficial = roles.includes('municipal_official');

  if (!isWorker && !isOfficial) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 sm:p-6 text-slate-900">
        <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200 shadow-xl p-6 sm:p-8 text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center mx-auto text-amber-600">
            <ShieldAlert className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
              403 Forbidden — Field Worker Only
            </div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Sanitation Worker Portal
            </h1>
            <p className="text-xs text-slate-500 leading-relaxed">
              Your account <span className="font-semibold text-slate-800 font-mono">({user.email})</span> is authenticated as:
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
            <p className="font-semibold text-slate-900">Worker RLS Boundary:</p>
            <p>
              This portal is restricted to active municipal sanitation field personnel dispatched by Navsari zone supervisors.
            </p>
          </div>

          <div className="flex flex-col gap-2 pt-2">
            <Link to="/my-reports" className="w-full">
              <Button variant="primary" className="w-full" leftIcon={<FileText className="w-4 h-4" />}>
                Go to Citizen My Reports
              </Button>
            </Link>
            {isOfficial && (
              <Link to="/admin" className="w-full">
                <Button variant="outline" className="w-full" leftIcon={<ShieldCheck className="w-4 h-4" />}>
                  Go to Municipal Admin Portal
                </Button>
              </Link>
            )}
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

  return <>{children}</>;
}
