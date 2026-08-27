import { useState } from 'react';
import {
  User, Phone, ChevronRight,
  Lock, Eye, EyeOff, Plus, Trash2, Info,
  Smartphone,
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { useApp } from '../context/AppContext';
import { TRUSTED_CONTACTS, type Contact } from '../data/mockData';
import { cn } from '../utils/formatters';

export default function Settings() {
  const { user } = useApp();
  const [showPhone, setShowPhone] = useState(false);

  return (
    <div className="page-wrapper space-y-5 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="text-slate-400 text-sm mt-1">Manage your account and safety preferences</p>
      </div>

      {/* ── Profile ── */}
      <section className="glass-card overflow-hidden">
        <div className="flex items-center gap-4 p-5 border-b border-white/10">
          <div className="relative">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-2xl font-bold text-white shadow-glow-primary">
              {user.avatar}
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-bold text-white">{user.name}</h2>
            <p className="text-slate-400 text-sm">{user.email}</p>
            <button
              className="flex items-center gap-1.5 text-slate-500 text-xs mt-1 hover:text-slate-300 transition-colors"
              onClick={() => setShowPhone(!showPhone)}
            >
              {showPhone ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              {showPhone ? user.phone : '•••• •••• ••'}
            </button>
          </div>
          <Button variant="ghost" size="sm" leftIcon={<User className="w-4 h-4" />}>Edit</Button>
        </div>
        <div className="divide-y divide-white/5">
          <SettingsRow icon={<User className="w-4 h-4 text-slate-500" />} label="Account Details" action="chevron" />
          <SettingsRow icon={<Lock className="w-4 h-4 text-slate-500" />} label="Change Password" action="chevron" />
        </div>
      </section>

      {/* ── Trusted Circle ── */}
      <section className="glass-card overflow-hidden">
        <div className="px-5 py-3.5 border-b border-white/10 flex items-center gap-2">
          <Phone className="w-4 h-4 text-primary-400" />
          <h2 className="text-sm font-bold text-white">Trusted Circle</h2>
          <Button variant="outline" size="sm" className="ml-auto" leftIcon={<Plus className="w-3.5 h-3.5" />}>Add</Button>
        </div>
        <div className="divide-y divide-white/5">
          {TRUSTED_CONTACTS.map(contact => (
            <TrustedContactRow key={contact.id} contact={contact} />
          ))}
        </div>
      </section>

      {/* ── App Info ── */}
      <section className="glass-card overflow-hidden">
        <div className="divide-y divide-white/5">
          <SettingsRow icon={<Info className="w-4 h-4 text-slate-500" />} label="About Saheli AI" action="chevron" />
          <SettingsRow icon={<Smartphone className="w-4 h-4 text-slate-500" />} label="App Version" value="v1.0.0-beta" />
        </div>
      </section>

      <p className="text-center text-slate-600 text-xs pb-4">Saheli AI v1.0.0-beta · Built with care, for every woman 💜</p>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SettingsRow({ icon, label, value, action }: {
  icon: React.ReactNode; label: string; value?: string; action?: 'chevron';
}) {
  return (
    <div className="flex items-center gap-3 px-5 py-3.5 hover:bg-white/5 transition-colors cursor-pointer">
      <div className="w-8 h-8 rounded-xl bg-surface-700/60 flex items-center justify-center flex-shrink-0">
        {icon}
      </div>
      <p className="text-sm text-slate-300 flex-1">{label}</p>
      {value && <p className="text-xs text-slate-500">{value}</p>}
      {action === 'chevron' && <ChevronRight className="w-4 h-4 text-slate-600 flex-shrink-0" />}
    </div>
  );
}

function TrustedContactRow({ contact }: { contact: Contact }) {
  return (
    <div className="flex items-center gap-3 px-5 py-3.5">
      <div className={cn('w-9 h-9 rounded-full bg-gradient-to-br flex items-center justify-center text-xs font-bold text-white flex-shrink-0', contact.color)}>
        {contact.avatar}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-slate-200">{contact.name}</p>
        <p className="text-xs text-slate-500">{contact.relation} · {contact.phone}</p>
      </div>
      <button className="w-7 h-7 rounded-lg bg-surface-600/60 hover:bg-danger-600/20 border border-white/10 hover:border-danger-500/30 flex items-center justify-center text-slate-500 hover:text-danger-400 transition-all">
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
