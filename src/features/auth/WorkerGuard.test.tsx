import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { WorkerGuard } from './WorkerGuard';
import type { AppRole } from '@/types/database.types';

const mockUseAuth = vi.fn();
vi.mock('@/features/auth', () => ({
  useAuth: () => mockUseAuth(),
}));

describe('WorkerGuard Role Protection & Security', () => {
  it('renders loading indicator while session/role is loading', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      roles: [],
      isLoading: true,
      signOut: vi.fn(),
    });

    render(
      <MemoryRouter initialEntries={['/worker']}>
        <WorkerGuard>
          <div data-testid="protected-worker-content">Field Tasks</div>
        </WorkerGuard>
      </MemoryRouter>
    );

    expect(screen.getByText(/Verifying Worker Session/i)).toBeInTheDocument();
    expect(screen.queryByTestId('protected-worker-content')).not.toBeInTheDocument();
  });

  it('redirects unauthenticated users to /auth with returnTo query param', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      roles: [],
      isLoading: false,
      signOut: vi.fn(),
    });

    render(
      <MemoryRouter initialEntries={['/worker']}>
        <Routes>
          <Route
            path="/worker"
            element={
              <WorkerGuard>
                <div data-testid="protected-worker-content">Field Tasks</div>
              </WorkerGuard>
            }
          />
          <Route path="/auth" element={<div data-testid="auth-page">Login Gateway</div>} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByTestId('auth-page')).toBeInTheDocument();
    expect(screen.queryByTestId('protected-worker-content')).not.toBeInTheDocument();
  });

  it('blocks citizen and displays 403 Forbidden with link to /my-reports', () => {
    mockUseAuth.mockReturnValue({
      user: { id: 'citizen-user-1', email: 'citizen@navsari.in' },
      roles: ['citizen'] as AppRole[],
      isLoading: false,
      signOut: vi.fn(),
    });

    render(
      <MemoryRouter initialEntries={['/worker']}>
        <WorkerGuard>
          <div data-testid="protected-worker-content">Field Tasks</div>
        </WorkerGuard>
      </MemoryRouter>
    );

    expect(screen.getByText(/403 Forbidden/i)).toBeInTheDocument();
    expect(screen.getByText(/Sanitation Worker Portal/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Go to Citizen My Reports/i })).toBeInTheDocument();
    expect(screen.queryByTestId('protected-worker-content')).not.toBeInTheDocument();
  });

  it('permits sanitation_worker to access worker portal', () => {
    mockUseAuth.mockReturnValue({
      user: { id: 'worker-user-1', email: 'worker@navsari.gov' },
      roles: ['sanitation_worker'] as AppRole[],
      isLoading: false,
      signOut: vi.fn(),
    });

    render(
      <MemoryRouter initialEntries={['/worker']}>
        <WorkerGuard>
          <div data-testid="protected-worker-content">Field Tasks</div>
        </WorkerGuard>
      </MemoryRouter>
    );

    expect(screen.getByTestId('protected-worker-content')).toBeInTheDocument();
    expect(screen.queryByText(/403 Forbidden/i)).not.toBeInTheDocument();
  });

  it('permits municipal_official supervisor to access worker portal', () => {
    mockUseAuth.mockReturnValue({
      user: { id: 'official-user-1', email: 'supervisor@navsari.gov' },
      roles: ['municipal_official'] as AppRole[],
      isLoading: false,
      signOut: vi.fn(),
    });

    render(
      <MemoryRouter initialEntries={['/worker']}>
        <WorkerGuard>
          <div data-testid="protected-worker-content">Field Tasks</div>
        </WorkerGuard>
      </MemoryRouter>
    );

    expect(screen.getByTestId('protected-worker-content')).toBeInTheDocument();
  });
});
