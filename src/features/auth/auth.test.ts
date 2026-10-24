import { describe, it, expect } from 'vitest';
import { hasPermission } from './index';
import {
  isValidInternalPath,
  getDefaultRolePath,
  getSafePostLoginRedirect,
} from './redirects';
import { authSignInSchema, authSignUpSchema } from '@/lib/validation/reports';

describe('Role Authorization Logic', () => {
  it('identifies municipal officials as holding administrative privileges', () => {
    expect(hasPermission(['municipal_official'], 'sanitation_worker')).toBe(true);
    expect(hasPermission(['municipal_official'], 'citizen')).toBe(true);
  });

  it('prevents standard citizens from accessing elevated roles', () => {
    expect(hasPermission(['citizen'], 'municipal_official')).toBe(false);
    expect(hasPermission(['citizen'], 'sanitation_worker')).toBe(false);
  });

  it('permits sanitation worker role matches', () => {
    expect(hasPermission(['sanitation_worker'], 'sanitation_worker')).toBe(true);
    expect(hasPermission(['sanitation_worker'], 'municipal_official')).toBe(false);
  });
});

describe('Redirect Security & Path Validation (isValidInternalPath)', () => {
  it('accepts safe internal relative paths', () => {
    expect(isValidInternalPath('/admin')).toBe(true);
    expect(isValidInternalPath('/worker')).toBe(true);
    expect(isValidInternalPath('/my-reports')).toBe(true);
    expect(isValidInternalPath('/reports/123')).toBe(true);
    expect(isValidInternalPath('/track?query=navsari')).toBe(true);
    expect(isValidInternalPath('/')).toBe(true);
  });

  it('rejects protocol-relative URLs (open redirect attacks)', () => {
    expect(isValidInternalPath('//evil.com')).toBe(false);
    expect(isValidInternalPath('//phishing.example.com/login')).toBe(false);
    expect(isValidInternalPath('///evil.com')).toBe(false);
  });

  it('rejects backslash directory traversal variants', () => {
    expect(isValidInternalPath('/\\evil.com')).toBe(false);
    expect(isValidInternalPath('\\evil.com')).toBe(false);
  });

  it('rejects absolute URLs and external URI schemes', () => {
    expect(isValidInternalPath('https://attacker.com')).toBe(false);
    expect(isValidInternalPath('http://malicious.org/admin')).toBe(false);
    expect(isValidInternalPath('javascript:alert(document.cookie)')).toBe(false);
    expect(isValidInternalPath('data:text/html,<script>alert(1)</script>')).toBe(false);
  });

  it('rejects non-strings, null, undefined, or empty strings', () => {
    expect(isValidInternalPath(null)).toBe(false);
    expect(isValidInternalPath(undefined)).toBe(false);
    expect(isValidInternalPath('')).toBe(false);
    expect(isValidInternalPath('   ')).toBe(false);
    expect(isValidInternalPath(12345)).toBe(false);
    expect(isValidInternalPath({})).toBe(false);
  });
});

describe('Default Role Portal Resolution (getDefaultRolePath)', () => {
  it('resolves /admin for municipal_official', () => {
    expect(getDefaultRolePath(['municipal_official'])).toBe('/admin');
    expect(getDefaultRolePath(['municipal_official', 'citizen'])).toBe('/admin');
  });

  it('resolves /worker for sanitation_worker', () => {
    expect(getDefaultRolePath(['sanitation_worker'])).toBe('/worker');
    expect(getDefaultRolePath(['sanitation_worker', 'citizen'])).toBe('/worker');
  });

  it('resolves /my-reports for citizen or fallback', () => {
    expect(getDefaultRolePath(['citizen'])).toBe('/my-reports');
    expect(getDefaultRolePath([])).toBe('/my-reports');
  });
});

describe('Role-Aware Post-Login Redirects (getSafePostLoginRedirect)', () => {
  it('routes municipal_official to /admin by default or requested safe admin route', () => {
    expect(getSafePostLoginRedirect(['municipal_official'], null)).toBe('/admin');
    expect(getSafePostLoginRedirect(['municipal_official'], '/admin/reports')).toBe('/admin/reports');
    expect(getSafePostLoginRedirect(['municipal_official'], '/my-reports')).toBe('/my-reports');
  });

  it('routes sanitation_worker to /worker by default or requested worker route', () => {
    expect(getSafePostLoginRedirect(['sanitation_worker'], null)).toBe('/worker');
    expect(getSafePostLoginRedirect(['sanitation_worker'], '/worker')).toBe('/worker');
  });

  it('prevents sanitation_worker from accessing municipal admin portal upon login', () => {
    expect(getSafePostLoginRedirect(['sanitation_worker'], '/admin')).toBe('/worker');
    expect(getSafePostLoginRedirect(['sanitation_worker'], '/admin/reports/123')).toBe('/worker');
  });

  it('routes citizen to /my-reports by default or safe public routes', () => {
    expect(getSafePostLoginRedirect(['citizen'], null)).toBe('/my-reports');
    expect(getSafePostLoginRedirect(['citizen'], '/track')).toBe('/track');
    expect(getSafePostLoginRedirect(['citizen'], '/report')).toBe('/report');
  });

  it('prevents citizen from accessing municipal admin or worker portals upon login', () => {
    expect(getSafePostLoginRedirect(['citizen'], '/admin')).toBe('/my-reports');
    expect(getSafePostLoginRedirect(['citizen'], '/admin/assignments')).toBe('/my-reports');
    expect(getSafePostLoginRedirect(['citizen'], '/worker')).toBe('/my-reports');
  });

  it('blocks open redirects and falls back to role dashboard', () => {
    expect(getSafePostLoginRedirect(['citizen'], '//evil.com/phish')).toBe('/my-reports');
    expect(getSafePostLoginRedirect(['municipal_official'], 'https://malicious.org')).toBe('/admin');
    expect(getSafePostLoginRedirect(['sanitation_worker'], 'javascript:steal()')).toBe('/worker');
  });

  it('prevents redirect loops back to /auth', () => {
    expect(getSafePostLoginRedirect(['citizen'], '/auth')).toBe('/my-reports');
    expect(getSafePostLoginRedirect(['municipal_official'], '/auth?returnTo=/admin')).toBe('/admin');
  });
});

describe('Authentication Form Schemas & Field Tampering Protection', () => {
  it('validates standard citizen registration payload', () => {
    const validData = {
      fullName: 'Pooja Mehta',
      email: 'pooja@example.com',
      password: 'StrongPassword123!',
      wardNumber: 3,
      phone: '+919876543210',
    };

    const parsed = authSignUpSchema.safeParse(validData);
    expect(parsed.success).toBe(true);
  });

  it('rejects invalid email and short passwords', () => {
    const invalidData = {
      fullName: 'A',
      email: 'invalid-email',
      password: '123',
      wardNumber: 99,
      phone: '',
    };

    const parsed = authSignUpSchema.safeParse(invalidData);
    expect(parsed.success).toBe(false);
  });

  it('validates unified sign-in input for any role account', () => {
    const validSignIn = {
      email: 'official@navsari.gujarat.gov.in',
      password: 'AuthorizedOfficerPass!',
    };

    const parsed = authSignInSchema.safeParse(validSignIn);
    expect(parsed.success).toBe(true);
  });
});
