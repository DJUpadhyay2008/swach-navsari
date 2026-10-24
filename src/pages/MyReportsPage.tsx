import { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/features/auth';
import { getCitizenReports } from '@/features/reports/reportsService';
import { STATUS_CONFIG, PRIORITY_CONFIG, CATEGORY_LABELS, formatDate } from '@/lib/utils';
import type { Database } from '@/types/database.types';
import { Card, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Alert } from '@/components/ui/Alert';
import {
  ClipboardList,
  MapPin,
  Calendar,
  ArrowRight,
  RefreshCw,
  Camera,
  Lock,
  Plus,
} from 'lucide-react';

type ReportItem = Database['public']['Tables']['reports']['Row'] & {
  mediaThumbUrl?: string | null;
};

export function MyReportsPage() {
  const { user, roles, isConfigured, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // If user is a staff member, redirect immediately to their designated operations portal
  useEffect(() => {
    if (!authLoading && user) {
      if (roles.includes('municipal_official')) {
        navigate('/admin', { replace: true });
        return;
      }
      if (roles.includes('sanitation_worker')) {
        navigate('/worker', { replace: true });
        return;
      }
    }
  }, [authLoading, user, roles, navigate]);

  const fetchReports = useCallback(async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const data = await getCitizenReports(user.id);
      setReports(data);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to load your complaints');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user && !roles.includes('municipal_official') && !roles.includes('sanitation_worker')) {
      fetchReports();
    } else if (!authLoading) {
      setIsLoading(false);
    }
  }, [user, roles, authLoading, fetchReports]);

  if (!isConfigured) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 space-y-6">
        <Alert variant="warning" title="Supabase Backend Not Configured">
          Please configure your Supabase environment variables in <code>.env</code> to view live citizen reports.
        </Alert>
      </div>
    );
  }

  if (!authLoading && !user) {
    return (
      <div className="max-w-md mx-auto my-12 px-4 text-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-400">
          <Lock className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-white">Sign In to View Your Reports</h2>
        <p className="text-xs text-slate-400">
          Your complaint history and resolution proofs are protected by PostgreSQL Row Level Security.
        </p>
        <div className="pt-2">
          <Link to="/auth" state={{ from: '/my-reports' }}>
            <Button size="lg" leftIcon={<Lock className="w-4 h-4" />}>
              Sign In to Account
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Badge variant="default">Citizen Dashboard</Badge>
            <Badge variant="neutral">Verified Scope</Badge>
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            My Submitted Complaints
          </h1>
          <p className="text-sm text-slate-400">
            Real-time track of all cleanliness complaints submitted by your account.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchReports}
            isLoading={isLoading}
            leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
          >
            Refresh
          </Button>
          <Link to="/report">
            <Button size="sm" leftIcon={<Plus className="w-3.5 h-3.5" />}>
              New Report
            </Button>
          </Link>
        </div>
      </div>

      {/* Error state */}
      {errorMessage && (
        <Alert variant="error" title="Failed to Load Complaints">
          <p>{errorMessage}</p>
          <div className="mt-2">
            <Button size="sm" variant="outline" onClick={fetchReports}>
              Retry
            </Button>
          </div>
        </Alert>
      )}

      {/* Loading state */}
      {isLoading && (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 animate-pulse space-y-3"
            >
              <div className="h-5 w-48 bg-slate-800 rounded" />
              <div className="h-4 w-full bg-slate-800/60 rounded" />
              <div className="h-4 w-3/4 bg-slate-800/40 rounded" />
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && !errorMessage && reports.length === 0 && (
        <Card className="text-center py-12 px-4 space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center mx-auto text-slate-400">
            <ClipboardList className="w-6 h-6" />
          </div>
          <CardTitle>No Complaints Filed Yet</CardTitle>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            You have not registered any cleanliness complaints. If you spot uncollected garbage or drainage issues in Navsari, report it to dispatch workers!
          </p>
          <div className="pt-2">
            <Link to="/report">
              <Button leftIcon={<Plus className="w-4 h-4" />}>
                File Your First Complaint
              </Button>
            </Link>
          </div>
        </Card>
      )}

      {/* Reports list */}
      {!isLoading && reports.length > 0 && (
        <div className="space-y-4">
          {reports.map((report) => {
            const statusMeta = STATUS_CONFIG[report.status];
            const priorityMeta = PRIORITY_CONFIG[report.priority];
            const categoryMeta = CATEGORY_LABELS[report.category];

            return (
              <Card
                key={report.id}
                className="glass-card-hover overflow-hidden border border-slate-800 flex flex-col sm:flex-row gap-5 p-5 items-start"
              >
                {/* Thumbnail slot */}
                <div className="w-full sm:w-40 sm:h-32 h-44 rounded-xl overflow-hidden bg-slate-950 border border-slate-800 shrink-0 flex items-center justify-center relative group">
                  {report.mediaThumbUrl ? (
                    <img
                      src={report.mediaThumbUrl}
                      alt="Complaint photo thumbnail"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="text-center p-3 text-slate-600 space-y-1">
                      <Camera className="w-6 h-6 mx-auto opacity-40" />
                      <span className="text-[10px] block">No photo</span>
                    </div>
                  )}
                </div>

                {/* Content details */}
                <div className="flex-1 space-y-3 w-full">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-base text-white tracking-wider">
                        {report.complaint_id}
                      </span>
                      <span
                        className={`text-xs px-2.5 py-0.5 rounded-full border font-semibold ${statusMeta.badgeClass}`}
                      >
                        {statusMeta.label}
                      </span>
                    </div>

                    <span
                      className={`text-[11px] px-2 py-0.5 rounded border font-medium ${priorityMeta.badgeClass}`}
                    >
                      {priorityMeta.label}
                    </span>
                  </div>

                  <div>
                    <h4 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
                      <span>{categoryMeta.label}</span>
                      <span className="text-[11px] text-gujarat-400 font-normal">
                        ({categoryMeta.gujarati})
                      </span>
                    </h4>
                    <p className="text-xs text-slate-400 line-clamp-2 mt-1 leading-relaxed">
                      {report.description}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 pt-1 border-t border-slate-800/60">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-gujarat-400" />
                      <span>
                        {report.ward_number ? `Ward ${report.ward_number} — ` : ''}
                        {report.address_locality || 'Navsari municipal area'}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{formatDate(report.submitted_at)}</span>
                    </div>
                  </div>
                </div>

                {/* Link to detail */}
                <div className="shrink-0 self-end sm:self-center w-full sm:w-auto pt-2 sm:pt-0">
                  <Link to={`/reports/${report.complaint_id}`} className="w-full sm:w-auto block">
                    <Button variant="outline" size="sm" className="w-full sm:w-auto" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
                      View Detail
                    </Button>
                  </Link>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
