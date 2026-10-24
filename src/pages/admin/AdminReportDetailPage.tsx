import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getAdminReportDetail,
  transitionComplaintStatus,
  updateComplaintPriority,
  getSanitationWorkers,
  assignWorkerToComplaint,
  verifyResolution,
} from '@/features/admin';
import { StatusBadge } from '@/features/admin/components/StatusBadge';
import { SlaBadge } from '@/features/admin/components/SlaBadge';
import { ActionDialog } from '@/features/admin/components/ActionDialog';
import { CATEGORY_LABELS, formatDate, NAVSARI_WARDS } from '@/lib/utils';
import type { ComplaintPriority, ComplaintStatus } from '@/types/database.types';
import {
  ArrowLeft,
  MapPin,
  Clock,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  RotateCcw,
  UserCheck,
  ExternalLink,
  Camera,
  History,
  FileCheck2,
  RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

export function AdminReportDetailPage() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();

  const [dialogState, setDialogState] = useState<{
    isOpen: boolean;
    type: 'assign' | 'reject' | 'rework' | 'confirm';
    title: string;
    description: string;
  }>({
    isOpen: false,
    type: 'assign',
    title: '',
    description: '',
  });

  const [notification, setNotification] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  // 1. Fetch Report Detail
  const { data: report, isLoading, error, refetch } = useQuery({
    queryKey: ['admin-report-detail', id],
    queryFn: () => getAdminReportDetail(id!),
    enabled: Boolean(id),
  });

  // 2. Fetch Sanitation Workers for assignment
  const { data: workers = [] } = useQuery({
    queryKey: ['sanitation-workers'],
    queryFn: getSanitationWorkers,
    enabled: Boolean(dialogState.isOpen && dialogState.type === 'assign'),
  });

  // Invalidate queries after mutations
  const handleSuccess = (msg: string) => {
    setNotification({ type: 'success', message: msg });
    queryClient.invalidateQueries({ queryKey: ['admin-report-detail', id] });
    queryClient.invalidateQueries({ queryKey: ['admin-reports'] });
    queryClient.invalidateQueries({ queryKey: ['admin-overview-metrics'] });
    setDialogState((prev) => ({ ...prev, isOpen: false }));
  };

  // Status transition mutation
  const transitionMutation = useMutation({
    mutationFn: ({
      newStatus,
      note,
      rejectionReason,
    }: {
      newStatus: ComplaintStatus;
      note?: string;
      rejectionReason?: string;
    }) => transitionComplaintStatus(report!.id, newStatus, note, rejectionReason),
    onSuccess: (data) => {
      handleSuccess(`Complaint status transitioned to "${data.status}".`);
    },
    onError: (err: Error) => {
      setNotification({ type: 'error', message: err.message });
    },
  });

  // Priority update mutation
  const priorityMutation = useMutation({
    mutationFn: (priority: ComplaintPriority) =>
      updateComplaintPriority(report!.id, priority),
    onSuccess: (data) => {
      handleSuccess(`Priority updated to "${data.priority}".`);
    },
    onError: (err: Error) => {
      setNotification({ type: 'error', message: err.message });
    },
  });

  // Assignment mutation
  const assignMutation = useMutation({
    mutationFn: ({ workerId, note }: { workerId: string; note?: string }) =>
      assignWorkerToComplaint(report!.id, workerId, note),
    onSuccess: () => {
      handleSuccess('Sanitation worker assigned successfully.');
    },
    onError: (err: Error) => {
      setNotification({ type: 'error', message: err.message });
    },
  });

  // Verification mutation
  const verifyMutation = useMutation({
    mutationFn: ({ approved, note }: { approved: boolean; note?: string }) =>
      verifyResolution(report!.id, approved, note),
    onSuccess: (data) => {
      handleSuccess(`Resolution ${data.status === 'resolved' ? 'approved' : 'rejected'}.`);
    },
    onError: (err: Error) => {
      setNotification({ type: 'error', message: err.message });
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-6 w-32 bg-slate-200 rounded" />
        <div className="h-32 bg-white rounded-2xl border border-slate-200 p-6" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-96 bg-white rounded-2xl border border-slate-200" />
          <div className="h-96 bg-white rounded-2xl border border-slate-200" />
        </div>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="p-8 bg-white rounded-2xl border border-slate-200 shadow-sm text-center space-y-4">
        <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto" />
        <div>
          <h2 className="text-lg font-bold text-[#172B3A]">Complaint Not Found</h2>
          <p className="text-xs text-[#64748B] mt-1">
            {(error as Error)?.message || 'The requested complaint identifier does not exist or you lack permission.'}
          </p>
        </div>
        <Link to="/admin/reports">
          <Button size="sm" variant="outline" leftIcon={<ArrowLeft className="w-3.5 h-3.5" />}>
            Back to Queue
          </Button>
        </Link>
      </div>
    );
  }

  const cat = CATEGORY_LABELS[report.category];
  const wardInfo = NAVSARI_WARDS.find((w) => w.number === report.ward_number);
  const isResolved = report.status === 'resolved' || report.status === 'rejected' || report.status === 'cancelled';

  return (
    <div className="space-y-6">
      {/* Back button & Navigation header */}
      <div className="flex items-center justify-between">
        <Link
          to="/admin/reports"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#087F7B] hover:text-[#066461] transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Complaint Queue</span>
        </Link>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => refetch()}
            leftIcon={<RefreshCw className="w-3 h-3" />}
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

      {/* Main Header Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-base font-mono font-extrabold text-[#087F7B]">
                {report.complaint_id}
              </span>
              <StatusBadge status={report.status} />
              <SlaBadge priority={report.priority} isResolved={isResolved} />
            </div>
            <h1 className="text-xl font-bold text-[#172B3A]">
              {cat?.label || report.category}
            </h1>
            <p className="text-xs text-[#64748B]">{cat?.description}</p>
          </div>

          {/* Action Bar / Priority Selector */}
          <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
            <div className="flex items-center gap-1.5 text-xs text-[#64748B]">
              <span>Priority:</span>
              <select
                value={report.priority}
                disabled={priorityMutation.isPending || isResolved}
                onChange={(e) => priorityMutation.mutate(e.target.value as ComplaintPriority)}
                className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs text-[#172B3A] font-semibold focus:outline-none focus:ring-1 focus:ring-[#087F7B]"
              >
                <option value="low">Low (120h)</option>
                <option value="medium">Medium (72h)</option>
                <option value="high">High (48h)</option>
                <option value="urgent">Urgent (24h)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Action Buttons Row */}
        <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center gap-2">
          {/* Transition: Under Review */}
          {report.status === 'submitted' && (
            <Button
              size="sm"
              variant="outline"
              isLoading={transitionMutation.isPending}
              onClick={() =>
                transitionMutation.mutate({
                  newStatus: 'under_review',
                  note: 'Complaint taken under official administrative review',
                })
              }
              leftIcon={<Clock className="w-3.5 h-3.5 text-indigo-600" />}
            >
              Take Under Review
            </Button>
          )}

          {/* Transition: Assign Worker */}
          {['submitted', 'under_review', 'reopened'].includes(report.status) && (
            <Button
              size="sm"
              className="bg-[#087F7B] hover:bg-[#066461] text-white"
              onClick={() =>
                setDialogState({
                  isOpen: true,
                  type: 'assign',
                  title: 'Dispatch Sanitation Worker',
                  description: `Assign ${report.complaint_id} to an authorized sanitation team lead for on-site action.`,
                })
              }
              leftIcon={<UserCheck className="w-3.5 h-3.5" />}
            >
              Assign Sanitation Worker
            </Button>
          )}

          {/* Transition: Reassign Worker */}
          {['assigned', 'in_progress'].includes(report.status) && (
            <Button
              size="sm"
              variant="outline"
              onClick={() =>
                setDialogState({
                  isOpen: true,
                  type: 'assign',
                  title: 'Reassign Sanitation Crew',
                  description: 'Reallocate this complaint to another active sanitation crew in Navsari.',
                })
              }
              leftIcon={<UserCheck className="w-3.5 h-3.5 text-cyan-600" />}
            >
              Reassign Worker
            </Button>
          )}

          {/* Transition: Verify / Reject Resolution */}
          {report.status === 'resolution_submitted' && (
            <>
              <Button
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
                isLoading={verifyMutation.isPending}
                onClick={() =>
                  setDialogState({
                    isOpen: true,
                    type: 'confirm',
                    title: 'Verify & Resolve Complaint',
                    description: 'Approve completion evidence and mark this civic complaint as resolved.',
                  })
                }
                leftIcon={<CheckCircle2 className="w-3.5 h-3.5" />}
              >
                Approve & Mark Resolved
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="text-amber-700 hover:bg-amber-50"
                onClick={() =>
                  setDialogState({
                    isOpen: true,
                    type: 'rework',
                    title: 'Request Rework at Site',
                    description: 'Send back to sanitation worker with specific remediation feedback.',
                  })
                }
                leftIcon={<RotateCcw className="w-3.5 h-3.5 text-amber-600" />}
              >
                Request Rework
              </Button>
            </>
          )}

          {/* Transition: Reject Complaint (min 5 chars reason) */}
          {['submitted', 'under_review'].includes(report.status) && (
            <Button
              size="sm"
              variant="outline"
              className="text-rose-600 hover:bg-rose-50 hover:text-rose-700"
              onClick={() =>
                setDialogState({
                  isOpen: true,
                  type: 'reject',
                  title: 'Reject Complaint Registration',
                  description: 'Document an audited statutory reason explaining why this issue cannot be processed.',
                })
              }
              leftIcon={<XCircle className="w-3.5 h-3.5" />}
            >
              Reject Complaint
            </Button>
          )}
        </div>
      </div>

      {/* Two-Column Grid: Left Details & Right Context/History */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Details, Media, Resolution */}
        <div className="lg:col-span-2 space-y-6">
          {/* Location & Details Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-[#172B3A]">Complaint Details & Location</h3>

            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-700 leading-relaxed italic">
              "{report.description}"
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-1">
              <div className="space-y-1">
                <span className="text-[#64748B]">Civic Territorial Ward</span>
                <p className="font-semibold text-[#172B3A]">
                  Ward {report.ward_number || '—'} {wardInfo ? `(${wardInfo.name})` : ''}
                </p>
              </div>

              <div className="space-y-1">
                <span className="text-[#64748B]">Address / Locality</span>
                <p className="font-semibold text-[#172B3A]">
                  {report.address_locality || 'Navsari'}
                  {report.landmark ? ` • Landmark: ${report.landmark}` : ''}
                </p>
              </div>

              <div className="space-y-1">
                <span className="text-[#64748B]">Filing Time</span>
                <p className="font-semibold text-[#172B3A]">{formatDate(report.submitted_at)}</p>
              </div>

              <div className="space-y-1">
                <span className="text-[#64748B]">Reporting Citizen</span>
                <p className="font-semibold text-[#172B3A]">
                  {report.is_anonymous
                    ? 'Anonymous Resident'
                    : report.reporterProfile?.full_name || 'Registered Citizen'}
                  {report.reporterProfile?.phone_number && ` (${report.reporterProfile.phone_number})`}
                </p>
              </div>
            </div>

            {/* GPS Telemetry & Maps Link */}
            {report.latitude !== null && report.longitude !== null && (
              <div className="pt-2 flex items-center justify-between p-3 bg-teal-50/50 rounded-xl border border-teal-100 text-xs">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-[#087F7B]" />
                  <span className="font-mono text-[#172B3A]">
                    {report.latitude.toFixed(5)}, {report.longitude.toFixed(5)}
                  </span>
                </div>
                <a
                  href={`https://maps.google.com/?q=${report.latitude},${report.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-[#087F7B] hover:underline flex items-center gap-1"
                >
                  View on Google Maps <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            )}
          </div>

          {/* Initial Citizen Evidence Photos */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Camera className="w-4 h-4 text-[#087F7B]" />
                <h3 className="text-sm font-bold text-[#172B3A]">
                  Citizen Evidence Gallery ({report.media.length} Photos)
                </h3>
              </div>
              <span className="text-[11px] text-[#64748B]">Encrypted Private Storage</span>
            </div>

            {report.media.length === 0 ? (
              <div className="p-6 bg-slate-50 rounded-xl border border-slate-100 text-center text-xs text-[#64748B]">
                No photos were attached with this complaint submission.
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {report.media.map((m, idx) => (
                  <div
                    key={m.id}
                    className="aspect-square bg-slate-100 rounded-xl overflow-hidden border border-slate-200 relative group"
                  >
                    {m.signedUrl ? (
                      <img
                        src={m.signedUrl}
                        alt={`Evidence ${idx + 1}`}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center p-2 text-center text-slate-400">
                        <Camera className="w-6 h-6 mb-1" />
                        <span className="text-[10px]">Signed URL Expired</span>
                      </div>
                    )}
                    <a
                      href={m.signedUrl || '#'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-semibold"
                    >
                      View Full Size
                    </a>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Resolution Evidence Card (if submitted) */}
          {report.resolutionEvidence.length > 0 && (
            <div className="bg-white rounded-2xl border border-teal-200 p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileCheck2 className="w-4 h-4 text-emerald-600" />
                  <h3 className="text-sm font-bold text-[#172B3A]">Sanitation Worker Resolution Evidence</h3>
                </div>
                <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  On-Site Completion
                </span>
              </div>

              {report.resolutionEvidence.map((ev) => (
                <div key={ev.id} className="space-y-3 p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-[#172B3A]">
                      Submitted by: {ev.workerName}
                    </span>
                    <span className="text-[#64748B]">{formatDate(ev.submitted_at)}</span>
                  </div>

                  <p className="text-xs text-slate-700 italic">"{ev.notes}"</p>

                  {ev.signedUrl && (
                    <div className="w-48 aspect-video rounded-lg overflow-hidden border border-slate-200">
                      <img
                        src={ev.signedUrl}
                        alt="Resolution Photo"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right 1 Col: Current Assignment & Immutable Audit Timeline */}
        <div className="space-y-6">
          {/* Active Assignment Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-[#172B3A]">Active Field Assignment</h3>
              <UserCheck className="w-4 h-4 text-cyan-600" />
            </div>

            {report.activeAssignment ? (
              <div className="space-y-3 text-xs">
                <div className="p-3 bg-cyan-50/50 rounded-xl border border-cyan-100 space-y-1">
                  <p className="text-[11px] text-[#64748B]">Assigned Sanitation Lead</p>
                  <p className="font-bold text-[#172B3A] text-sm">
                    {report.activeAssignment.workerName}
                  </p>
                  {report.activeAssignment.workerPhone && (
                    <p className="text-[#64748B]">{report.activeAssignment.workerPhone}</p>
                  )}
                </div>

                <div className="space-y-1">
                  <span className="text-[#64748B]">Dispatched At</span>
                  <p className="font-semibold text-[#172B3A]">
                    {formatDate(report.activeAssignment.assigned_at)}
                  </p>
                </div>

                {report.activeAssignment.notes && (
                  <div className="space-y-1">
                    <span className="text-[#64748B]">Official Dispatch Instructions</span>
                    <p className="text-slate-700 italic">{report.activeAssignment.notes}</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-4 bg-slate-50 rounded-xl text-center space-y-2">
                <p className="text-xs text-[#64748B]">No sanitation crew currently assigned</p>
                {!isResolved && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full text-xs"
                    onClick={() =>
                      setDialogState({
                        isOpen: true,
                        type: 'assign',
                        title: 'Dispatch Sanitation Worker',
                        description: `Assign ${report.complaint_id} to an authorized sanitation team lead.`,
                      })
                    }
                  >
                    Assign Now
                  </Button>
                )}
              </div>
            )}
          </div>

          {/* Immutable Audit Timeline */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-[#087F7B]" />
                <h3 className="text-sm font-bold text-[#172B3A]">Status Audit Trail</h3>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">Immutable Log</span>
            </div>

            <div className="space-y-3 relative before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
              {report.history.map((h) => (
                <div key={h.id} className="relative pl-6 text-xs space-y-0.5">
                  <div className="absolute left-0.5 top-1.5 w-3 h-3 rounded-full bg-white border-2 border-[#087F7B]" />
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#172B3A]">
                      {h.previous_status ? `${h.previous_status} &rarr; ` : ''}
                      {h.new_status}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {new Date(h.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#64748B]">By {h.actorName}</p>
                  {h.note && (
                    <p className="text-[11px] text-slate-700 italic bg-slate-50 p-1.5 rounded mt-0.5">
                      "{h.note}"
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Action Dialog Modal */}
      <ActionDialog
        isOpen={dialogState.isOpen}
        onClose={() => setDialogState((prev) => ({ ...prev, isOpen: false }))}
        title={dialogState.title}
        description={dialogState.description}
        type={dialogState.type}
        workers={workers}
        isSubmitting={
          assignMutation.isPending || transitionMutation.isPending || verifyMutation.isPending
        }
        onSubmit={async ({ workerId, reason, note }) => {
          if (dialogState.type === 'assign' && workerId) {
            await assignMutation.mutateAsync({ workerId, note });
          } else if (dialogState.type === 'reject' && reason) {
            await transitionMutation.mutateAsync({
              newStatus: 'rejected',
              note: note || 'Rejected by municipal official',
              rejectionReason: reason,
            });
          } else if (dialogState.type === 'rework') {
            await verifyMutation.mutateAsync({ approved: false, note });
          } else if (dialogState.type === 'confirm') {
            await verifyMutation.mutateAsync({ approved: true, note });
          }
        }}
      />
    </div>
  );
}
