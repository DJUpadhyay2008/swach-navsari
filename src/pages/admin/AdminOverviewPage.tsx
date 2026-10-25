import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { getAdminOverviewMetrics } from '@/features/admin';
import { useDemoMode, DemoDataBanner, DemoToggle, getSimulatedAdminMetrics } from '@/lib/demo';
import {
  ClipboardList,
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  TrendingUp,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface RecentReport {
  id: string;
  category: string;
  location: string;
  status: 'In-Progress' | 'Assigned' | 'Resolved' | 'Overdue';
  priority: 'High' | 'Medium' | 'Low';
  date: string;
}

const DEMO_RECENT_REPORTS: RecentReport[] = [
  {
    id: 'NAV-2026-00108',
    category: 'Garbage Dump',
    location: 'Dudhia Talav [Simulated]',
    status: 'In-Progress',
    priority: 'High',
    date: 'Today',
  },
  {
    id: 'NAV-2026-00104',
    category: 'Market Waste',
    location: 'Lunsikui Market [Simulated]',
    status: 'In-Progress',
    priority: 'High',
    date: 'Yesterday',
  },
  {
    id: 'NAV-2026-00098',
    category: 'Drain Overflow',
    location: 'Dandi Heritage [Simulated]',
    status: 'Resolved',
    priority: 'High',
    date: '21 Oct',
  },
  {
    id: 'NAV-2026-00105',
    category: 'Open Burning',
    location: 'Lunsikui Ring Rd [Simulated]',
    status: 'Overdue',
    priority: 'High',
    date: '25 Oct',
  },
];

export function AdminOverviewPage() {
  const { isDemoMode } = useDemoMode();

  const { data: metrics, refetch, isFetching } = useQuery({
    queryKey: ['admin-overview-metrics'],
    queryFn: getAdminOverviewMetrics,
    enabled: !isDemoMode,
  });

  // Calculate isolated metrics based on mode
  const simulatedMetrics = getSimulatedAdminMetrics();

  const openReportsCount = isDemoMode
    ? simulatedMetrics.totalComplaints - simulatedMetrics.resolvedCount
    : (metrics?.submittedCount ?? 0) +
      (metrics?.underReviewCount ?? 0) +
      (metrics?.assignedCount ?? 0) +
      (metrics?.inProgressCount ?? 0);

  const unassignedCount = isDemoMode
    ? simulatedMetrics.submittedCount
    : metrics?.submittedCount ?? 0;

  const overdueCount = isDemoMode
    ? simulatedMetrics.overdueCount
    : metrics?.overdueCount ?? 0;

  const resolvedCount = isDemoMode
    ? simulatedMetrics.resolvedCount
    : metrics?.resolvedCount ?? 0;

  return (
    <div className="space-y-6">
      {/* Demo Banner */}
      <DemoDataBanner />

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Dashboard</h1>
            {isDemoMode && (
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                SIMULATED DATA
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Navsari Municipal Corporation • Real-Time Sanitation Overview
          </p>
        </div>

        <div className="flex items-center gap-2">
          <DemoToggle />

          {!isDemoMode && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => refetch()}
              isLoading={isFetching}
              className="border-slate-300 text-slate-700 hover:bg-slate-100"
              leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
            >
              Refresh
            </Button>
          )}

          <Link to="/admin/reports">
            <Button size="sm" className="bg-emerald-600 hover:bg-emerald-500 text-white font-medium">
              View All Reports
            </Button>
          </Link>
        </div>
      </div>

      {/* 4 Stat KPI Cards (Matches Mockup Screen 1) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Open Reports */}
        <Link
          to="/admin/reports?status=in_progress"
          className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all group flex items-start justify-between"
        >
          <div>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
              <ClipboardList className="w-4 h-4 text-emerald-600" />
              <span>Open Reports</span>
            </div>
            <div className="mt-2 text-3xl font-extrabold text-slate-900">{openReportsCount}</div>
            <div className="text-[11px] text-slate-400 mt-1">Open/Reports in Ward Zones</div>
          </div>
          <span className="p-2 rounded-xl bg-emerald-50 text-emerald-600 group-hover:scale-110 transition-transform">
            <TrendingUp className="w-4 h-4" />
          </span>
        </Link>

        {/* Card 2: Unassigned */}
        <Link
          to="/admin/reports?status=submitted"
          className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all group flex items-start justify-between"
        >
          <div>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-600">
              <AlertCircle className="w-4 h-4 text-amber-500" />
              <span>Unassigned</span>
            </div>
            <div className="mt-2 text-3xl font-extrabold text-slate-900">{unassignedCount}</div>
            <div className="text-[11px] text-slate-400 mt-1">Awaiting Worker Dispatch</div>
          </div>
          <span className="p-2 rounded-xl bg-amber-50 text-amber-600 group-hover:scale-110 transition-transform">
            <AlertCircle className="w-4 h-4" />
          </span>
        </Link>

        {/* Card 3: Overdue */}
        <Link
          to="/admin/reports?sortBy=priority_desc"
          className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all group flex items-start justify-between"
        >
          <div>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-rose-600">
              <AlertTriangle className="w-4 h-4 text-rose-500" />
              <span>Overdue</span>
            </div>
            <div className="mt-2 text-3xl font-extrabold text-slate-900">{overdueCount}</div>
            <div className="text-[11px] text-slate-400 mt-1">Exceeded SLA Timeline</div>
          </div>
          <span className="p-2 rounded-xl bg-rose-50 text-rose-600 group-hover:scale-110 transition-transform">
            <AlertTriangle className="w-4 h-4" />
          </span>
        </Link>

        {/* Card 4: Resolved (This Month) */}
        <Link
          to="/admin/reports?status=resolved"
          className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all group flex items-start justify-between"
        >
          <div>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Resolved (This Month)</span>
            </div>
            <div className="mt-2 text-3xl font-extrabold text-slate-900">{resolvedCount}</div>
            <div className="text-[11px] text-slate-400 mt-1">100% Photo Proof Verified</div>
          </div>
          <span className="p-2 rounded-xl bg-emerald-50 text-emerald-600 group-hover:scale-110 transition-transform">
            <CheckCircle2 className="w-4 h-4" />
          </span>
        </Link>
      </div>

      {/* Middle Row: Reports Trend Line Chart & Category Distribution Donut Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left: Reports Trend (3 cols) */}
        <div className="lg:col-span-3 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Reports Trend</h2>
              <p className="text-xs text-slate-400">Incident flow vs completions over last 30 days</p>
            </div>
            <div className="flex items-center gap-3 text-xs font-medium">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                <span className="text-slate-600">Submitted</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span className="text-slate-600">Resolved</span>
              </div>
            </div>
          </div>

          {/* SVG Trend Line Chart with Y and X axes */}
          <div className="flex items-stretch gap-2 h-56 pt-2">
            {/* Y-axis labels */}
            <div className="flex flex-col justify-between text-[10px] text-slate-400 font-mono py-1 text-right w-6 shrink-0">
              <span>200</span>
              <span>100</span>
              <span>0</span>
            </div>

            {/* SVG Canvas */}
            <div className="flex-1 flex flex-col justify-between">
              <svg className="w-full h-44 overflow-visible" viewBox="0 0 500 160" preserveAspectRatio="none">
                {/* Horizontal grid lines */}
                <line x1="0" y1="20" x2="500" y2="20" stroke="#f1f5f9" strokeWidth="1" />
                <line x1="0" y1="80" x2="500" y2="80" stroke="#f1f5f9" strokeWidth="1" />
                <line x1="0" y1="140" x2="500" y2="140" stroke="#f1f5f9" strokeWidth="1" />

                {/* Gradients */}
                <defs>
                  <linearGradient id="submittedGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.2" />
                    <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.0" />
                  </linearGradient>
                  <linearGradient id="resolvedGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity="0.2" />
                    <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Area Under Submitted */}
                <path
                  d="M 30 110 Q 140 60 250 85 T 470 50 L 470 140 L 30 140 Z"
                  fill="url(#submittedGrad)"
                />
                <path
                  d="M 30 110 Q 140 60 250 85 T 470 50"
                  fill="none"
                  stroke="#3b82f6"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />

                {/* Area Under Resolved */}
                <path
                  d="M 30 130 Q 140 110 250 95 T 470 40 L 470 140 L 30 140 Z"
                  fill="url(#resolvedGrad)"
                />
                <path
                  d="M 30 130 Q 140 110 250 95 T 470 40"
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />

                {/* Data points */}
                <circle cx="30" cy="110" r="3.5" fill="#3b82f6" />
                <circle cx="250" cy="85" r="3.5" fill="#3b82f6" />
                <circle cx="470" cy="50" r="3.5" fill="#3b82f6" />

                <circle cx="30" cy="130" r="3.5" fill="#10b981" />
                <circle cx="250" cy="95" r="3.5" fill="#10b981" />
                <circle cx="470" cy="40" r="3.5" fill="#10b981" />
              </svg>

              {/* X-axis labels matching mockup */}
              <div className="flex justify-between text-[11px] text-slate-400 pt-1 px-4">
                <span>5 Oct</span>
                <span>10 Oct</span>
                <span>15 Oct</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Category Distribution Donut (2 cols) */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4 flex flex-col justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Category Distribution</h2>
            <p className="text-xs text-slate-400">Proportional classification breakdown</p>
          </div>

          <div className="flex items-center justify-center gap-6 my-auto">
            {/* Donut SVG with Total 523 in center */}
            <div className="relative w-36 h-36 flex items-center justify-center shrink-0">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="38" fill="none" stroke="#e2e8f0" strokeWidth="14" />
                {/* 38% Garbage Dumping (strokeDasharray 90 238) */}
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="14"
                  strokeDasharray="91 238"
                  strokeDashoffset="0"
                />
                {/* 26% Overflowing Bin */}
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  fill="none"
                  stroke="#06b6d4"
                  strokeWidth="14"
                  strokeDasharray="62 238"
                  strokeDashoffset="-91"
                />
                {/* 18% Street Litter */}
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  fill="none"
                  stroke="#f59e0b"
                  strokeWidth="14"
                  strokeDasharray="43 238"
                  strokeDashoffset="-153"
                />
                {/* 11% Drain Waste */}
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  fill="none"
                  stroke="#6366f1"
                  strokeWidth="14"
                  strokeDasharray="26 238"
                  strokeDashoffset="-196"
                />
                {/* 7% Other */}
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  fill="none"
                  stroke="#94a3b8"
                  strokeWidth="14"
                  strokeDasharray="16 238"
                  strokeDashoffset="-222"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Total</span>
                <span className="text-xl font-extrabold text-slate-900 leading-none">523</span>
              </div>
            </div>

            {/* Legend with percentages */}
            <div className="space-y-1.5 text-xs">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  <span className="text-slate-700">Garbage Dumping</span>
                </div>
                <span className="font-bold text-slate-900">38%</span>
              </div>

              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-cyan-500" />
                  <span className="text-slate-700">Overflowing Bin</span>
                </div>
                <span className="font-bold text-slate-900">26%</span>
              </div>

              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                  <span className="text-slate-700">Street Litter</span>
                </div>
                <span className="font-bold text-slate-900">18%</span>
              </div>

              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
                  <span className="text-slate-700">Drain Waste</span>
                </div>
                <span className="font-bold text-slate-900">11%</span>
              </div>

              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-400" />
                  <span className="text-slate-700">Other</span>
                </div>
                <span className="font-bold text-slate-900">7%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Table: Recent Reports (Matches Mockup Screen 1) */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-200/80 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Recent Reports</h2>
            <p className="text-xs text-slate-400">Incoming municipal incidents across Navsari wards</p>
          </div>
          <Link
            to="/admin/reports"
            className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
          >
            <span>View All</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[11px] border-b border-slate-200">
              <tr>
                <th className="py-3 px-5 font-semibold">ID</th>
                <th className="py-3 px-5 font-semibold">Category</th>
                <th className="py-3 px-5 font-semibold">Location</th>
                <th className="py-3 px-5 font-semibold">Status</th>
                <th className="py-3 px-5 font-semibold">Priority</th>
                <th className="py-3 px-5 font-semibold">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {DEMO_RECENT_REPORTS.map((row) => (
                <tr key={row.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3.5 px-5 font-mono font-medium text-slate-900">
                    <Link
                      to={`/admin/reports`}
                      className="text-emerald-700 hover:text-emerald-800 hover:underline"
                    >
                      {row.id}
                    </Link>
                  </td>
                  <td className="py-3.5 px-5 text-slate-800 font-medium">{row.category}</td>
                  <td className="py-3.5 px-5 text-slate-600">{row.location}</td>
                  <td className="py-3.5 px-5">
                    {row.status === 'In-Progress' ? (
                      <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                        In-Progress
                      </span>
                    ) : row.status === 'Assigned' ? (
                      <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                        Assigned
                      </span>
                    ) : row.status === 'Resolved' ? (
                      <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        Resolved
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                        Overdue
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-5">
                    {row.priority === 'High' ? (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800">
                        High
                      </span>
                    ) : row.priority === 'Medium' ? (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                        Medium
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                        Low
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-5 text-slate-500 font-mono">{row.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
