import { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'react-router-dom';
import { complaintTrackSchema, ComplaintTrackInput } from '@/lib/validation/reports';
import { isSupabaseConfigured, getSupabase } from '@/lib/supabase/client';
import { STATUS_CONFIG, PRIORITY_CONFIG, formatDate } from '@/lib/utils';
import type { ComplaintStatus, ComplaintPriority } from '@/types';
import { useDemoMode, DemoDataBanner, DemoToggle, SIMULATED_REPORTS } from '@/lib/demo';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Alert } from '@/components/ui/Alert';
import {
  Search,
  CheckCircle2,
  Clock,
  MapPin,
  Calendar,
  Info,
  ArrowRight,
} from 'lucide-react';

interface DisplayReport {
  complaint_id: string;
  category: string;
  status: ComplaintStatus;
  priority: ComplaintPriority;
  ward_number: number;
  address_locality: string;
  submitted_at: string;
  resolved_at: string | null;
  reopened_at: string | null;
  isSimulated?: boolean;
}

export function TrackComplaintPage() {
  const backendConfigured = isSupabaseConfigured();
  const { isDemoMode } = useDemoMode();
  const [loading, setLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [reportResult, setReportResult] = useState<DisplayReport | null>(null);
  const lastSearchTimeRef = useRef<number>(0);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<ComplaintTrackInput>({
    resolver: zodResolver(complaintTrackSchema),
    defaultValues: {
      complaint_id: 'NAV-2026-00101',
    },
  });

  const onSearch = async (data: ComplaintTrackInput) => {
    // Abuse protection: 500ms rate limit throttle
    const now = Date.now();
    if (now - lastSearchTimeRef.current < 500) {
      return;
    }
    lastSearchTimeRef.current = now;

    setLoading(true);
    setSearchError(null);
    setReportResult(null);

    const queryKey = data.complaint_id.trim().toUpperCase();

    // 1. If in Demo Mode, search isolated synthetic dataset
    if (isDemoMode) {
      setTimeout(() => {
        const found = SIMULATED_REPORTS.find(
          (r) =>
            r.complaint_id.toUpperCase() === queryKey ||
            r.tracking_token?.toUpperCase() === queryKey
        );

        if (found) {
          setReportResult({
            complaint_id: found.complaint_id,
            category: found.category,
            status: found.status,
            priority: found.priority,
            ward_number: found.ward_number || 1,
            address_locality: found.address_locality || 'Navsari',
            submitted_at: found.submitted_at,
            resolved_at: found.resolved_at,
            reopened_at: found.reopened_at,
            isSimulated: true,
          });
        } else {
          setSearchError(
            `No simulated demo complaint found matching '${data.complaint_id}'. (Try demo ID: NAV-2026-00101, NAV-2026-00104, or NAV-2026-00098)`
          );
        }
        setLoading(false);
      }, 200);
      return;
    }

    // 2. If backend is unconfigured and not in demo mode
    if (!backendConfigured) {
      setSearchError(
        'Supabase backend credentials are not yet configured. Switch on Demo Mode to test with simulated data, or configure VITE_SUPABASE_URL in .env.'
      );
      setLoading(false);
      return;
    }

    // 3. Live Supabase query using trusted security definer function track_complaint
    const client = getSupabase();
    if (!client) {
      setSearchError('Could not initialize Supabase client.');
      setLoading(false);
      return;
    }

    try {
      const { data: records, error } = await client.rpc('track_complaint', {
        p_complaint_id: queryKey,
      });

      if (error) {
        setSearchError(error.message);
      } else if (!records || records.length === 0) {
        setSearchError(`No complaint found with Reference ID '${data.complaint_id}'.`);
      } else {
        const first = records[0];
        if (first) {
          setReportResult({
            complaint_id: first.complaint_id,
            category: first.category,
            status: first.status,
            priority: first.priority,
            ward_number: first.ward_number,
            address_locality: first.address_locality,
            submitted_at: first.submitted_at,
            resolved_at: first.resolved_at,
            reopened_at: first.reopened_at,
            isSimulated: false,
          });
        }
      }
    } catch (err) {
      setSearchError(err instanceof Error ? err.message : 'Failed to query database');
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    { key: 'submitted', label: '1. Submitted' },
    { key: 'under_review', label: '2. Triaged' },
    { key: 'assigned', label: '3. Assigned' },
    { key: 'in_progress', label: '4. In Progress' },
    { key: 'resolution_submitted', label: '5. Work Done' },
    { key: 'resolved', label: '6. Verified' },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-8">
      {/* Demo Banner */}
      <DemoDataBanner />

      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-2">
          <Badge variant="default">Public Tracking</Badge>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Track Waste Complaint Status
          </h1>
          <p className="text-sm text-slate-500">
            Enter your safe Complaint Identifier (NAV-YYYY-XXXXX) to check real-time municipal action.
          </p>
        </div>
        <div>
          <DemoToggle />
        </div>
      </div>

      {/* Search Bar */}
      <Card className="bg-white border border-slate-200 shadow-xs">
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit(onSearch)} className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 space-y-1">
              <input
                type="text"
                placeholder="e.g. NAV-2026-00101"
                {...register('complaint_id')}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-sm text-slate-900 uppercase tracking-wider font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
              />
              {errors.complaint_id && (
                <p className="text-xs text-rose-500">{errors.complaint_id.message}</p>
              )}
            </div>
            <Button
              type="submit"
              size="lg"
              isLoading={loading}
              leftIcon={<Search className="w-4 h-4" />}
            >
              Track Complaint
            </Button>
          </form>

          {/* Quick Demo Seed Pills */}
          <div className="mt-3 flex items-center gap-2 text-xs text-slate-500 flex-wrap">
            <span>Demo sample references:</span>
            <button
              type="button"
              onClick={() => setValue('complaint_id', 'NAV-2026-00101')}
              className="text-emerald-700 hover:underline font-mono bg-slate-100 px-2 py-0.5 rounded border border-slate-200"
            >
              NAV-2026-00101 (Grid Substation)
            </button>
            <button
              type="button"
              onClick={() => setValue('complaint_id', 'NAV-2026-00104')}
              className="text-emerald-700 hover:underline font-mono bg-slate-100 px-2 py-0.5 rounded border border-slate-200"
            >
              NAV-2026-00104 (Lunsikui Market)
            </button>
            <button
              type="button"
              onClick={() => setValue('complaint_id', 'NAV-2026-00098')}
              className="text-emerald-700 hover:underline font-mono bg-slate-100 px-2 py-0.5 rounded border border-slate-200"
            >
              NAV-2026-00098 (Dandi Road)
            </button>
          </div>
        </CardContent>
      </Card>

      {searchError && (
        <Alert variant="error" title="Record Not Found">
          {searchError}
        </Alert>
      )}

      {/* Result Display */}
      {reportResult && (
        <div className="space-y-6">
          <Card className="bg-white border border-slate-200 shadow-xs">
            <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono text-xl font-bold text-slate-900 tracking-wider">
                    {reportResult.complaint_id}
                  </span>
                  <span
                    className={`text-xs px-2.5 py-0.5 rounded-full border font-semibold ${
                      STATUS_CONFIG[reportResult.status].badgeClass
                    }`}
                  >
                    {STATUS_CONFIG[reportResult.status].label}
                  </span>
                  {reportResult.isSimulated && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                      DEMO DATA — SIMULATED
                    </span>
                  )}
                </div>
                <div className="text-xs text-slate-500 mt-1 flex items-center gap-3">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                    Ward {reportResult.ward_number} — {reportResult.address_locality}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span
                  className={`text-xs px-2.5 py-1 rounded-md border font-medium ${
                    PRIORITY_CONFIG[reportResult.priority].badgeClass
                  }`}
                >
                  {PRIORITY_CONFIG[reportResult.priority].label}
                </span>
              </div>
            </CardHeader>

            <CardContent className="pt-6 space-y-6">
              {/* Stepper Timeline */}
              <div className="space-y-3">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Lifecycle Progress
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-6 gap-2">
                  {steps.map((st, idx) => {
                    const currentStepNum = STATUS_CONFIG[reportResult.status].step;
                    const thisStepNum = idx + 1;
                    const isCompleted = currentStepNum >= thisStepNum;
                    const isCurrent = currentStepNum === thisStepNum;

                    return (
                      <div
                        key={st.key}
                        className={`p-2.5 rounded-xl border text-center transition-all ${
                          isCurrent
                            ? 'bg-emerald-50 border-emerald-500 text-emerald-900 font-bold shadow-xs ring-1 ring-emerald-500'
                            : isCompleted
                            ? 'bg-emerald-50/50 border-emerald-200 text-emerald-700'
                            : 'bg-slate-50 border-slate-200 text-slate-400'
                        }`}
                      >
                        <div className="text-[11px] truncate">{st.label}</div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Status explanation */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-3">
                <Info className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div className="text-xs space-y-1">
                  <div className="font-semibold text-slate-900">
                    Current Phase: {STATUS_CONFIG[reportResult.status].label}
                  </div>
                  <div className="text-slate-600">
                    {STATUS_CONFIG[reportResult.status].description}
                  </div>
                </div>
              </div>

              {/* Dates & Metrics */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                  <div className="text-slate-500 flex items-center gap-1 mb-1">
                    <Calendar className="w-3.5 h-3.5" />
                    Submitted
                  </div>
                  <div className="font-semibold text-slate-800">
                    {formatDate(reportResult.submitted_at)}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                  <div className="text-slate-500 flex items-center gap-1 mb-1">
                    <Clock className="w-3.5 h-3.5" />
                    Target SLA
                  </div>
                  <div className="font-semibold text-slate-800">
                    {PRIORITY_CONFIG[reportResult.priority].slaHours} Hours Resolution
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                  <div className="text-slate-500 flex items-center gap-1 mb-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Status Verification
                  </div>
                  <div className="font-semibold text-slate-800">
                    {reportResult.resolved_at ? formatDate(reportResult.resolved_at) : 'In Progress'}
                  </div>
                </div>
              </div>

              {/* Detail link */}
              <div className="pt-4 border-t border-slate-100 flex justify-end">
                <Link to={`/reports/${reportResult.complaint_id}`}>
                  <Button variant="outline" size="sm" rightIcon={<ArrowRight className="w-4 h-4" />}>
                    View Detailed History &amp; Evidence
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
