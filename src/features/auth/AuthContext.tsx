import React, { useEffect, useState, useMemo, useCallback } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { getSupabase, isSupabaseConfigured } from '@/lib/supabase/client';
import type { AppRole, Database } from '@/types/database.types';
import { AuthContext } from './authContextDef';

type ProfileRow = Database['public']['Tables']['profiles']['Row'];

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const configured = isSupabaseConfigured();

  // Fetch protected roles and profile for the authenticated user
  const fetchUserData = useCallback(async (currentUser: User) => {
    const supabase = getSupabase();
    if (!supabase) return;

    try {
      // 1. Fetch user roles from protected user_roles table
      const { data: roleRecords } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', currentUser.id);

      if (roleRecords && roleRecords.length > 0) {
        setRoles(roleRecords.map((r) => r.role));
      } else {
        setRoles(['citizen']); // Default fallback
      }

      // 2. Fetch public profile
      const { data: profileRecord } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', currentUser.id)
        .maybeSingle();

      if (profileRecord) {
        setProfile(profileRecord);
      }
    } catch (err) {
      console.warn('Failed to fetch user roles/profile:', err);
      setRoles(['citizen']);
    }
  }, []);

  useEffect(() => {
    if (!configured) {
      setIsLoading(false);
      return;
    }

    const supabase = getSupabase();
    if (!supabase) {
      setIsLoading(false);
      return;
    }

    // Initial session retrieval
    supabase.auth.getSession().then(({ data: { session: initialSession }, error }) => {
      if (error) {
        console.warn('Error fetching initial session:', error);
      }
      setSession(initialSession);
      setUser(initialSession?.user ?? null);
      if (initialSession?.user) {
        fetchUserData(initialSession.user).finally(() => setIsLoading(false));
      } else {
        setIsLoading(false);
      }
    });

    // Real-time auth state subscription
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      setSession(newSession);
      setUser(newSession?.user ?? null);
      if (newSession?.user) {
        await fetchUserData(newSession.user);
      } else {
        setRoles([]);
        setProfile(null);
      }
      setIsLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [configured, fetchUserData]);

  const signIn = useCallback(async (email: string, password: string) => {
    const supabase = getSupabase();
    if (!supabase) {
      return { error: new Error('Supabase is not configured.') };
    }

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    return { error: error ? new Error(error.message) : null };
  }, []);

  const signUp = useCallback(
    async (
      email: string,
      password: string,
      fullName: string,
      wardNumber?: number | null,
      phone?: string | null
    ) => {
      const supabase = getSupabase();
      if (!supabase) {
        return { error: new Error('Supabase is not configured.'), user: null };
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            ward_number: wardNumber || null,
            phone_number: phone || null,
          },
        },
      });

      return {
        error: error ? new Error(error.message) : null,
        user: data.user,
      };
    },
    []
  );

  const signOut = useCallback(async () => {
    const supabase = getSupabase();
    if (supabase) {
      await supabase.auth.signOut();
    }
    setSession(null);
    setUser(null);
    setRoles([]);
    setProfile(null);
  }, []);

  const refreshProfile = useCallback(async () => {
    if (user) {
      await fetchUserData(user);
    }
  }, [user, fetchUserData]);

  const value = useMemo(
    () => ({
      user,
      session,
      roles,
      profile,
      isLoading,
      isConfigured: configured,
      signIn,
      signUp,
      signOut,
      refreshProfile,
    }),
    [user, session, roles, profile, isLoading, configured, signIn, signUp, signOut, refreshProfile]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
