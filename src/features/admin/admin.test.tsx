import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { AdminGuard } from './components/AdminGuard';
import { transitionComplaintStatus, assignWorkerToComplaint } from './adminService';
import { isReportOverdue } from '@/features/analytics';
import type { AppRole } from '@/types/database.types';

// Mock useAuth
const mockUseAuth = vi.fn();
vi.mock('@/features/auth', () => ({
  useAuth: () => mockUseAuth(),
}));

// Mock Supabase client
const mockRpc = vi.fn();
vi.mock('@/lib/supabase/client', () => ({
  getSupabase: () => ({
    rpc: mockRpc,
    from: () => ({
      select: () => ({
        eq: () => ({ maybeSingle: vi.fn() }),
      }),
    }),
  }),
  isSupabaseConfigured: () => true,
}));

describe('AdminGuard Role Protection & Security', () => {
  it('renders loading state when auth session is initializing', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      roles: [],
      isLoading: true,
      signOut: vi.fn(),
    });

    render(
      <MemoryRouter initialEntries={['/admin']}>
        <AdminGuard>
          <div data-testid="protected-content">Secret Municipal Operations</div>
        </AdminGuard>
      </MemoryRouter>
    );

    expect(screen.getByText(/Verifying Municipal Credentials/i)).toBeInTheDocument();
    expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
  });

  it('redirects unauthenticated users to /auth with return path', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      roles: [],
      isLoading: false,
      signOut: vi.fn(),
    });

    render(
      <MemoryRouter initialEntries={['/admin/reports']}>
        <Routes>
          <Route
            path="/admin/reports"
            element={
              <AdminGuard>
                <div data-testid="protected-content">Secret Municipal Operations</div>
              </AdminGuard>
            }
          />
          <Route path="/auth" element={<div data-testid="auth-page">Login Gateway</div>} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByTestId('auth-page')).toBeInTheDocument();
    expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
  });

  it('blocks authenticated citizen and renders Access Denied view', () => {
    mockUseAuth.mockReturnValue({
      user: { id: 'citizen-1', email: 'resident@navsari.gov' },
      roles: ['citizen'] as AppRole[],
      isLoading: false,
      signOut: vi.fn(),
    });

    render(
      <MemoryRouter initialEntries={['/admin']}>
        <AdminGuard>
          <div data-testid="protected-content">Secret Municipal Operations</div>
        </AdminGuard>
      </MemoryRouter>
    );

    expect(screen.getByText(/Municipal Official Access Required/i)).toBeInTheDocument();
    expect(screen.getByText(/403 Forbidden/i)).toBeInTheDocument();
    expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
  });

  it('blocks sanitation worker from municipal portal and offers link to worker portal', () => {
    mockUseAuth.mockReturnValue({
      user: { id: 'worker-1', email: 'worker@navsari.gov' },
      roles: ['sanitation_worker'] as AppRole[],
      isLoading: false,
      signOut: vi.fn(),
    });

    render(
      <MemoryRouter initialEntries={['/admin']}>
        <AdminGuard>
          <div data-testid="protected-content">Secret Municipal Operations</div>
        </AdminGuard>
      </MemoryRouter>
    );

    expect(screen.getByText(/Municipal Official Access Required/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Go to Worker Sanitation Portal/i })).toBeInTheDocument();
    expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
  });

  it('allows authenticated municipal_official to access administrative features', () => {
    mockUseAuth.mockReturnValue({
      user: { id: 'official-1', email: 'chief.sanitation@navsari.gov' },
      roles: ['municipal_official'] as AppRole[],
      isLoading: false,
      signOut: vi.fn(),
    });

    render(
      <MemoryRouter initialEntries={['/admin']}>
        <AdminGuard>
          <div data-testid="protected-content">Authorized Municipal Console</div>
        </AdminGuard>
      </MemoryRouter>
    );

    expect(screen.getByTestId('protected-content')).toBeInTheDocument();
    expect(screen.queryByText(/403 Forbidden/i)).not.toBeInTheDocument();
  });
});

describe('Municipal Administrative Service Validation Rules', () => {
  it('enforces mandatory rejection reason (min 5 characters) when rejecting complaints', async () => {
    await expect(
      transitionComplaintStatus('rep-1', 'rejected', 'note', 'bad')
    ).rejects.toThrow(/rejection reason of at least 5 characters is required/i);

    await expect(
      transitionComplaintStatus('rep-1', 'rejected', 'note', undefined)
    ).rejects.toThrow(/rejection reason of at least 5 characters is required/i);
  });

  it('allows valid rejection with reason >= 5 characters via RPC', async () => {
    mockRpc.mockResolvedValueOnce({
      data: { id: 'rep-1', status: 'rejected', rejection_reason: 'Private property outside municipal boundary' },
      error: null,
    });

    const result = await transitionComplaintStatus(
      'rep-1',
      'rejected',
      'Audited rejection',
      'Private property outside municipal boundary'
    );

    expect(mockRpc).toHaveBeenCalledWith('transition_report_status', {
      p_report_id: 'rep-1',
      p_new_status: 'rejected',
      p_note: 'Audited rejection',
      p_rejection_reason: 'Private property outside municipal boundary',
    });
    expect(result.status).toBe('rejected');
  });

  it('dispatches worker assignment through trusted assign_report RPC', async () => {
    mockRpc.mockResolvedValueOnce({
      data: { id: 'assn-1', report_id: 'rep-1', worker_id: 'worker-1', status: 'assigned' },
      error: null,
    });

    const result = await assignWorkerToComplaint('rep-1', 'worker-1', 'Deploy mini dumper');

    expect(mockRpc).toHaveBeenCalledWith('assign_report', {
      p_report_id: 'rep-1',
      p_worker_id: 'worker-1',
      p_notes: 'Deploy mini dumper',
    });
    expect(result.status).toBe('assigned');
  });

  it('correctly calculates SLA overdue status based on priority window', () => {
    const now = Date.now();
    // 25 hours ago urgent (sla: 24h) -> overdue
    const urgentDate = new Date(now - 25 * 3600 * 1000).toISOString();
    expect(isReportOverdue(urgentDate, 'urgent', false)).toBe(true);

    // 10 hours ago urgent (sla: 24h) -> not overdue
    const recentUrgent = new Date(now - 10 * 3600 * 1000).toISOString();
    expect(isReportOverdue(recentUrgent, 'urgent', false)).toBe(false);

    // Resolved complaint is never marked overdue
    expect(isReportOverdue(urgentDate, 'urgent', true)).toBe(false);
  });
});
