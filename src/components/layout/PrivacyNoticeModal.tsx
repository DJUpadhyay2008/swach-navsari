import { ShieldCheck, X, Lock, MapPin, Eye, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export function PrivacyNoticeModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="relative bg-white rounded-2xl max-w-2xl w-full border border-slate-200 shadow-2xl p-6 sm:p-8 space-y-6 text-slate-900">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Civic Privacy Notice & Data Policy</h2>
              <p className="text-xs text-slate-500">S.W.A.C.H. Navsari • Systematic Waste Action & Cleanliness Hub</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="space-y-4 text-xs text-slate-600 leading-relaxed max-h-[60vh] overflow-y-auto pr-2">
          <div className="space-y-1.5 p-3 rounded-xl bg-slate-50 border border-slate-200">
            <div className="flex items-center gap-2 text-slate-900 font-bold">
              <MapPin className="w-4 h-4 text-emerald-600" />
              <span>Location Data & Geolocation Consent</span>
            </div>
            <p>
              Your precise GPS coordinates are collected only when you explicitly grant location permissions in your browser.
              If you deny geolocation access, you can submit reports using manual locality or street descriptions. Coordinates are used solely to dispatch municipal sanitation teams and map ward-level cleanliness trends.
            </p>
          </div>

          <div className="space-y-1.5 p-3 rounded-xl bg-slate-50 border border-slate-200">
            <div className="flex items-center gap-2 text-slate-900 font-bold">
              <Lock className="w-4 h-4 text-emerald-600" />
              <span>Private Evidence Storage & Access Controls</span>
            </div>
            <p>
              Complaint photographs and worker completion proof are stored in private, encrypted Supabase object storage buckets (<code className="font-mono text-slate-800">report-evidence</code> and <code className="font-mono text-slate-800">resolution-evidence</code>).
              Storage Row Level Security (RLS) ensures photos are never publicly readable. Access is restricted to the reporting citizen, dispatched sanitation personnel, and authorized municipal officials via short-lived signed URLs.
            </p>
          </div>

          <div className="space-y-1.5 p-3 rounded-xl bg-slate-50 border border-slate-200">
            <div className="flex items-center gap-2 text-slate-900 font-bold">
              <Eye className="w-4 h-4 text-emerald-600" />
              <span>Public Tracking Data Minimization</span>
            </div>
            <p>
              When a citizen or reviewer looks up a report via its reference ID (<code className="font-mono text-slate-800">NAV-YYYY-XXXXX</code>) or secure tracking token, only non-sensitive operational fields are returned: complaint category, status, priority, ward number, and general locality.
              Citizen identity, phone numbers, private photos, and internal municipal notes are strictly excluded from public tracking responses.
            </p>
          </div>

          <div className="space-y-1.5 p-3 rounded-xl bg-slate-50 border border-slate-200">
            <div className="flex items-center gap-2 text-slate-900 font-bold">
              <Trash2 className="w-4 h-4 text-emerald-600" />
              <span>Data Retention & Deletion Guidance</span>
            </div>
            <p>
              Civic complaint records and resolution proof are retained to maintain an immutable audit trail for municipal cleanliness accountability.
              Citizens wishing to remove personal profile details or request report redaction can contact the municipal sanitation desk or local ward administration.
            </p>
          </div>

          <p className="text-[11px] text-slate-400 italic">
            Disclaimer: S.W.A.C.H. Navsari is a community civic cleanliness initiative developed for demonstration and hackathon evaluation. While designed with enterprise security and strict RLS boundaries, official municipal endorsement remains subject to formal local administrative review.
          </p>
        </div>

        {/* Footer */}
        <div className="pt-2 flex justify-end">
          <Button variant="primary" onClick={onClose}>
            Understood & Close
          </Button>
        </div>
      </div>
    </div>
  );
}
