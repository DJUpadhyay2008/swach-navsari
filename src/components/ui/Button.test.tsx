import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Button } from './Button';

describe('Button UI Component', () => {
  it('renders button label properly', () => {
    render(<Button>Submit Report</Button>);
    expect(screen.getByText('Submit Report')).toBeInTheDocument();
  });

  it('shows loading indicator and disables button during isLoading state', () => {
    render(<Button isLoading>Processing</Button>);
    const btn = screen.getByRole('button');
    expect(btn).toBeDisabled();
    expect(screen.getByText('Processing')).toBeInTheDocument();
  });
});
