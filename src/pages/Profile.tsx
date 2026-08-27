import React, { useState } from 'react';
import {
  User, Bell, Shield, Phone, ChevronRight,
  Lock, Eye, EyeOff, Plus, Trash2, FlaskConical, Info
} from 'lucide-react';
import { Card, CardBody, CardHeader } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { useApp } from '../context/AppContext';
import { useDemo } from '../context/DemoContext';
import { cn } from '../utils/formatters';

// ─── Profile / Settings Page ──────────────────────────────────────────────────

export default function Profile() {
  const { user, trustedContacts, notificationsEnabled, setNotificationsEnabled } = useApp();
  const { isDemoMode, toggleDemoMode } = useDemo();
  const [showPhone, setShowPhone] = useState(false);

  return (
    <div className="page-wrapper space-y-6">
      <div>
        <h1 className="section-title text-2xl">Profile & Settings</h1>
        <p className="section-subtitle">Manage your safety preferences</p>
      </div>

      {/* Profile card */}
      <Card>
        <CardBody>
          <div className="flex items-center gap-4">
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
              <div className="flex items-center gap-1.5 mt-1">
                <div
                  className="flex items-center gap-1.5 text-slate-500 text-xs cursor-pointer hover:text-slate-300"
                  onClick={() => setShowPhone(!showPhone)}
                >
                  {showPhone ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  {showPhone ? user.phone : '••••••••••'}
                </div>
              </div>
            </div>
            <Button variant="ghost" size="sm" leftIcon={<User className="w-4 h-4" />}>
              Edit
            </Button>
          </div>
        </CardBody>
      </Card>

      {/* Demo Mode */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <FlaskConical className="w-4 h-4 text-amber-400" />
            <h2 className="section-title text-base">Demo Mode</h2>
          </div>
          <p className="section-subtitle text-xs mt-0.5">Hackathon demonstration settings</p>
        </CardHeader>
        <CardBody className="space-y-4 !pt-0">
          <SettingRow
            id="toggle-demo-mode"
            label="Demo Mode"
            description="Use simulated data — no real location or backend required"
            toggle
            toggleValue={isDemoMode}
            onToggle={toggleDemoMode}
          />
          {isDemoMode && (
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
              <div className="flex items-start gap-2">
                <Info className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-amber-300/80">
                  All journeys, positions, and risk assessments are simulated. Supabase and Gemini connections are optional.
                </p>
              </div>
            </div>
          )}
        </CardBody>
      </Card>

      {/* Trusted contacts */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-primary-400" />
              <h2 className="section-title text-base">Trusted Circle</h2>
            </div>
            <Button variant="outline" size="sm" leftIcon={<Plus className="w-3.5 h-3.5" />}>
              Add
            </Button>
          </div>
        </CardHeader>
        <CardBody className="space-y-3 !pt-0">
          {trustedContacts.map(contact => (
            <div key={contact.id} className="flex items-center gap-3 p-3 rounded-xl bg-surface-700/40">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-sm font-bold text-white flex-shrink-0">
                {contact.avatar}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-200">{contact.name}</p>
                <p className="text-xs text-slate-500">{contact.relation} · {contact.phone}</p>
              </div>
              <button className="w-7 h-7 rounded-lg bg-surface-600 hover:bg-danger-600/30 border border-white/10 hover:border-danger-500/30 flex items-center justify-center text-slate-500 hover:text-danger-400 transition-all duration-200">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </CardBody>
      </Card>

      {/* Notifications */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-primary-400" />
            <h2 className="section-title text-base">Notifications</h2>
          </div>
        </CardHeader>
        <CardBody className="space-y-4 !pt-0">
          <SettingRow
            id="toggle-notifications"
            label="Push Notifications"
            description="Receive safety alerts and check-in reminders"
            toggle
            toggleValue={notificationsEnabled}
            onToggle={() => setNotificationsEnabled(!notificationsEnabled)}
          />
          <SettingRow
            id="toggle-safety-checks"
            label="Safety Check-ins"
            description="Discreet prompts during unusual journey behavior"
            toggle
            toggleValue
            onToggle={() => {}}
          />
          <SettingRow
            id="toggle-sms-alerts"
            label="SMS Alerts to Contacts"
            description="Notify trusted circle via SMS during incidents"
            toggle
            toggleValue
            onToggle={() => {}}
          />
        </CardBody>
      </Card>

      {/* Safety settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-primary-400" />
            <h2 className="section-title text-base">Safety Settings</h2>
          </div>
        </CardHeader>
        <CardBody className="space-y-1 !pt-0">
          {[
            { id: 'check-in-timeout',  label: 'Check-in Timeout',    value: '60 seconds' },
            { id: 'deviation-threshold', label: 'Deviation Threshold', value: '200 meters' },
            { id: 'stop-threshold',    label: 'Stop Alert Threshold', value: '2 minutes'  },
          ].map(({ id, label, value }) => (
            <div key={id} className="flex items-center justify-between py-3 border-b border-white/5 last:border-0">
              <p className="text-sm font-medium text-slate-300">{label}</p>
              <div className="flex items-center gap-2">
                <Badge variant="primary">{value}</Badge>
                <ChevronRight className="w-4 h-4 text-slate-600" />
              </div>
            </div>
          ))}
        </CardBody>
      </Card>

      {/* Privacy */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-primary-400" />
            <h2 className="section-title text-base">Privacy</h2>
          </div>
        </CardHeader>
        <CardBody className="space-y-1 !pt-0">
          {[
            { label: 'Data Storage',       value: 'Supabase (encrypted)' },
            { label: 'Location Access',    value: 'Only during journey'  },
            { label: 'AI Conversations',   value: 'Not stored'           },
          ].map(({ label, value }) => (
            <div key={label} className="flex items-center justify-between py-3 border-b border-white/5 last:border-0">
              <p className="text-sm text-slate-400">{label}</p>
              <p className="text-sm font-medium text-slate-200">{value}</p>
            </div>
          ))}
        </CardBody>
      </Card>

      <div className="text-center text-slate-600 text-xs pb-4">
        Saheli AI v1.0.0-beta · Built for safety, with care
      </div>
    </div>
  );
}

// ─── Setting Row ──────────────────────────────────────────────────────────────

function SettingRow({
  id, label, description, toggle, toggleValue, onToggle
}: {
  id: string;
  label: string;
  description?: string;
  toggle?: boolean;
  toggleValue?: boolean;
  onToggle?: () => void;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-200">{label}</p>
        {description && <p className="text-xs text-slate-500 mt-0.5">{description}</p>}
      </div>
      {toggle && (
        <button
          id={id}
          onClick={onToggle}
          className={cn(
            'relative flex-shrink-0 w-11 h-6 rounded-full transition-colors duration-200',
            toggleValue ? 'bg-primary-600' : 'bg-surface-600',
          )}
          role="switch"
          aria-checked={toggleValue}
        >
          <span className={cn(
            'absolute top-1 left-0 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200',
            toggleValue ? 'translate-x-6' : 'translate-x-1',
          )} />
        </button>
      )}
    </div>
  );
}
