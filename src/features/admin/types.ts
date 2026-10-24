import type {
  ComplaintCategory,
  ComplaintPriority,
  ComplaintStatus,
  AssignmentStatus,
  Database,
} from '@/types/database.types';

export type ReportRow = Database['public']['Tables']['reports']['Row'];
export type AssignmentRow = Database['public']['Tables']['assignments']['Row'];
export type ReportMediaRow = Database['public']['Tables']['report_media']['Row'];
export type ReportStatusHistoryRow = Database['public']['Tables']['report_status_history']['Row'];
export type ResolutionEvidenceRow = Database['public']['Tables']['resolution_evidence']['Row'];
export type ProfileRow = Database['public']['Tables']['profiles']['Row'];
export type AuditLogRow = Database['public']['Tables']['audit_logs']['Row'];

export interface AdminOverviewMetrics {
  totalComplaints: number;
  submittedCount: number;
  underReviewCount: number;
  assignedCount: number;
  inProgressCount: number;
  verificationCount: number;
  resolvedCount: number;
  rejectedCount: number;
  overdueCount: number;
  averageResolutionHours: number | null;
  wardDistribution: { wardNumber: number; wardName: string; count: number }[];
  categoryDistribution: { category: ComplaintCategory; count: number }[];
}

export interface ReportFilterParams {
  status?: ComplaintStatus | 'all';
  category?: ComplaintCategory | 'all';
  priority?: ComplaintPriority | 'all';
  ward?: number | 'all';
  searchQuery?: string;
  sortBy?: 'submitted_at_desc' | 'submitted_at_asc' | 'priority_desc' | 'status';
  page?: number;
  pageSize?: number;
}

export interface PaginatedResult<T> {
  data: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface AdminReportListItem extends ReportRow {
  mediaCount: number;
  firstPhotoUrl?: string | null;
  activeAssignment?: {
    workerId: string;
    workerName?: string;
    assignedAt: string;
    status: AssignmentStatus;
  } | null;
  isOverdue?: boolean;
}

export interface AdminReportDetail extends ReportRow {
  media: (ReportMediaRow & { signedUrl?: string | null })[];
  history: (ReportStatusHistoryRow & { actorName?: string })[];
  activeAssignment: (AssignmentRow & { workerName?: string; workerPhone?: string | null }) | null;
  allAssignments: (AssignmentRow & { workerName?: string })[];
  resolutionEvidence: (ResolutionEvidenceRow & { signedUrl?: string | null; workerName?: string })[];
  reporterProfile?: Pick<ProfileRow, 'full_name' | 'phone_number'> | null;
}

export interface SanitationWorkerItem {
  id: string;
  fullName: string;
  phone: string | null;
  wardNumber: number | null;
  locality: string | null;
  activeAssignmentsCount: number;
  completedAssignmentsCount: number;
}

export interface VerificationItem {
  report: ReportRow;
  evidence: ResolutionEvidenceRow & { signedUrl?: string | null };
  workerProfile?: Pick<ProfileRow, 'full_name' | 'phone_number'> | null;
  activeAssignment?: AssignmentRow | null;
}

export interface StaffDirectoryItem {
  id: string;
  role: 'municipal_official' | 'sanitation_worker';
  fullName: string;
  phone: string | null;
  wardNumber: number | null;
  locality: string | null;
  activeWorkload: number;
}
