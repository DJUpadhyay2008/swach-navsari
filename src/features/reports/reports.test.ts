import { describe, it, expect } from 'vitest';
import { canTransition } from './index';

describe('Complaint Lifecycle State Machine', () => {
  it('allows valid forward progress transitions', () => {
    expect(canTransition('submitted', 'under_review')).toBe(true);
    expect(canTransition('submitted', 'assigned')).toBe(true);
    expect(canTransition('assigned', 'in_progress')).toBe(true);
    expect(canTransition('in_progress', 'resolution_submitted')).toBe(true);
    expect(canTransition('resolution_submitted', 'resolved')).toBe(true);
  });

  it('allows dispute and rework transitions', () => {
    expect(canTransition('resolution_submitted', 'in_progress')).toBe(true);
    expect(canTransition('resolved', 'reopened')).toBe(true);
  });

  it('prohibits skipping lifecycle states', () => {
    // Cannot jump straight from submitted to resolved without assignment and work
    expect(canTransition('submitted', 'resolved')).toBe(false);
    expect(canTransition('assigned', 'resolved')).toBe(false);
  });

  it('prohibits transitions from terminal states', () => {
    expect(canTransition('rejected', 'in_progress')).toBe(false);
    expect(canTransition('cancelled', 'assigned')).toBe(false);
  });
});
