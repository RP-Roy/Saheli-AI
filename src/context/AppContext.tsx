import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { trustedContactService, type TrustedContactData } from '../services/trustedContactService';
import type { TrustedContact } from '../config/demoConfig';

// ─── App Context Types ─────────────────────────────────────────────────────────

export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  phone: string;
}

interface AppContextValue {
  user: User;
  isAuthenticated: boolean;
  // Modern trusted contact management
  contacts: TrustedContactData[];
  loadingContacts: boolean;
  loadContacts: () => Promise<void>;
  addContact: (contact: Omit<TrustedContactData, 'id'>) => Promise<{ success: boolean; error?: string }>;
  updateContact: (id: string, updates: Partial<TrustedContactData>) => Promise<{ success: boolean; error?: string }>;
  toggleContact: (id: string, enabled: boolean) => Promise<{ success: boolean; error?: string }>;
  removeContact: (id: string) => Promise<{ success: boolean; error?: string }>;
  // Legacy / convenience accessors
  trustedContacts: TrustedContact[];
  addTrustedContact: (contact: TrustedContact) => void;
  removeTrustedContact: (id: string) => void;
  notificationsEnabled: boolean;
  setNotificationsEnabled: (val: boolean) => void;
}

const AppContext = createContext<AppContextValue | undefined>(undefined);

// ─── App Provider ──────────────────────────────────────────────────────────────

export function AppProvider({ children }: { children: ReactNode }) {
  const { user: authUser } = useAuth();
  
  const [user, setUser] = useState<User>({
    id: 'demo-user',
    name: 'Saheli User',
    email: 'user@saheliai.in',
    avatar: 'S',
    phone: '+91 98765 43210',
  });

  const [contacts, setContacts] = useState<TrustedContactData[]>([]);
  const [loadingContacts, setLoadingContacts] = useState<boolean>(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);

  useEffect(() => {
    if (authUser) {
      setUser({
        id: authUser.id,
        name: authUser.user_metadata?.name || 'Saheli User',
        email: authUser.email || '',
        avatar: (authUser.user_metadata?.name || 'S').charAt(0).toUpperCase(),
        phone: authUser.phone || '',
      });
    } else {
      setUser({
        id: 'demo-user',
        name: 'Saheli User',
        email: 'user@saheliai.in',
        avatar: 'S',
        phone: '+91 98765 43210',
      });
    }
  }, [authUser]);

  const loadContacts = useCallback(async () => {
    setLoadingContacts(true);
    try {
      const userId = authUser?.id || 'demo-user';
      const { data } = await trustedContactService.getContacts(userId);
      setContacts(data || []);
    } finally {
      setLoadingContacts(false);
    }
  }, [authUser?.id]);

  useEffect(() => {
    loadContacts();
  }, [loadContacts]);

  const addContact = async (contactData: Omit<TrustedContactData, 'id'>): Promise<{ success: boolean; error?: string }> => {
    const userId = authUser?.id || 'demo-user';
    const { data, error } = await trustedContactService.addContact({
      ...contactData,
      user_id: userId,
    });

    if (error || !data) {
      return { success: false, error: error?.message || 'Failed to add contact.' };
    }

    setContacts(prev => [...prev, data]);
    return { success: true };
  };

  const updateContact = async (id: string, updates: Partial<TrustedContactData>): Promise<{ success: boolean; error?: string }> => {
    const userId = authUser?.id || 'demo-user';
    const { data, error } = await trustedContactService.updateContact(id, {
      ...updates,
      user_id: userId,
    });

    if (error || !data) {
      return { success: false, error: error?.message || 'Failed to update contact.' };
    }

    setContacts(prev => prev.map(c => (c.id === id ? data : c)));
    return { success: true };
  };

  const toggleContact = async (id: string, enabled: boolean): Promise<{ success: boolean; error?: string }> => {
    const { data, error } = await trustedContactService.toggleContactEnabled(id, enabled);
    if (error || !data) {
      return { success: false, error: error?.message || 'Failed to toggle contact status.' };
    }

    setContacts(prev => prev.map(c => (c.id === id ? data : c)));
    return { success: true };
  };

  const removeContact = async (id: string): Promise<{ success: boolean; error?: string }> => {
    const { error } = await trustedContactService.removeContact(id);
    if (error) {
      return { success: false, error: error.message || 'Failed to remove contact.' };
    }

    setContacts(prev => prev.filter(c => c.id !== id));
    return { success: true };
  };

  // Convert to legacy TrustedContact format for backwards compatibility
  const legacyTrustedContacts: TrustedContact[] = contacts.map(c => ({
    id: c.id || '',
    name: c.name,
    relation: c.relationship,
    phone: c.phone,
    avatar: c.name.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase(),
    notified: false,
  }));

  const addTrustedContact = (contact: TrustedContact) => {
    addContact({
      user_id: authUser?.id || 'demo-user',
      name: contact.name,
      relationship: contact.relation,
      phone: contact.phone,
      enabled: true,
      consent_given: true,
      consent_timestamp: new Date().toISOString(),
    });
  };

  const removeTrustedContact = (id: string) => {
    removeContact(id);
  };

  return (
    <AppContext.Provider value={{
      user,
      isAuthenticated: !!authUser,
      contacts,
      loadingContacts,
      loadContacts,
      addContact,
      updateContact,
      toggleContact,
      removeContact,
      trustedContacts: legacyTrustedContacts,
      addTrustedContact,
      removeTrustedContact,
      notificationsEnabled,
      setNotificationsEnabled,
    }}>
      {children}
    </AppContext.Provider>
  );
}

// ─── Hook ──────────────────────────────────────────────────────────────────────

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside AppProvider');
  return ctx;
}
