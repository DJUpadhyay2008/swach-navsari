import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { getAdminOverviewMetrics } from '@/features/admin';
import { CATEGORY_LABELS } from '@/lib/utils';
import {
  Inbox,
  UserCheck,
  FileCheck2,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  MapPin,
  RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

export function AdminOverviewPage() {
  const { data: metrics, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ['admin-overview-metrics'],
    queryFn: getAdminOverviewMetrics,
  });

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-64 bg-slate-200 rounded-lg" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 bg-white rounded-2xl border border-slate-200 p-5" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-72 bg-white rounded-2xl border border-slate-200" />
          <div className="h-72 bg-white rounded-2xl border border-slate-200" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 bg-white rounded-2xl border border-rose-200 shadow-sm text-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-[#172B3A]">Failed to Load Municipal Operations Data</h2>
          <p className="text-xs text-[#64748B] mt-1">{(error as Error).message}</p>
        </div>
        <Button size="sm" onClick={() => refetch()} leftIcon={<RefreshCw className="w-3.5 h-3.5" />}>
          Retry Query
        </Button>
      </div>
    );
  }

  const m = metrics || {
    totalComplaints: 0,
    submittedCount: 0,
    underReviewCount: 0,
    assignedCount: 0,
    inProgressCount: 0,
    verificationCount: 0,
    resolvedCount: 0,
    rejectedCount: 0,
    overdueCount: 0,
    averageResolutionHours: null,
    wardDistribution: [],
    categoryDistribution: [],
  };

  const pendingTriageCount = m.submittedCount + m.underReviewCount;
  const activeDispatchedCount = m.assignedCount + m.inProgressCount;

  return (
    <div className="space-y-6">
      {/* Page Title & Context Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-teal-50 text-[#087F7B] border border-teal-200">
              Live Operations Deck
            </span>
            <span className="text-xs text-[#64748B]">Gujarat Municipalities Act 1963</span>
          </div>
          <h1 className="text-2xl font-extrabold text-[#172B3A] tracking-tight mt-1">
            Navsari Municipal Operations Console
          </h1>
          <p className="text-xs text-[#64748B] mt-0.5">
            Real-time complaint triage, sanitation crew dispatching, SLA monitoring, and verification across 13 civic wards.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => refetch()}
            isLoading={isFetching}
            leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
          >
            Refresh Data
          </Button>
          <Link to="/admin/reports">
            <Button size="sm" className="bg-[#087F7B] hover:bg-[#066461] text-white" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
              Open Queue ({m.totalComplaints})
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Pending Triage */}
        <Link
          to="/admin/reports?status=submitted"
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:border-amber-300 hover:shadow-md transition-all group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#64748B]">Awaiting Triage</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Inbox className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-3xl font-extrabold text-[#172B3A]">{pendingTriageCount}</div>
          <div className="flex items-center justify-between mt-2 text-[11px]">
            <span className="text-amber-700 font-medium">{m.submittedCount} new, {m.underReviewCount} in review</span>
            <span className="text-slate-400 group-hover:text-amber-600 font-medium">Review &rarr;</span>
          </div>
        </Link>

        {/* Card 2: Active Dispatched */}
        <Link
          to="/admin/reports?status=in_progress"
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:border-blue-300 hover:shadow-md transition-all group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#64748B]">Active Field Work</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <UserCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-3xl font-extrabold text-[#172B3A]">{activeDispatchedCount}</div>
          <div className="flex items-center justify-between mt-2 text-[11px]">
            <span className="text-blue-700 font-medium">{m.assignedCount} assigned, {m.inProgressCount} on-site</span>
            <span className="text-slate-400 group-hover:text-blue-600 font-medium">Track &rarr;</span>
          </div>
        </Link>

        {/* Card 3: Awaiting Verification */}
        <Link
          to="/admin/verifications"
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:border-teal-300 hover:shadow-md transition-all group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#64748B]">Awaiting Verification</span>
            <div className="w-8 h-8 rounded-xl bg-teal-50 text-[#087F7B] flex items-center justify-center group-hover:scale-110 transition-transform">
              <FileCheck2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-3xl font-extrabold text-[#172B3A]">{m.verificationCount}</div>
          <div className="flex items-center justify-between mt-2 text-[11px]">
            <span className="text-teal-700 font-medium">Photos uploaded by crew</span>
            <span className="text-slate-400 group-hover:text-[#087F7B] font-medium">Verify &rarr;</span>
          </div>
        </Link>

        {/* Card 4: Resolved Complaints */}
        <Link
          to="/admin/reports?status=resolved"
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:border-emerald-300 hover:shadow-md transition-all group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#64748B]">Total Resolved</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-3xl font-extrabold text-[#172B3A]">{m.resolvedCount}</div>
          <div className="flex items-center justify-between mt-2 text-[11px]">
            <span className="text-emerald-700 font-medium">
              {m.averageResolutionHours !== null ? `Avg ${m.averageResolutionHours}h resolution` : 'Cleaned & verified'}
            </span>
            <span className="text-slate-400 group-hover:text-emerald-600 font-medium">Audit &rarr;</span>
          </div>
        </Link>
      </div>

      {/* SLA Alert Banner if Overdue items exist */}
      {m.overdueCount > 0 && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-rose-900">
                SLA Compliance Alert: {m.overdueCount} Complaint{m.overdueCount > 1 ? 's' : ''} Exceeded Statutory Window
              </p>
              <p className="text-[11px] text-rose-700 mt-0.5">
                Urgent complaints (24h limit) or high-priority complaints (48h limit) require immediate intervention.
              </p>
            </div>
          </div>
          <Link to="/admin/reports?sortBy=priority_desc">
            <Button size="sm" className="bg-rose-600 hover:bg-rose-700 text-white shrink-0">
              Prioritize Escalations
            </Button>
          </Link>
        </div>
      )}

      {/* Main Grid: Ward-Level Distribution & Categories */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Ward Distribution (13 Wards of Navsari) */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-[#172B3A]">
                Ward Cleanliness Distribution (13 Civic Wards)
              </h3>
              <p className="text-xs text-[#64748B] mt-0.5">
                Active municipal coverage across all 13 territorial zones in Navsari
              </p>
            </div>
            <Link to="/admin/map" className="text-xs font-semibold text-[#087F7B] hover:underline flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5" /> View Ward Map
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            {m.wardDistribution.map((w) => {
              const maxCount = Math.max(...m.wardDistribution.map((x) => x.count), 1);
              const pct = Math.round((w.count / maxCount) * 100);

              return (
                <Link
                  key={w.wardNumber}
                  to={`/admin/reports?ward=${w.wardNumber}`}
                  className="p-3 rounded-xl bg-slate-50 border border-slate-100 hover:border-teal-200 hover:bg-teal-50/40 transition-colors group block"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-[#172B3A] group-hover:text-[#087F7B]">
                      Ward {w.wardNumber}: {w.wardName.split('&')[0]?.trim() || w.wardName}
                    </span>
                    <span className="font-mono font-semibold px-2 py-0.5 rounded-full text-[10px] bg-white border border-slate-200 text-slate-700">
                      {w.count}
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 h-1.5 rounded-full mt-2 overflow-hidden">
                    <div
                      className="bg-[#087F7B] h-full rounded-full transition-all duration-500"
                      style={{ width: `${Math.max(w.count > 0 ? 8 : 0, pct)}%` }}
                    />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Category Breakdown & Quick Actions */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-5 flex flex-col justify-between">
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-bold text-[#172B3A]">Category Breakdown</h3>
              <p className="text-xs text-[#64748B] mt-0.5">Observed solid waste issues</p>
            </div>

            <div className="space-y-2.5">
              {m.categoryDistribution.length === 0 ? (
                <p className="text-xs text-slate-400 py-6 text-center">No complaints recorded yet</p>
              ) : (
                m.categoryDistribution.slice(0, 6).map((c) => {
                  const label = CATEGORY_LABELS[c.category]?.label || c.category;
                  return (
                    <div key={c.category} className="flex items-center justify-between text-xs">
                      <span className="text-[#64748B] truncate max-w-[180px]">{label}</span>
                      <span className="font-mono font-semibold text-[#172B3A] bg-slate-100 px-2 py-0.5 rounded">
                        {c.count}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 space-y-2">
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-[#64748B]">
              Quick Operations Actions
            </h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <Link to="/admin/assignments">
                <Button size="sm" variant="outline" className="w-full text-xs">
                  Dispatch Crew
                </Button>
              </Link>
              <Link to="/admin/audit">
                <Button size="sm" variant="outline" className="w-full text-xs">
                  Audit History
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
