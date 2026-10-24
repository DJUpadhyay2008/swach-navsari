import { createContext } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import type { AppRole, Database } from '@/types/database.types';

type ProfileRow = Database['public']['Tables']['profiles']['Row'];

export interface AuthContextType {
  user: User | null;
  session: Session | null;
  roles: AppRole[];
  profile: ProfileRow | null;
  isLoading: boolean;
  isConfigured: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (
    email: string,
    password: string,
    fullName: string,
    wardNumber?: number | null,
    phone?: string | null
  ) => Promise<{ error: Error | null; user: User | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);
