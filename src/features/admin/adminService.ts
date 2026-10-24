import { getSupabase } from '@/lib/supabase/client';
import { getSignedMediaUrl } from '@/features/reports/reportsService';
import { NAVSARI_WARDS } from '@/lib/utils';
import { isReportOverdue } from '@/features/analytics';
import type {
  ComplaintPriority,
  ComplaintStatus,
} from '@/types/database.types';
import type {
  AdminOverviewMetrics,
  ReportFilterParams,
  PaginatedResult,
  AdminReportListItem,
  AdminReportDetail,
  SanitationWorkerItem,
  VerificationItem,
  StaffDirectoryItem,
  ReportRow,
  AssignmentRow,
  ProfileRow,
} from './types';

/**
 * Aggregates live operational metrics across all 13 wards of Navsari.
 */
export async function getAdminOverviewMetrics(): Promise<AdminOverviewMetrics> {
  const supabase = getSupabase();
  if (!supabase) {
    throw new Error('Supabase client is not configured.');
  }

  const { data: reports, error } = await supabase
    .from('reports')
    .select('id, category, priority, status, ward_number, submitted_at, resolved_at');

  if (error) {
    throw new Error(`Failed to load administrative metrics: ${error.message}`);
  }

  const reportList = reports || [];

  let submittedCount = 0;
  let underReviewCount = 0;
  let assignedCount = 0;
  let inProgressCount = 0;
  let verificationCount = 0;
  let resolvedCount = 0;
  let rejectedCount = 0;
  let overdueCount = 0;

  const resolutionTimesMs: number[] = [];

  // Initialize ward distribution for all 13 wards
  const wardMap = new Map<number, { wardNumber: number; wardName: string; count: number }>();
  NAVSARI_WARDS.forEach((w) => {
    wardMap.set(w.number, { wardNumber: w.number, wardName: w.name, count: 0 });
  });

  // Initialize category count
  const categoryMap = new Map<string, number>();

  for (const r of reportList) {
    // Status counts
    switch (r.status) {
      case 'submitted':
        submittedCount++;
        break;
      case 'under_review':
        underReviewCount++;
        break;
      case 'assigned':
        assignedCount++;
        break;
      case 'in_progress':
        inProgressCount++;
        break;
      case 'resolution_submitted':
        verificationCount++;
        break;
      case 'resolved':
        resolvedCount++;
        if (r.resolved_at && r.submitted_at) {
          const diff = new Date(r.resolved_at).getTime() - new Date(r.submitted_at).getTime();
          if (diff > 0) resolutionTimesMs.push(diff);
        }
        break;
      case 'rejected':
        rejectedCount++;
        break;
    }

    // SLA overdue calculation
    const isResolved = r.status === 'resolved' || r.status === 'rejected' || r.status === 'cancelled';
    if (isReportOverdue(r.submitted_at, r.priority, isResolved)) {
      overdueCount++;
    }

    // Ward counts
    if (r.ward_number && wardMap.has(r.ward_number)) {
      const w = wardMap.get(r.ward_number)!;
      w.count++;
    }

    // Category counts
    categoryMap.set(r.category, (categoryMap.get(r.category) || 0) + 1);
  }

  // Calculate average resolution hours if data exists
  let averageResolutionHours: number | null = null;
  if (resolutionTimesMs.length > 0) {
    const totalMs = resolutionTimesMs.reduce((acc, curr) => acc + curr, 0);
    averageResolutionHours = Math.round((totalMs / resolutionTimesMs.length / (1000 * 3600)) * 10) / 10;
  }

  const wardDistribution = Array.from(wardMap.values());
  const categoryDistribution = Array.from(categoryMap.entries()).map(([cat, count]) => ({
    category: cat as ReportRow['category'],
    count,
  }));

  return {
    totalComplaints: reportList.length,
    submittedCount,
    underReviewCount,
    assignedCount,
    inProgressCount,
    verificationCount,
    resolvedCount,
    rejectedCount,
    overdueCount,
    averageResolutionHours,
    wardDistribution,
    categoryDistribution,
  };
}

