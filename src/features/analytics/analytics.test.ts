import { describe, it, expect } from 'vitest';
import { isReportOverdue } from './index';

describe('Overdue SLA Computation', () => {
  it('marks a 30-hour-old urgent complaint as overdue (SLA 24h)', () => {
    const thirtyHoursAgo = new Date(Date.now() - 30 * 3600 * 1000).toISOString();
    expect(isReportOverdue(thirtyHoursAgo, 'urgent', false)).toBe(true);
  });

  it('marks a 10-hour-old urgent complaint as within SLA', () => {
    const tenHoursAgo = new Date(Date.now() - 10 * 3600 * 1000).toISOString();
    expect(isReportOverdue(tenHoursAgo, 'urgent', false)).toBe(false);
  });

  it('never marks resolved complaints as overdue', () => {
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString();
    expect(isReportOverdue(oneWeekAgo, 'urgent', true)).toBe(false);
  });
});
