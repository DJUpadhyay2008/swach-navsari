import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AuthProvider } from './AuthContext';
import { useAuth } from './useAuth';

function TestConsumer() {
  const { user, isLoading, isConfigured } = useAuth();
  return (
    <div>
      <span data-testid="auth-loading">{isLoading ? 'loading' : 'ready'}</span>
      <span data-testid="auth-user">{user ? user.email : 'anonymous'}</span>
      <span data-testid="auth-config">{isConfigured ? 'configured' : 'not-configured'}</span>
    </div>
  );
}

describe('AuthProvider & useAuth', () => {
  it('renders children with clean initial state', () => {
    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    expect(screen.getByTestId('auth-loading')).toBeInTheDocument();
    expect(screen.getByTestId('auth-user')).toHaveTextContent('anonymous');
  });
});
