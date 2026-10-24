import { describe, it, expect } from 'vitest';
import {
  reportSubmissionSchema,
  complaintTrackSchema,
  reportFeedbackSchema,
} from '@/lib/validation/reports';

describe('Zod Validation Schemas', () => {
  describe('reportSubmissionSchema', () => {
    it('validates a correct complaint submission input', () => {
      const validPayload = {
        category: 'garbage_dump',
        priority: 'high',
        description: 'Large pile of commercial waste left behind vegetable stalls.',
        ward_number: 4,
        address_locality: 'Lunsikui Market Area',
        landmark: 'Opposite Sardar Complex',
        latitude: 20.9467,
        longitude: 72.9281,
        is_anonymous: false,
      };

      const result = reportSubmissionSchema.safeParse(validPayload);
      expect(result.success).toBe(true);
    });

    it('rejects short descriptions below 10 characters', () => {
      const payload = {
        category: 'overflowing_bin',
        description: 'Trash',
        ward_number: 7,
        address_locality: 'Dudhia Talav',
        latitude: 20.9525,
        longitude: 72.9325,
      };

      const result = reportSubmissionSchema.safeParse(payload);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toContain('at least 10 characters');
      }
    });

    it('rejects coordinates outside the Navsari district boundary', () => {
      const outOfBoundsPayload = {
        category: 'garbage_dump',
        description: 'Uncollected refuse along roadside.',
        ward_number: 1,
        address_locality: 'Gandevi Road',
        latitude: 28.6139, // New Delhi coordinates
        longitude: 77.2090,
      };

      const result = reportSubmissionSchema.safeParse(outOfBoundsPayload);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some((i) => i.path.includes('latitude'))).toBe(true);
      }
    });
  });

  describe('complaintTrackSchema', () => {
    it('accepts valid NAV-YYYY-XXXXX format', () => {
      expect(complaintTrackSchema.safeParse({ complaint_id: 'NAV-2026-00101' }).success).toBe(true);
      expect(complaintTrackSchema.safeParse({ complaint_id: 'NAV-2026-123456' }).success).toBe(true);
    });

    it('rejects invalid or unsafe formats', () => {
      expect(complaintTrackSchema.safeParse({ complaint_id: '12345' }).success).toBe(false);
      expect(complaintTrackSchema.safeParse({ complaint_id: 'DROP TABLE reports;' }).success).toBe(false);
    });
  });

  describe('reportFeedbackSchema', () => {
    it('accepts valid 1-5 star ratings', () => {
      expect(reportFeedbackSchema.safeParse({ rating: 5, comments: 'Prompt action!' }).success).toBe(true);
      expect(reportFeedbackSchema.safeParse({ rating: 0 }).success).toBe(false);
      expect(reportFeedbackSchema.safeParse({ rating: 6 }).success).toBe(false);
    });
  });
});
