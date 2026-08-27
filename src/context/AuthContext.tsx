import React, { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { authService } from '../services/authService';
import { isSupabaseConfigured } from '../lib/supabaseClient';

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isDemoUser: boolean;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user] = useState<User | null>({
    id: 'saheli-active-user',
    email: 'user@saheliai.in',
    user_metadata: { name: 'Saheli User' }
  } as any);
  const [session] = useState<Session | null>(null);
  const loading = false;
  const isDemoUser = true;

  return (
    <AuthContext.Provider value={{ user, session, loading, isDemoUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
