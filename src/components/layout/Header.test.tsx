import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Header } from './Header';
import type { AppRole } from '@/types/database.types';

const mockUseAuth = vi.fn();
vi.mock('@/features/auth', () => ({
  useAuth: () => mockUseAuth(),
}));

vi.mock('@/lib/supabase/client', () => ({
  isSupabaseConfigured: () => true,
}));

describe('Header Dynamic Role-Based Navigation', () => {
  it('renders correct navigation and actions for signed out visitors', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      profile: null,
      roles: [],
      isLoading: false,
      signOut: vi.fn(),
    });

    render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>
    );

    // Should render generic "Sign In" (not "Citizen Sign In") and "Report Waste"
    expect(screen.getByRole('link', { name: /Sign In/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Report Waste/i })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /Municipal Portal/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /Worker Portal/i })).not.toBeInTheDocument();
  });

  it('renders citizen navigation for verified citizen users', () => {
    mockUseAuth.mockReturnValue({
      user: { id: 'c1', email: 'citizen@example.com' },
      profile: { full_name: 'Aarav Patel' },
      roles: ['citizen'] as AppRole[],
      isLoading: false,
      signOut: vi.fn(),
    });

    render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>
    );

    expect(screen.getByRole('link', { name: /My Reports/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Report Waste/i })).toBeInTheDocument();
    expect(screen.getByTitle(/Sign out/i)).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /Municipal Portal/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /Worker Portal/i })).not.toBeInTheDocument();
  });

  it('renders municipal official navigation exclusively for officials', () => {
    mockUseAuth.mockReturnValue({
      user: { id: 'o1', email: 'officer@navsari.gov' },
      profile: { full_name: 'Rajesh Joshi' },
      roles: ['municipal_official'] as AppRole[],
      isLoading: false,
      signOut: vi.fn(),
    });

    render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>
    );

    expect(screen.getByRole('link', { name: /Municipal Portal/i })).toBeInTheDocument();
    expect(screen.getByTitle(/Sign out/i)).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /Worker Portal/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /My Reports/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /Report Waste/i })).not.toBeInTheDocument();
  });

  it('renders worker navigation exclusively for sanitation workers', () => {
    mockUseAuth.mockReturnValue({
      user: { id: 'w1', email: 'worker@navsari.gov' },
      profile: { full_name: 'Dinesh Solanki' },
      roles: ['sanitation_worker'] as AppRole[],
      isLoading: false,
      signOut: vi.fn(),
    });

    render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>
    );

    expect(screen.getByRole('link', { name: /Worker Portal/i })).toBeInTheDocument();
    expect(screen.getByTitle(/Sign out/i)).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /Municipal Portal/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /My Reports/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /Report Waste/i })).not.toBeInTheDocument();
  });
});
