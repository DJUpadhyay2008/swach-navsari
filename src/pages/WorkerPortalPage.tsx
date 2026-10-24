import React, { useState, useRef, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/features/auth';
import { isSupabaseConfigured } from '@/lib/supabase/client';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import {
  CATEGORY_LABELS,
  STATUS_CONFIG,
  PRIORITY_CONFIG,
  formatDate,
} from '@/lib/utils';
import {
  getWorkerTasks,
  startWorkOnAssignment,
  submitResolutionEvidence,
  DEMO_WORKER_TASKS,
  type WorkerTask,
} from '@/features/worker';
import {
  HardHat,
  MapPin,
  Clock,
  Camera,
  CheckCircle2,
  Navigation,
  Lock,
  RefreshCw,
  X,
  FileCheck,
  AlertCircle,
  Play,
  Check,
} from 'lucide-react';

export function WorkerPortalPage() {
  const { user, profile } = useAuth();
  const queryClient = useQueryClient();
  const backendConfigured = isSupabaseConfigured();

  // Active filter tab
  const [filterTab, setFilterTab] = useState<'active' | 'review' | 'resolved' | 'all'>('active');

  // Local state to track task mutations (e.g. for demo tasks or optimistic UI updates)
  const [localTaskOverrides, setLocalTaskOverrides] = useState<Record<string, Partial<WorkerTask>>>({});

  // Form states per task ID
  const [selectedPhotos, setSelectedPhotos] = useState<Record<string, { file: File; previewUrl: string }>>({});
  const [resolutionNotes, setResolutionNotes] = useState<Record<string, string>>({});
  const [submissionFeedback, setSubmissionFeedback] = useState<Record<string, { type: 'success' | 'error'; message: string }>>({});

  // File input refs per task
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  // Query live tasks for the worker
  const {
    data: fetchedTasks,
    isLoading,
    error: queryError,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ['worker-tasks', user?.id],
    queryFn: () => (user?.id ? getWorkerTasks(user.id) : Promise.resolve([])),
    enabled: Boolean(user?.id),
  });

  // Decide which base tasks to display:
  // If backend returned tasks for this worker, use them.
  // Otherwise, fallback to the interactive DEMO_WORKER_TASKS so the worker has immediate functionality.
  const baseTasks = useMemo(() => {
    if (fetchedTasks && fetchedTasks.length > 0) {
      return fetchedTasks;
    }
    return DEMO_WORKER_TASKS;
  }, [fetchedTasks]);

  const isUsingDemo = !fetchedTasks || fetchedTasks.length === 0;

  // Merge with any local optimistic status transitions
  const tasks = useMemo(() => {
    return baseTasks.map((task) => {
      const override = localTaskOverrides[task.assignmentId];
      if (override) {
        return { ...task, ...override };
      }
      return task;
    });
  }, [baseTasks, localTaskOverrides]);

  // Tab counts
  const activeCount = tasks.filter((t) => ['assigned', 'in_progress'].includes(t.reportStatus)).length;
  const reviewCount = tasks.filter((t) => t.reportStatus === 'resolution_submitted').length;
  const resolvedCount = tasks.filter((t) => ['resolved', 'rejected', 'cancelled'].includes(t.reportStatus)).length;

  // Filtered tasks
  const filteredTasks = useMemo(() => {
    switch (filterTab) {
      case 'active':
        return tasks.filter((t) => ['assigned', 'in_progress'].includes(t.reportStatus));
      case 'review':
        return tasks.filter((t) => t.reportStatus === 'resolution_submitted');
      case 'resolved':
        return tasks.filter((t) => ['resolved', 'rejected', 'cancelled'].includes(t.reportStatus));
      case 'all':
      default:
        return tasks;
    }
  }, [tasks, filterTab]);

  // Mutation: Start work on assignment
  const startWorkMutation = useMutation({
    mutationFn: startWorkOnAssignment,
    onSuccess: (_, variables) => {
      setLocalTaskOverrides((prev) => ({
        ...prev,
        [variables.assignmentId]: {
          reportStatus: 'in_progress',
          assignmentStatus: 'in_progress',
          startedAt: new Date().toISOString(),
        },
      }));
      queryClient.invalidateQueries({ queryKey: ['worker-tasks', user?.id] });
    },
  });

  // Mutation: Submit resolution evidence
  const submitResolutionMutation = useMutation({
    mutationFn: submitResolutionEvidence,
    onSuccess: (result, variables) => {
      setLocalTaskOverrides((prev) => ({
        ...prev,
        [variables.assignmentId]: {
          reportStatus: 'resolution_submitted',
          assignmentStatus: 'in_progress',
          completedAt: new Date().toISOString(),
          resolutionPhotoUrl: result.previewUrl,
          resolutionNotes: variables.notes,
        },
      }));

      // Automatically switch to the "Under Review" tab so the worker sees the submitted task immediately
      setFilterTab('review');

      setSubmissionFeedback((prev) => ({
        ...prev,
        [variables.assignmentId]: {
          type: 'success',
          message: 'Resolution evidence uploaded! Task submitted for municipal supervisor review.',
        },
      }));

      // Cleanup local file selection
      setSelectedPhotos((prev) => {
        const copy = { ...prev };
        delete copy[variables.assignmentId];
        return copy;
      });

      queryClient.invalidateQueries({ queryKey: ['worker-tasks', user?.id] });
    },
    onError: (err: Error, variables) => {
      setSubmissionFeedback((prev) => ({
        ...prev,
        [variables.assignmentId]: {
          type: 'error',
          message: err.message || 'Failed to submit resolution evidence.',
        },
      }));
    },
  });

  // Handle photo file selection
  const handlePhotoSelect = (taskId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setSubmissionFeedback((prev) => ({
        ...prev,
        [taskId]: {
          type: 'error',
          message: 'Please choose a JPEG, PNG, or WEBP image file.',
        },
      }));
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setSubmissionFeedback((prev) => ({
        ...prev,
        [taskId]: {
          type: 'error',
          message: 'Photo exceeds 10MB limit. Please choose a smaller photo.',
        },
      }));
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    setSelectedPhotos((prev) => ({
      ...prev,
      [taskId]: { file, previewUrl },
    }));

    setSubmissionFeedback((prev) => {
      const copy = { ...prev };
      delete copy[taskId];
      return copy;
    });
  };

  const handleRemovePhoto = (taskId: string) => {
    setSelectedPhotos((prev) => {
      const existing = prev[taskId];
      if (existing) {
        URL.revokeObjectURL(existing.previewUrl);
      }
      const copy = { ...prev };
      delete copy[taskId];
      return copy;
    });

    if (fileInputRefs.current[taskId]) {
      fileInputRefs.current[taskId]!.value = '';
    }
  };

  // Launch navigation to location
  const handleOpenNavigation = (lat: number | null, lng: number | null) => {
    if (!lat || !lng) {
      alert('Coordinates are not available for this complaint.');
      return;
    }
    const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-8">
      {/* Page Title & Profile Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="warning">Worker Portal</Badge>
            <Badge variant="neutral">Role: sanitation_worker</Badge>
            {profile?.full_name && (
              <span className="text-xs text-slate-300 font-medium px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700">
                Worker: {profile.full_name}
              </span>
            )}
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            Field Sanitation Task Board
          </h1>
          <p className="text-sm text-slate-400">
            Mobile-responsive task queue for Navsari sanitation workers and rapid response units.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            leftIcon={<RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />}
            onClick={() => refetch()}
            disabled={isFetching}
          >
            {isFetching ? 'Refreshing...' : 'Refresh Tasks'}
          </Button>
        </div>
      </div>

      {/* Backend & Scoping Notice */}
      {!backendConfigured ? (
        <Alert variant="warning" title="Worker Session Notice">
          <p>
            In production, tasks displayed on this page are strictly scoped by the database RLS policy{' '}
            <code className="text-amber-300 font-mono">reports_select_policy</code> where{' '}
            <code className="text-amber-300 font-mono">public.is_assigned_worker(reports.id, auth.uid())</code>{' '}
            is true.
          </p>
        </Alert>
      ) : (
        <Alert variant="success" title="Worker Scope Secured">
          Connected to database. Task queue is isolated to tasks assigned to your worker ID (
          <code className="text-slate-300 font-mono text-xs">{user?.id || 'demo-worker'}</code>).
        </Alert>
      )}

      {/* Notice if displaying demo task */}
      {isUsingDemo && (
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs flex items-start gap-3">
          <HardHat className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <div className="font-semibold text-white">
              No live assignments currently dispatched to your account in database
            </div>
            <p className="text-slate-300">
              Displaying the interactive Navsari demo task (<strong className="text-amber-300">NAV-2026-00101</strong>) below.
              You can test the entire field flow: open GPS directions, upload photo evidence, and submit resolution for supervisor verification.
            </p>
          </div>
        </div>
      )}

      {/* Query Error Notice */}
      {queryError && (
        <Alert variant="error" title="Error loading assignments">
          <p>{(queryError as Error).message}</p>
        </Alert>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3 overflow-x-auto">
        <button
          onClick={() => setFilterTab('active')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
            filterTab === 'active'
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <HardHat className="w-3.5 h-3.5" />
          <span>Active Tasks</span>
          <span className="px-1.5 py-0.2 rounded-full bg-slate-800 text-[10px] text-slate-300">
            {activeCount}
          </span>
        </button>

        <button
          onClick={() => setFilterTab('review')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
            filterTab === 'review'
              ? 'bg-teal-500/20 text-teal-300 border border-teal-500/30 shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <FileCheck className="w-3.5 h-3.5" />
          <span>Under Review</span>
          <span className="px-1.5 py-0.2 rounded-full bg-slate-800 text-[10px] text-slate-300">
            {reviewCount}
          </span>
        </button>

        <button
          onClick={() => setFilterTab('resolved')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
            filterTab === 'resolved'
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Completed</span>
          <span className="px-1.5 py-0.2 rounded-full bg-slate-800 text-[10px] text-slate-300">
            {resolvedCount}
          </span>
        </button>

        <button
          onClick={() => setFilterTab('all')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
            filterTab === 'all'
              ? 'bg-slate-800 text-white border border-slate-700 shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <span>All Tasks</span>
          <span className="px-1.5 py-0.2 rounded-full bg-slate-800 text-[10px] text-slate-300">
            {tasks.length}
          </span>
        </button>
      </div>

      {/* Task Queue List */}
      <div className="space-y-6">
        {isLoading ? (
          <div className="py-12 text-center space-y-3">
            <RefreshCw className="w-8 h-8 text-amber-400 animate-spin mx-auto" />
            <p className="text-sm text-slate-400">Loading assigned tasks from database...</p>
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="p-8 rounded-2xl bg-slate-900/40 border border-slate-800 text-center space-y-3">
            <HardHat className="w-10 h-10 text-slate-600 mx-auto" />
            <h3 className="text-base font-bold text-white">No tasks in this category</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              There are no tasks matching the selected filter ({filterTab}). Check other tabs or refresh your queue.
            </p>
          </div>
        ) : (
          filteredTasks.map((task) => {
            const statusConfig = STATUS_CONFIG[task.reportStatus] || STATUS_CONFIG.in_progress;
            const priorityConfig = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.medium;
            const categoryMeta = CATEGORY_LABELS[task.category];
            const currentSelectedPhoto = selectedPhotos[task.assignmentId];
            const currentNotes = resolutionNotes[task.assignmentId] ?? task.resolutionNotes ?? '';
            const feedback = submissionFeedback[task.assignmentId];
            const isSubmitting = submitResolutionMutation.isPending && submitResolutionMutation.variables?.assignmentId === task.assignmentId;
            const isStartingWork = startWorkMutation.isPending && startWorkMutation.variables?.assignmentId === task.assignmentId;

            // Border color according to status
            let borderAccent = 'border-l-amber-500';
            if (task.reportStatus === 'assigned') borderAccent = 'border-l-cyan-500';
            if (task.reportStatus === 'resolution_submitted') borderAccent = 'border-l-teal-500';
            if (task.reportStatus === 'resolved') borderAccent = 'border-l-emerald-500';

            return (
              <Card key={task.assignmentId} className={`border-l-4 ${borderAccent} bg-slate-900/60 shadow-xl`}>
                <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-800/80 pb-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-lg font-bold text-white tracking-wide">
                        {task.complaintId}
                      </span>
                      <span className={`text-xs px-2.5 py-0.5 rounded-full border font-semibold ${statusConfig.badgeClass}`}>
                        {statusConfig.label}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${priorityConfig.badgeClass}`}>
                        {priorityConfig.label}
                      </span>
                      {categoryMeta && (
                        <span className="text-xs text-slate-300 px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700">
                          {categoryMeta.label}
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-400 flex items-center gap-1.5 flex-wrap">
                      <MapPin className="w-3.5 h-3.5 text-swach-400 shrink-0" />
                      <span className="font-medium text-slate-200">
                        Ward {task.wardNumber} — {task.addressLocality}
                      </span>
                      {task.landmark && (
                        <span className="text-slate-500">({task.landmark})</span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-xs text-amber-400 font-medium flex items-center gap-1 bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/20">
                      <Clock className="w-3.5 h-3.5" />
                      <span>SLA: {priorityConfig.slaHours}h Target</span>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="pt-4 space-y-4">
                  {/* Complaint Description */}
                  <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 text-xs text-slate-300 space-y-1">
                    <div className="font-semibold text-slate-200 flex items-center justify-between">
                      <span>Citizen Complaint Details:</span>
                      <span className="text-[11px] text-slate-500">
                        Filed: {formatDate(task.assignedAt)}
                      </span>
                    </div>
                    <p className="text-slate-400 leading-relaxed">{task.description}</p>
                  </div>

                  {/* Task Instruction from Official */}
                  {task.officialInstructions && (
                    <div className="p-3.5 rounded-xl bg-amber-950/20 border border-amber-800/40 text-xs text-amber-200 space-y-1">
                      <div className="font-semibold text-amber-300 flex items-center gap-1.5">
                        <HardHat className="w-4 h-4 text-amber-400" />
                        <span>Official Dispatch Instruction:</span>
                      </div>
                      <p className="text-slate-300 leading-relaxed">
                        &ldquo;{task.officialInstructions}&rdquo;
                      </p>
                    </div>
                  )}

                  {/* Submission Feedback Message */}
                  {feedback && (
                    <div
                      className={`p-3.5 rounded-xl text-xs flex items-center gap-2 ${
                        feedback.type === 'success'
                          ? 'bg-emerald-950/40 border border-emerald-800/60 text-emerald-300'
                          : 'bg-rose-950/40 border border-rose-800/60 text-rose-300'
                      }`}
                    >
                      {feedback.type === 'success' ? (
                        <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                      )}
                      <span>{feedback.message}</span>
                    </div>
                  )}

                  {/* State 1: ASSIGNED (Needs Start Work) */}
                  {task.reportStatus === 'assigned' && (
                    <div className="p-4 rounded-xl border border-dashed border-cyan-800/60 bg-cyan-950/20 text-center space-y-3">
                      <Play className="w-7 h-7 mx-auto text-cyan-400" />
                      <div className="text-xs font-semibold text-cyan-200">
                        Task Dispatched to Your Unit
                      </div>
                      <p className="text-[11px] text-slate-400 max-w-md mx-auto">
                        Acknowledge receipt and begin field transit to site to record your start time.
                      </p>
                      <Button
                        size="sm"
                        variant="primary"
                        leftIcon={<Play className="w-4 h-4" />}
                        isLoading={isStartingWork}
                        onClick={() =>
                          startWorkMutation.mutate({
                            assignmentId: task.assignmentId,
                            reportId: task.reportId,
                            isDemo: task.isDemo,
                          })
                        }
                      >
                        Start Work on Site
                      </Button>
                    </div>
                  )}

                  {/* State 2: IN_PROGRESS (Upload Photo and Submit Resolution) */}
                  {task.reportStatus === 'in_progress' && (
                    <div className="p-4 rounded-xl border border-dashed border-slate-700 bg-slate-950/50 space-y-4">
                      <div className="text-center space-y-1">
                        <Camera className="w-6 h-6 mx-auto text-swach-400" />
                        <div className="text-xs font-semibold text-slate-200">
                          Upload Post-Cleanup Resolution Photo
                        </div>
                        <p className="text-[11px] text-slate-400 max-w-md mx-auto">
                          Evidence photos are automatically stored in the private{' '}
                          <code className="text-slate-300">resolution-evidence</code> bucket and verified by
                          the municipal supervisor before final closure.
                        </p>
                      </div>

                      {/* Hidden File Input */}
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        capture="environment"
                        className="hidden"
                        ref={(el) => (fileInputRefs.current[task.assignmentId] = el)}
                        onChange={(e) => handlePhotoSelect(task.assignmentId, e)}
                      />

                      {/* Photo Preview or Selection Area */}
                      {currentSelectedPhoto ? (
                        <div className="space-y-2">
                          <div className="relative rounded-xl overflow-hidden border border-slate-700 bg-black/60 max-h-64 flex items-center justify-center">
                            <img
                              src={currentSelectedPhoto.previewUrl}
                              alt="Cleanup resolution evidence"
                              className="max-h-64 w-auto object-contain"
                            />
                            <button
                              type="button"
                              onClick={() => handleRemovePhoto(task.assignmentId)}
                              className="absolute top-2 right-2 p-1.5 rounded-full bg-slate-900/80 hover:bg-rose-600 text-white transition-colors"
                              title="Remove photo"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                          <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
                            <span>{currentSelectedPhoto.file.name}</span>
                            <span>{(currentSelectedPhoto.file.size / 1024).toFixed(0)} KB</span>
                          </div>
                        </div>
                      ) : (
                        <div className="pt-1 text-center">
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            leftIcon={<Camera className="w-4 h-4" />}
                            onClick={() => fileInputRefs.current[task.assignmentId]?.click()}
                          >
                            Select Completion Photo
                          </Button>
                        </div>
                      )}

                      {/* Resolution Notes Input */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-[11px] font-medium">
                          <label className="text-slate-300">
                            Resolution & Cleanup Summary Notes:
                          </label>
                          <span
                            className={`font-semibold ${
                              currentNotes.trim().length >= 5
                                ? 'text-emerald-400'
                                : currentNotes.trim().length > 0
                                ? 'text-amber-400'
                                : 'text-slate-500'
                            }`}
                          >
                            {currentNotes.trim().length >= 5
                              ? `✓ ${currentNotes.trim().length} chars (Ready)`
                              : `${currentNotes.trim().length}/5 chars (Need ${5 - currentNotes.trim().length} more)`}
                          </span>
                        </div>

                        {/* Quick Presets for Field Workers */}
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[10px] text-slate-500 font-medium">Quick fill:</span>
                          {[
                            'Done & site cleared',
                            'Waste collected and sanitized',
                            'Area completely cleaned',
                            'Blockage cleared successfully',
                          ].map((preset) => (
                            <button
                              key={preset}
                              type="button"
                              onClick={() => {
                                setResolutionNotes((prev) => ({
                                  ...prev,
                                  [task.assignmentId]: preset,
                                }));
                                setSubmissionFeedback((prev) => {
                                  const copy = { ...prev };
                                  delete copy[task.assignmentId];
                                  return copy;
                                });
                              }}
                              className="text-[10px] px-2 py-0.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors"
                            >
                              + {preset}
                            </button>
                          ))}
                        </div>

                        <textarea
                          rows={2}
                          value={currentNotes}
                          onChange={(e) => {
                            const val = e.target.value;
                            setResolutionNotes((prev) => ({
                              ...prev,
                              [task.assignmentId]: val,
                            }));
                            if (val.trim().length >= 5) {
                              setSubmissionFeedback((prev) => {
                                const copy = { ...prev };
                                delete copy[task.assignmentId];
                                return copy;
                              });
                            }
                          }}
                          placeholder="Describe the actions completed (e.g. Done & site cleared, 200kg waste cleared)..."
                          className="w-full text-xs bg-slate-900 border border-slate-800 rounded-xl p-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-swach-500/40"
                        />
                      </div>
                    </div>
                  )}

                  {/* State 3: RESOLUTION_SUBMITTED (Under Verification) */}
                  {task.reportStatus === 'resolution_submitted' && (
                    <div className="p-4 rounded-xl bg-teal-950/20 border border-teal-800/40 space-y-3">
                      <div className="flex items-center gap-2 text-teal-300 text-xs font-semibold">
                        <FileCheck className="w-4 h-4 text-teal-400" />
                        <span>Resolution Evidence Submitted — Awaiting Supervisor Verification</span>
                      </div>
                      {task.resolutionPhotoUrl && (
                        <div className="rounded-xl overflow-hidden border border-teal-900/40 bg-black/40 max-h-48 flex items-center justify-center">
                          <img
                            src={task.resolutionPhotoUrl}
                            alt="Resolution evidence"
                            className="max-h-48 w-auto object-contain"
                          />
                        </div>
                      )}
                      {task.resolutionNotes && (
                        <div className="text-xs text-slate-300 bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
                          <span className="font-medium text-slate-400 block mb-0.5">Submitted Notes:</span>
                          <p>{task.resolutionNotes}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* State 4: RESOLVED (Final Verified State) */}
                  {task.reportStatus === 'resolved' && (
                    <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-800/40 space-y-2">
                      <div className="flex items-center gap-2 text-emerald-300 text-xs font-semibold">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        <span>Verified & Closed by Municipal Supervisor</span>
                      </div>
                      {task.resolutionPhotoUrl && (
                        <div className="rounded-xl overflow-hidden border border-emerald-900/40 bg-black/40 max-h-48 flex items-center justify-center">
                          <img
                            src={task.resolutionPhotoUrl}
                            alt="Verified resolution"
                            className="max-h-48 w-auto object-contain"
                          />
                        </div>
                      )}
                    </div>
                  )}

                  {/* Action Bar */}
                  <div className="pt-3 border-t border-slate-800 flex items-center justify-between flex-wrap gap-3">
                    <Button
                      size="sm"
                      variant="ghost"
                      leftIcon={<Navigation className="w-3.5 h-3.5" />}
                      onClick={() => handleOpenNavigation(task.latitude, task.longitude)}
                    >
                      Open GPS Navigation
                    </Button>

                    {task.reportStatus === 'in_progress' && (
                      <Button
                        size="sm"
                        variant="primary"
                        leftIcon={<CheckCircle2 className="w-4 h-4" />}
                        isLoading={isSubmitting}
                        disabled={isSubmitting}
                        onClick={() => {
                          if (!currentSelectedPhoto) {
                            setSubmissionFeedback((prev) => ({
                              ...prev,
                              [task.assignmentId]: {
                                type: 'error',
                                message: 'Please select or capture a cleanup completion photo before submitting.',
                              },
                            }));
                            fileInputRefs.current[task.assignmentId]?.click();
                            return;
                          }

                          if (currentNotes.trim().length < 5) {
                            setSubmissionFeedback((prev) => ({
                              ...prev,
                              [task.assignmentId]: {
                                type: 'error',
                                message: `Notes must be at least 5 characters (currently ${currentNotes.trim().length}/5). For example: "Done & cleared" or tap one of the quick fill buttons above.`,
                              },
                            }));
                            return;
                          }

                          submitResolutionMutation.mutate({
                            assignmentId: task.assignmentId,
                            reportId: task.reportId,
                            workerId: user?.id || 'demo-worker',
                            photoFile: currentSelectedPhoto.file,
                            notes: currentNotes,
                            isDemo: task.isDemo,
                          });
                        }}
                      >
                        Submit Resolution for Review
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Security Architecture note */}
      <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800 text-xs text-slate-400 flex items-start gap-3">
        <Lock className="w-4 h-4 text-swach-400 shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold text-slate-200">Worker Authorization Boundary:</span>{' '}
          Sanitation workers cannot assign complaints to other workers or dismiss reports without
          submitting photographic evidence in <code className="text-swach-300">resolution_evidence</code>.
        </div>
      </div>
    </div>
  );
}
