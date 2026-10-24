import type { AppRole } from '@/types/database.types';

/**
 * Validates whether a string path is a safe internal relative path.
 * Disallows protocol-relative URLs (e.g. //evil.com), backslash tricks, and external protocols.
 */
export function isValidInternalPath(path: unknown): path is string {
  if (typeof path !== 'string' || !path.trim()) return false;
  const trimmed = path.trim();

  // Must start with exactly one slash, not double slash (//) or backslash (/\)
  if (!trimmed.startsWith('/') || trimmed.startsWith('//') || trimmed.startsWith('/\\')) {
    return false;
  }

  // Prevent scheme injection like "javascript:", "data:", "https:"
  const firstSlashIndex = trimmed.indexOf('/', 1);
  const colonIndex = trimmed.indexOf(':');
  if (colonIndex !== -1 && (firstSlashIndex === -1 || colonIndex < firstSlashIndex)) {
    return false;
  }

  return true;
}

/**
 * Resolves the primary default dashboard path for a set of verified database roles.
 */
export function getDefaultRolePath(roles: AppRole[]): string {
  if (roles.includes('municipal_official')) {
    return '/admin';
  }
  if (roles.includes('sanitation_worker')) {
    return '/worker';
  }
  return '/my-reports';
}

/**
 * Securely calculates post-login destination:
 * 1. Validates that requestedPath is a safe internal relative path.
 * 2. Ensures the user is authorized to access the destination based on their verified database roles.
 * 3. Falls back to their role-appropriate default dashboard if unauthorized or unprovided.
 */
export function getSafePostLoginRedirect(
  roles: AppRole[],
  requestedPath?: string | null
): string {
  const defaultPath = getDefaultRolePath(roles);

  if (!requestedPath || !isValidInternalPath(requestedPath)) {
    return defaultPath;
  }

  const normalized = requestedPath.trim();

  // Prevent redirect loops back to auth page
  if (normalized === '/auth' || normalized.startsWith('/auth?')) {
    return defaultPath;
  }

  // 1. Municipal Official: always route directly to municipal portal
  // (Officers triage municipal operations and do not file citizen complaints)
  if (roles.includes('municipal_official')) {
    if (normalized === '/admin' || normalized.startsWith('/admin/')) {
      return normalized;
    }
    return '/admin';
  }

  // 2. Sanitation Worker: always route directly to field sanitation portal
  if (roles.includes('sanitation_worker')) {
    if (normalized === '/worker' || normalized.startsWith('/worker/')) {
      return normalized;
    }
    return '/worker';
  }

  // 3. Citizen: block access to staff portals and route safely
  if (normalized.startsWith('/admin') || normalized.startsWith('/worker')) {
    return defaultPath;
  }

  // Public / Citizen paths (e.g. /my-reports, /report, /community, /track, /reports/:id)
  return normalized;
}
