import { getSupabase } from '@/lib/supabase/client';
import { getSignedMediaUrl } from '@/features/reports/reportsService';
import type { Database } from '@/types/database.types';
import type { WorkerTask, SubmitResolutionInput, StartWorkInput } from './types';

type ReportRow = Database['public']['Tables']['reports']['Row'];
type AssignmentRow = Database['public']['Tables']['assignments']['Row'];

export const DEMO_WORKER_TASKS: WorkerTask[] = [
  {
    assignmentId: 'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
    reportId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    complaintId: 'NAV-2026-00101',
    category: 'garbage_dump',
    priority: 'high',
    reportStatus: 'in_progress',
    assignmentStatus: 'in_progress',
    description:
      'Large accumulation of mixed commercial and plastic packaging along the walking perimeter near Dudhia Talav park entrance.',
    addressLocality: 'Dudhia Talav Garden Perimeter',
    landmark: 'Near East Gate Children Play Area',
    wardNumber: 7,
    latitude: 20.9525,
    longitude: 72.9325,
    assignedAt: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
    startedAt: new Date(Date.now() - 20 * 3600 * 1000).toISOString(),
    completedAt: null,
    officialInstructions:
      'Dispatched Ward 7 mini-dumper and 4 personnel for clearing plastic packaging and commercial solid waste near East Gate Children Play Area.',
    isDemo: true,
  },
];

/**
 * Fetches all assignments and joined report details for a specific sanitation worker.
 */
export async function getWorkerTasks(workerId: string): Promise<WorkerTask[]> {
  const supabase = getSupabase();
  if (!supabase) {
    return DEMO_WORKER_TASKS;
  }

  // 1. Fetch assignments for this worker
  const { data: assignments, error: assignmentsError } = await supabase
    .from('assignments')
    .select(`
      id,
      report_id,
      worker_id,
      assigned_by,
      status,
      notes,
      assigned_at,
      started_at,
      completed_at
    `)
    .eq('worker_id', workerId)
    .order('assigned_at', { ascending: false });

  if (assignmentsError) {
    console.warn('Error fetching worker assignments:', assignmentsError.message);
    throw new Error(`Failed to load worker tasks: ${assignmentsError.message}`);
  }

  if (!assignments || assignments.length === 0) {
    return [];
  }

  const reportIds = assignments.map((a) => a.report_id);

  // 2. Fetch associated reports
  const { data: reports, error: reportsError } = await supabase
    .from('reports')
    .select('*')
    .in('id', reportIds);

  if (reportsError) {
    console.warn('Error fetching assigned reports:', reportsError.message);
    throw new Error(`Failed to load complaint details: ${reportsError.message}`);
  }

  const reportMap = new Map<string, ReportRow>((reports || []).map((r) => [r.id, r]));

  // 3. Fetch resolution evidence for these reports
  const { data: evidenceRecords } = await supabase
    .from('resolution_evidence')
    .select('*')
    .in('report_id', reportIds);

  const evidenceMap = new Map(
    (evidenceRecords || []).map((e) => [e.report_id, e])
  );

  // 4. Map into WorkerTask objects
  const tasks: WorkerTask[] = [];

  for (const assn of assignments) {
    const rep = reportMap.get(assn.report_id);
    if (!rep) continue;

    const evidence = evidenceMap.get(rep.id);
    let resolutionPhotoUrl: string | null = null;

    if (evidence?.storage_path) {
      resolutionPhotoUrl = await getSignedMediaUrl('resolution-evidence', evidence.storage_path);
    }

    tasks.push({
      assignmentId: assn.id,
      reportId: rep.id,
      complaintId: rep.complaint_id,
      category: rep.category,
      priority: rep.priority,
      reportStatus: rep.status,
      assignmentStatus: assn.status as AssignmentRow['status'],
      description: rep.description,
      addressLocality: rep.address_locality || 'Navsari Locality',
      landmark: rep.landmark,
      wardNumber: rep.ward_number || 1,
      latitude: rep.latitude,
      longitude: rep.longitude,
      assignedAt: assn.assigned_at,
      startedAt: assn.started_at,
      completedAt: assn.completed_at,
      officialInstructions: assn.notes,
      resolutionPhotoUrl,
      resolutionNotes: evidence?.notes || null,
      isDemo: false,
    });
  }

  return tasks;
}

