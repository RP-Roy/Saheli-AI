import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// A helper to quickly determine if we have real credentials to talk to a remote backend
export const isSupabaseConfigured = () => {
  return (
    supabaseUrl !== '' &&
    !supabaseUrl.includes('your-project.supabase.co') &&
    supabaseAnonKey !== '' &&
    !supabaseAnonKey.includes('your-anon-key')
  );
};

// We create the client anyway, but it won't be successfully used unless configured.
// It fails gracefully if the URLs are completely empty or malformed strings, so we 
// provide a dummy string if missing just to prevent the client constructor from throwing.
export const supabase = createClient(
  supabaseUrl || 'https://dummy.supabase.co',
  supabaseAnonKey || 'dummy-key'
);
