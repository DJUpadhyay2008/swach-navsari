import { z } from 'zod';

export const COMPLAINT_CATEGORIES = [
  'garbage_dump',
  'overflowing_bin',
  'open_defecation',
  'construction_debris',
  'drainage_blockage',
  'sewage_overflow',
  'dead_animal',
  'hazardous_waste',
  'other',
] as const;

export const COMPLAINT_PRIORITIES = ['low', 'medium', 'high', 'urgent'] as const;

export const MAX_PHOTO_COUNT = 3;
export const MAX_PHOTO_SIZE_BYTES = 10 * 1024 * 1024; // 10MB
export const ALLOWED_PHOTO_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;

export function validatePhotoFile(file: File): { valid: boolean; error?: string } {
  if (!ALLOWED_PHOTO_MIME_TYPES.includes(file.type as typeof ALLOWED_PHOTO_MIME_TYPES[number])) {
    return {
      valid: false,
      error: `Unsupported file type "${file.type}". Allowed: JPG, PNG, WEBP.`,
    };
  }
  if (file.size > MAX_PHOTO_SIZE_BYTES) {
    return {
      valid: false,
      error: `File "${file.name}" exceeds the 10MB limit (${(file.size / (1024 * 1024)).toFixed(1)}MB).`,
    };
  }
  if (file.size === 0) {
    return {
      valid: false,
      error: `File "${file.name}" is empty.`,
    };
  }
  return { valid: true };
}

export const reportSubmissionSchema = z
  .object({
    category: z.enum(COMPLAINT_CATEGORIES, {
      errorMap: () => ({ message: 'Please select a valid cleanliness category' }),
    }),
    priority: z.enum(COMPLAINT_PRIORITIES).default('medium'),
    description: z
      .string()
      .min(10, 'Please provide at least 10 characters describing the issue')
      .max(1000, 'Description cannot exceed 1000 characters'),
    ward_number: z.preprocess((val) => {
      if (val === '' || val === null || val === undefined) return null;
      const num = Number(val);
      return isNaN(num) ? null : num;
    }, z.number().int().min(1, 'Ward must be between 1 and 20').max(20).nullable().optional()),
    address_locality: z
      .string()
      .max(200, 'Address is too long')
      .optional()
      .or(z.literal('')),
    landmark: z.string().max(100).optional().or(z.literal('')),
    latitude: z
      .number()
      .min(20.8, 'Latitude must be within the Navsari district boundary (~20.80 - 21.05)')
      .max(21.1, 'Latitude must be within the Navsari district boundary (~20.80 - 21.05)')
      .nullable()
      .optional(),
    longitude: z
      .number()
      .min(72.8, 'Longitude must be within the Navsari district boundary (~72.80 - 73.10)')
      .max(73.15, 'Longitude must be within the Navsari district boundary (~72.80 - 73.10)')
      .nullable()
      .optional(),
    is_anonymous: z.boolean().default(false),
  })
  .refine(
    (data) => {
      const hasGps = typeof data.latitude === 'number' && typeof data.longitude === 'number';
      const hasLocality = typeof data.address_locality === 'string' && data.address_locality.trim().length >= 3;
      return hasGps || hasLocality;
    },
    {
      message: 'Please provide either GPS coordinates (via browser geolocation) or enter a street/locality address (min 3 characters).',
      path: ['address_locality'],
    }
  );

export type ReportSubmissionInput = z.infer<typeof reportSubmissionSchema>;

export const complaintTrackSchema = z.object({
  complaint_id: z
    .string()
    .trim()
    .regex(/^NAV-[0-9]{4}-[0-9]{4,6}$/i, {
      message: 'Format must match NAV-YYYY-XXXXX (e.g. NAV-2026-00101)',
    }),
});

export type ComplaintTrackInput = z.infer<typeof complaintTrackSchema>;

export const reportFeedbackSchema = z.object({
  rating: z.number().int().min(1, 'Rating must be at least 1 star').max(5, 'Max 5 stars'),
  comments: z.string().max(500).optional(),
  is_satisfied: z.boolean().default(true),
  needs_reopening: z.boolean().default(false),
});

export type ReportFeedbackInput = z.infer<typeof reportFeedbackSchema>;

export const authSignInSchema = z.object({
  email: z.string().trim().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export type AuthSignInInput = z.infer<typeof authSignInSchema>;

export const authSignUpSchema = z.object({
  fullName: z.string().trim().min(2, 'Full name must be at least 2 characters'),
  email: z.string().trim().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  wardNumber: z.preprocess((val) => {
    if (val === '' || val === null || val === undefined) return null;
    const num = Number(val);
    return isNaN(num) ? null : num;
  }, z.number().int().min(1).max(20).nullable().optional()),
  phone: z.string().trim().regex(/^(\+91)?[6-9]\d{9}$/, 'Please enter a valid 10-digit Indian phone number').optional().or(z.literal('')),
});

export type AuthSignUpInput = z.infer<typeof authSignUpSchema>;
