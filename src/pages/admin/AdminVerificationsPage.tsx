import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getPendingVerifications, verifyResolution } from '@/features/admin';
import { StatusBadge } from '@/features/admin/components/StatusBadge';
import { SlaBadge } from '@/features/admin/components/SlaBadge';
import { ActionDialog } from '@/features/admin/components/ActionDialog';
import { CATEGORY_LABELS, formatDate } from '@/lib/utils';
import {
  CheckCircle2,
  RotateCcw,
  AlertCircle,
  ExternalLink,
  RefreshCw,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/Button';

export function AdminVerificationsPage() {
  const queryClient = useQueryClient();
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  const [dialogState, setDialogState] = useState<{
    isOpen: boolean;
    type: 'rework' | 'confirm';
    title: string;
    description: string;
  }>({
    isOpen: false,
    type: 'confirm',
    title: '',
    description: '',
  });

  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const { data: items = [], isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ['admin-pending-verifications'],
    queryFn: getPendingVerifications,
  });

  const verifyMutation = useMutation({
    mutationFn: ({ reportId, approved, note }: { reportId: string; approved: boolean; note?: string }) =>
      verifyResolution(reportId, approved, note),
    onSuccess: (data) => {
      setNotification({
        type: 'success',
        message: `Complaint ${data.complaint_id} ${
          data.status === 'resolved' ? 'verified & resolved' : 'sent back for rework'
        }.`,
      });
      queryClient.invalidateQueries({ queryKey: ['admin-pending-verifications'] });
      queryClient.invalidateQueries({ queryKey: ['admin-overview-metrics'] });
      queryClient.invalidateQueries({ queryKey: ['admin-reports'] });
      setDialogState((prev) => ({ ...prev, isOpen: false }));
      setSelectedReportId(null);
    },
    onError: (err: Error) => {
      setNotification({ type: 'error', message: err.message });
    },
  });

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#172B3A] tracking-tight">
            Resolution Verification Deck
          </h1>
          <p className="text-xs text-[#64748B] mt-0.5">
            Audit completion photos and field remediation evidence uploaded by sanitation crews before marking complaints resolved.
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
            Refresh Queue
          </Button>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-teal-50 text-[#087F7B] border border-teal-200">
            {items.length} Awaiting Verification
          </span>
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

      {/* Content */}
      {isLoading ? (
        <div className="space-y-4 animate-pulse">
          {[1, 2].map((i) => (
            <div key={i} className="h-64 bg-white rounded-2xl border border-slate-200 p-6" />
          ))}
        </div>
      ) : error ? (
        <div className="p-8 bg-white rounded-2xl border border-slate-200 text-center space-y-3">
          <AlertCircle className="w-8 h-8 text-rose-500 mx-auto" />
          <p className="text-sm font-bold text-[#172B3A]">Failed to Load Verification Queue</p>
          <p className="text-xs text-[#64748B]">{(error as Error).message}</p>
          <Button size="sm" onClick={() => refetch()}>
            Try Again
          </Button>
        </div>
      ) : items.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-teal-50 border border-teal-200 text-[#087F7B] flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h2 className="text-base font-bold text-[#172B3A]">Verification Queue is Clear</h2>
          <p className="text-xs text-[#64748B] max-w-sm mx-auto">
            There are currently no resolved complaints awaiting municipal verification. When sanitation workers submit completion photos, they will appear here.
          </p>
          <Link to="/admin/reports">
            <Button size="sm" variant="outline">
              Inspect General Queue
            </Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((item) => {
            const rep = item.report;
            const ev = item.evidence;
            const cat = CATEGORY_LABELS[rep.category];

            return (
              <div
                key={rep.id}
                className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-5"
              >
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-sm text-[#087F7B]">
                        {rep.complaint_id}
                      </span>
                      <StatusBadge status={rep.status} />
                      <SlaBadge priority={rep.priority} />
                    </div>
                    <h3 className="text-base font-bold text-[#172B3A]">
                      {cat?.label || rep.category}
                    </h3>
                    <p className="text-xs text-[#64748B]">
                      Ward {rep.ward_number || '—'} • {rep.address_locality || 'Navsari'}
                    </p>
                  </div>

                  <Link to={`/admin/reports/${rep.id}`}>
                    <Button size="sm" variant="outline" rightIcon={<ExternalLink className="w-3.5 h-3.5" />}>
                      Full Triage View
                    </Button>
                  </Link>
                </div>

                {/* Verification Evidence Grid: Description & Completion Photo */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                  {/* Complaint Context */}
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-3 text-xs">
                    <div>
                      <span className="font-bold text-[#172B3A] block">Initial Citizen Complaint:</span>
                      <p className="text-slate-600 mt-1 italic">"{rep.description}"</p>
                    </div>

                    <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px] text-[#64748B]">
                      <span>Filed: {formatDate(rep.submitted_at)}</span>
                      <span>By: {rep.is_anonymous ? 'Anonymous Resident' : 'Registered Citizen'}</span>
                    </div>

                    <div className="p-3 bg-white rounded-lg border border-slate-200 text-xs space-y-1">
                      <span className="font-semibold text-[#172B3A]">Worker Completion Notes:</span>
                      <p className="text-slate-700 italic">"{ev.notes}"</p>
                      <div className="text-[10px] text-teal-800 font-medium pt-1">
                        Remediated by: {item.workerProfile?.full_name || 'Sanitation Crew'} • {formatDate(ev.submitted_at)}
                      </div>
                    </div>
                  </div>

                  {/* Resolution Photo Card */}
                  <div className="bg-slate-50 rounded-xl border border-slate-100 p-4 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-[#172B3A]">On-Site Cleanliness Photo</span>
                      <span className="text-[11px] text-teal-700 font-semibold bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                        Resolution Evidence
                      </span>
                    </div>

                    {ev.signedUrl ? (
                      <div className="aspect-video w-full rounded-lg overflow-hidden border border-slate-200 relative group">
                        <img
                          src={ev.signedUrl}
                          alt="Resolution completion evidence"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                        />
                        <a
                          href={ev.signedUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-semibold"
                        >
                          Expand Photo
                        </a>
                      </div>
                    ) : (
                      <div className="aspect-video w-full bg-slate-200 rounded-lg flex items-center justify-center text-xs text-slate-500">
                        Photo preview unavailable
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions Bar */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-amber-700 hover:bg-amber-50"
                    onClick={() => {
                      setSelectedReportId(rep.id);
                      setDialogState({
                        isOpen: true,
                        type: 'rework',
                        title: 'Request Site Rework',
                        description: `Send ${rep.complaint_id} back to the sanitation worker with specific remediation instructions.`,
                      });
                    }}
                    leftIcon={<RotateCcw className="w-3.5 h-3.5 text-amber-600" />}
                  >
                    Request Rework
                  </Button>

                  <Button
                    size="sm"
                    className="bg-[#087F7B] hover:bg-[#066461] text-white"
                    onClick={() => {
                      setSelectedReportId(rep.id);
                      setDialogState({
                        isOpen: true,
                        type: 'confirm',
                        title: 'Verify & Mark Resolved',
                        description: `Confirm that ${rep.complaint_id} has been cleaned satisfactorily.`,
                      });
                    }}
                    leftIcon={<CheckCircle2 className="w-3.5 h-3.5" />}
                  >
                    Approve & Verify Resolution
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Action Dialog */}
      <ActionDialog
        isOpen={dialogState.isOpen}
        onClose={() => {
          setDialogState((prev) => ({ ...prev, isOpen: false }));
          setSelectedReportId(null);
        }}
        title={dialogState.title}
        description={dialogState.description}
        type={dialogState.type}
        isSubmitting={verifyMutation.isPending}
        onSubmit={async ({ note }) => {
          if (selectedReportId) {
            await verifyMutation.mutateAsync({
              reportId: selectedReportId,
              approved: dialogState.type === 'confirm',
              note,
            });
          }
        }}
      />
    </div>
  );
}
