import { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getReportDetailWithMedia, ReportDetailWithMedia } from '@/features/reports/reportsService';
import { STATUS_CONFIG, PRIORITY_CONFIG, CATEGORY_LABELS, formatDate } from '@/lib/utils';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Alert } from '@/components/ui/Alert';
import {
  MapPin,
  Calendar,
  Clock,
  ArrowLeft,
  Camera,
  History,
  AlertCircle,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';

export function ReportDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [report, setReport] = useState<ReportDetailWithMedia | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const fetchDetail = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const data = await getReportDetailWithMedia(id);
      if (!data) {
        setErrorMessage(`No complaint record found matching reference "${id}".`);
      } else {
        setReport(data);
      }
    } catch (err) {
      setErrorMessage(
        err instanceof Error
          ? err.message
          : 'Could not fetch complaint details. You may not be authorized to access this private report.'
      );
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 space-y-6">
        <div className="h-8 w-48 bg-slate-800 rounded animate-pulse" />
        <Card className="p-8 space-y-4 animate-pulse">
          <div className="h-6 w-1/3 bg-slate-800 rounded" />
          <div className="h-4 w-full bg-slate-800/60 rounded" />
          <div className="h-32 w-full bg-slate-800/40 rounded" />
        </Card>
      </div>
    );
  }

  if (errorMessage || !report) {
    return (
      <div className="max-w-lg mx-auto px-4 py-12 space-y-6 text-center">
        <div className="w-16 h-16 rounded-3xl bg-amber-50 border border-amber-200 flex items-center justify-center mx-auto text-amber-600">
          <AlertCircle className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-slate-900">Complaint Not Found</h2>
          <p className="text-xs text-slate-500">
            {errorMessage || 'The requested complaint does not exist or access was restricted.'}
          </p>
        </div>
        <div className="pt-2 flex justify-center gap-3">
          <Link to="/my-reports">
            <Button variant="outline" leftIcon={<ArrowLeft className="w-4 h-4" />}>
              Back to My Reports
            </Button>
          </Link>
          <Button onClick={fetchDetail} leftIcon={<RefreshCw className="w-4 h-4" />}>
            Retry
          </Button>
        </div>
      </div>
    );
  }

  const statusMeta = STATUS_CONFIG[report.status];
  const priorityMeta = PRIORITY_CONFIG[report.priority];
  const categoryMeta = CATEGORY_LABELS[report.category];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-8">
      {/* Back button */}
      <div>
        <Link
          to="/my-reports"
          className="inline-flex items-center gap-2 text-xs text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to My Reports</span>
        </Link>
      </div>

      {/* Main Header Card */}
      <Card className="bg-white border border-slate-200 shadow-xs">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-100 pb-5">
          <div className="space-y-1">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="font-mono text-2xl font-extrabold text-slate-900 tracking-wider">
                {report.complaint_id}
              </span>
              <span
                className={`text-xs px-3 py-1 rounded-full border font-semibold ${statusMeta.badgeClass}`}
              >
                {statusMeta.label}
              </span>
              <span
                className={`text-xs px-2.5 py-1 rounded-md border font-medium ${priorityMeta.badgeClass}`}
              >
                {priorityMeta.label}
              </span>
            </div>
            <div className="text-xs text-slate-500 flex items-center gap-4 flex-wrap pt-1">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                Submitted {formatDate(report.submitted_at)}
              </span>
              {report.resolved_at && (
                <span className="flex items-center gap-1.5 text-emerald-700 font-medium">
                  <Clock className="w-3.5 h-3.5" />
                  Resolved {formatDate(report.resolved_at)}
                </span>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-6 space-y-6">
          {/* Category & Description */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant="neutral">Category</Badge>
              <h3 className="text-base font-bold text-slate-900">
                {categoryMeta.label}
              </h3>
              <span className="text-xs text-emerald-700 font-medium">
                ({categoryMeta.gujarati})
              </span>
            </div>
            <p className="text-sm text-slate-700 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-200">
              {report.description}
            </p>
          </div>

          {/* Location Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-emerald-600" />
                <span>Civic Locality</span>
              </div>
              <div className="text-sm font-semibold text-slate-900">
                {report.address_locality || 'Navsari Municipal Area'}
              </div>
              {report.landmark && (
                <p className="text-xs text-slate-500">Landmark: {report.landmark}</p>
              )}
              {report.ward_number && (
                <p className="text-xs text-emerald-700 font-medium">
                  Assigned Ward #{report.ward_number}
                </p>
              )}
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-emerald-600" />
                <span>Target SLA &amp; Resolution</span>
              </div>
              <div className="text-sm font-semibold text-slate-900">
                {priorityMeta.slaHours} Hours Standard Target
              </div>
              <p className="text-xs text-slate-500">
                {statusMeta.description}
              </p>
              {report.latitude && report.longitude && (
                <a
                  href={`https://maps.google.com/?q=${report.latitude},${report.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-emerald-700 hover:underline pt-1"
                >
                  <span>Open Coordinates in Maps ({report.latitude.toFixed(4)}, {report.longitude.toFixed(4)})</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
          </div>

          {/* Rejection notice if applicable */}
          {report.status === 'rejected' && report.rejection_reason && (
            <Alert variant="error" title="Rejection Reason Documented by Official">
              {report.rejection_reason}
            </Alert>
          )}

          {/* Photographic Evidence Gallery */}
          <div className="space-y-3 pt-4 border-t border-slate-100">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-700 flex items-center gap-2">
              <Camera className="w-4 h-4 text-emerald-600" />
              <span>Photographic Evidence ({report.media.length})</span>
            </h4>

            {report.media.length === 0 ? (
              <p className="text-xs text-slate-500 italic">No initial photo evidence was uploaded for this complaint.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {report.media.map((m, index) => (
                  <div
                    key={m.id}
                    onClick={() => m.signedUrl && setSelectedImage(m.signedUrl)}
                    className="relative rounded-xl overflow-hidden border border-slate-200 bg-slate-100 aspect-video group cursor-pointer hover:border-emerald-500 transition-all shadow-xs"
                  >
                    {m.signedUrl ? (
                      <img
                        src={m.signedUrl}
                        alt={`Evidence photo ${index + 1}`}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xs text-slate-500">
                        Generating secure link...
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2.5">
                      <span className="text-[11px] text-white font-medium flex items-center gap-1">
                        <ExternalLink className="w-3 h-3" />
                        Click to enlarge
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Status History Trail */}
          <div className="space-y-3 pt-4 border-t border-slate-100">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-700 flex items-center gap-2">
              <History className="w-4 h-4 text-emerald-600" />
              <span>Status Lifecycle Audit History</span>
            </h4>

            {report.history.length === 0 ? (
              <p className="text-xs text-slate-500 italic">No status transitions logged yet.</p>
            ) : (
              <div className="relative pl-6 border-l-2 border-slate-200 space-y-4">
                {report.history.map((h) => {
                  const sMeta = STATUS_CONFIG[h.new_status];
                  return (
                    <div key={h.id} className="relative group">
                      <div className="absolute -left-[31px] top-1 w-3 h-3 rounded-full bg-emerald-600 ring-4 ring-white" />
                      <div className="text-xs font-semibold text-slate-900 flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] border ${sMeta.badgeClass}`}>
                          {sMeta.label}
                        </span>
                        <span className="text-slate-500 font-normal">
                          {formatDate(h.created_at)}
                        </span>
                      </div>
                      {h.note && (
                        <p className="text-xs text-slate-600 mt-1 italic">
                          &ldquo;{h.note}&rdquo;
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Lightbox Modal for Fullsize Photo */}
      {selectedImage && (
        <div
          onClick={() => setSelectedImage(null)}
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 cursor-pointer"
        >
          <div className="relative max-w-4xl max-h-[90vh] overflow-hidden rounded-2xl border border-slate-800">
            <img
              src={selectedImage}
              alt="Full size evidence photo"
              className="max-w-full max-h-[85vh] object-contain"
            />
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute top-3 right-3 px-3 py-1.5 rounded-lg bg-black/70 text-white text-xs font-bold hover:bg-rose-600 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
