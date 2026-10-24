import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database.types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

/**
 * Validates whether real Supabase environment credentials have been supplied.
 * Checks that values exist and are not default placeholder text.
 */
export function isSupabaseConfigured(): boolean {
  if (!supabaseUrl || !supabaseAnonKey) {
    return false;
  }
  const isPlaceholderUrl =
    supabaseUrl.includes('your-project.supabase.co') ||
    supabaseUrl.trim() === '';
  const isPlaceholderKey =
    supabaseAnonKey.includes('your-supabase-anon-key') ||
    supabaseAnonKey.trim() === '';

  return !isPlaceholderUrl && !isPlaceholderKey;
}

let supabaseInstance: SupabaseClient<Database> | null = null;

/**
 * Returns the active Supabase client or null if not yet configured with valid credentials.
 * Ensures the app will never crash on initial render when credentials are not yet supplied.
 */
export function getSupabase(): SupabaseClient<Database> | null {
  if (!isSupabaseConfigured()) {
    return null;
  }
  if (!supabaseInstance && supabaseUrl && supabaseAnonKey) {
    supabaseInstance = createClient<Database>(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    });
  }
  return supabaseInstance;
}

/**
 * Check backend connection status without throwing unhandled exceptions.
 */
export async function testSupabaseConnection(): Promise<{
  connected: boolean;
  message: string;
}> {
  if (!isSupabaseConfigured()) {
    return {
      connected: false,
      message:
        'Supabase is not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env.',
    };
  }

  const client = getSupabase();
  if (!client) {
    return {
      connected: false,
      message: 'Failed to initialize Supabase client instance.',
    };
  }

  try {
    const { error } = await client
      .from('reports')
      .select('count', { count: 'exact', head: true });

    if (error) {
      return {
        connected: false,
        message: `Database responded with error: ${error.message}`,
      };
    }
    return {
      connected: true,
      message: 'Successfully connected to S.W.A.C.H. Navsari Supabase backend.',
    };
  } catch (err) {
    return {
      connected: false,
      message: `Connection failed: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}
