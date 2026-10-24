import { useState, type FormEvent } from 'react';
import { X, AlertTriangle, UserCheck, CheckCircle2, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import type { SanitationWorkerItem } from '../types';

interface ActionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description: string;
  type: 'assign' | 'reject' | 'rework' | 'confirm';
  workers?: SanitationWorkerItem[];
  defaultWorkerId?: string;
  isSubmitting?: boolean;
  onSubmit: (data: { workerId?: string; reason?: string; note?: string }) => Promise<void>;
}

export function ActionDialog({
  isOpen,
  onClose,
  title,
  description,
  type,
  workers = [],
  defaultWorkerId,
  isSubmitting = false,
  onSubmit,
}: ActionDialogProps) {
  const [selectedWorkerId, setSelectedWorkerId] = useState<string>(defaultWorkerId || '');
  const [reason, setReason] = useState('');
  const [note, setNote] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    if (type === 'assign') {
      if (!selectedWorkerId) {
        setValidationError('Please select an authorized sanitation worker.');
        return;
      }
      await onSubmit({ workerId: selectedWorkerId, note });
    } else if (type === 'reject') {
      if (!reason || reason.trim().length < 5) {
        setValidationError('A rejection reason of at least 5 characters is mandatory under municipal audit rules.');
        return;
      }
      await onSubmit({ reason: reason.trim(), note: note.trim() });
    } else if (type === 'rework') {
      if (!note || note.trim().length < 5) {
        setValidationError('Please provide specific rework instructions (min 5 characters) for the worker.');
        return;
      }
      await onSubmit({ note: note.trim() });
    } else {
      await onSubmit({ note: note.trim() });
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div
        className="relative bg-slate-900 rounded-2xl max-w-lg w-full border border-slate-800 shadow-2xl p-6 space-y-5 animate-in fade-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
        aria-labelledby="dialog-title"
      >
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            {type === 'reject' && (
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
            )}
            {type === 'assign' && (
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 flex items-center justify-center shrink-0">
                <UserCheck className="w-5 h-5" />
              </div>
            )}
            {type === 'rework' && (
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center shrink-0">
                <RotateCcw className="w-5 h-5" />
              </div>
            )}
            {type === 'confirm' && (
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            )}
            <div>
              <h3 id="dialog-title" className="text-lg font-bold text-white">
                {title}
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">{description}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {validationError && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300 font-medium">
              {validationError}
            </div>
          )}

          {/* Type: Assign */}
          {type === 'assign' && (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Select Sanitation Worker <span className="text-rose-400">*</span>
                </label>
                {workers.length === 0 ? (
                  <div className="p-3 bg-amber-500/10 rounded-xl border border-amber-500/30 text-xs text-amber-300">
                    No active sanitation workers found registered in database.
                  </div>
                ) : (
                  <select
                    value={selectedWorkerId}
                    onChange={(e) => setSelectedWorkerId(e.target.value)}
                    required
                    className="w-full text-xs bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-slate-100 focus:outline-none focus:ring-2 focus:ring-swach-500 focus:border-swach-500"
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
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Dispatch Instructions / Operational Notes (Optional)
                </label>
                <textarea
                  rows={2}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="e.g. Deploy mini dumper and 2 personnel. Focus on perimeter near main gate."
                  className="w-full text-xs bg-slate-950 border border-slate-700 rounded-xl p-3 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-swach-500 focus:border-swach-500"
                />
              </div>
            </div>
          )}

          {/* Type: Reject */}
          {type === 'reject' && (
            <div className="space-y-3">
              <div className="p-3 bg-rose-500/10 rounded-xl border border-rose-500/30 text-xs text-rose-300">
                <span className="font-semibold text-rose-200">Statutory Compliance Warning:</span> A documented
                rejection reason is permanently logged in the audit trail and visible to the citizen.
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Rejection Reason <span className="text-rose-400">*</span> (min 5 characters)
                </label>
                <textarea
                  rows={3}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  required
                  placeholder="e.g. Site falls under Western Railway jurisdiction; forwarded to railway division office."
                  className="w-full text-xs bg-slate-950 border border-slate-700 rounded-xl p-3 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
                />
                <div className="flex justify-between items-center text-[11px] text-slate-400 mt-1">
                  <span>Characters: {reason.trim().length} / 5 required</span>
                  {reason.trim().length >= 5 && <span className="text-emerald-400 font-medium">Valid</span>}
                </div>
              </div>
            </div>
          )}

          {/* Type: Rework */}
          {type === 'rework' && (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Specific Rework Feedback for Sanitation Worker <span className="text-rose-400">*</span>
                </label>
                <textarea
                  rows={3}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  required
                  placeholder="e.g. Clearance photo shows remaining debris along gutter side. Please sweep and re-upload photo."
                  className="w-full text-xs bg-slate-950 border border-slate-700 rounded-xl p-3 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                />
                <div className="flex justify-between items-center text-[11px] text-slate-400 mt-1">
                  <span>Characters: {note.trim().length} / 5 required</span>
                  {note.trim().length >= 5 && <span className="text-emerald-400 font-medium">Valid</span>}
                </div>
              </div>
            </div>
          )}

          {/* Type: Confirm */}
          {type === 'confirm' && (
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Official Verification Note (Optional)
              </label>
              <textarea
                rows={2}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="e.g. Inspected on-site completion evidence; verified complete clearance."
                className="w-full text-xs bg-slate-950 border border-slate-700 rounded-xl p-3 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>
          )}

          {/* Footer buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
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
                  : 'bg-swach-600 hover:bg-swach-500 text-white'
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
