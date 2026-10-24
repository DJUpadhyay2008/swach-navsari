import { describe, it, expect } from 'vitest';
import {
  reportSubmissionSchema,
  complaintTrackSchema,
  reportFeedbackSchema,
  authSignInSchema,
  authSignUpSchema,
  validatePhotoFile,
} from '@/lib/validation/reports';

describe('Zod Validation Schemas', () => {
  describe('reportSubmissionSchema (Phase 2 Geolocation & Locality)', () => {
    it('validates a correct complaint submission input with both GPS and locality', () => {
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

    it('allows submission with manual locality when GPS is denied (latitude/longitude null)', () => {
      const payloadWithoutGps = {
        category: 'overflowing_bin',
        description: 'Trash container overflowing outside society gate.',
        ward_number: 7,
        address_locality: 'Dudhia Talav Promenade West',
        latitude: null,
        longitude: null,
      };

      const result = reportSubmissionSchema.safeParse(payloadWithoutGps);
      expect(result.success).toBe(true);
    });

    it('allows submission with GPS coordinates when locality text is not provided', () => {
      const payloadWithGpsOnly = {
        category: 'drainage_blockage',
        description: 'Blocked drain causing road water stagnation.',
        latitude: 20.9525,
        longitude: 72.9325,
        address_locality: '',
      };

      const result = reportSubmissionSchema.safeParse(payloadWithGpsOnly);
      expect(result.success).toBe(true);
    });

    it('rejects submission when neither GPS nor locality is provided', () => {
      const invalidLocationPayload = {
        category: 'garbage_dump',
        description: 'Debris left unattended on public sidewalk.',
        latitude: null,
        longitude: null,
        address_locality: '',
      };

      const result = reportSubmissionSchema.safeParse(invalidLocationPayload);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toContain('Please provide either GPS coordinates');
      }
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

  describe('validatePhotoFile', () => {
    it('accepts valid JPEG, PNG, and WEBP photos under 10MB', () => {
      const validJpg = new File(['content'], 'test.jpg', { type: 'image/jpeg' });
      const validPng = new File(['content'], 'test.png', { type: 'image/png' });
      const validWebp = new File(['content'], 'test.webp', { type: 'image/webp' });

      expect(validatePhotoFile(validJpg).valid).toBe(true);
      expect(validatePhotoFile(validPng).valid).toBe(true);
      expect(validatePhotoFile(validWebp).valid).toBe(true);
    });

    it('rejects unsupported file formats', () => {
      const pdfFile = new File(['%PDF'], 'document.pdf', { type: 'application/pdf' });
      const gifFile = new File(['GIF89a'], 'animated.gif', { type: 'image/gif' });

      const pdfRes = validatePhotoFile(pdfFile);
      expect(pdfRes.valid).toBe(false);
      expect(pdfRes.error).toContain('Unsupported file type');

      const gifRes = validatePhotoFile(gifFile);
      expect(gifRes.valid).toBe(false);
    });

    it('rejects files larger than 10MB', () => {
      // Mock large file object
      const largeFile = {
        name: 'huge.jpg',
        type: 'image/jpeg',
        size: 11 * 1024 * 1024, // 11MB
      } as unknown as File;

      const res = validatePhotoFile(largeFile);
      expect(res.valid).toBe(false);
      expect(res.error).toContain('exceeds the 10MB limit');
    });

    it('rejects empty 0-byte files', () => {
      const emptyFile = new File([], 'empty.png', { type: 'image/png' });
      const res = validatePhotoFile(emptyFile);
      expect(res.valid).toBe(false);
      expect(res.error).toContain('is empty');
    });
  });

  describe('authSignInSchema & authSignUpSchema', () => {
    it('validates correct sign-in credentials', () => {
      const validSignIn = {
        email: 'citizen@navsari.gov.in',
        password: 'securePassword123',
      };
      expect(authSignInSchema.safeParse(validSignIn).success).toBe(true);
    });

    it('rejects invalid email formats', () => {
      const invalidEmail = {
        email: 'not-an-email',
        password: 'securePassword123',
      };
      expect(authSignInSchema.safeParse(invalidEmail).success).toBe(false);
    });

    it('rejects passwords shorter than 6 characters', () => {
      const shortPass = {
        email: 'citizen@navsari.gov.in',
        password: '123',
      };
      expect(authSignInSchema.safeParse(shortPass).success).toBe(false);
    });

    it('validates full citizen sign-up payload', () => {
      const validSignUp = {
        fullName: 'Kiritbhai Patel',
        email: 'kiritbhai@example.com',
        password: 'password123',
        wardNumber: 4,
        phone: '9876543210',
      };
      expect(authSignUpSchema.safeParse(validSignUp).success).toBe(true);
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
