import { useQuery } from '@tanstack/react-query';
import { getAdminOverviewMetrics } from '@/features/admin';
import { CATEGORY_LABELS } from '@/lib/utils';
import {
  Clock,
  CheckCircle2,
  AlertTriangle,
  Info,
  MapPin,
  RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

export function AdminAnalyticsPage() {
  const { data: metrics, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['admin-overview-metrics'],
    queryFn: getAdminOverviewMetrics,
  });

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-48 bg-slate-200 rounded" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-28 bg-white rounded-2xl border border-slate-200" />
          ))}
        </div>
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

  // Calculate resolution rate %
  const resolutionRate =
    m.totalComplaints > 0 ? Math.round((m.resolvedCount / m.totalComplaints) * 100) : 0;

  // Find top reporting ward
  const topWard = [...m.wardDistribution].sort((a, b) => b.count - a.count)[0];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#172B3A] tracking-tight">
            Operational Analytics & Ward Benchmarks
          </h1>
          <p className="text-xs text-[#64748B] mt-0.5">
            Evidence-based cleanliness metrics, resolution speed, and SLA compliance across Navsari.
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
            Refresh Telemetry
          </Button>
        </div>
      </div>

      {/* Analytical Truth Disclosure Banner */}
      <div className="p-4 bg-teal-50/60 rounded-2xl border border-teal-200 text-xs text-[#087F7B] flex items-start gap-3">
        <Info className="w-4 h-4 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold">Authoritative Data Integrity:</span> The metrics below are
          calculated directly from audited database records and status transitions. Future AI-assisted
          predictive routing models will build upon this historical baseline.
        </div>
      </div>

      {/* Top Level Metric Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs text-[#64748B]">
            <span>Resolution Rate</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-3xl font-extrabold text-[#172B3A]">{resolutionRate}%</div>
          <p className="text-[11px] text-[#64748B]">
            {m.resolvedCount} of {m.totalComplaints} total complaints verified
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs text-[#64748B]">
            <span>Average Resolution Time</span>
            <Clock className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-3xl font-extrabold text-[#172B3A]">
            {m.averageResolutionHours !== null ? `${m.averageResolutionHours} hrs` : 'N/A'}
          </div>
          <p className="text-[11px] text-[#64748B]">
            {m.averageResolutionHours !== null
              ? 'Calculated from filing to verification'
              : 'Requires resolved complaints with timestamps'}
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs text-[#64748B]">
            <span>Highest Volume Ward</span>
            <MapPin className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-xl font-bold text-[#172B3A] truncate">
            {topWard && topWard.count > 0 ? `Ward ${topWard.wardNumber}` : 'Equally Distributed'}
          </div>
          <p className="text-[11px] text-[#64748B] truncate">
            {topWard && topWard.count > 0
              ? `${topWard.count} complaints (${topWard.wardName.split('&')[0]?.trim() || topWard.wardName})`
              : 'No complaints logged yet'}
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs text-[#64748B]">
            <span>Overdue SLA Rate</span>
            <AlertTriangle className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-3xl font-extrabold text-[#172B3A]">
            {m.totalComplaints > 0 ? Math.round((m.overdueCount / m.totalComplaints) * 100) : 0}%
          </div>
          <p className="text-[11px] text-rose-700">
            {m.overdueCount} complaints exceeded priority target SLA
          </p>
        </div>
      </div>

      {/* Ward Volume Breakdown Table & Graph */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Ward Breakdown */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-[#172B3A]">
            Ward-by-Ward Complaint Distribution (1-13)
          </h2>
          <div className="space-y-2.5">
            {m.wardDistribution.map((w) => {
              const maxCount = Math.max(...m.wardDistribution.map((x) => x.count), 1);
              const pct = Math.round((w.count / maxCount) * 100);

              return (
                <div key={w.wardNumber} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-[#172B3A]">
                      Ward {w.wardNumber} — {w.wardName}
                    </span>
                    <span className="font-mono font-bold text-[#087F7B]">{w.count}</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-[#087F7B] h-full rounded-full transition-all duration-300"
                      style={{ width: `${Math.max(w.count > 0 ? 5 : 0, pct)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Category Breakdown */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-[#172B3A]">Waste Category Incidence</h2>
          <div className="space-y-3">
            {m.categoryDistribution.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">No complaints recorded yet</p>
            ) : (
              m.categoryDistribution.map((c) => {
                const cat = CATEGORY_LABELS[c.category];
                const maxCount = Math.max(...m.categoryDistribution.map((x) => x.count), 1);
                const pct = Math.round((c.count / maxCount) * 100);

                return (
                  <div key={c.category} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <div>
                        <span className="font-medium text-[#172B3A]">{cat?.label || c.category}</span>
                        <span className="text-[10px] text-[#64748B] ml-1.5 font-sans">{cat?.gujarati}</span>
                      </div>
                      <span className="font-mono font-bold text-slate-700">{c.count}</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-teal-600 h-full rounded-full transition-all duration-300"
                        style={{ width: `${Math.max(c.count > 0 ? 5 : 0, pct)}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
