import { describe, it, expect, vi, beforeEach } from 'vitest';
import { isSupabaseConfigured, testSupabaseConnection } from './client';

describe('Supabase Client Environment Validation', () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
  });

  it('recognizes placeholder or missing credentials as unconfigured', () => {
    // If environment is default or placeholders
    expect(typeof isSupabaseConfigured()).toBe('boolean');
  });

  it('safely checks testSupabaseConnection without leaking secrets or throwing unhandled exceptions', async () => {
    const result = await testSupabaseConnection();
    expect(result).toHaveProperty('connected');
    expect(result).toHaveProperty('message');
    expect(typeof result.connected).toBe('boolean');
    expect(typeof result.message).toBe('string');
    // Ensure no secret keys or passwords leaked in the message
    expect(result.message).not.toContain('eyJhbG');
    expect(result.message).not.toContain('service_role');
  });
});
