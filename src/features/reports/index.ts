export * from '@/lib/validation/reports';
export * from './reportsService';
import type { ComplaintStatus } from '@/types';

export interface TransitionRequest {
  reportId: string;
  newStatus: ComplaintStatus;
  note?: string;
  rejectionReason?: string;
}

export const VALID_TRANSITIONS: Record<ComplaintStatus, ComplaintStatus[]> = {
  submitted: ['under_review', 'assigned', 'rejected', 'cancelled'],
  under_review: ['assigned', 'rejected', 'cancelled'],
  assigned: ['in_progress', 'cancelled'],
  in_progress: ['resolution_submitted', 'cancelled'],
  resolution_submitted: ['resolved', 'in_progress'],
  resolved: ['reopened'],
  reopened: ['under_review', 'assigned'],
  rejected: [],
  cancelled: [],
};

export function canTransition(
  current: ComplaintStatus,
  target: ComplaintStatus
): boolean {
  const allowed = VALID_TRANSITIONS[current];
  return allowed ? allowed.includes(target) : false;
}
