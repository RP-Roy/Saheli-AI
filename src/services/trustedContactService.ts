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
    id: 'contact-demo-1',
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
    id: 'contact-demo-2',
    user_id: 'demo-user',
    name: 'Ankit Verma',
    relationship: 'Brother',
    phone: '+91 98123 45678',
    enabled: true,
    consent_given: true,
    consent_timestamp: new Date().toISOString(),
    created_at: new Date().toISOString(),
  },
  {
    id: 'contact-demo-3',
    user_id: 'demo-user',
    name: 'Sneha Patel',
    relationship: 'Best Friend',
    phone: '+91 97654 32109',
    enabled: true,
    consent_given: true,
    consent_timestamp: new Date().toISOString(),
    created_at: new Date().toISOString(),
  },
];

function getLocalContacts(): TrustedContactData[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(DEFAULT_DEMO_CONTACTS));
      return [...DEFAULT_DEMO_CONTACTS];
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [...DEFAULT_DEMO_CONTACTS];
  } catch {
    return [...DEFAULT_DEMO_CONTACTS];
  }
}

function saveLocalContacts(contacts: TrustedContactData[]) {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(contacts));
  } catch (err) {
    console.warn('Failed to persist contacts in localStorage:', err);
  }
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
        console.warn('Supabase trusted_contacts query error, falling back to local store:', error.message);
        return { data: getLocalContacts(), error: null };
      }

      // If remote table is empty, seed or return local contacts
      if (!data || data.length === 0) {
        return { data: getLocalContacts(), error: null };
      }

      return { data: data as TrustedContactData[], error: null };
    } catch (err: any) {
      console.warn('Error fetching trusted contacts, falling back to local store:', err);
      return { data: getLocalContacts(), error: null };
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
      const { count, error: countError } = await supabase
        .from('trusted_contacts')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', data.user_id);

      if (!countError && (count || 0) >= 5) {
        return { data: null, error: new Error('Maximum limit of 5 emergency contacts reached.') };
      }

      const { data: inserted, error } = await supabase
        .from('trusted_contacts')
        .insert(payload)
        .select()
        .single();

      if (error) {
        // Fallback to local storage if remote table is missing or fails
        console.warn('Supabase insert failed, saving to local store:', error.message);
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

      return { data: inserted as TrustedContactData, error: null };
    } catch (err: any) {
      console.warn('Supabase addContact exception, saving to local store:', err);
      const contacts = getLocalContacts();
      const newContact: TrustedContactData = {
        ...payload,
        id: `contact-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      };
      contacts.push(newContact);
      saveLocalContacts(contacts);
      return { data: newContact, error: null };
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

      if (error) {
        console.warn('Supabase update failed, updating local store:', error.message);
        const contacts = getLocalContacts();
        const idx = contacts.findIndex(c => c.id === id);
        if (idx !== -1) {
          contacts[idx] = { ...contacts[idx], ...updatedPayload };
          saveLocalContacts(contacts);
          return { data: contacts[idx], error: null };
        }
        return { data: null, error: null };
      }

      return { data: data as TrustedContactData, error: null };
    } catch (err: any) {
      console.warn('Supabase updateContact exception, updating local store:', err);
      const contacts = getLocalContacts();
      const idx = contacts.findIndex(c => c.id === id);
      if (idx !== -1) {
        contacts[idx] = { ...contacts[idx], ...updatedPayload };
        saveLocalContacts(contacts);
        return { data: contacts[idx], error: null };
      }
      return { data: null, error: null };
    }
  },

  async toggleContactEnabled(id: string, enabled: boolean): Promise<{ data: TrustedContactData | null; error: any }> {
    return this.updateContact(id, { enabled });
  },

  async removeContact(id: string): Promise<{ data: null; error: any }> {
    // Always clean up local store
    const contacts = getLocalContacts().filter(c => c.id !== id);
    saveLocalContacts(contacts);

    if (!isSupabaseConfigured()) {
      return { data: null, error: null };
    }

    try {
      const { error } = await supabase
        .from('trusted_contacts')
        .delete()
        .eq('id', id);

      if (error) {
        console.warn('Supabase delete failed, cleaned local store:', error.message);
      }

      return { data: null, error: null };
    } catch (err: any) {
      console.warn('Supabase removeContact exception:', err);
      return { data: null, error: null };
    }
  }
};