/**
 * Fetches filtered and paginated complaint queue records for the municipal dashboard.
 */
export async function getAdminReports(
  params: ReportFilterParams = {}
): Promise<PaginatedResult<AdminReportListItem>> {
  const supabase = getSupabase();
  if (!supabase) {
    throw new Error('Supabase client is not configured.');
  }

  const page = Math.max(1, params.page || 1);
  const pageSize = Math.max(1, Math.min(100, params.pageSize || 15));
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase.from('reports').select('*', { count: 'exact' });

  // Filters
  if (params.status && params.status !== 'all') {
    query = query.eq('status', params.status);
  }
  if (params.category && params.category !== 'all') {
    query = query.eq('category', params.category);
  }
  if (params.priority && params.priority !== 'all') {
    query = query.eq('priority', params.priority);
  }
  if (params.ward && params.ward !== 'all') {
    query = query.eq('ward_number', Number(params.ward));
  }
  if (params.searchQuery && params.searchQuery.trim().length > 0) {
    const q = params.searchQuery.trim();
    // Search by complaint_id or address_locality or landmark
    query = query.or(`complaint_id.ilike.%${q}%,address_locality.ilike.%${q}%,landmark.ilike.%${q}%`);
  }

  // Sorting
  switch (params.sortBy) {
    case 'submitted_at_asc':
      query = query.order('submitted_at', { ascending: true });
      break;
    case 'priority_desc':
      query = query.order('priority', { ascending: false }).order('submitted_at', { ascending: false });
      break;
    case 'status':
      query = query.order('status', { ascending: true }).order('submitted_at', { ascending: false });
      break;
    case 'submitted_at_desc':
    default:
      query = query.order('submitted_at', { ascending: false });
      break;
  }

  query = query.range(from, to);

  const { data: reports, count, error } = await query;
  if (error) {
    throw new Error(`Failed to load complaint queue: ${error.message}`);
  }

  const totalCount = count || 0;
  const totalPages = Math.ceil(totalCount / pageSize);

  if (!reports || reports.length === 0) {
    return { data: [], totalCount, page, pageSize, totalPages };
  }

  // Fetch active assignments for these reports to show worker info
  const reportIds = reports.map((r) => r.id);
  const { data: assignments } = await supabase
    .from('assignments')
    .select('id, report_id, worker_id, status, assigned_at')
    .in('report_id', reportIds)
    .in('status', ['assigned', 'accepted', 'in_progress']);

  // Fetch worker profiles if assignments exist
  const workerIds = Array.from(new Set(assignments?.map((a) => a.worker_id) || []));
  let workerMap = new Map<string, string>();
  if (workerIds.length > 0) {
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, full_name')
      .in('id', workerIds);
    if (profiles) {
      workerMap = new Map(profiles.map((p) => [p.id, p.full_name]));
    }
  }

  // Fetch first photo for thumbnail preview
  const { data: mediaRows } = await supabase
    .from('report_media')
    .select('report_id, storage_path')
    .in('report_id', reportIds);

  const mediaByReport = new Map<string, string[]>();
  mediaRows?.forEach((m) => {
    const existing = mediaByReport.get(m.report_id) || [];
    existing.push(m.storage_path);
    mediaByReport.set(m.report_id, existing);
  });

  const enrichedData: AdminReportListItem[] = reports.map((rep) => {
    const activeAssn = assignments?.find((a) => a.report_id === rep.id);
    const mediaPaths = mediaByReport.get(rep.id) || [];
    const isResolved = rep.status === 'resolved' || rep.status === 'rejected' || rep.status === 'cancelled';
    const isOverdue = isReportOverdue(rep.submitted_at, rep.priority, isResolved);

    return {
      ...rep,
      mediaCount: mediaPaths.length,
      isOverdue,
      activeAssignment: activeAssn
        ? {
            workerId: activeAssn.worker_id,
            workerName: workerMap.get(activeAssn.worker_id) || 'Assigned Worker',
            assignedAt: activeAssn.assigned_at,
            status: activeAssn.status,
          }
        : null,
    };
  });

  return {
    data: enrichedData,
    totalCount,
    page,
    pageSize,
    totalPages,
  };
}

