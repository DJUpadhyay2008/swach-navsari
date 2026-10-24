import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getWorkerTasks,
  startWorkOnAssignment,
  submitResolutionEvidence,
  DEMO_WORKER_TASKS,
} from './workerService';
import * as supabaseClientModule from '@/lib/supabase/client';

describe('Sanitation Worker Service', () => {
  const mockRpc = vi.fn();
  const mockFrom = vi.fn();
  const mockStorageFrom = vi.fn();

  const fakeSupabase = {
    rpc: mockRpc,
    from: mockFrom,
    storage: {
      from: mockStorageFrom,
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(supabaseClientModule, 'getSupabase').mockReturnValue(fakeSupabase as unknown as ReturnType<typeof supabaseClientModule.getSupabase>);
  });

  describe('getWorkerTasks', () => {
    it('returns empty array when worker has no assignments in database', async () => {
      mockFrom.mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ error: null }),
          }),
        }),
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: [],
              error: null,
            }),
          }),
        }),
      });

      const tasks = await getWorkerTasks('worker-123');
      expect(tasks).toEqual([]);
    });

    it('returns DEMO_WORKER_TASKS when Supabase client is not available', async () => {
      vi.spyOn(supabaseClientModule, 'getSupabase').mockReturnValue(null);

      const tasks = await getWorkerTasks('worker-123');
      expect(tasks).toEqual(DEMO_WORKER_TASKS);
      expect(tasks[0]!.complaintId).toBe('NAV-2026-00101');
    });

    it('successfully maps joined assignments, reports, and resolution evidence', async () => {
      const mockAssignments = [
        {
          id: 'assn-1',
          report_id: 'rep-1',
          worker_id: 'worker-123',
          assigned_by: 'officer-1',
          status: 'in_progress',
          notes: 'Clear perimeter with crew',
          assigned_at: '2026-10-24T10:00:00Z',
          started_at: '2026-10-24T11:00:00Z',
          completed_at: null,
        },
      ];

      const mockReports = [
        {
          id: 'rep-1',
          complaint_id: 'NAV-2026-00101',
          category: 'garbage_dump',
          priority: 'high',
          status: 'in_progress',
          description: 'Large waste accumulation at park perimeter',
          address_locality: 'Dudhia Talav',
          landmark: 'East Gate',
          ward_number: 7,
          latitude: 20.9525,
          longitude: 72.9325,
          submitted_at: '2026-10-24T08:00:00Z',
        },
      ];

      mockFrom.mockImplementation((tableName: string) => {
        if (tableName === 'assignments') {
          return {
            update: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockResolvedValue({ error: null }),
              }),
            }),
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                order: vi.fn().mockResolvedValue({
                  data: mockAssignments,
                  error: null,
                }),
              }),
            }),
          };
        }
        if (tableName === 'reports') {
          return {
            select: vi.fn().mockReturnValue({
              in: vi.fn().mockResolvedValue({
                data: mockReports,
                error: null,
              }),
            }),
          };
        }
        if (tableName === 'resolution_evidence') {
          return {
            select: vi.fn().mockReturnValue({
              in: vi.fn().mockResolvedValue({
                data: [],
                error: null,
              }),
            }),
          };
        }
        return {};
      });

      const tasks = await getWorkerTasks('worker-123');
      expect(tasks.length).toBe(1);
      expect(tasks[0]!.complaintId).toBe('NAV-2026-00101');
      expect(tasks[0]!.wardNumber).toBe(7);
      expect(tasks[0]!.officialInstructions).toBe('Clear perimeter with crew');
    });
  });

  describe('startWorkOnAssignment', () => {
    it('executes transition_report_status RPC and updates assignment record', async () => {
      mockRpc.mockResolvedValue({ error: null });
      const mockUpdate = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      });
      mockFrom.mockReturnValue({ update: mockUpdate });

      await startWorkOnAssignment({
        assignmentId: 'assn-1',
        reportId: 'rep-1',
        isDemo: false,
      });

      expect(mockRpc).toHaveBeenCalledWith('transition_report_status', {
        p_report_id: 'rep-1',
        p_new_status: 'in_progress',
        p_note: expect.stringContaining('Sanitation worker'),
      });
      expect(mockFrom).toHaveBeenCalledWith('assignments');
    });

    it('bypasses remote database calls when task is in demo mode', async () => {
      await startWorkOnAssignment({
        assignmentId: 'assn-demo',
        reportId: 'rep-demo',
        isDemo: true,
      });

      expect(mockRpc).not.toHaveBeenCalled();
      expect(mockFrom).not.toHaveBeenCalled();
    });
  });

  describe('submitResolutionEvidence', () => {
    it('throws error if photographic evidence is missing', async () => {
      await expect(
        submitResolutionEvidence({
          assignmentId: 'assn-1',
          reportId: 'rep-1',
          workerId: 'worker-1',
          photoFile: null as unknown as File,
          notes: 'Finished all cleaning work',
        })
      ).rejects.toThrow('A post-cleanup photographic proof is mandatory.');
    });

    it('throws error if file format is unsupported', async () => {
      const invalidFile = new File(['mock content'], 'test.pdf', { type: 'application/pdf' });
      await expect(
        submitResolutionEvidence({
          assignmentId: 'assn-1',
          reportId: 'rep-1',
          workerId: 'worker-1',
          photoFile: invalidFile,
          notes: 'Finished all cleaning work',
        })
      ).rejects.toThrow('Invalid image format');
    });

    it('throws error if resolution notes are fewer than 5 characters', async () => {
      const validFile = new File(['mock image'], 'photo.jpg', { type: 'image/jpeg' });
      await expect(
        submitResolutionEvidence({
          assignmentId: 'assn-1',
          reportId: 'rep-1',
          workerId: 'worker-1',
          photoFile: validFile,
          notes: 'done',
        })
      ).rejects.toThrow('at least 5 characters');
    });

    it('handles demo submission cleanly without calling remote Supabase', async () => {
      const validFile = new File(['mock image'], 'photo.jpg', { type: 'image/jpeg' });
      // Mock URL.createObjectURL in jsdom
      window.URL.createObjectURL = vi.fn().mockReturnValue('blob:http://localhost/mock-preview');

      const result = await submitResolutionEvidence({
        assignmentId: 'assn-demo',
        reportId: 'rep-demo',
        workerId: 'demo-worker',
        photoFile: validFile,
        notes: 'Cleared all garbage and washed the street.',
        isDemo: true,
      });

      expect(result.storagePath).toContain('demo');
      expect(result.previewUrl).toBe('blob:http://localhost/mock-preview');
      expect(mockRpc).not.toHaveBeenCalled();
    });

    it('uploads to resolution-evidence bucket, registers evidence record, and transitions complaint status', async () => {
      const validFile = new File(['mock image content'], 'resolution.jpg', { type: 'image/jpeg' });
      window.URL.createObjectURL = vi.fn().mockReturnValue('blob:http://localhost/mock-preview');

      mockStorageFrom.mockReturnValue({
        upload: vi.fn().mockResolvedValue({ error: null }),
        createSignedUrl: vi.fn().mockResolvedValue({
          data: { signedUrl: 'https://storage.supabase.co/signed/evidence.jpg' },
          error: null,
        }),
      });

      const mockInsert = vi.fn().mockResolvedValue({ error: null });
      const mockUpdate = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      });

      mockFrom.mockImplementation((tableName: string) => {
        if (tableName === 'resolution_evidence') {
          return { insert: mockInsert };
        }
        if (tableName === 'assignments') {
          return { update: mockUpdate };
        }
        return {};
      });

      mockRpc.mockResolvedValue({ error: null });

      const result = await submitResolutionEvidence({
        assignmentId: 'assn-1',
        reportId: 'rep-1',
        workerId: 'worker-1',
        photoFile: validFile,
        notes: 'Cleared all packaging waste and sprayed disinfectant.',
        isDemo: false,
      });

      expect(mockStorageFrom).toHaveBeenCalledWith('resolution-evidence');
      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          report_id: 'rep-1',
          assignment_id: 'assn-1',
          worker_id: 'worker-1',
          notes: 'Cleared all packaging waste and sprayed disinfectant.',
        })
      );
      expect(mockRpc).toHaveBeenCalledWith('transition_report_status', {
        p_report_id: 'rep-1',
        p_new_status: 'resolution_submitted',
        p_note: 'Cleared all packaging waste and sprayed disinfectant.',
      });
      expect(result.previewUrl).toBeTruthy();
    });
  });
});
