export * from './AuthContext';
export * from './useAuth';
export * from './redirects';
export * from './WorkerGuard';
export * from '@/lib/validation/reports';
import type { AppRole } from '@/types';

export interface AuthState {
  userId: string | null;
  roles: AppRole[];
  isAuthenticated: boolean;
  isLoading: boolean;
}

export function hasPermission(
  userRoles: AppRole[],
  requiredRole: AppRole
): boolean {
  if (userRoles.includes('municipal_official')) {
    return true; // Municipal official has administrative oversight
  }
  return userRoles.includes(requiredRole);
}
