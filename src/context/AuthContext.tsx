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
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  // If Supabase is NOT configured, or the user explicitly forces demo mode
  const isDemoUser = !isSupabaseConfigured() || localStorage.getItem('forceDemoMode') === 'true';

  useEffect(() => {
    async function initializeAuth() {
      if (isDemoUser) {
        // Mock user for demo mode
        setUser({ id: 'demo-user', email: 'demo@saheliai.in', user_metadata: { name: 'Demo User' } } as any);
        setLoading(false);
        return;
      }

      const { data: { session } } = await authService.getSession();
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);

      const { data: { subscription } } = authService.onAuthStateChange((_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
      });

      return () => {
        subscription.unsubscribe();
      };
    }

    initializeAuth();
  }, [isDemoUser]);

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
