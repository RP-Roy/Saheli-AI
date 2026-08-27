import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';

export interface TrustedContactData {
  id?: string;
  user_id: string;
  name: string;
  relationship: string;
  phone: string;
  enabled: boolean;
  consent_given: boolean;
  consent_timestamp?: string;
  created_at?: string;
  updated_at?: string;
}

const LOCAL_STORAGE_KEY = 'saheli_trusted_contacts';

const DEFAULT_DEMO_CONTACTS: TrustedContactData[] = [
  {
    id: 'c1',
    user_id: 'demo-user',
    name: 'Priya Sharma',
    relationship: 'Mother',
    phone: '+91 98765 43210',
    enabled: true,
    consent_given: true,
    consent_timestamp: new Date().toISOString(),
    created_at: new Date().toISOString(),
  },
  {
    id: 'c2',
    user_id: 'demo-user',
    name: 'Arjun Mehta',
    relationship: 'Brother',
    phone: '+91 98765 43211',
    enabled: true,
    consent_given: true,
    consent_timestamp: new Date().toISOString(),
    created_at: new Date().toISOString(),
  },
  {
    id: 'c3',
    user_id: 'demo-user',
    name: 'Sneha Reddy',
    relationship: 'Best Friend',
    phone: '+91 87654 32109',
    enabled: true,
    consent_given: true,
    consent_timestamp: new Date().toISOString(),
    created_at: new Date().toISOString(),
  },
];

let memoryContacts: TrustedContactData[] = [...DEFAULT_DEMO_CONTACTS];

function getLocalContacts(): TrustedContactData[] {
  if (typeof localStorage !== 'undefined') {
    try {
      const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (!raw) return DEFAULT_DEMO_CONTACTS;
      return JSON.parse(raw);
    } catch {
      return DEFAULT_DEMO_CONTACTS;
    }
  }
  return memoryContacts;
}

function saveLocalContacts(contacts: TrustedContactData[]) {
  if (typeof localStorage !== 'undefined') {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(contacts));
    } catch {
      // Ignore storage quota errors in sandbox
    }
  }
  memoryContacts = [...contacts];
}

export function maskPhoneNumber(phone: string): string {
  if (!phone) return '';
  const clean = phone.trim();
  const digits = clean.replace(/[^\d]/g, '');
  if (digits.length <= 4) return '••••';
  const prefix = clean.startsWith('+') ? clean.slice(0, 3) : clean.slice(0, 2);
  const suffix = clean.slice(-3);
  return `${prefix} ••••• ••${suffix}`;
}

export const trustedContactService = {
  // Reset memory / demo store for tests
  resetStore(contacts: TrustedContactData[] = DEFAULT_DEMO_CONTACTS) {
    saveLocalContacts([...contacts]);
  },

  async getContacts(userId: string): Promise<{ data: TrustedContactData[]; error: any }> {
    if (!isSupabaseConfigured() || userId === 'demo-user') {
      const local = getLocalContacts();
      return { data: local, error: null };
    }

    try {
      const { data, error } = await supabase
        .from('trusted_contacts')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: true });

      if (error) {
        // Fallback to local contacts if table doesn't exist yet or connection fails
        return { data: getLocalContacts(), error };
      }

      return { data: data as TrustedContactData[], error: null };
    } catch (err: any) {
      return { data: getLocalContacts(), error: err };
    }
  },

  async addContact(data: Omit<TrustedContactData, 'id'>): Promise<{ data: TrustedContactData | null; error: any }> {
    if (!data.consent_given) {
      return { data: null, error: new Error('User consent is mandatory to store emergency contacts.') };
    }

    const payload = {
      ...data,
      enabled: data.enabled ?? true,
      consent_given: true,
      consent_timestamp: data.consent_timestamp || new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (!isSupabaseConfigured() || data.user_id === 'demo-user') {
      const contacts = getLocalContacts();
      if (contacts.length >= 5) {
        return { data: null, error: new Error('Maximum limit of 5 emergency contacts reached.') };
      }
      const newContact: TrustedContactData = {
        ...payload,
        id: `contact-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      };
      contacts.push(newContact);
      saveLocalContacts(contacts);
      return { data: newContact, error: null };
    }

    try {
      // Check existing count in Supabase
      const { count } = await supabase
        .from('trusted_contacts')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', data.user_id);

      if ((count || 0) >= 5) {
        return { data: null, error: new Error('Maximum limit of 5 emergency contacts reached.') };
      }

      const { data: inserted, error } = await supabase
        .from('trusted_contacts')
        .insert(payload)
        .select()
        .single();

      return { data: inserted as TrustedContactData, error };
    } catch (err: any) {
      return { data: null, error: err };
    }
  },

  async updateContact(id: string, updates: Partial<TrustedContactData>): Promise<{ data: TrustedContactData | null; error: any }> {
    const updatedPayload = {
      ...updates,
      updated_at: new Date().toISOString(),
    };

    if (!isSupabaseConfigured() || updates.user_id === 'demo-user') {
      const contacts = getLocalContacts();
      const idx = contacts.findIndex(c => c.id === id);
      if (idx !== -1) {
        contacts[idx] = { ...contacts[idx], ...updatedPayload };
        saveLocalContacts(contacts);
        return { data: contacts[idx], error: null };
      }
      return { data: null, error: new Error('Contact not found') };
    }

    try {
      const { data, error } = await supabase
        .from('trusted_contacts')
        .update(updatedPayload)
        .eq('id', id)
        .select()
        .single();

      return { data: data as TrustedContactData, error };
    } catch (err: any) {
      return { data: null, error: err };
    }
  },

  async toggleContactEnabled(id: string, enabled: boolean): Promise<{ data: TrustedContactData | null; error: any }> {
    return this.updateContact(id, { enabled });
  },

  async removeContact(id: string): Promise<{ data: null; error: any }> {
    if (!isSupabaseConfigured()) {
      const contacts = getLocalContacts().filter(c => c.id !== id);
      saveLocalContacts(contacts);
      return { data: null, error: null };
    }

    try {
      const { error } = await supabase
        .from('trusted_contacts')
        .delete()
        .eq('id', id);

      // Also clean up local store if any
      const contacts = getLocalContacts().filter(c => c.id !== id);
      saveLocalContacts(contacts);

      return { data: null, error };
    } catch (err: any) {
      return { data: null, error: err };
    }
  }
};
