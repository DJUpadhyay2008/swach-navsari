import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getAdminReports,
  getSanitationWorkers,
  assignWorkerToComplaint,
} from '@/features/admin';
import { StatusBadge } from '@/features/admin/components/StatusBadge';
import { SlaBadge } from '@/features/admin/components/SlaBadge';
import { ActionDialog } from '@/features/admin/components/ActionDialog';
import { CATEGORY_LABELS, formatDate } from '@/lib/utils';
import {
  HardHat,
  Phone,
  UserCheck,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/Button';

export function AdminAssignmentsPage() {
  const queryClient = useQueryClient();
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // 1. Fetch complaints needing assignment (submitted, under_review, reopened)
  const {
    data: unassignedData,
    isLoading: isLoadingReports,
    refetch: refetchReports,
  } = useQuery({
    queryKey: ['admin-unassigned-reports'],
    queryFn: () =>
      getAdminReports({
        status: 'submitted',
        pageSize: 30,
        sortBy: 'priority_desc',
      }),
  });

  // 2. Fetch active assigned reports
  const { data: activeAssignedData } = useQuery({
    queryKey: ['admin-active-assigned-reports'],
    queryFn: () =>
      getAdminReports({
        status: 'assigned',
        pageSize: 30,
        sortBy: 'submitted_at_desc',
      }),
  });

  // 3. Fetch registered sanitation workers
  const {
    data: workers = [],
    isLoading: isLoadingWorkers,
    refetch: refetchWorkers,
  } = useQuery({
    queryKey: ['sanitation-workers'],
    queryFn: getSanitationWorkers,
  });

  // Assignment Mutation
  const assignMutation = useMutation({
    mutationFn: ({ reportId, workerId, note }: { reportId: string; workerId: string; note?: string }) =>
      assignWorkerToComplaint(reportId, workerId, note),
    onSuccess: () => {
      setNotification({ type: 'success', message: 'Worker successfully dispatched and complaint marked assigned.' });
      queryClient.invalidateQueries({ queryKey: ['admin-unassigned-reports'] });
      queryClient.invalidateQueries({ queryKey: ['admin-active-assigned-reports'] });
      queryClient.invalidateQueries({ queryKey: ['sanitation-workers'] });
      queryClient.invalidateQueries({ queryKey: ['admin-overview-metrics'] });
      setAssignDialogOpen(false);
      setSelectedReportId(null);
    },
    onError: (err: Error) => {
      setNotification({ type: 'error', message: err.message });
    },
  });

  const unassignedList = unassignedData?.data || [];
  const activeList = activeAssignedData?.data || [];

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#172B3A] tracking-tight">
            Sanitation Worker Assignment Desk
          </h1>
          <p className="text-xs text-[#64748B] mt-0.5">
            Allocate unassigned cleanliness reports to registered sanitation crew leads with real-time workload tracking.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              refetchReports();
              refetchWorkers();
            }}
            leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* Notification Banner */}
      {notification && (
        <div
          className={`p-3.5 rounded-xl border text-xs flex items-center justify-between ${
            notification.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          <span>{notification.message}</span>
          <button
            type="button"
            onClick={() => setNotification(null)}
            className="text-xs font-bold underline ml-3"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Workers Roster Row */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <HardHat className="w-5 h-5 text-[#087F7B]" />
            <h2 className="text-sm font-bold text-[#172B3A]">
              Authorized Sanitation Crew Roster ({workers.length} Leads)
            </h2>
          </div>
          <span className="text-[11px] text-[#64748B]">Derived from public.user_roles</span>
        </div>

        {isLoadingWorkers ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 animate-pulse">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-slate-100 rounded-xl" />
            ))}
          </div>
        ) : workers.length === 0 ? (
          <div className="p-6 bg-amber-50 rounded-xl border border-amber-200 text-center text-xs text-amber-800">
            No registered users currently hold the <code>sanitation_worker</code> role in the database.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {workers.map((w) => (
              <div
                key={w.id}
                className="p-4 rounded-xl bg-slate-50 border border-slate-200 hover:border-teal-300 transition-colors space-y-2"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-xs font-bold text-[#172B3A]">{w.fullName}</h3>
                    <p className="text-[11px] text-[#64748B]">
                      {w.wardNumber ? `Designated Ward ${w.wardNumber}` : 'Navsari General Unit'}
                    </p>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-50 text-[#087F7B] border border-teal-200">
                    {w.activeAssignmentsCount} Active
                  </span>
                </div>

                {w.phone && (
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                    <Phone className="w-3 h-3" />
                    <span>{w.phone}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Unassigned Complaints Awaiting Worker */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-[#172B3A]">
              Unassigned Complaints Queue ({unassignedList.length})
            </h2>
            <p className="text-xs text-[#64748B] mt-0.5">
              Complaints registered by citizens needing immediate workforce dispatch
            </p>
          </div>
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
            Triage Pending
          </span>
        </div>

        {isLoadingReports ? (
          <div className="space-y-3 animate-pulse">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-slate-100 rounded-xl" />
            ))}
          </div>
        ) : unassignedList.length === 0 ? (
          <div className="p-8 text-center text-xs text-[#64748B] bg-slate-50 rounded-xl border border-slate-100">
            <CheckCircle2 className="w-6 h-6 text-emerald-500 mx-auto mb-2" />
            All submitted complaints have been assigned to sanitation teams!
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-[#172B3A]">
              <thead className="bg-slate-50 text-[#64748B] uppercase tracking-wider text-[11px] border-b border-slate-200 font-semibold">
                <tr>
                  <th className="py-3 px-4">Complaint ID</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Ward / Locality</th>
                  <th className="py-3 px-4">Priority / SLA</th>
                  <th className="py-3 px-4">Submitted</th>
                  <th className="py-3 px-4 text-right">Dispatch Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {unassignedList.map((r) => {
                  const cat = CATEGORY_LABELS[r.category];
                  return (
                    <tr key={r.id} className="hover:bg-slate-50/70">
                      <td className="py-3 px-4 font-mono font-bold text-[#087F7B]">
                        <Link to={`/admin/reports/${r.id}`} className="hover:underline">
                          {r.complaint_id}
                        </Link>
                      </td>
                      <td className="py-3 px-4 font-semibold text-[#172B3A]">
                        {cat?.label || r.category}
                      </td>
                      <td className="py-3 px-4">
                        Ward {r.ward_number || '—'} • {r.address_locality || 'Navsari'}
                      </td>
                      <td className="py-3 px-4">
                        <SlaBadge priority={r.priority} isOverdue={r.isOverdue} />
                      </td>
                      <td className="py-3 px-4 text-[#64748B]">{formatDate(r.submitted_at)}</td>
                      <td className="py-3 px-4 text-right">
                        <Button
                          size="sm"
                          className="bg-[#087F7B] hover:bg-[#066461] text-white text-xs h-7"
                          onClick={() => {
                            setSelectedReportId(r.id);
                            setAssignDialogOpen(true);
                          }}
                          leftIcon={<UserCheck className="w-3.5 h-3.5" />}
                        >
                          Dispatch Worker
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Active Dispatches Row */}
      {activeList.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-[#172B3A]">
              Currently Active Dispatches ({activeList.length})
            </h2>
            <Link to="/admin/reports?status=assigned" className="text-xs text-[#087F7B] hover:underline">
              View All &rarr;
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {activeList.map((r) => (
              <div
                key={r.id}
                className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-[#087F7B]">{r.complaint_id}</span>
                  <StatusBadge status={r.status} />
                </div>
                <p className="font-semibold text-[#172B3A] truncate">
                  {CATEGORY_LABELS[r.category]?.label || r.category}
                </p>
                <p className="text-[#64748B] text-[11px] truncate">
                  Ward {r.ward_number || '—'} • {r.address_locality || 'Navsari'}
                </p>
                <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between">
                  <span className="font-medium text-cyan-800">
                    Lead: {r.activeAssignment?.workerName || 'Assigned Worker'}
                  </span>
                  <Link to={`/admin/reports/${r.id}`}>
                    <span className="text-[#087F7B] hover:underline text-[11px]">Triage &rarr;</span>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Worker Assignment Modal */}
      <ActionDialog
        isOpen={assignDialogOpen}
        onClose={() => {
          setAssignDialogOpen(false);
          setSelectedReportId(null);
        }}
        title="Dispatch Sanitation Worker"
        description="Select an authorized sanitation crew lead to assign to this complaint."
        type="assign"
        workers={workers}
        isSubmitting={assignMutation.isPending}
        onSubmit={async ({ workerId, note }) => {
          if (selectedReportId && workerId) {
            await assignMutation.mutateAsync({
              reportId: selectedReportId,
              workerId,
              note,
            });
          }
        }}
      />
    </div>
  );
}
