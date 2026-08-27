import { useState } from 'react';
import {
  User, Phone, ChevronRight,
  Lock, Eye, EyeOff, Plus, Trash2, FlaskConical, Info,
  LogOut, Smartphone,
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { useApp } from '../context/AppContext';
import { useDemo } from '../context/DemoContext';
import { TRUSTED_CONTACTS, type Contact } from '../data/mockData';
import { cn } from '../utils/formatters';

export default function Settings() {
  const { user } = useApp();
  const { isDemoMode, toggleDemoMode } = useDemo();
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
            {isDemoMode && (
              <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-amber-500 rounded-full border-2 border-surface-900 flex items-center justify-center">
                <FlaskConical className="w-2.5 h-2.5 text-white" />
              </div>
            )}
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

      {/* ── Demo Mode ── */}
      <section className="glass-card overflow-hidden">
        <div className="px-5 py-3.5 border-b border-white/10 flex items-center gap-2">
          <FlaskConical className="w-4 h-4 text-amber-400" />
          <h2 className="text-sm font-bold text-white">Demo Mode</h2>
          {isDemoMode && <Badge variant="caution" className="ml-auto">Active</Badge>}
        </div>
        <div className="p-5 space-y-4">
          <ToggleRow
            id="toggle-demo-mode"
            label="Demo Mode"
            description="Use simulated data — no real location or backend needed"
            value={isDemoMode}
            onToggle={toggleDemoMode}
          />
          {isDemoMode && (
            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-2">
              <Info className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-amber-300/80 leading-relaxed">
                All journey data, positions, and risk events are simulated. Supabase and Gemini are optional.
              </p>
            </div>
          )}
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

      <button className="w-full flex items-center gap-3 px-5 py-4 rounded-2xl border border-danger-500/20 bg-danger-500/5 hover:bg-danger-500/10 hover:border-danger-500/30 text-danger-400 hover:text-danger-300 transition-all">
        <LogOut className="w-4 h-4" />
        <span className="text-sm font-semibold">Sign Out</span>
      </button>

      <p className="text-center text-slate-600 text-xs pb-4">Saheli AI v1.0.0-beta · Built with care, for every woman 💜</p>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function ToggleRow({ id, label, description, value, onToggle }: {
  id: string; label: string; description?: string; value: boolean; onToggle: () => void;
}) {
  return (
    <div className="flex items-center gap-3 py-3.5">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-200">{label}</p>
        {description && <p className="text-xs text-slate-500 mt-0.5">{description}</p>}
      </div>
      <button
        id={id}
        onClick={onToggle}
        role="switch"
        aria-checked={value}
        className={cn(
          'relative flex-shrink-0 w-11 h-6 rounded-full transition-colors duration-200',
          value ? 'bg-primary-600' : 'bg-surface-600',
        )}
      >
        <span className={cn(
          'absolute top-1 left-0 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200',
          value ? 'translate-x-6' : 'translate-x-1',
        )} />
      </button>
    </div>
  );
}

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
