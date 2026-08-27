import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';

export const learningService = {
  async getProgress(userId: string) {
    if (!isSupabaseConfigured()) return { data: [], error: null };
    return supabase.from('self_defense_progress')
      .select('*')
      .eq('user_id', userId);
  },

  async updateProgress(userId: string, videoId: string, percent: number, completed: boolean) {
    if (!isSupabaseConfigured()) return { data: null, error: null };
    
    // Upsert equivalent
    return supabase.from('self_defense_progress').upsert({
      user_id: userId,
      video_id: videoId,
      progress_percent: percent,
      completed,
      updated_at: new Date().toISOString()
    }, { onConflict: 'user_id,video_id' });
  }
};
