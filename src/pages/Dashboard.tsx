import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Navigation, BookOpen, MessageCircle,
  AlertOctagon, MapPin, Clock, ChevronRight, Zap,
  Users, Sparkles, Shield
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

      {/* ── Hero Greeting Card ── */}
      <div className="relative overflow-hidden rounded-3xl bg-white/95 border border-pink-200/80 p-6 sm:p-8 shadow-card">
        {/* Subtle ambient rose background glow */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-br from-pink-200/40 via-rose-100/30 to-transparent rounded-full blur-3xl pointer-events-none -mr-16 -mt-16" />

        <div className="relative z-10 space-y-2 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-50 border border-primary-200/70 text-primary-700 text-xs font-bold shadow-sm">
            <span className="w-2 h-2 rounded-full bg-primary-500 animate-pulse" />
            <span>{displayJourney ? 'Active Protection Live' : 'You’re covered with Saheli'}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            {greeting}, {user.name.split(' ')[0]} 👋
          </h1>
          <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
            {displayJourney
              ? 'Your journey is currently monitored with AI anomaly detection and instant trusted circle alerts.'
              : 'Plan safer routes, check live safety-supporting locations, and navigate with confidence.'}
          </p>
        </div>
      </div>

      {/* ── Active Journey Banner (when active) ── */}
      {displayJourney && (
        <ActiveJourneyCard journey={displayJourney} />
      )}

      {/* ── Quick Actions ── */}
      <div>
        <div className="flex items-center justify-between mb-3.5">
          <h2 className="text-lg font-extrabold text-slate-900 tracking-tight">Quick Actions</h2>
          <span className="text-xs font-semibold text-primary-600">Essential Tools</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          <QuickActionCard
            to="/journey"
            icon={<Navigation className="w-5 h-5" />}
            label="Plan Route"
            description="High safety paths"
            iconBg="bg-primary-100 text-primary-600"
          />
          <QuickActionCard
            to="/learn"
            icon={<BookOpen className="w-5 h-5" />}
            label="Self-Defense"
            description="Curated video lessons"
            iconBg="bg-amber-100 text-amber-700"
          />
          <QuickActionCard
            to="/companion"
            icon={<MessageCircle className="w-5 h-5" />}
            label="Ask Saheli"
            description="AI safety guidance"
            iconBg="bg-rose-100 text-rose-600"
          />
          <QuickActionCard
            to="/emergency"
            icon={<AlertOctagon className="w-5 h-5" />}
            label="Emergency SOS"
            description="Instant circle alerts"
            iconBg="bg-red-100 text-rose-700"
            danger
          />
        </div>
      </div>

      {/* ── Trusted Circle + Safety Tip ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {/* Trusted Circle Card */}
        <div className="glass-card p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-primary-100 text-primary-600 flex items-center justify-center shadow-sm">
                  <Users className="w-4 h-4" />
                </div>
                <h2 className="text-sm font-bold text-slate-900 tracking-tight">Trusted Circle</h2>
              </div>
              <Link to="/settings" className="text-xs font-bold text-primary-600 hover:text-primary-700 transition-colors">
                Manage
              </Link>
            </div>
            
            <div className="space-y-3">
              {TRUSTED_CONTACTS.slice(0, 3).map(contact => (
                <div key={contact.id} className="flex items-center gap-3 p-2 rounded-2xl hover:bg-pink-50/50 transition-colors">
                  <div className={cn('w-9 h-9 rounded-full bg-gradient-to-br flex items-center justify-center text-xs font-bold text-white flex-shrink-0 shadow-sm', contact.color)}>
                    {contact.avatar}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-900 truncate">{contact.name}</p>
                    <p className="text-[11px] text-slate-500 truncate">{contact.relation}</p>
                  </div>
                  <div className="flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <span>Ready</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-pink-100 text-[11px] text-slate-500 flex items-center justify-between">
            <span>Auto-notified during SOS</span>
            <span className="font-bold text-primary-600">3 active</span>
          </div>
        </div>

        {/* Daily Safety Tip Card */}
        <div className="glass-card p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shadow-sm">
                  <Sparkles className="w-4 h-4" />
                </div>
                <h2 className="text-sm font-bold text-slate-900 tracking-tight">Daily Safety Tip</h2>
              </div>
              <span className="text-[10px] font-bold text-primary-700 bg-primary-50 border border-primary-200/70 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                {tip.category}
              </span>
            </div>

            <div className="space-y-1.5">
              <p className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <span>{tip.icon}</span>
                <span>{tip.title}</span>
              </p>
              <p className="text-xs text-slate-600 leading-relaxed pt-1">
                {tip.body}
              </p>
            </div>
          </div>

          {/* Pagination Indicators */}
          <div className="flex gap-1.5 mt-5">
            {SAFETY_TIPS.map((_, i) => (
              <button
                key={i}
                onClick={() => setTipIndex(i)}
                aria-label={`Tip ${i + 1}`}
                className={cn(
                  'h-1.5 rounded-full transition-all duration-300',
                  i === tipIndex ? 'w-6 bg-primary-500' : 'w-2 bg-pink-200 hover:bg-pink-300'
                )}
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
  const destination = 'destination' in journey ? journey.destination : 'Destination';
  const origin = 'origin' in journey ? journey.origin : 'Origin';
  const routeType = 'routeType' in journey ? journey.routeType : 'SAFEST';

  return (
    <div className="relative overflow-hidden rounded-3xl border border-pink-200 bg-white/95 p-6 shadow-card transition-all duration-300">
      <div className="flex items-center gap-5">
        {/* Score Ring */}
        <div className="flex-shrink-0">
          <RouteSafetyScore score={routeSafetyScore} riskLevel={riskLevel} size="md" />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex items-center gap-2">
            <RiskBadge level={riskLevel} />
            <span className="text-xs font-bold text-primary-700 bg-primary-50 px-2 py-0.5 rounded-full border border-primary-200">
              {routeType} ROUTE
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-900 font-bold text-sm truncate">
            <MapPin className="w-4 h-4 text-primary-500 flex-shrink-0" />
            <span className="truncate">{destination}</span>
          </div>
          <div className="flex items-center gap-3 text-xs text-slate-500">
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>Active Monitoring</span>
            </span>
            <span>• From {origin.split(',')[0]}</span>
          </div>
        </div>

        <Link
          to="/journey"
          className="flex-shrink-0 w-10 h-10 rounded-2xl bg-primary-50 hover:bg-primary-100 text-primary-600 flex items-center justify-center border border-primary-200/80 transition-all hover:scale-105 active:scale-95"
          aria-label="View live journey"
        >
          <ChevronRight className="w-5 h-5" />
        </Link>
      </div>
    </div>
  );
}

// ─── Quick Action Card Component ──────────────────────────────────────────────

function QuickActionCard({
  to, icon, label, description, iconBg, danger = false
}: {
  to: string; icon: React.ReactNode; label: string; description: string;
  iconBg: string; danger?: boolean;
}) {
  return (
    <Link
      to={to}
      className={cn(
        'group flex flex-col items-center justify-center text-center p-5 rounded-3xl bg-white border border-pink-200/70 shadow-card transition-all duration-200',
        'hover:-translate-y-1 hover:shadow-card-hover hover:border-primary-300 active:scale-[0.98]',
        danger && 'hover:border-rose-300'
      )}
    >
      <div className={cn('w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm mb-3 transition-transform duration-200 group-hover:scale-110', iconBg)}>
        {icon}
      </div>
      <div className="w-full flex flex-col items-center justify-center text-center">
        <p className={cn('text-sm font-extrabold text-slate-900 tracking-tight text-center', danger && 'group-hover:text-rose-600')}>
          {label}
        </p>
        <p className="text-xs text-slate-500 mt-1 text-center font-medium">
          {description}
        </p>
      </div>
    </Link>
  );
}