/**
 * Fetches comprehensive complaint triage details for municipal administration.
 */
export async function getAdminReportDetail(
  identifier: string
): Promise<AdminReportDetail | null> {
  const supabase = getSupabase();
  if (!supabase) {
    throw new Error('Supabase client is not configured.');
  }

  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(identifier);

  let query = supabase.from('reports').select('*');
  query = isUuid ? query.eq('id', identifier) : query.eq('complaint_id', identifier.toUpperCase().trim());

  const { data: report, error } = await query.maybeSingle();
  if (error) {
    throw new Error(`Failed to load complaint details: ${error.message}`);
  }
  if (!report) return null;

  // 1. Fetch reporter profile if not anonymous
  let reporterProfile: Pick<ProfileRow, 'full_name' | 'phone_number'> | null = null;
  if (report.reporter_id && !report.is_anonymous) {
    const { data: p } = await supabase
      .from('profiles')
      .select('full_name, phone_number')
      .eq('id', report.reporter_id)
      .maybeSingle();
    reporterProfile = p || null;
  }

  // 2. Fetch media with signed URLs
  const { data: mediaRows } = await supabase
    .from('report_media')
    .select('*')
    .eq('report_id', report.id);

  const media = await Promise.all(
    (mediaRows || []).map(async (m) => {
      const signedUrl = await getSignedMediaUrl('report-evidence', m.storage_path, 3600);
      return { ...m, signedUrl };
    })
  );

  // 3. Fetch status history
  const { data: historyRows } = await supabase
    .from('report_status_history')
    .select('*')
    .eq('report_id', report.id)
    .order('created_at', { ascending: true });

  // Get actor names for history rows
  const actorIds = Array.from(new Set(historyRows?.map((h) => h.actor_id).filter(Boolean) as string[]));
  let actorMap = new Map<string, string>();
  if (actorIds.length > 0) {
    const { data: actors } = await supabase
      .from('profiles')
      .select('id, full_name')
      .in('id', actorIds);
    if (actors) {
      actorMap = new Map(actors.map((a) => [a.id, a.full_name]));
    }
  }

  const history = (historyRows || []).map((h) => ({
    ...h,
    actorName: h.actor_id ? actorMap.get(h.actor_id) || 'Authorized Official' : 'System',
  }));

  // 4. Fetch assignments
  const { data: assignments } = await supabase
    .from('assignments')
    .select('*')
    .eq('report_id', report.id)
    .order('assigned_at', { ascending: false });

  const workerIds = Array.from(new Set((assignments || []).map((a) => a.worker_id)));
  let workerProfileMap = new Map<string, ProfileRow>();
  if (workerIds.length > 0) {
    const { data: workerProfiles } = await supabase
      .from('profiles')
      .select('*')
      .in('id', workerIds);
    if (workerProfiles) {
      workerProfileMap = new Map(workerProfiles.map((p) => [p.id, p]));
    }
  }

  const allAssignments = (assignments || []).map((a) => ({
    ...a,
    workerName: workerProfileMap.get(a.worker_id)?.full_name || 'Sanitation Worker',
  }));

  const activeRaw = (assignments || []).find((a) =>
    ['assigned', 'accepted', 'in_progress'].includes(a.status)
  );

  const activeAssignment = activeRaw
    ? {
        ...activeRaw,
        workerName: workerProfileMap.get(activeRaw.worker_id)?.full_name || 'Sanitation Worker',
        workerPhone: workerProfileMap.get(activeRaw.worker_id)?.phone_number || null,
      }
    : null;

  // 5. Fetch resolution evidence
  const { data: resEvidenceRows } = await supabase
    .from('resolution_evidence')
    .select('*')
    .eq('report_id', report.id)
    .order('submitted_at', { ascending: false });

  const resolutionEvidence = await Promise.all(
    (resEvidenceRows || []).map(async (ev) => {
      const signedUrl = await getSignedMediaUrl('resolution-evidence', ev.storage_path, 3600);
      const workerName = workerProfileMap.get(ev.worker_id)?.full_name || 'Sanitation Worker';
      return { ...ev, signedUrl, workerName };
    })
  );

  return {
    ...report,
    media,
    history,
    activeAssignment,
    allAssignments,
    resolutionEvidence,
    reporterProfile,
  };
}

