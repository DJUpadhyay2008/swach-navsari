import type { AssignmentStatus } from '@/types';

export interface AssignWorkerPayload {
  reportId: string;
  workerId: string;
  notes?: string;
}

export interface WorkerTaskSummary {
  assignmentId: string;
  reportId: string;
  complaintId: string;
  wardNumber: number;
  locality: string;
  status: AssignmentStatus;
  assignedAt: string;
}

export * from '@/features/worker';
