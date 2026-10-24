import React, { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router-dom';
import {
  reportSubmissionSchema,
  ReportSubmissionInput,
  COMPLAINT_CATEGORIES,
  MAX_PHOTO_COUNT,
  validatePhotoFile,
} from '@/lib/validation/reports';
import { NAVSARI_WARDS, CATEGORY_LABELS } from '@/lib/utils';
import { useAuth } from '@/features/auth';
import { submitCitizenReport } from '@/features/reports/reportsService';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { Badge } from '@/components/ui/Badge';
import {
  Camera,
  MapPin,
  CheckCircle2,
  Trash2,
  Lock,
  ArrowRight,
  Crosshair,
  Loader2,
  FileText,
} from 'lucide-react';

export function ReportIssuePage() {
  const { user, isConfigured } = useAuth();
  const navigate = useNavigate();

  // Photo state
  const [selectedPhotos, setSelectedPhotos] = useState<File[]>([]);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);
  const [photoErrors, setPhotoErrors] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Geolocation state
  const [isLocating, setIsLocating] = useState(false);
  const [geoNotice, setGeoNotice] = useState<string | null>(null);

  // Submission state
  const [progressStep, setProgressStep] = useState<string | null>(null);
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [createdComplaintId, setCreatedComplaintId] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ReportSubmissionInput>({
    resolver: zodResolver(reportSubmissionSchema),
    defaultValues: {
      category: 'garbage_dump',
      priority: 'medium',
      ward_number: 4,
      latitude: null,
      longitude: null,
      address_locality: '',
      landmark: '',
      description: '',
      is_anonymous: false,
    },
  });

  const selectedCategory = watch('category');
  const currentLat = watch('latitude');
  const currentLng = watch('longitude');
  const descValue = watch('description') || '';

  // Handle browser geolocation
  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      setGeoNotice('Browser geolocation is not supported on this device. Please enter your street address manually.');
      return;
    }

    setIsLocating(true);
    setGeoNotice(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = Number(pos.coords.latitude.toFixed(6));
        const lng = Number(pos.coords.longitude.toFixed(6));
        setValue('latitude', lat, { shouldValidate: true });
        setValue('longitude', lng, { shouldValidate: true });
        setGeoNotice(`GPS locked: ${lat}° N, ${lng}° E`);
        setIsLocating(false);
      },
      (err) => {
        setIsLocating(false);
        if (err.code === err.PERMISSION_DENIED) {
          setGeoNotice('Location permission was denied. You can enter the street or locality manually below.');
        } else {
          setGeoNotice('Could not acquire GPS position. Please enter the locality manually.');
        }
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleClearLocation = () => {
    setValue('latitude', null, { shouldValidate: true });
    setValue('longitude', null, { shouldValidate: true });
    setGeoNotice(null);
  };

  // Photo file selection
  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;

    const files = Array.from(e.target.files);
    const newErrors: string[] = [];
    const validFiles: File[] = [];

    for (const f of files) {
      if (selectedPhotos.length + validFiles.length >= MAX_PHOTO_COUNT) {
        newErrors.push(`Maximum of ${MAX_PHOTO_COUNT} photos allowed per report.`);
        break;
      }
      const validation = validatePhotoFile(f);
      if (!validation.valid) {
        newErrors.push(validation.error || 'Invalid file');
      } else {
        validFiles.push(f);
      }
    }

    if (validFiles.length > 0) {
      const newPhotos = [...selectedPhotos, ...validFiles];
      setSelectedPhotos(newPhotos);
      const newUrls = validFiles.map((file) => URL.createObjectURL(file));
      setPhotoPreviews([...photoPreviews, ...newUrls]);
    }

    setPhotoErrors(newErrors);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleRemovePhoto = (index: number) => {
    const updatedPhotos = selectedPhotos.filter((_, i) => i !== index);
    const updatedPreviews = photoPreviews.filter((_, i) => i !== index);
    URL.revokeObjectURL(photoPreviews[index] || '');
    setSelectedPhotos(updatedPhotos);
    setPhotoPreviews(updatedPreviews);
  };

  const onSubmit = async (data: ReportSubmissionInput) => {
    if (!user) {
      setSubmissionError('You must be signed in to submit a report.');
      return;
    }

    setSubmissionError(null);
    setProgressStep('Registering report...');

    try {
      const result = await submitCitizenReport(
        data,
        selectedPhotos,
        user.id,
        (step) => {
          if (step === 'inserting_report') setProgressStep('Registering complaint in database...');
          if (step === 'uploading_photos') setProgressStep('Uploading evidence photos to private storage...');
          if (step === 'linking_media') setProgressStep('Linking photographic evidence...');
          if (step === 'completed') setProgressStep(null);
        }
      );

      setCreatedComplaintId(result.report.complaint_id);
    } catch (err) {
      setProgressStep(null);
      setSubmissionError(err instanceof Error ? err.message : 'Failed to submit report. Please retry.');
    }
  };

  // If successfully submitted, display the confirmation screen
  if (createdComplaintId) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 space-y-6 text-center">
        <div className="w-16 h-16 rounded-3xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-400">
          <CheckCircle2 className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <Badge variant="success">Complaint Registered</Badge>
          <h1 className="text-3xl font-extrabold text-white">Report Successfully Submitted</h1>
          <p className="text-sm text-slate-400 max-w-md mx-auto">
            Your complaint has been queued for municipal triage in Navsari. Use your unique Complaint Reference to track progress.
          </p>
        </div>

        <Card className="max-w-md mx-auto bg-slate-900/90 border-swach-500/30 p-6">
          <div className="text-xs uppercase font-semibold text-slate-400 tracking-wider">
            Your Tracking Reference
          </div>
          <div className="mt-2 text-2xl font-mono font-bold text-swach-400 tracking-wider">
            {createdComplaintId}
          </div>
          <p className="text-xs text-slate-400 mt-2">
            Status: <span className="text-amber-400 font-semibold">Submitted &amp; Queued</span>
          </p>
        </Card>

        <div className="flex flex-col sm:flex-row justify-center gap-3 pt-4">
          <Button
            size="lg"
            onClick={() => navigate(`/reports/${createdComplaintId}`)}
            leftIcon={<FileText className="w-4 h-4" />}
          >
            View Complaint Details
          </Button>
          <Button
            variant="outline"
            size="lg"
            onClick={() => navigate('/my-reports')}
          >
            My Reports Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-8">
      {/* Title & Info */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Badge variant="default">Citizen Reporting</Badge>
          {user && (
            <Badge variant="success">
              Signed in: {user.email?.split('@')[0]}
            </Badge>
          )}
        </div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">
          Report Civic Waste or Sanitation Issue
        </h1>
        <p className="text-sm text-slate-400">
          Citizen reports are dispatched directly to the responsible Navsari Ward sanitation unit.
        </p>
      </div>

      {/* Backend connection warning */}
      {!isConfigured && (
        <Alert variant="warning" title="Supabase Backend Not Configured">
          Please set <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_ANON_KEY</code> in <code>.env</code>.
          Submissions are disabled until backend credentials are supplied.
        </Alert>
      )}

      {/* Auth required banner if not signed in */}
      {!user && (
        <Alert variant="info" title="Citizen Sign-In Required">
          <p>
            You must be signed in with a citizen account to submit a report and track resolution evidence.
          </p>
          <div className="mt-3">
            <Link to="/auth" state={{ from: '/report' }}>
              <Button size="sm" leftIcon={<Lock className="w-3.5 h-3.5" />}>
                Sign In / Register to Continue
              </Button>
            </Link>
          </div>
        </Alert>
      )}

      {submissionError && (
        <Alert variant="error" title="Submission Failed">
          {submissionError}
        </Alert>
      )}

      {/* Form Card */}
      <Card>
        <CardHeader>
          <CardTitle>Complaint Details &amp; Location</CardTitle>
          <CardDescription>
            Photographic evidence and precise location enable rapid sanitation worker dispatch.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Category Selection */}
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                1. Select Waste Category <span className="text-rose-400">*</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {COMPLAINT_CATEGORIES.map((catKey) => {
                  const meta = CATEGORY_LABELS[catKey];
                  const isSelected = selectedCategory === catKey;
                  return (
                    <button
                      type="button"
                      key={catKey}
                      onClick={() => setValue('category', catKey, { shouldValidate: true })}
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

            {/* Location Section */}
            <div className="space-y-3 pt-2 border-t border-slate-800">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                  2. Incident Location (GPS or Manual Address) <span className="text-rose-400">*</span>
                </label>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={handleGetLocation}
                    isLoading={isLocating}
                    leftIcon={<Crosshair className="w-3.5 h-3.5 text-swach-400" />}
                  >
                    Acquire GPS Location
                  </Button>
                  {(currentLat || currentLng) && (
                    <button
                      type="button"
                      onClick={handleClearLocation}
                      className="text-xs text-rose-400 hover:underline"
                    >
                      Clear GPS
                    </button>
                  )}
                </div>
              </div>

              {geoNotice && (
                <p className="text-xs text-swach-300 bg-slate-900/80 p-2.5 rounded-lg border border-slate-800 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-gujarat-400 shrink-0" />
                  <span>{geoNotice}</span>
                </p>
              )}

              {/* Coordinates preview if available */}
              {currentLat && currentLng && (
                <div className="p-2.5 rounded-xl bg-swach-500/10 border border-swach-500/30 text-xs text-swach-300 flex items-center justify-between">
                  <span>GPS Lat: <strong>{currentLat}</strong>, Lng: <strong>{currentLng}</strong></span>
                  <span className="text-[11px] font-semibold uppercase bg-swach-500/20 px-2 py-0.5 rounded">GPS Ready</span>
                </div>
              )}

              {/* Manual Address & Locality */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs text-slate-300 font-medium">
                    Street / Society / Locality
                    {!currentLat && <span className="text-rose-400"> (Required if GPS not used)</span>}
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Near Dudhia Talav Promenade or Lunsikui Market"
                    {...register('address_locality')}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-swach-500"
                  />
                  {errors.address_locality && (
                    <p className="text-xs text-rose-400">{errors.address_locality.message}</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs text-slate-300 font-medium">
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

              {/* Ward & Priority */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs text-slate-300 font-medium">
                    Navsari Municipal Ward (Select if known)
                  </label>
                  <select
                    {...register('ward_number')}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-swach-500"
                  >
                    <option value="">Unknown / Municipal Triage to Assign</option>
                    {NAVSARI_WARDS.map((w) => (
                      <option key={w.number} value={w.number}>
                        Ward #{w.number} — {w.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs text-slate-300 font-medium">
                    Urgency Level
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
            </div>

            {/* Description */}
            <div className="space-y-1.5 pt-2 border-t border-slate-800">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                  3. Description <span className="text-rose-400">*</span>
                </label>
                <span className="text-[11px] text-slate-400">
                  {descValue.length} / 1000 characters
                </span>
              </div>
              <textarea
                rows={3}
                placeholder="Describe the nature of waste, approximate size, access constraints, or health hazards (min 10 characters)..."
                {...register('description')}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-sm text-slate-100 focus:outline-none focus:border-swach-500"
              />
              {errors.description && (
                <p className="text-xs text-rose-400">{errors.description.message}</p>
              )}
            </div>

            {/* Photographic Evidence Slot */}
            <div className="space-y-2 pt-2 border-t border-slate-800">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                  4. Photographic Evidence (Up to {MAX_PHOTO_COUNT} Photos, Max 10MB each)
                </label>
                <span className="text-xs text-slate-400">
                  {selectedPhotos.length} / {MAX_PHOTO_COUNT} selected
                </span>
              </div>

              {/* Upload trigger box */}
              {selectedPhotos.length < MAX_PHOTO_COUNT && (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-700 hover:border-swach-500/60 rounded-2xl p-6 text-center bg-slate-900/30 transition-colors cursor-pointer"
                >
                  <Camera className="w-8 h-8 mx-auto text-slate-400 mb-2" />
                  <p className="text-xs text-slate-300 font-medium">
                    Click to add complaint photos
                  </p>
                  <p className="text-[11px] text-slate-500 mt-1">
                    JPEG, PNG, WEBP &bull; Max 10MB &bull; Stored in private bucket
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    multiple
                    onChange={handlePhotoSelect}
                    className="hidden"
                  />
                </div>
              )}

              {photoErrors.map((err, i) => (
                <p key={i} className="text-xs text-rose-400">{err}</p>
              ))}

              {/* Preview thumbnails */}
              {photoPreviews.length > 0 && (
                <div className="grid grid-cols-3 gap-3 pt-2">
                  {photoPreviews.map((url, index) => (
                    <div
                      key={index}
                      className="relative rounded-xl overflow-hidden border border-slate-700 bg-slate-900 aspect-video group"
                    >
                      <img
                        src={url}
                        alt={`Evidence preview ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemovePhoto(index)}
                        className="absolute top-1.5 right-1.5 p-1 rounded-full bg-slate-950/80 text-rose-400 hover:text-white hover:bg-rose-600 transition-colors"
                        title="Remove photo"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Privacy option */}
            <div className="flex items-center gap-2 pt-2">
              <input
                type="checkbox"
                id="is_anonymous"
                {...register('is_anonymous')}
                className="w-4 h-4 rounded bg-slate-900 border-slate-700 text-swach-500 focus:ring-swach-500 focus:ring-offset-slate-950"
              />
              <label htmlFor="is_anonymous" className="text-xs text-slate-400 select-none cursor-pointer">
                Submit as anonymous report (your identity is hidden from on-site field workers)
              </label>
            </div>

            {/* Submission progress indicator */}
            {progressStep && (
              <div className="p-3.5 rounded-xl bg-blue-950/40 border border-blue-800/60 text-xs text-blue-200 flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin shrink-0 text-blue-400" />
                <span>{progressStep}</span>
              </div>
            )}

            {/* Submit Action */}
            <div className="pt-4 border-t border-slate-800 flex items-center justify-between flex-wrap gap-4">
              <Link to="/my-reports" className="text-xs text-slate-400 hover:text-white">
                View My Submitted Reports &rarr;
              </Link>
              <Button
                type="submit"
                size="lg"
                disabled={!user || isSubmitting}
                isLoading={isSubmitting}
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                Submit Cleanliness Complaint
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
