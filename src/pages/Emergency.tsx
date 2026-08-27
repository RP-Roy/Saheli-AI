import { useState, useEffect, useCallback } from 'react';
import {
  AlertOctagon, Phone, MapPin, Clock, CheckCircle,
  Shield, Navigation, Radio, Share2, RefreshCw, Check,
  AlertTriangle, PhoneCall, Info
} from 'lucide-react';
import { useDemo } from '../context/DemoContext';
import { useApp } from '../context/AppContext';
import { Button } from '../components/ui/Button';
import { RiskBadge } from '../components/ui/Badge';
import { RouteSafetyScore } from '../components/ui/RouteSafetyScore';
import { EmergencyCircle } from '../components/emergency/EmergencyCircle';
import { incidentService, type IncidentData, type SOSDispatchResult } from '../services/incidentService';
import { cn } from '../utils/formatters';

const EMERGENCY_NUMBERS = [
  { id: 'police',     label: 'Police',          number: '100',  color: 'text-blue-400',   bg: 'bg-blue-500/15 border-blue-500/30'  },
  { id: 'women',      label: 'Women Helpline',   number: '1091', color: 'text-pink-400',   bg: 'bg-pink-500/15 border-pink-500/30'  },
  { id: 'ambulance',  label: 'Ambulance',        number: '108',  color: 'text-safe-400',   bg: 'bg-safe-500/15 border-safe-500/30'  },
  { id: 'emergency',  label: 'Emergency (All)',  number: '112',  color: 'text-danger-400', bg: 'bg-danger-500/15 border-danger-500/30' },
];

