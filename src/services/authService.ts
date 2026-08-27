import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';

export const authService = {
  async signUp(email: string, password: string, name: string) {
    if (!isSupabaseConfigured()) {
      return { data: { user: { id: 'demo-user', email, user_metadata: { name } } }, error: null };
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name } }
    });
    
    // Auto-create profile record since triggers might not be set up in hackathon
    if (data.user && !error) {
      await supabase.from('profiles').insert({
        id: data.user.id,
        email: data.user.email,
        name: name,
      });
    }
    
    return { data, error };
  },

  async signIn(email: string, password: string) {
    if (!isSupabaseConfigured()) {
      return { data: { user: { id: 'demo-user', email, user_metadata: { name: 'Demo User' } } }, error: null };
    }
    return supabase.auth.signInWithPassword({ email, password });
  },

  async signOut() {
    if (!isSupabaseConfigured()) return { error: null };
    return supabase.auth.signOut();
  },

  async getSession() {
    if (!isSupabaseConfigured()) {
      return { data: { session: null }, error: null };
    }
    return supabase.auth.getSession();
  },

  onAuthStateChange(callback: (event: string, session: any) => void) {
    if (!isSupabaseConfigured()) {
      return { data: { subscription: { unsubscribe: () => {} } } };
    }
    return supabase.auth.onAuthStateChange(callback);
  }
};
