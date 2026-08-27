import { useState } from 'react';
import {
  User, Phone, ChevronRight,
  Lock, Eye, EyeOff, Plus, Trash2, Info,
  Smartphone, Shield, Bell, Check, Sparkles
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { useApp } from '../context/AppContext';
import { TRUSTED_CONTACTS, type Contact } from '../data/mockData';
import { EmergencyCircle } from '../components/emergency/EmergencyCircle';
import { cn } from '../utils/formatters';

export default function Settings() {
  const { user } = useApp();
  const [showPhone, setShowPhone] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [liveLocationSharing, setLiveLocationSharing] = useState(true);

  return (
    <div className="page-wrapper space-y-6 max-w-3xl">
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-50 border border-primary-200/60 text-primary-700 text-xs font-bold mb-2 shadow-sm">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Account & Security</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Settings</h1>
        <p className="text-slate-500 text-xs sm:text-sm mt-0.5">Manage your profile, trusted circle, and safety privacy controls.</p>
      </div>

      {/* ── Profile Card ── */}
      <section className="glass-card overflow-hidden bg-white/95">
        <div className="flex flex-col sm:flex-row sm:items-center gap-5 p-6 border-b border-pink-100">
          <div className="relative">
            <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-primary-500 to-rose-400 flex items-center justify-center text-2xl font-black text-white shadow-soft-pink">
              {user.avatar}
            </div>
            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full border-2 border-white flex items-center justify-center text-white">
              <Check className="w-3 h-3 stroke-[3]" />
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-extrabold text-slate-900">{user.name}</h2>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                Protected
              </span>
            </div>
            <p className="text-slate-500 text-xs mt-0.5 font-medium">{user.email}</p>
            <button
              className="flex items-center gap-1.5 text-slate-400 text-xs mt-2 font-mono hover:text-primary-600 transition-colors"
              onClick={() => setShowPhone(!showPhone)}
            >
              {showPhone ? <EyeOff className="w-3.5 h-3.5 text-primary-500" /> : <Eye className="w-3.5 h-3.5 text-primary-500" />}
              <span>{showPhone ? user.phone : '+91 ••••• •••90'}</span>
            </button>
          </div>
          <Button variant="secondary" size="sm" leftIcon={<User className="w-3.5 h-3.5" />}>
            Edit Profile
          </Button>
        </div>

        <div className="divide-y divide-pink-50">
          <SettingsRow
            icon={<Shield className="w-4 h-4 text-primary-500" />}
            label="Privacy & Security Controls"
            description="Manage data encryption and location permissions"
            action="chevron"
          />
          <SettingsRow
            icon={<Lock className="w-4 h-4 text-primary-500" />}
            label="Change Security PIN / Password"
            description="Update app lock credentials"
            action="chevron"
          />
        </div>
      </section>

      {/* ── Privacy & Alerts Toggles ── */}
      <section className="glass-card overflow-hidden bg-white/95 p-6 space-y-4">
        <div className="flex items-center gap-2.5 pb-3 border-b border-pink-100">
          <div className="w-8 h-8 rounded-xl bg-primary-100 text-primary-600 flex items-center justify-center">
            <Bell className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-extrabold text-slate-900 tracking-tight">Notification & Sharing</h2>
            <p className="text-xs text-slate-500">Customize when Saheli sends alerts</p>
          </div>
        </div>

        <div className="space-y-4 pt-1">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-slate-900">Safety Check-In Prompts</p>
              <p className="text-xs text-slate-500 mt-0.5">Receive gentle prompts during unexpected stops</p>
            </div>
            <button
              onClick={() => setNotificationsEnabled(!notificationsEnabled)}
              className={cn(
                'w-12 h-6.5 rounded-full transition-colors relative flex items-center px-0.5',
                notificationsEnabled ? 'bg-primary-500' : 'bg-slate-200'
              )}
            >
              <div
                className={cn(
                  'w-5.5 h-5.5 rounded-full bg-white shadow-md transition-transform duration-200',
                  notificationsEnabled ? 'translate-x-5.5' : 'translate-x-0'
                )}
              />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-slate-900">Live GPS Sharing During SOS</p>
              <p className="text-xs text-slate-500 mt-0.5">Automatically include real-time map link in SOS alerts</p>
            </div>
            <button
              onClick={() => setLiveLocationSharing(!liveLocationSharing)}
              className={cn(
                'w-12 h-6.5 rounded-full transition-colors relative flex items-center px-0.5',
                liveLocationSharing ? 'bg-primary-500' : 'bg-slate-200'
              )}
            >
              <div
                className={cn(
                  'w-5.5 h-5.5 rounded-full bg-white shadow-md transition-transform duration-200',
                  liveLocationSharing ? 'translate-x-5.5' : 'translate-x-0'
                )}
              />
            </button>
          </div>
        </div>
      </section>

      {/* ── Trusted Circle Component ── */}
      <EmergencyCircle />

      {/* ── App Info ── */}
      <section className="glass-card overflow-hidden bg-white/95">
        <div className="divide-y divide-pink-50">
          <SettingsRow
            icon={<Info className="w-4 h-4 text-primary-500" />}
            label="About Saheli AI"
            description="Predictive Safety Twin for women's daily commute"
            action="chevron"
          />
          <SettingsRow
            icon={<Smartphone className="w-4 h-4 text-primary-500" />}
            label="App Version"
            value="v2.0.0 (Light Pink Edition)"
          />
        </div>
      </section>

      <p className="text-center text-slate-400 text-xs font-semibold pb-4">Saheli AI · Designed with elegance & care for every woman 🌸</p>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SettingsRow({
  icon,
  label,
  description,
  value,
  action
}: {
  icon: React.ReactNode;
  label: string;
  description?: string;
  value?: string;
  action?: 'chevron';
}) {
  return (
    <div className="flex items-center gap-3.5 px-6 py-4 hover:bg-blush-50/70 transition-colors cursor-pointer group">
      <div className="w-9 h-9 rounded-2xl bg-primary-50 border border-primary-100 flex items-center justify-center flex-shrink-0 shadow-sm">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-slate-900 group-hover:text-primary-700 transition-colors">{label}</p>
        {description && <p className="text-xs text-slate-500 mt-0.5">{description}</p>}
      </div>
      {value && <span className="text-xs font-bold text-slate-600 bg-blush-100 px-2.5 py-1 rounded-full border border-pink-200">{value}</span>}
      {action === 'chevron' && <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-primary-500 group-hover:translate-x-0.5 transition-all flex-shrink-0" />}
    </div>
  );
}