/**
 * Transitions task to in_progress when the worker begins field cleanup.
 */
export async function startWorkOnAssignment(input: StartWorkInput): Promise<void> {
  if (input.isDemo) {
    return;
  }

  const supabase = getSupabase();
  if (!supabase) {
    throw new Error('Supabase client is not configured.');
  }

  // 1. Transition report status via PostgreSQL trusted function
  const { error: rpcError } = await supabase.rpc('transition_report_status', {
    p_report_id: input.reportId,
    p_new_status: 'in_progress',
    p_note: 'Sanitation worker reached the field site and began cleanup operations.',
  });

  if (rpcError) {
    throw new Error(rpcError.message || 'Failed to update complaint status to in_progress.');
  }

  // 2. Update assignments row started_at
  const { error: updateError } = await supabase
    .from('assignments')
    .update({
      status: 'in_progress',
      started_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', input.assignmentId);

  if (updateError) {
    console.warn('Assignment timestamp update notice:', updateError.message);
  }
}

/**
 * Uploads resolution photo evidence and transitions complaint to resolution_submitted.
 */
export async function submitResolutionEvidence(
  input: SubmitResolutionInput
): Promise<{ storagePath: string; previewUrl: string }> {
  // Validate file
  if (!input.photoFile) {
    throw new Error('A post-cleanup photographic proof is mandatory.');
  }

  const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
  if (!validTypes.includes(input.photoFile.type)) {
    throw new Error('Invalid image format. Supported formats: JPEG, PNG, WEBP.');
  }

  if (input.photoFile.size > 10 * 1024 * 1024) {
    throw new Error('Image file exceeds the maximum permitted size of 10MB.');
  }

  // Validate notes
  if (!input.notes || input.notes.trim().length < 5) {
    throw new Error('Please provide at least 5 characters describing the cleanup actions taken.');
  }

  // In demo mode
  if (input.isDemo) {
    const previewUrl = URL.createObjectURL(input.photoFile);
    return {
      storagePath: `demo/${input.workerId}/${input.reportId}/resolution.jpg`,
      previewUrl,
    };
  }

  const supabase = getSupabase();
  if (!supabase) {
    throw new Error('Supabase client is not configured.');
  }

  // 1. Upload file to resolution-evidence bucket
  // Path convention required by RLS: {worker_id}/{report_id}/{unique_filename}
  const safeName = input.photoFile.name.replace(/[^a-zA-Z0-9.-]/g, '_');
  const uniqueId = typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : Math.random().toString(36).substring(2);
  const storagePath = `${input.workerId}/${input.reportId}/${uniqueId}-${safeName}`;

  const { error: uploadError } = await supabase.storage
    .from('resolution-evidence')
    .upload(storagePath, input.photoFile, {
      contentType: input.photoFile.type,
      upsert: false,
    });

  if (uploadError) {
    throw new Error(`Photo evidence upload failed: ${uploadError.message}`);
  }

  try {
    // 2. Insert record into public.resolution_evidence
    const { error: evidenceError } = await supabase
      .from('resolution_evidence')
      .insert({
        report_id: input.reportId,
        assignment_id: input.assignmentId,
        worker_id: input.workerId,
        storage_path: storagePath,
        file_size_bytes: input.photoFile.size,
        mime_type: input.photoFile.type,
        notes: input.notes.trim(),
      });

    if (evidenceError) {
      throw new Error(`Failed to record resolution evidence: ${evidenceError.message}`);
    }

    // 3. Transition report status to resolution_submitted
    const { error: rpcError } = await supabase.rpc('transition_report_status', {
      p_report_id: input.reportId,
      p_new_status: 'resolution_submitted',
      p_note: input.notes.trim(),
    });

    if (rpcError) {
      throw new Error(`Failed to submit complaint for verification: ${rpcError.message}`);
    }

    // 4. Update assignment status to completed
    const { error: assnError } = await supabase
      .from('assignments')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', input.assignmentId);

    if (assnError) {
      console.warn('Assignment completed status update notice:', assnError.message);
    }

    const previewUrl =
      (await getSignedMediaUrl('resolution-evidence', storagePath)) ||
      URL.createObjectURL(input.photoFile);

    return { storagePath, previewUrl };
  } catch (err) {
    // Rollback uploaded storage file on database failure
    await supabase.storage.from('resolution-evidence').remove([storagePath]);
    throw err;
  }
}
