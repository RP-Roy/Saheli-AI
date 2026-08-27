import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Navigation, BookOpen, MessageCircle,
  AlertOctagon, MapPin, Clock, ChevronRight, Zap,
  Users, Star,
} from 'lucide-react';
import { useDemo } from '../context/DemoContext';
import { useApp } from '../context/AppContext';
import { RouteSafetyScore } from '../components/ui/RouteSafetyScore';
import { RiskBadge } from '../components/ui/Badge';
import {
  TRUSTED_CONTACTS, SAFETY_TIPS,
  ACTIVE_JOURNEY,
} from '../data/mockData';
import { cn } from '../utils/formatters';
import type { RiskLevel } from '../config/appConfig';

export default function Dashboard() {
  const { journey } = useDemo();
  const { user } = useApp();
  const [tipIndex, setTipIndex] = useState(0);

  const hour = new Date().getHours();
  const greeting = hour < 5 ? 'Good night' : hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  useEffect(() => {
    const t = setInterval(() => setTipIndex(i => (i + 1) % SAFETY_TIPS.length), 8000);
    return () => clearInterval(t);
  }, []);

  const tip = SAFETY_TIPS[tipIndex];
  const displayJourney = journey.isActive ? journey : null;

  return (
    <div className="page-wrapper space-y-6 max-w-4xl">

      {/* ── Header ── */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-slate-400 text-sm font-medium">{greeting},</p>
          <h1 className="text-2xl font-bold text-white mt-0.5">{user.name.split(' ')[0]} 👋</h1>
          <p className="text-slate-400 text-sm mt-1 max-w-sm leading-relaxed">
            {displayJourney ? 'Journey monitoring is active.' : 'Saheli helps you choose a safer practical route and stay protected during the journey.'}
          </p>
        </div>
        <div className="flex items-center gap-2 bg-surface-700/60 border border-white/10 rounded-2xl px-3 py-2">
          <div className={cn('w-2 h-2 rounded-full', displayJourney ? 'bg-safe-500 animate-pulse' : 'bg-slate-600')} />
          <span className="text-xs font-semibold text-slate-300">
            {displayJourney ? 'Monitoring' : 'Standby'}
          </span>
        </div>
      </div>

      {/* ── Active Journey Banner (when active) ── */}
      {displayJourney && (
        <ActiveJourneyCard journey={displayJourney} />
      )}

      {/* ── Quick Actions ── */}
      <div>
        <h2 className="section-title mb-3">Quick Actions</h2>
        <div className="grid grid-cols-2 gap-3">
          <QuickAction
            to="/journey"
            icon={<Navigation className="w-6 h-6" />}
            label="Plan Safer Route"
            description="Find safe paths"
            gradient="from-primary-600/40 to-primary-900/40"
            border="border-primary-500/30"
            iconBg="bg-primary-500/20 text-primary-300"
          />
          <QuickAction
            to="/learn"
            icon={<BookOpen className="w-6 h-6" />}
            label="Learn Self-Defense"
            description="Video catalogue"
            gradient="from-caution-600/30 to-caution-900/30"
            border="border-caution-500/30"
            iconBg="bg-caution-500/20 text-caution-300"
          />
          <QuickAction
            to="/companion"
            icon={<MessageCircle className="w-6 h-6" />}
            label="Ask Saheli"
            description="AI companion"
            gradient="from-violet-600/30 to-violet-900/30"
            border="border-violet-500/30"
            iconBg="bg-violet-500/20 text-violet-300"
          />
          <QuickAction
            to="/emergency"
            icon={<AlertOctagon className="w-6 h-6" />}
            label="Emergency"
            description="SOS & contacts"
            gradient="from-danger-600/30 to-danger-900/30"
            border="border-danger-500/30"
            iconBg="bg-danger-500/20 text-danger-300"
          />
        </div>
      </div>

      {/* ── Trusted Circle + Safety Tip ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Trusted Circle */}
        <div className="glass-card p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-primary-400" />
              <h2 className="text-sm font-bold text-white">Trusted Circle</h2>
            </div>
            <Link to="/settings" className="text-xs text-primary-400 hover:text-primary-300 transition-colors">Manage</Link>
          </div>
          <div className="space-y-3">
            {TRUSTED_CONTACTS.map(contact => (
              <div key={contact.id} className="flex items-center gap-3">
                <div className={cn('w-9 h-9 rounded-full bg-gradient-to-br flex items-center justify-center text-xs font-bold text-white flex-shrink-0', contact.color)}>
                  {contact.avatar}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-200 truncate">{contact.name}</p>
                  <p className="text-xs text-slate-500">{contact.relation}</p>
                </div>
                <div className="flex-shrink-0">
                  <div className="w-2 h-2 rounded-full bg-safe-500" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Safety Tip */}
        <div className="glass-card p-5 flex flex-col">
          <div className="flex items-center gap-2 mb-3">
            <Star className="w-4 h-4 text-caution-400" />
            <h2 className="text-sm font-bold text-white">Daily Safety Tip</h2>
            <span className="ml-auto text-xs text-slate-500 bg-surface-700/60 px-2 py-0.5 rounded-full">{tip.category}</span>
          </div>
          <div className="flex-1">
            <div className="text-2xl mb-2">{tip.icon}</div>
            <p className="text-sm font-semibold text-slate-200 mb-1.5">{tip.title}</p>
            <p className="text-xs text-slate-400 leading-relaxed">{tip.body}</p>
          </div>
          <div className="flex gap-1 mt-4">
            {SAFETY_TIPS.map((_, i) => (
              <div
                key={i}
                className={cn('h-1 rounded-full flex-1 transition-all duration-500', i === tipIndex ? 'bg-primary-400' : 'bg-surface-600')}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Active Journey Card ──────────────────────────────────────────────────────

function ActiveJourneyCard({ journey }: { journey: typeof ACTIVE_JOURNEY | ReturnType<typeof useDemo>['journey'] }) {
  const riskLevel: RiskLevel = ('riskLevel' in journey ? journey.riskLevel : 'SAFE') as RiskLevel;
  const routeSafetyScore = 'routeSafetyScore' in journey ? journey.routeSafetyScore : 88;
  const destination = 'destination' in journey ? journey.destination : 'Unknown';
  const origin = 'origin' in journey ? journey.origin : 'Unknown';
  const routeType = 'routeType' in journey ? journey.routeType : 'SAFEST';

  return (
    <div className={cn(
      'relative overflow-hidden rounded-2xl border p-5 transition-all duration-500',
      riskLevel === 'SAFE'      ? 'bg-safe-500/10 border-safe-500/30'    :
      riskLevel === 'CAUTION'   ? 'bg-caution-500/10 border-caution-500/30' :
                                   'bg-danger-500/10 border-danger-500/30 animate-pulse-slow',
    )}>
      {/* Glow blob */}
      <div className={cn(
        'absolute -top-8 -right-8 w-32 h-32 rounded-full blur-3xl opacity-20 pointer-events-none',
        riskLevel === 'SAFE' ? 'bg-safe-500' : riskLevel === 'CAUTION' ? 'bg-caution-500' : 'bg-danger-500',
      )} />

      <div className="relative flex items-center gap-4">
        {/* Score */}
        <div className="flex-shrink-0">
          <RouteSafetyScore score={routeSafetyScore} riskLevel={riskLevel} size="md" />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <RiskBadge level={riskLevel} />
            <span className="text-xs text-slate-400 flex items-center gap-1">
              <Zap className="w-3 h-3" /> {routeType} ROUTE
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-300 text-sm mb-1">
            <MapPin className="w-3.5 h-3.5 flex-shrink-0 text-primary-400" />
            <span className="truncate font-medium">{destination}</span>
          </div>
          <div className="flex items-center gap-3 text-xs text-slate-500">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" /> 22 min ETA
            </span>
            <span>from {origin.split(' ')[0]}</span>
          </div>
        </div>

        <Link to="/journey">
          <div className="flex-shrink-0 w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 transition-colors flex items-center justify-center">
            <ChevronRight className="w-4 h-4 text-white" />
          </div>
        </Link>
      </div>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function QuickAction({ to, icon, label, description, gradient, border, iconBg }: {
  to: string; icon: React.ReactNode; label: string; description: string;
  gradient: string; border: string; iconBg: string;
}) {
  return (
    <Link
      to={to}
      className={cn(
        'flex items-center gap-3 p-4 rounded-2xl border bg-gradient-to-br transition-all duration-200',
        'hover:scale-[1.02] hover:shadow-glass-sm active:scale-[0.99]',
        gradient, border,
      )}
    >
      <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0', iconBg)}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-sm font-bold text-white">{label}</p>
        <p className="text-xs text-slate-400">{description}</p>
      </div>
    </Link>
  );
}
