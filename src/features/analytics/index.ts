import type { ComplaintPriority } from '@/types';

export interface WardCleanlinessMetric {
  wardNumber: number;
  wardName: string;
  totalReported: number;
  totalResolved: number;
  averageResolutionHours: number;
  complianceRatePercentage: number;
}

export function isReportOverdue(
  submittedAtIso: string,
  priority: ComplaintPriority,
  isResolved: boolean
): boolean {
  if (isResolved) return false;

  const slaHoursMap: Record<ComplaintPriority, number> = {
    urgent: 24,
    high: 48,
    medium: 72,
    low: 120,
  };

  const slaMs = slaHoursMap[priority] * 3600 * 1000;
  const elapsedMs = Date.now() - new Date(submittedAtIso).getTime();

  return elapsedMs > slaMs;
}
