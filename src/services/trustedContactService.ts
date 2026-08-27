import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import { TRUSTED_CONTACTS } from '../data/mockData';

export interface TrustedContactData {
  user_id: string;
  name: string;
  relationship: string;
  phone: string;
  enabled?: boolean;
}

export const trustedContactService = {
  async getContacts(userId: string) {
    if (!isSupabaseConfigured()) return { data: TRUSTED_CONTACTS, error: null };
    return supabase.from('trusted_contacts')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });
  },

  async addContact(data: TrustedContactData) {
    if (!isSupabaseConfigured()) return { data: { ...data, id: 'demo-contact' }, error: null };
    return supabase.from('trusted_contacts').insert(data).select().single();
  },

  async removeContact(id: string) {
    if (!isSupabaseConfigured()) return { data: null, error: null };
    return supabase.from('trusted_contacts').delete().eq('id', id);
  }
};