/**
 * Transitions complaint status via PostgreSQL function public.transition_report_status.
 * Enforces role security, state machine, and mandatory rejection reason.
 */
export async function transitionComplaintStatus(
  reportId: string,
  newStatus: ComplaintStatus,
  note?: string,
  rejectionReason?: string
): Promise<ReportRow> {
  const supabase = getSupabase();
  if (!supabase) {
    throw new Error('Supabase client is not configured.');
  }

  if (newStatus === 'rejected') {
    if (!rejectionReason || rejectionReason.trim().length < 5) {
      throw new Error('A detailed rejection reason of at least 5 characters is required by municipal protocol.');
    }
  }

  const { data, error } = await supabase.rpc('transition_report_status', {
    p_report_id: reportId,
    p_new_status: newStatus,
    p_note: note?.trim() || undefined,
    p_rejection_reason: rejectionReason?.trim() || undefined,
  });

  if (error) {
    throw new Error(error.message || `Failed to transition complaint status to ${newStatus}.`);
  }

  return data as ReportRow;
}

/**
 * Updates complaint priority directly via municipal official authorization.
 */
export async function updateComplaintPriority(
  reportId: string,
  priority: ComplaintPriority
): Promise<ReportRow> {
  const supabase = getSupabase();
  if (!supabase) {
    throw new Error('Supabase client is not configured.');
  }

  const { data, error } = await supabase
    .from('reports')
    .update({ priority })
    .eq('id', reportId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update complaint priority: ${error.message}`);
  }

  return data as ReportRow;
}

/**
 * Retrieves registered sanitation workers and their active workload counts.
 */
export async function getSanitationWorkers(): Promise<SanitationWorkerItem[]> {
  const supabase = getSupabase();
  if (!supabase) {
    throw new Error('Supabase client is not configured.');
  }

  // 1. Query user_roles table for users with 'sanitation_worker' role
  const { data: workerRoles, error: rolesError } = await supabase
    .from('user_roles')
    .select('user_id')
    .eq('role', 'sanitation_worker');

  if (rolesError) {
    throw new Error(`Failed to load worker roles: ${rolesError.message}`);
  }

  if (!workerRoles || workerRoles.length === 0) {
    return [];
  }

  const workerIds = workerRoles.map((r) => r.user_id);

  // 2. Fetch profiles
  const { data: profiles, error: profError } = await supabase
    .from('profiles')
    .select('id, full_name, phone_number, ward_number, locality')
    .in('id', workerIds);

  if (profError) {
    throw new Error(`Failed to load worker profiles: ${profError.message}`);
  }

  // 3. Count active and completed assignments per worker
  const { data: assignments } = await supabase
    .from('assignments')
    .select('worker_id, status')
    .in('worker_id', workerIds);

  const activeCountMap = new Map<string, number>();
  const completedCountMap = new Map<string, number>();

  assignments?.forEach((a) => {
    if (['assigned', 'accepted', 'in_progress'].includes(a.status)) {
      activeCountMap.set(a.worker_id, (activeCountMap.get(a.worker_id) || 0) + 1);
    } else if (a.status === 'completed') {
      completedCountMap.set(a.worker_id, (completedCountMap.get(a.worker_id) || 0) + 1);
    }
  });

  return (profiles || []).map((p) => ({
    id: p.id,
    fullName: p.full_name,
    phone: p.phone_number,
    wardNumber: p.ward_number,
    locality: p.locality,
    activeAssignmentsCount: activeCountMap.get(p.id) || 0,
    completedAssignmentsCount: completedCountMap.get(p.id) || 0,
  }));
}

/**
 * Atomically assigns a report to a sanitation worker using public.assign_report RPC.
 */
export async function assignWorkerToComplaint(
  reportId: string,
  workerId: string,
  notes?: string
): Promise<AssignmentRow> {
  const supabase = getSupabase();
  if (!supabase) {
    throw new Error('Supabase client is not configured.');
  }

  const { data, error } = await supabase.rpc('assign_report', {
    p_report_id: reportId,
    p_worker_id: workerId,
    p_notes: notes?.trim() || undefined,
  });

  if (error) {
    throw new Error(error.message || 'Worker assignment failed.');
  }

  return data as AssignmentRow;
}

/**
 * Fetches all reports currently in 'resolution_submitted' status awaiting official verification.
 */
export async function getPendingVerifications(): Promise<VerificationItem[]> {
  const supabase = getSupabase();
  if (!supabase) {
    throw new Error('Supabase client is not configured.');
  }

  // 1. Fetch reports with status = 'resolution_submitted'
  const { data: reports, error: reportsErr } = await supabase
    .from('reports')
    .select('*')
    .eq('status', 'resolution_submitted')
    .order('updated_at', { ascending: false });

  if (reportsErr) {
    throw new Error(`Failed to load pending verifications: ${reportsErr.message}`);
  }

  if (!reports || reports.length === 0) {
    return [];
  }

  const reportIds = reports.map((r) => r.id);

  // 2. Fetch resolution evidence for these reports
  const { data: evidenceList } = await supabase
    .from('resolution_evidence')
    .select('*')
    .in('report_id', reportIds)
    .order('submitted_at', { ascending: false });

  // 3. Fetch active assignments
  const { data: assignments } = await supabase
    .from('assignments')
    .select('*')
    .in('report_id', reportIds);

  // 4. Fetch worker profiles
  const workerIds = Array.from(new Set(evidenceList?.map((e) => e.worker_id) || []));
  let workerMap = new Map<string, Pick<ProfileRow, 'full_name' | 'phone_number'>>();
  if (workerIds.length > 0) {
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, full_name, phone_number')
      .in('id', workerIds);
    if (profiles) {
      workerMap = new Map(profiles.map((p) => [p.id, { full_name: p.full_name, phone_number: p.phone_number }]));
    }
  }

  const items: VerificationItem[] = [];

  for (const rep of reports) {
    const ev = (evidenceList || []).find((e) => e.report_id === rep.id);
    if (ev) {
      const signedUrl = await getSignedMediaUrl('resolution-evidence', ev.storage_path, 3600);
      const activeAssn = (assignments || []).find((a) => a.report_id === rep.id);
      items.push({
        report: rep,
        evidence: { ...ev, signedUrl },
        workerProfile: workerMap.get(ev.worker_id) || null,
        activeAssignment: activeAssn || null,
      });
    }
  }

  return items;
}

/**
 * Verifies or rejects resolution evidence submitted by sanitation workers.
 */
export async function verifyResolution(
  reportId: string,
  approved: boolean,
  note?: string
): Promise<ReportRow> {
  const newStatus: ComplaintStatus = approved ? 'resolved' : 'in_progress';
  const defaultNote = approved
    ? 'Resolution approved and verified by municipal official'
    : 'Resolution rejected by official: Rework required at site';

  return transitionComplaintStatus(
    reportId,
    newStatus,
    note?.trim() || defaultNote
  );
}

/**
 * Retrieves complaints with valid GPS coordinates for municipal map visualization.
 */
export async function getGeospatialReports(): Promise<ReportRow[]> {
  const supabase = getSupabase();
  if (!supabase) {
    throw new Error('Supabase client is not configured.');
  }

  const { data, error } = await supabase
    .from('reports')
    .select('*')
    .not('latitude', 'is', null)
    .not('longitude', 'is', null)
    .order('submitted_at', { ascending: false })
    .limit(300);

  if (error) {
    throw new Error(`Failed to load geospatial data: ${error.message}`);
  }

  return data || [];
}

/**
 * Fetches combined municipal staff directory (officials & sanitation workers).
 */
export async function getMunicipalStaffDirectory(): Promise<StaffDirectoryItem[]> {
  const supabase = getSupabase();
  if (!supabase) {
    throw new Error('Supabase client is not configured.');
  }

  const { data: roles, error: rolesErr } = await supabase
    .from('user_roles')
    .select('user_id, role')
    .in('role', ['municipal_official', 'sanitation_worker']);

  if (rolesErr) {
    throw new Error(`Failed to load staff roles: ${rolesErr.message}`);
  }

  if (!roles || roles.length === 0) return [];

  const userIds = roles.map((r) => r.user_id);
  const { data: profiles, error: profErr } = await supabase
    .from('profiles')
    .select('*')
    .in('id', userIds);

  if (profErr) {
    throw new Error(`Failed to load staff profiles: ${profErr.message}`);
  }

  // Active assignment counts for sanitation workers
  const { data: assignments } = await supabase
    .from('assignments')
    .select('worker_id, status')
    .in('status', ['assigned', 'accepted', 'in_progress']);

  const activeWorkloadMap = new Map<string, number>();
  assignments?.forEach((a) => {
    activeWorkloadMap.set(a.worker_id, (activeWorkloadMap.get(a.worker_id) || 0) + 1);
  });

  const profileMap = new Map(profiles?.map((p) => [p.id, p]) || []);

  return roles.map((r) => {
    const prof = profileMap.get(r.user_id);
    return {
      id: r.user_id,
      role: r.role as 'municipal_official' | 'sanitation_worker',
      fullName: prof?.full_name || 'Staff Member',
      phone: prof?.phone_number || null,
      wardNumber: prof?.ward_number || null,
      locality: prof?.locality || null,
      activeWorkload: activeWorkloadMap.get(r.user_id) || 0,
    };
  });
}

/**
 * Fetches authorized immutable civic audit trail records.
 */
export async function getAdminAuditTrail(
  page: number = 1,
  pageSize: number = 25
): Promise<PaginatedResult<{
  id: string;
  createdAt: string;
  reportId?: string;
  complaintId?: string;
  previousStatus?: ComplaintStatus | null;
  newStatus: string;
  actorId?: string | null;
  actorName?: string;
  note?: string | null;
}>> {
  const supabase = getSupabase();
  if (!supabase) {
    throw new Error('Supabase client is not configured.');
  }

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const { data: history, count, error } = await supabase
    .from('report_status_history')
    .select('*, reports(complaint_id)', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to);

  if (error) {
    throw new Error(`Failed to load audit trail: ${error.message}`);
  }

  const totalCount = count || 0;
  const totalPages = Math.ceil(totalCount / pageSize);

  const actorIds = Array.from(new Set(history?.map((h) => h.actor_id).filter(Boolean) as string[]));
  let actorMap = new Map<string, string>();
  if (actorIds.length > 0) {
    const { data: actors } = await supabase
      .from('profiles')
      .select('id, full_name')
      .in('id', actorIds);
    if (actors) {
      actorMap = new Map(actors.map((a) => [a.id, a.full_name]));
    }
  }

  const rows = (history || []).map((h) => {
    // @ts-expect-error join type
    const compId = h.reports?.complaint_id as string | undefined;
    return {
      id: h.id,
      createdAt: h.created_at,
      reportId: h.report_id,
      complaintId: compId,
      previousStatus: h.previous_status,
      newStatus: h.new_status,
      actorId: h.actor_id,
      actorName: h.actor_id ? actorMap.get(h.actor_id) || 'Authorized Actor' : 'Citizen / System',
      note: h.note,
    };
  });

  return {
    data: rows,
    totalCount,
    page,
    pageSize,
    totalPages,
  };
}
