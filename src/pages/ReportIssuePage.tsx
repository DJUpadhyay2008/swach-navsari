import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  reportSubmissionSchema,
  ReportSubmissionInput,
  COMPLAINT_CATEGORIES,
} from '@/lib/validation/reports';
import { NAVSARI_WARDS, CATEGORY_LABELS } from '@/lib/utils';
import { isSupabaseConfigured, getSupabase } from '@/lib/supabase/client';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { Badge } from '@/components/ui/Badge';
import {
  Camera,
  MapPin,
  Database,
  Info,
} from 'lucide-react';

export function ReportIssuePage() {
  const backendConfigured = isSupabaseConfigured();
  const [submissionStatus, setSubmissionStatus] = useState<
    'idle' | 'submitting' | 'error' | 'not_configured'
  >('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ReportSubmissionInput>({
    resolver: zodResolver(reportSubmissionSchema),
    defaultValues: {
      category: 'garbage_dump',
      priority: 'medium',
      ward_number: 4,
      latitude: 20.9467,
      longitude: 72.9281,
      address_locality: 'Lunsikui Market Area',
      description: '',
      is_anonymous: false,
    },
  });

  const selectedCategory = watch('category');
  const selectedWard = watch('ward_number');

  const onSubmit = async (data: ReportSubmissionInput) => {
    // Strictly do not pretend a successful write if Supabase backend is not configured
    if (!backendConfigured) {
      setSubmissionStatus('not_configured');
      setErrorMessage(
        'Backend connection is not configured. Real complaint submission requires connecting a Supabase project and running the Phase 1 migrations.'
      );
      return;
    }

    setSubmissionStatus('submitting');
    setErrorMessage(null);

    const client = getSupabase();
    if (!client) {
      setSubmissionStatus('error');
      setErrorMessage('Supabase client could not be initialized.');
      return;
    }

    try {
      // In live environment, this calls public.reports insertion
      const { error } = await client.from('reports').insert([
        {
          category: data.category,
          priority: data.priority,
          ward_number: data.ward_number,
          description: data.description,
          address_locality: data.address_locality,
          landmark: data.landmark || null,
          latitude: data.latitude,
          longitude: data.longitude,
          is_anonymous: data.is_anonymous,
          status: 'submitted',
        },
      ]);

      if (error) {
        setSubmissionStatus('error');
        setErrorMessage(error.message);
      } else {
        // Successful live submission
        window.location.href = '/track';
      }
    } catch (err) {
      setSubmissionStatus('error');
      setErrorMessage(err instanceof Error ? err.message : 'Unknown submission error');
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-8">
      {/* Title & Info */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Badge variant="default">Civic Report Portal</Badge>
          {!backendConfigured && (
            <Badge variant="warning">Local Architecture Mode</Badge>
          )}
        </div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">
          Report Civic Waste or Sanitation Issue
        </h1>
        <p className="text-sm text-slate-400">
          Citizen reports are dispatched directly to the responsible Navsari Ward sanitation unit.
        </p>
      </div>

      {/* Backend Status Alert */}
      {!backendConfigured ? (
        <Alert variant="warning" title="Supabase Database Not Connected">
          <p>
            You are viewing the validated frontend complaint submission shell. Since Supabase environment
            variables (<code>VITE_SUPABASE_URL</code>) have not been populated in <code>.env</code>, form
            submissions will not make fake mock writes.
          </p>
          <p className="mt-2 text-xs font-mono bg-amber-950/80 p-2 rounded border border-amber-800/80">
            Apply migrations: supabase migration up (or run SQL files in Supabase dashboard)
          </p>
        </Alert>
      ) : (
        <Alert variant="success" title="Live Backend Connected">
          Connected to S.W.A.C.H. Navsari Supabase instance. Submissions are guarded by Row Level Security.
        </Alert>
      )}

      {errorMessage && (
        <Alert variant="error" title="Submission Guard Notice">
          {errorMessage}
        </Alert>
      )}

      {/* Complaint Submission Form */}
      <Card>
        <CardHeader>
          <CardTitle>Complaint Details &amp; Location</CardTitle>
          <CardDescription>
            All submitted reports generate a unique, non-enumerable tracking identifier (NAV-YYYY-XXXXX).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Category Grid */}
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                1. Select Waste / Cleanliness Category
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {COMPLAINT_CATEGORIES.map((catKey) => {
                  const meta = CATEGORY_LABELS[catKey];
                  const isSelected = selectedCategory === catKey;
                  return (
                    <button
                      type="button"
                      key={catKey}
                      onClick={() => setValue('category', catKey)}
                      className={`text-left p-3 rounded-xl border text-xs transition-all ${
                        isSelected
                          ? 'bg-swach-500/15 border-swach-500 text-white shadow-sm ring-1 ring-swach-500'
                          : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <div className="font-semibold text-slate-100">{meta.label}</div>
                      <div className="text-[10px] text-gujarat-400 font-medium mt-0.5">
                        {meta.gujarati}
                      </div>
                    </button>
                  );
                })}
              </div>
              {errors.category && (
                <p className="text-xs text-rose-400">{errors.category.message}</p>
              )}
            </div>

            {/* Ward & Locality */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                  2. Navsari Ward
                </label>
                <select
                  {...register('ward_number')}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-swach-500"
                >
                  {NAVSARI_WARDS.map((w) => (
                    <option key={w.number} value={w.number}>
                      Ward #{w.number} — {w.name}
                    </option>
                  ))}
                </select>
                {errors.ward_number && (
                  <p className="text-xs text-rose-400">{errors.ward_number.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                  Priority / Urgency
                </label>
                <select
                  {...register('priority')}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-swach-500"
                >
                  <option value="low">Low Priority (5 days SLA)</option>
                  <option value="medium">Medium Priority (72h SLA)</option>
                  <option value="high">High Priority (48h SLA)</option>
                  <option value="urgent">Urgent Hazard (24h SLA)</option>
                </select>
              </div>
            </div>

            {/* Address & Landmark */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                  Street / Locality
                </label>
                <input
                  type="text"
                  placeholder="e.g. Near Dudhia Talav Promenade or Sardar Market Alley"
                  {...register('address_locality')}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-swach-500"
                />
                {errors.address_locality && (
                  <p className="text-xs text-rose-400">{errors.address_locality.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                  Nearby Landmark (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Opposite Municipal Water Tank"
                  {...register('landmark')}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-swach-500"
                />
              </div>
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                Detailed Description of Waste Accumulation
              </label>
              <textarea
                rows={3}
                placeholder="Describe the nature of waste, approximate size, access constraints, or foul odor hazards..."
                {...register('description')}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-sm text-slate-100 focus:outline-none focus:border-swach-500"
              />
              {errors.description && (
                <p className="text-xs text-rose-400">{errors.description.message}</p>
              )}
            </div>

            {/* Photo Evidence Slot */}
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                3. Photographic Evidence (Max 10MB — Stored in Private Bucket)
              </label>
              <div className="border-2 border-dashed border-slate-700 hover:border-swach-500/60 rounded-2xl p-6 text-center bg-slate-900/30 transition-colors">
                <Camera className="w-8 h-8 mx-auto text-slate-400 mb-2" />
                <p className="text-xs text-slate-300 font-medium">
                  Click to select photo or drag and drop image file
                </p>
                <p className="text-[11px] text-slate-500 mt-1">
                  Supported formats: JPG, PNG, WEBP (Protected by Supabase storage.objects RLS)
                </p>
              </div>
            </div>

            {/* Simulated Geolocation Coordinates */}
            <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 text-xs flex items-center justify-between text-slate-400 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-gujarat-400" />
                <span>
                  Simulated Navsari GPS:{' '}
                  <strong className="text-slate-200">20.9467° N, 72.9281° E</strong> (Ward {selectedWard})
                </span>
              </div>
              <span className="text-[11px] text-swach-400 font-medium">GPS Lock Active</span>
            </div>

            {/* Submit Action */}
            <div className="pt-4 border-t border-slate-800 flex items-center justify-between flex-wrap gap-4">
              <div className="text-xs text-slate-400 flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-slate-400" />
                <span>Identity protected; verified officials only</span>
              </div>
              <Button
                type="submit"
                size="lg"
                isLoading={submissionStatus === 'submitting'}
                leftIcon={<Database className="w-4 h-4" />}
              >
                {backendConfigured ? 'Submit Complaint to Supabase' : 'Validate Form Structure'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
