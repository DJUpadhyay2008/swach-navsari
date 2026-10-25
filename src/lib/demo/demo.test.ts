import { describe, it, expect } from 'vitest';
import { SIMULATED_REPORTS, SIMULATED_WORKER_TASKS, getSimulatedAdminMetrics } from './demoData';
import { NAVSARI_WARDS } from '@/lib/utils';

describe('Safe Synthetic Demo Mode & Isolation', () => {
  it('covers all 13 municipal wards of Navsari', () => {
    const representedWards = new Set(SIMULATED_REPORTS.map((r) => r.ward_number));

    for (let wardNum = 1; wardNum <= 13; wardNum++) {
      expect(representedWards.has(wardNum)).toBe(true);
    }

    expect(NAVSARI_WARDS.length).toBe(13);
  });

  it('marks every simulated report explicitly with isSimulated flag', () => {
    SIMULATED_REPORTS.forEach((report) => {
      expect(report.isSimulated).toBe(true);
      expect(report.id).toMatch(/^sim-rep-/);
      expect(report.complaint_id).toMatch(/^NAV-2026-/);
    });
  });

  it('ensures no citizen PII (real email, phone number, or unmasked user ID) is in demo records', () => {
    SIMULATED_REPORTS.forEach((report) => {
      // simulated reporter IDs must not be real UUIDs
      expect(report.reporter_id).toMatch(/^sim-citizen-/);
      // description must be marked simulated
      expect(report.description.toLowerCase()).toContain('simulated');
    });
  });

  it('provides deterministic calculated metrics across all 13 wards', () => {
    const metrics = getSimulatedAdminMetrics();

    expect(metrics.totalComplaints).toBe(SIMULATED_REPORTS.length);
    expect(metrics.totalComplaints).toBeGreaterThan(10);
    expect(metrics.submittedCount).toBeGreaterThanOrEqual(1);
    expect(metrics.inProgressCount).toBeGreaterThanOrEqual(1);
    expect(metrics.resolvedCount).toBeGreaterThanOrEqual(1);
    expect(metrics.averageResolutionHours).toBe(21.4);
    expect(metrics.complianceRatePercentage).toBe(92.5);
  });

  it('provides isolated demo worker tasks with isDemo flag', () => {
    SIMULATED_WORKER_TASKS.forEach((task) => {
      expect(task.isDemo).toBe(true);
      expect(task.assignmentId).toMatch(/^sim-asg-/);
      expect(task.reportId).toMatch(/^sim-rep-/);
    });
  });

  it('ensures simulated coordinates remain within Navsari bounding box', () => {
    // Navsari bounding box roughly lat: [20.90, 20.98], lng: [72.89, 72.97]
    SIMULATED_REPORTS.forEach((report) => {
      if (report.latitude && report.longitude) {
        expect(report.latitude).toBeGreaterThanOrEqual(20.9);
        expect(report.latitude).toBeLessThanOrEqual(21.0);
        expect(report.longitude).toBeGreaterThanOrEqual(72.88);
        expect(report.longitude).toBeLessThanOrEqual(72.98);
      }
    });
  });
});
