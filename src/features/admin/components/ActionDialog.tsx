import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { X, AlertTriangle, UserCheck, RotateCcw, CheckCircle2 } from 'lucide-react';

interface WorkerOption {
  id: string;
  fullName: string;
  wardNumber: number | null;
  activeAssignmentsCount: number;
}

interface ActionDialogProps {
  isOpen: boolean;
  type: 'assign' | 'reject' | 'rework' | 'confirm';
  title: string;
  description: string;
  workers?: WorkerOption[];
  isSubmitting?: boolean;
  onClose: () => void;
  onSubmit: (data: { workerId?: string; reason?: string; note?: string }) => Promise<void>;
}

export function ActionDialog({
  isOpen,
  type,
  title,
  description,
  workers = [],
  isSubmitting = false,
  onClose,
  onSubmit,
}: ActionDialogProps) {
  const [selectedWorkerId, setSelectedWorkerId] = useState('');
  const [reason, setReason] = useState('');
  const [note, setNote] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    if (type === 'assign') {
      if (!selectedWorkerId) {
        setValidationError('Please select a sanitation worker to dispatch.');
        return;
      }
      await onSubmit({ workerId: selectedWorkerId, note: note.trim() });
    } else if (type === 'reject') {
      if (!reason.trim() || reason.trim().length < 5) {
        setValidationError('Rejection reason is required (minimum 5 characters for compliance audit trail).');
        return;
      }
      await onSubmit({ reason: reason.trim() });
    } else if (type === 'rework') {
      if (!note.trim() || note.trim().length < 5) {
        setValidationError('Detailed rework instructions are required (minimum 5 characters).');
        return;
      }
      await onSubmit({ note: note.trim() });
    } else {
      await onSubmit({ note: note.trim() });
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div
        className="relative bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-2xl p-6 space-y-5 animate-in fade-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
        aria-labelledby="dialog-title"
      >
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            {type === 'reject' && (
              <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
            )}
            {type === 'assign' && (
              <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 border border-sky-200 flex items-center justify-center shrink-0">
                <UserCheck className="w-5 h-5" />
              </div>
            )}
            {type === 'rework' && (
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center shrink-0">
                <RotateCcw className="w-5 h-5" />
              </div>
            )}
            {type === 'confirm' && (
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            )}
            <div>
              <h3 id="dialog-title" className="text-lg font-bold text-slate-900">
                {title}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">{description}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {validationError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-medium">
              {validationError}
            </div>
          )}

          {/* Type: Assign */}
          {type === 'assign' && (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Select Sanitation Worker <span className="text-rose-500">*</span>
                </label>
                {workers.length === 0 ? (
                  <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-800">
                    No active sanitation workers found registered in database.
                  </div>
                ) : (
                  <select
                    value={selectedWorkerId}
                    onChange={(e) => setSelectedWorkerId(e.target.value)}
                    required
                    className="w-full text-xs bg-white border border-slate-300 rounded-xl px-3 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="">-- Choose sanitation crew lead --</option>
                    {workers.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.fullName} {w.wardNumber ? `(Ward ${w.wardNumber})` : ''} — Active Tasks: {w.activeAssignmentsCount}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Dispatch Instructions / Operational Notes (Optional)
                </label>
                <textarea
                  rows={2}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="e.g. Deploy mini dumper and 2 personnel. Focus on perimeter near main gate."
                  className="w-full text-xs bg-white border border-slate-300 rounded-xl p-3 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>
          )}

          {/* Type: Reject */}
          {type === 'reject' && (
            <div className="space-y-3">
              <div className="p-3 bg-rose-50 rounded-xl border border-rose-200 text-xs text-rose-800">
                <span className="font-semibold text-rose-900">Statutory Compliance Warning:</span> A documented
                rejection reason is permanently logged in the audit trail and visible to the citizen.
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Rejection Reason <span className="text-rose-500">*</span> (min 5 characters)
                </label>
                <textarea
                  rows={3}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  required
                  placeholder="e.g. Site falls under Western Railway jurisdiction; forwarded to railway division office."
                  className="w-full text-xs bg-white border border-slate-300 rounded-xl p-3 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
                <div className="flex justify-between items-center text-[11px] text-slate-500 mt-1">
                  <span>Characters: {reason.trim().length} / 5 required</span>
                  {reason.trim().length >= 5 && <span className="text-emerald-700 font-medium">Valid</span>}
                </div>
              </div>
            </div>
          )}

          {/* Type: Rework */}
          {type === 'rework' && (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Specific Rework Feedback for Sanitation Worker <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={3}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  required
                  placeholder="e.g. Clearance photo shows remaining debris along gutter side. Please sweep and re-upload photo."
                  className="w-full text-xs bg-white border border-slate-300 rounded-xl p-3 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
                <div className="flex justify-between items-center text-[11px] text-slate-500 mt-1">
                  <span>Characters: {note.trim().length} / 5 required</span>
                  {note.trim().length >= 5 && <span className="text-emerald-700 font-medium">Valid</span>}
                </div>
              </div>
            </div>
          )}

          {/* Type: Confirm */}
          {type === 'confirm' && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Official Verification Note (Optional)
              </label>
              <textarea
                rows={2}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="e.g. Inspected on-site completion evidence; verified complete clearance."
                className="w-full text-xs bg-white border border-slate-300 rounded-xl p-3 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          )}

          {/* Footer buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              isLoading={isSubmitting}
              className={
                type === 'reject'
                  ? 'bg-rose-600 hover:bg-rose-500 text-white'
                  : type === 'rework'
                  ? 'bg-amber-600 hover:bg-amber-500 text-white'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white'
              }
            >
              {type === 'reject'
                ? 'Confirm Rejection'
                : type === 'assign'
                ? 'Dispatch Worker'
                : type === 'rework'
                ? 'Send Back for Rework'
                : 'Confirm & Resolve'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
