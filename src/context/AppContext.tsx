import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { DEMO_TRUSTED_CONTACTS, type TrustedContact } from '../config/demoConfig';
import { useAuth } from './AuthContext';

// ─── App Context Types ─────────────────────────────────────────────────────────

interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  phone: string;
}

interface AppContextValue {
  user: User;
  isAuthenticated: boolean;
  trustedContacts: TrustedContact[];
  addTrustedContact: (contact: TrustedContact) => void;
  removeTrustedContact: (id: string) => void;
  notificationsEnabled: boolean;
  setNotificationsEnabled: (val: boolean) => void;
}

const AppContext = createContext<AppContextValue | undefined>(undefined);

// ─── App Provider ──────────────────────────────────────────────────────────────

export function AppProvider({ children }: { children: ReactNode }) {
  const { user: authUser, isDemoUser } = useAuth();
  
  const [user, setUser] = useState<User>({
    id: '',
    name: '',
    email: '',
    avatar: 'S',
    phone: ''
  });

  useEffect(() => {
    if (authUser) {
      setUser({
        id: authUser.id,
        name: authUser.user_metadata?.name || 'Saheli User',
        email: authUser.email || '',
        avatar: (authUser.user_metadata?.name || 'S').charAt(0).toUpperCase(),
        phone: authUser.phone || '',
      });
    }
  }, [authUser]);
  const [trustedContacts, setTrustedContacts] = useState<TrustedContact[]>(DEMO_TRUSTED_CONTACTS);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);

  const addTrustedContact = (contact: TrustedContact) => {
    setTrustedContacts(prev => [...prev, contact]);
  };

  const removeTrustedContact = (id: string) => {
    setTrustedContacts(prev => prev.filter(c => c.id !== id));
  };

  return (
    <AppContext.Provider value={{
      user,
      isAuthenticated: !!authUser,
      trustedContacts,
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
