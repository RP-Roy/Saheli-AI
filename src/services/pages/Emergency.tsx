import { useState } from 'react';
import {
  AlertOctagon, Phone, MapPin, Clock, CheckCircle,
  XCircle, Shield, Navigation, Radio, ChevronRight, Wifi,
} from 'lucide-react';
import { useDemo } from '../context/DemoContext';
import { useApp } from '../context/AppContext';
import { Button } from '../components/ui/Button';
import { RiskBadge } from '../components/ui/Badge';
import { RouteSafetyScore } from '../components/ui/RouteSafetyScore';
import { ACTIVE_INCIDENT, TRUSTED_CONTACTS, type Contact } from '../data/mockData';
import { formatTime, cn } from '../utils/formatters';

const EMERGENCY_NUMBERS = [
  { id: 'police',     label: 'Police',       number: '100',  color: 'text-blue-400',   bg: 'bg-blue-500/15 border-blue-500/30'  },
  { id: 'women',      label: 'Women Helpline',number: '1091', color: 'text-pink-400',   bg: 'bg-pink-500/15 border-pink-500/30'  },
  { id: 'ambulance',  label: 'Ambulance',     number: '108',  color: 'text-safe-400',   bg: 'bg-safe-500/15 border-safe-500/30'  },
  { id: 'emergency',  label: 'Emergency',     number: '112',  color: 'text-danger-400', bg: 'bg-danger-500/15 border-danger-500/30' },
];