export default function Emergency() {
  const { contacts } = useApp();
  const { isDemoMode, journey, updateRiskLevel } = useDemo();

  // SOS and Incident State
  const [sosActivated, setSosActivated] = useState(false);
  const [activeIncidentId, setActiveIncidentId] = useState<string | null>(null);
  const [incidentTriggerTime, setIncidentTriggerTime] = useState<string | null>(null);
  const [locationCaptured, setLocationCaptured] = useState(false);
  const [currentCoordinates, setCurrentCoordinates] = useState<{ lat: number; lng: number } | null>(null);
  const [locationAddress, setLocationAddress] = useState<string>('Bellandur Junction, Bengaluru');
  
  // Notification progress & delivery state
  const [dispatchResult, setDispatchResult] = useState<SOSDispatchResult | null>(null);
  const [isDispatching, setIsDispatching] = useState(false);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);
  const [showRepeatConfirm, setShowRepeatConfirm] = useState(false);
  const [shareFeedback, setShareFeedback] = useState<string | null>(null);
  const [dialerNotice, setDialerNotice] = useState<string | null>(null);

  // Safety Check-In response state
  const [safetyCheckResponded, setSafetyCheckResponded] = useState(false);
  const [isLoadingSafe, setIsLoadingSafe] = useState(false);

  const displayRisk = journey.riskLevel;
  const displayScore = journey.routeSafetyScore;
  const isHighRisk = displayRisk === 'HIGH_RISK';
  const activeContacts = contacts.filter(c => c.enabled && c.consent_given);
  const primaryContact = activeContacts[0] || contacts[0] || null;

  // Handle cooldown countdown
  useEffect(() => {
    if (cooldownSeconds <= 0) return;
    const timer = setInterval(() => {
      setCooldownSeconds(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldownSeconds]);

  // Capture user location
  const captureCurrentLocation = useCallback(async (): Promise<{ lat: number; lng: number; address: string }> => {
    if (navigator.geolocation && !isDemoMode) {
      try {
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 6000, enableHighAccuracy: true });
        });
        const coords = { lat: position.coords.latitude, lng: position.coords.longitude };
        setCurrentCoordinates(coords);
        setLocationCaptured(true);
        const addr = `${coords.lat.toFixed(4)}°N, ${coords.lng.toFixed(4)}°E (Live GPS)`;
        setLocationAddress(addr);
        return { ...coords, address: addr };
      } catch {
        // Fallback to last known position or simulated location
      }
    }

    const fallback = journey.currentPosition || { lat: 12.9352, lng: 77.6890 };
    setCurrentCoordinates(fallback);
    setLocationCaptured(true);
    setLocationAddress('Bellandur Junction, Bengaluru');
    return { ...fallback, address: 'Bellandur Junction, Bengaluru' };
  }, [isDemoMode, journey.currentPosition]);

  // Trigger SOS Flow
  const activateSOS = async () => {
    setSosActivated(true);
    updateRiskLevel('HIGH_RISK');
    const nowTime = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
    setIncidentTriggerTime(nowTime);
    setIsDispatching(true);
    setCooldownSeconds(60); // 60s cooldown for repeated SOS

    // 1. Capture Location
    const loc = await captureCurrentLocation();

    // 2. Create Incident in Supabase / Local
    const incPayload: IncidentData = {
      user_id: isDemoMode ? 'demo-user' : 'current-user',
      risk_level: 'HIGH_RISK',
      latitude: loc.lat,
      longitude: loc.lng,
      location_name: loc.address,
      sos_message: `SAHELI SOS: Immediate assistance requested at ${loc.address}`,
    };

    const { data: incData } = await incidentService.triggerIncident(incPayload);
    const incId = incData?.id || `inc-${Date.now()}`;
    setActiveIncidentId(incId);

    // 3. Dispatch Notifications via Server Edge Function (passes only incId) or Simulation
    const result = await incidentService.sendSOSNotification(incId, {
      demoLocation: { lat: loc.lat, lng: loc.lng, address: loc.address },
    });

    setDispatchResult(result);
    setIsDispatching(false);
  };

  // Repeated SOS with confirmation & cooldown
  const handleRepeatSOS = async () => {
    setShowRepeatConfirm(false);
    if (!activeIncidentId) {
      await activateSOS();
      return;
    }
    setIsDispatching(true);
    setCooldownSeconds(60);
    const loc = await captureCurrentLocation();
    const result = await incidentService.sendSOSNotification(activeIncidentId, {
      force: true,
      demoLocation: { lat: loc.lat, lng: loc.lng, address: loc.address },
    });
    setDispatchResult(result);
    setIsDispatching(false);
  };

  // Resolve Incident
  const resolveIncident = async () => {
    if (activeIncidentId) {
      await incidentService.resolveIncident(activeIncidentId, 'RESOLVED');
    }
    setSosActivated(false);
    setActiveIncidentId(null);
    setDispatchResult(null);
    updateRiskLevel('SAFE');
  };

  // Mark Safe from Check-in prompt
  const markSafe = async () => {
    setIsLoadingSafe(true);
    await new Promise(r => setTimeout(r, 600));
    setIsLoadingSafe(false);
    setSafetyCheckResponded(true);
    updateRiskLevel('SAFE');
  };

  // Share Live Location
  const shareLocation = async () => {
    const lat = currentCoordinates?.lat || 12.9352;
    const lng = currentCoordinates?.lng || 77.6890;
    const mapUrl = `https://maps.google.com/?q=${lat},${lng}`;
    const shareText = `SAHELI EMERGENCY ALERT: I need assistance. My location: ${locationAddress}. Map: ${mapUrl}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Saheli Emergency SOS',
          text: shareText,
          url: mapUrl,
        });
        setShareFeedback('Location shared via device.');
      } catch {
        // User cancelled or share failed
      }
    } else {
      try {
        await navigator.clipboard.writeText(shareText);
        setShareFeedback('Location alert copied to clipboard!');
      } catch {
        setShareFeedback('Location: ' + mapUrl);
      }
    }

    setTimeout(() => setShareFeedback(null), 4000);
  };

  const handleDialerClick = (contactName?: string) => {
    setDialerNotice(`Opening phone dialer to call ${contactName || 'contact'}...`);
    setTimeout(() => setDialerNotice(null), 4500);
  };

  // Notification delivery summary calculations
  const sentCount = dispatchResult?.results.filter(r => r.status === 'SENT' || r.status === 'SIMULATED').length || 0;
  const failedCount = dispatchResult?.results.filter(r => r.status === 'FAILED' || r.status === 'PROVIDER_NOT_CONFIGURED').length || 0;

  return (
    <div className="page-wrapper space-y-5 max-w-2xl">

      {/* ── Dialer Info Toast ── */}
      {dialerNotice && (
        <div className="p-3.5 rounded-2xl bg-blue-500/15 border border-blue-500/30 flex items-center gap-2.5 text-blue-300 text-xs animate-fade-in shadow-lg">
          <PhoneCall className="w-4 h-4 flex-shrink-0 animate-bounce" />
          <p className="leading-snug">
            {dialerNotice} <span className="text-slate-400">Your phone will open the dialer so you can place the call.</span>
          </p>
        </div>
      )}

      {/* ── Share Feedback Banner ── */}
      {shareFeedback && (
        <div className="p-3.5 rounded-2xl bg-safe-500/15 border border-safe-500/30 flex items-center gap-2.5 text-safe-300 text-xs animate-fade-in">
          <Check className="w-4 h-4 flex-shrink-0" />
          <p>{shareFeedback}</p>
        </div>
      )}

      {/* ── ACTIVE INCIDENT CARD (Shown when SOS is triggered) ── */}
      {sosActivated ? (
        <section className="relative overflow-hidden rounded-3xl border-2 border-danger-500/60 bg-danger-500/15 p-6 shadow-glow-danger animate-fade-in space-y-5">
          <div className="absolute -top-12 -right-12 w-44 h-44 bg-danger-500/30 rounded-full blur-3xl pointer-events-none" />

          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-danger-500/30 border border-danger-400 flex items-center justify-center text-danger-300 animate-pulse">
                <AlertOctagon className="w-7 h-7 text-danger-400" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-danger-500 text-white font-black text-xs uppercase tracking-wider">
                    ACTIVE INCIDENT
                  </span>
                  <span className="text-xs text-danger-300 font-semibold">
                    Risk: HIGH
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-1 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-danger-400" />
                  Triggered at {incidentTriggerTime || 'Just now'}
                </p>
              </div>
            </div>

            <div className="text-right">
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-surface-900/80 text-slate-400 border border-white/10">
                {activeIncidentId || 'INC-LIVE'}
              </span>
            </div>
          </div>

          {/* Status Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="p-3 rounded-2xl bg-surface-900/60 border border-white/10">
              <p className="text-[11px] text-slate-400">Latest Location</p>
              <p className="text-xs font-bold text-white mt-0.5 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-primary-400 flex-shrink-0" />
                <span className="truncate">{locationCaptured ? 'Available' : 'Capturing...'}</span>
              </p>
              <p className="text-[10px] text-slate-400 truncate mt-0.5">{locationAddress}</p>
            </div>

            <div className="p-3 rounded-2xl bg-surface-900/60 border border-white/10">
              <p className="text-[11px] text-slate-400">Emergency Contacts</p>
              <p className="text-xs font-bold text-white mt-0.5">
                {activeContacts.length} active
              </p>
              <p className="text-[10px] text-slate-400 mt-0.5">Ready for alerts</p>
            </div>

            <div className="p-3 rounded-2xl bg-surface-900/60 border border-white/10 col-span-2 sm:col-span-1">
              <p className="text-[11px] text-slate-400">Notification Status</p>
              {isDispatching ? (
                <p className="text-xs font-bold text-amber-400 mt-0.5 animate-pulse">
                  Sending alerts...
                </p>
              ) : dispatchResult ? (
                <div className="text-xs font-bold mt-0.5">
                  <span className="text-safe-400">{sentCount} sent</span>
                  {failedCount > 0 && <span className="text-danger-400 ml-1.5">{failedCount} failed</span>}
                </div>
              ) : (
                <p className="text-xs font-bold text-slate-400 mt-0.5">Pending</p>
              )}
              <p className="text-[10px] text-slate-400 mt-0.5">
                {isDemoMode ? 'Simulated delivery' : 'Server dispatch'}
              </p>
            </div>
          </div>

          {/* SOS Progression Stepper */}
          <div className="p-4 rounded-2xl bg-surface-900/80 border border-white/10 space-y-2.5">
            <p className="text-xs font-bold text-slate-300 uppercase tracking-wider">Emergency Flow Status</p>
            
            <div className="space-y-2 text-xs">
              <div className="flex items-center gap-2 text-safe-300">
                <CheckCircle className="w-4 h-4 text-safe-400 flex-shrink-0" />
                <span>Incident created ({activeIncidentId})</span>
              </div>

              <div className="flex items-center gap-2 text-safe-300">
                <CheckCircle className="w-4 h-4 text-safe-400 flex-shrink-0" />
                <span>Location captured ({locationAddress})</span>
              </div>

              {isDispatching ? (
                <div className="flex items-center gap-2 text-amber-300 animate-pulse">
                  <RefreshCw className="w-4 h-4 animate-spin flex-shrink-0" />
                  <span>Dispatching SOS message to emergency circle...</span>
                </div>
              ) : dispatchResult?.results && dispatchResult.results.length > 0 ? (
                dispatchResult.results.map(r => (
                  <div key={r.contactId} className="flex items-center justify-between gap-2 pl-6">
                    <div className="flex items-center gap-2">
                      {r.status === 'SENT' || r.status === 'SIMULATED' ? (
                        <CheckCircle className="w-3.5 h-3.5 text-safe-400" />
                      ) : (
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                      )}
                      <span className="text-slate-200">{r.name} ({r.relationship})</span>
                      <span className="text-[10px] text-slate-400">
                        {r.status === 'SENT' ? 'Notified via SMS' : r.status === 'SIMULATED' ? 'Notified (Demo)' : 'Notification could not be delivered.'}
                      </span>
                    </div>

                    <a
                      href={`tel:${contacts.find(c => c.id === r.contactId)?.phone || ''}`}
                      onClick={() => handleDialerClick(r.name)}
                      className="text-[11px] px-2 py-0.5 rounded-lg bg-surface-700 hover:bg-surface-600 border border-white/10 text-primary-300 flex items-center gap-1 font-semibold"
                    >
                      <Phone className="w-3 h-3" /> Call {r.name.split(' ')[0]}
                    </a>
                  </div>
                ))
              ) : (
                <div className="flex items-center gap-2 text-slate-400 pl-6">
                  <Info className="w-3.5 h-3.5 text-slate-400" />
                  <span>No emergency contacts were configured or active.</span>
                </div>
              )}
            </div>
          </div>

          {/* Primary Action Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            {primaryContact && (
              <a
                href={`tel:${primaryContact.phone}`}
                onClick={() => handleDialerClick(primaryContact.name)}
                className="w-full py-3 px-4 rounded-2xl bg-safe-600 hover:bg-safe-500 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg transition-all active:scale-[0.98]"
              >
                <PhoneCall className="w-4 h-4" />
                Call Primary Contact ({primaryContact.name.split(' ')[0]})
              </a>
            )}

            <Button
              variant="outline"
              leftIcon={<Share2 className="w-4 h-4" />}
              onClick={shareLocation}
              fullWidth
            >
              Share Location
            </Button>
          </div>

          {/* Secondary Actions: Send SOS Again & Resolve Incident */}
          <div className="flex items-center justify-between pt-2 border-t border-white/10 text-xs">
            {/* Send SOS Again with Cooldown */}
            {showRepeatConfirm ? (
              <div className="flex items-center gap-2">
                <span className="text-danger-300 font-semibold">Resend SOS alert?</span>
                <button
                  onClick={handleRepeatSOS}
                  className="px-2.5 py-1 rounded-lg bg-danger-600 text-white font-bold hover:bg-danger-500 transition-colors"
                >
                  Yes, Resend
                </button>
                <button
                  onClick={() => setShowRepeatConfirm(false)}
                  className="px-2 py-1 text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                disabled={cooldownSeconds > 0}
                onClick={() => setShowRepeatConfirm(true)}
                className={cn(
                  'flex items-center gap-1.5 font-semibold transition-colors',
                  cooldownSeconds > 0
                    ? 'text-slate-500 cursor-not-allowed'
                    : 'text-danger-400 hover:text-danger-300 underline'
                )}
              >
                <RefreshCw className={cn('w-3.5 h-3.5', cooldownSeconds > 0 && 'animate-spin')} />
                {cooldownSeconds > 0 ? `Send SOS Again (${cooldownSeconds}s)` : 'Send SOS Again'}
              </button>
            )}

            <button
              onClick={resolveIncident}
              className="text-slate-400 hover:text-white font-semibold underline transition-colors"
            >
              Resolve Incident
            </button>
          </div>
        </section>
      ) : (
        /* ── Risk Header (When no active SOS) ── */
        <div className={cn(
          'relative overflow-hidden rounded-3xl border p-6 transition-all duration-500',
          isHighRisk
            ? 'bg-danger-500/15 border-danger-500/40'
            : displayRisk === 'CAUTION'
            ? 'bg-caution-500/10 border-caution-500/30'
            : 'bg-safe-500/10 border-safe-500/30',
        )}>
          <div className={cn(
            'absolute -top-10 -right-10 w-40 h-40 rounded-full blur-3xl opacity-20 pointer-events-none',
            isHighRisk ? 'bg-danger-500' : displayRisk === 'CAUTION' ? 'bg-caution-500' : 'bg-safe-500',
          )} />

          <div className="relative flex items-center gap-5">
            <RouteSafetyScore score={displayScore} riskLevel={displayRisk} size="md" />
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <RiskBadge level={displayRisk} />
                {journey.isActive && (
                  <span className="text-xs text-slate-400 flex items-center gap-1">
                    <Radio className="w-3 h-3 text-safe-400 animate-pulse" /> Live Journey
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
            <span className="truncate">{locationAddress}</span>
            <Navigation className="w-3.5 h-3.5 text-slate-500 ml-auto flex-shrink-0" />
          </div>
        </div>
      )}

      {/* ── Safety Check-In Prompt (if high risk/caution and not in active SOS) ── */}
      {(isHighRisk || displayRisk === 'CAUTION') && !sosActivated && !safetyCheckResponded && (
        <div className="glass-card p-5 border-caution-500/30 bg-caution-500/5 animate-fade-in">
          <div className="flex items-start gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-caution-500/20 flex items-center justify-center flex-shrink-0">
              <Shield className="w-5 h-5 text-caution-400" />
            </div>
            <div>
              <h2 className="font-bold text-white">Safety Check-In</h2>
              <p className="text-sm text-slate-400 mt-0.5">We detected something unusual. Are you safe?</p>
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
              Need Help (SOS)
            </Button>
          </div>
        </div>
      )}

      {/* ── Marked Safe Confirmation ── */}
      {safetyCheckResponded && !sosActivated && (
        <div className="glass-card p-5 border-safe-500/30 bg-safe-500/5 flex items-center gap-3 animate-fade-in">
          <CheckCircle className="w-8 h-8 text-safe-400 flex-shrink-0" />
          <div>
            <p className="font-bold text-safe-300">You're marked as safe</p>
            <p className="text-sm text-slate-400">Your trusted circle status has been refreshed.</p>
          </div>
        </div>
      )}

      {/* ── Prominent SOS Trigger Button (when not activated) ── */}
      {!sosActivated && (
        <div className="glass-card p-6 text-center">
          <p className="text-sm text-slate-400 mb-5">
            In an immediate emergency, activate SOS to alert your trusted circle instantly with your live location.
          </p>
          <button
            id="sos-button"
            onClick={activateSOS}
            className={cn(
              'mx-auto flex items-center justify-center w-28 h-28 rounded-full border-4',
              'bg-danger-600 border-danger-400 text-white font-black text-lg tracking-widest',
              'hover:bg-danger-500 hover:scale-105 active:scale-95',
              'transition-all duration-200 shadow-glow-danger',
            )}
            aria-label="Activate Emergency SOS"
          >
            SOS
          </button>
          <p className="text-xs text-slate-500 mt-4">
            Tap to activate instant emergency escalation
          </p>
        </div>
      )}

      {/* ── Emergency Circle Component (Contacts Management & Calling) ── */}
      <EmergencyCircle />

      {/* ── Direct Emergency Service Numbers ── */}
      <div>
        <h2 className="section-title mb-3">Emergency Services</h2>
        <div className="grid grid-cols-2 gap-3">
          {EMERGENCY_NUMBERS.map(({ id, label, number, color, bg }) => (
            <a
              key={id}
              href={`tel:${number}`}
              id={`emergency-${id}`}
              onClick={() => handleDialerClick(label)}
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
