import type { AppRole, ComplaintCategory, ComplaintPriority, ComplaintStatus } from './database.types';

export * from './database.types';

export interface UserSession {
  userId: string;
  email?: string;
  fullName: string;
  roles: AppRole[];
  wardNumber?: number;
}

export interface NavsariWard {
  number: number;
  name: string;
  keyLandmarks: string[];
}

export interface ComplaintTrackingResult {
  complaint_id: string;
  category: ComplaintCategory;
  status: ComplaintStatus;
  priority: ComplaintPriority;
  ward_number: number;
  address_locality: string;
  submitted_at: string;
  resolved_at: string | null;
  reopened_at: string | null;
}

export interface MetricCardData {
  title: string;
  value: string | number;
  change?: string;
  icon: string;
}
