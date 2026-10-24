import { z } from 'zod';

export const COMPLAINT_CATEGORIES = [
  'garbage_dump',
  'overflowing_bin',
  'dead_animal',
  'sewage_overflow',
  'construction_debris',
  'open_defecation',
  'drainage_blockage',
  'hazardous_waste',
  'other',
] as const;

export const COMPLAINT_PRIORITIES = ['low', 'medium', 'high', 'urgent'] as const;

export const reportSubmissionSchema = z.object({
  category: z.enum(COMPLAINT_CATEGORIES, {
    errorMap: () => ({ message: 'Please select a valid cleanliness category' }),
  }),
  priority: z.enum(COMPLAINT_PRIORITIES).default('medium'),
  description: z
    .string()
    .min(10, 'Please provide at least 10 characters describing the issue')
    .max(1000, 'Description cannot exceed 1000 characters'),
  ward_number: z.coerce
    .number()
    .int('Ward must be an integer')
    .min(1, 'Please select a valid Navsari Ward (1 to 13)')
    .max(20, 'Ward number cannot exceed 20'),
  address_locality: z
    .string()
    .min(3, 'Please provide the street, society, or locality name in Navsari')
    .max(200, 'Address is too long'),
  landmark: z.string().max(100).optional(),
  latitude: z
    .number()
    .min(20.8, 'Latitude must be within the Navsari district boundary (~20.80 - 21.05)')
    .max(21.1, 'Latitude must be within the Navsari district boundary (~20.80 - 21.05)'),
  longitude: z
    .number()
    .min(72.8, 'Longitude must be within the Navsari district boundary (~72.80 - 73.10)')
    .max(73.15, 'Longitude must be within the Navsari district boundary (~72.80 - 73.10)'),
  is_anonymous: z.boolean().default(false),
});

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