export default function Emergency() {
  const { trustedContacts } = useApp();
  const { journey, updateRiskLevel } = useDemo();
  const [sosActivated, setSosActivated] = useState(false);
  const [notifiedContactIds, setNotifiedContactIds] = useState<string[]>([]);
  const [safetyCheckResponded, setSafetyCheckResponded] = useState(false);
  const [isLoadingSafe, setIsLoadingSafe] = useState(false);

  const displayRisk     = journey.riskLevel;
  const displayScore    = journey.routeSafetyScore;
  const isHighRisk      = displayRisk === 'HIGH_RISK';
  const incident        = ACTIVE_INCIDENT;

  const activateSOS = () => {
    setSosActivated(true);
    updateRiskLevel('HIGH_RISK');
    // Simulate notifying contacts one by one
    TRUSTED_CONTACTS.forEach((c, i) => {
      setTimeout(() => {
        setNotifiedContactIds(prev => [...prev, c.id]);
      }, (i + 1) * 1200);
    });
  };

  const markSafe = async () => {
    setIsLoadingSafe(true);
    await new Promise(r => setTimeout(r, 1000));
    setIsLoadingSafe(false);
    setSafetyCheckResponded(true);
    updateRiskLevel('SAFE');
  };

  return (
    <div className="page-wrapper space-y-5 max-w-2xl">

      {/* ── Risk Header ── */}
      <div className={cn(
        'relative overflow-hidden rounded-3xl border p-6 transition-all duration-500',
        isHighRisk || sosActivated
          ? 'bg-danger-500/15 border-danger-500/40'
          : displayRisk === 'CAUTION'
          ? 'bg-caution-500/10 border-caution-500/30'
          : 'bg-safe-500/10 border-safe-500/30',
      )}>
        <div className={cn(
          'absolute -top-10 -right-10 w-40 h-40 rounded-full blur-3xl opacity-20 pointer-events-none',
          isHighRisk || sosActivated ? 'bg-danger-500' : displayRisk === 'CAUTION' ? 'bg-caution-500' : 'bg-safe-500',
        )} />

        <div className="relative flex items-center gap-5">
          <RouteSafetyScore score={displayScore} riskLevel={displayRisk} size="md" />
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <RiskBadge level={displayRisk} />
              {journey.isActive && (
                <span className="text-xs text-slate-400 flex items-center gap-1">
                  <Radio className="w-3 h-3 text-safe-400 animate-pulse" /> Live
                </span>
              )}
            </div>
            <p className="text-xl font-bold text-white">{displayScore}%</p>
            <p className="text-sm text-slate-400">Route Safety Score</p>
          </div>
        </div>

        {/* Location */}
        <div className="relative mt-4 flex items-center gap-2 text-sm text-slate-400">
          <MapPin className="w-4 h-4 text-primary-400 flex-shrink-0" />
          <span className="truncate">{incident.location}</span>
          <Navigation className="w-3.5 h-3.5 text-slate-500 ml-auto flex-shrink-0" />
        </div>
      </div>

      {/* ── Safety Check (if high risk and not SOS) ── */}
      {(isHighRisk || displayRisk === 'CAUTION') && !sosActivated && !safetyCheckResponded && (
        <div className="glass-card p-5 border-caution-500/30 bg-caution-500/5 animate-fade-in">
          <div className="flex items-start gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-caution-500/20 flex items-center justify-center flex-shrink-0">
              <Shield className="w-5 h-5 text-caution-400" />
            </div>
            <div>
              <h2 className="font-bold text-white">Safety Check-In</h2>
              <p className="text-sm text-slate-400 mt-0.5">We detected something unusual. Are you safe?</p>
              <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                <Clock className="w-3 h-3" /> Sent {Math.round((Date.now() - incident.safetyCheckSentAt.getTime()) / 60000)} min ago
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <Button
              variant="safe"
              fullWidth
              loading={isLoadingSafe}
              leftIcon={<CheckCircle className="w-4 h-4" />}
              onClick={markSafe}
              id="im-safe-btn"
            >
              I'm Safe
            </Button>
            <Button
              variant="danger"
              fullWidth
              leftIcon={<AlertOctagon className="w-4 h-4" />}
              onClick={activateSOS}
              id="need-help-btn"
            >
              Need Help
            </Button>
          </div>
        </div>
      )}

      {/* ── Safe confirmation ── */}
      {safetyCheckResponded && !sosActivated && (
        <div className="glass-card p-5 border-safe-500/30 bg-safe-500/5 flex items-center gap-3 animate-fade-in">
          <CheckCircle className="w-8 h-8 text-safe-400 flex-shrink-0" />
          <div>
            <p className="font-bold text-safe-300">You're marked as safe</p>
            <p className="text-sm text-slate-400">Your trusted circle has been notified.</p>
          </div>
        </div>
      )}

      {/* ── SOS Button ── */}
      {!sosActivated ? (
        <div className="glass-card p-6 text-center">
          <p className="text-sm text-slate-400 mb-5">In an immediate emergency, activate SOS to alert your trusted circle instantly.</p>
          <button
            id="sos-button"
            onClick={activateSOS}
            className={cn(
              'mx-auto flex items-center justify-center w-28 h-28 rounded-full border-4',
              'bg-danger-600 border-danger-400 text-white font-black text-lg tracking-widest',
              'hover:bg-danger-500 hover:scale-105 active:scale-95',
              'transition-all duration-200 shadow-glow-danger',
            )}
          >
            SOS
          </button>
          <p className="text-xs text-slate-600 mt-4">Hold for 2 seconds to activate</p>
        </div>
      ) : (
        <div className="glass-card p-6 text-center border-danger-500/40 bg-danger-500/10 animate-fade-in">
          <div className="mx-auto flex items-center justify-center w-20 h-20 rounded-full bg-danger-500/20 border-2 border-danger-500/60 mb-4 animate-pulse">
            <Radio className="w-9 h-9 text-danger-400 animate-pulse" />
          </div>
          <p className="font-bold text-danger-300 text-lg mb-1">SOS Activated</p>
          <p className="text-sm text-slate-400">Your location is being shared with your trusted circle</p>
          <button
            onClick={() => { setSosActivated(false); updateRiskLevel('SAFE'); setNotifiedContactIds([]); }}
            className="mt-4 text-xs text-slate-500 hover:text-slate-300 underline transition-colors"
          >
            Cancel SOS
          </button>
        </div>
      )}

      {/* ── Trusted Circle ── */}
      <div className="glass-card overflow-hidden">
        <div className="px-5 py-4 border-b border-white/10">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <Phone className="w-4 h-4 text-primary-400" /> Trusted Circle
          </h2>
        </div>
        <div className="divide-y divide-white/5">
          {TRUSTED_CONTACTS.map(contact => {
            const notified = notifiedContactIds.includes(contact.id);
            return (
              <ContactRow key={contact.id} contact={contact} notified={notified} />
            );
          })}
        </div>
      </div>

      {/* ── Incident Timeline ── */}
      <div className="glass-card overflow-hidden">
        <div className="px-5 py-4 border-b border-white/10">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <Clock className="w-4 h-4 text-primary-400" /> Incident Timeline
          </h2>
        </div>
        <div className="px-5 py-4 space-y-4">
          {incident.timeline.map((event, i) => (
            <div key={event.id} className="flex items-start gap-3">
              <div className="flex flex-col items-center">
                <div className={cn('w-3 h-3 rounded-full flex-shrink-0 mt-0.5',
                  event.type === 'success' ? 'bg-safe-500' :
                  event.type === 'warning' ? 'bg-caution-500' : 'bg-danger-500 animate-pulse'
                )} />
                {i < incident.timeline.length - 1 && <div className="w-px h-8 bg-surface-600 mt-1" />}
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-slate-200">{event.label}</p>
                <p className="text-xs text-slate-500 mt-0.5">{formatTime(event.time)}</p>
              </div>
            </div>
          ))}
          {sosActivated && (
            <div className="flex items-start gap-3 animate-fade-in">
              <div className="w-3 h-3 rounded-full bg-danger-500 animate-pulse flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-danger-300">SOS Activated</p>
                <p className="text-xs text-slate-500 mt-0.5">{formatTime(new Date())}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Emergency Numbers ── */}
      <div>
        <h2 className="section-title mb-3">Emergency Numbers</h2>
        <div className="grid grid-cols-2 gap-3">
          {EMERGENCY_NUMBERS.map(({ id, label, number, color, bg }) => (
            <a
              key={id}
              href={`tel:${number}`}
              id={`emergency-${id}`}
              className={cn(
                'flex items-center gap-3 p-4 rounded-2xl border transition-all hover:scale-[1.02] active:scale-[0.99]',
                bg,
              )}
            >
              <Phone className={cn('w-5 h-5 flex-shrink-0', color)} />
              <div>
                <p className={cn('text-base font-black', color)}>{number}</p>
                <p className="text-xs text-slate-400">{label}</p>
              </div>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Contact Row ──────────────────────────────────────────────────────────────

function ContactRow({ contact, notified }: { contact: Contact; notified: boolean }) {
  return (
    <div className="flex items-center gap-3 px-5 py-3.5">
      <div className={cn('w-10 h-10 rounded-full bg-gradient-to-br flex items-center justify-center text-xs font-bold text-white flex-shrink-0', contact.color)}>
        {contact.avatar}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-slate-200">{contact.name}</p>
        <p className="text-xs text-slate-500">{contact.relation}</p>
      </div>
      <div className="flex-shrink-0">
        {notified ? (
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-safe-500/15 border border-safe-500/30 rounded-lg">
            <Wifi className="w-3 h-3 text-safe-400" />
            <span className="text-[10px] font-semibold text-safe-300">Notified</span>
          </div>
        ) : (
          <a
            href={`tel:${contact.phone}`}
            className="w-8 h-8 rounded-xl bg-surface-700 border border-white/10 flex items-center justify-center text-slate-500 hover:text-white hover:border-primary-500/30 transition-all"
          >
            <Phone className="w-3.5 h-3.5" />
          </a>
        )}
      </div>
    </div>
  );
}
