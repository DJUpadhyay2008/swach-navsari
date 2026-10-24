import type { ComplaintCategory, ComplaintPriority, ComplaintStatus, AssignmentStatus } from '@/types/database.types';

export interface WorkerTask {
  assignmentId: string;
  reportId: string;
  complaintId: string;
  category: ComplaintCategory;
  priority: ComplaintPriority;
  reportStatus: ComplaintStatus;
  assignmentStatus: AssignmentStatus;
  description: string;
  addressLocality: string;
  landmark: string | null;
  wardNumber: number;
  latitude: number | null;
  longitude: number | null;
  assignedAt: string;
  startedAt: string | null;
  completedAt: string | null;
  officialInstructions: string | null;
  resolutionPhotoUrl?: string | null;
  resolutionNotes?: string | null;
  isDemo?: boolean;
}

export interface SubmitResolutionInput {
  assignmentId: string;
  reportId: string;
  workerId: string;
  photoFile: File;
  notes: string;
  isDemo?: boolean;
}

export interface StartWorkInput {
  assignmentId: string;
  reportId: string;
  isDemo?: boolean;
}
