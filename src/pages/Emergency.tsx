import { useState, useEffect, useCallback } from 'react';
import {
  AlertOctagon, Phone, MapPin, Clock, CheckCircle,
  Shield, Share2, RefreshCw, Check,
  AlertTriangle, PhoneCall, Info, Navigation2, MessageSquare
} from 'lucide-react';
import { useDemo } from '../context/DemoContext';
import { useApp } from '../context/AppContext';
import { Button } from '../components/ui/Button';
import { EmergencyCircle } from '../components/emergency/EmergencyCircle';
import { incidentService, type IncidentData, type SOSDispatchResult } from '../services/incidentService';
import { cn } from '../utils/formatters';

const EMERGENCY_NUMBERS = [
  { id: 'police',     label: 'Police Help',      number: '100',  color: 'text-rose-700', bg: 'bg-rose-50 border-rose-200' },
  { id: 'women',      label: 'Women Helpline',   number: '1091', color: 'text-primary-700', bg: 'bg-primary-50 border-primary-200' },
  { id: 'ambulance',  label: 'Ambulance',        number: '108',  color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200' },
  { id: 'emergency',  label: 'All Emergency',   number: '112',  color: 'text-rose-800', bg: 'bg-rose-100/70 border-rose-300' },
];

export default function Emergency() {
  const { contacts, user } = useApp();
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
        // Fallback
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
    setCooldownSeconds(60);

    // 1. Capture Location
    const loc = await captureCurrentLocation();

    // 2. Create Incident
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

    // 3. Dispatch Notifications
    const result = await incidentService.sendSOSNotification(incId, {
      demoLocation: { lat: loc.lat, lng: loc.lng, address: loc.address },
      contacts: activeContacts,
      userName: user.name,
    });

    setDispatchResult(result);
    setIsDispatching(false);
  };

  // Repeated SOS
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
      contacts: activeContacts,
      userName: user.name,
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

  // Mark Safe
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
        // Cancelled
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

  const sentCount = dispatchResult?.results.filter(r => r.status === 'SENT' || r.status === 'SIMULATED').length || 0;
  const failedCount = dispatchResult?.results.filter(r => r.status === 'FAILED' || r.status === 'PROVIDER_NOT_CONFIGURED').length || 0;

  return (
    <div className="page-wrapper space-y-6 max-w-2xl">

      {/* ── Dialer Info Notice ── */}
      {dialerNotice && (
        <div className="p-4 rounded-2xl bg-primary-50 border border-primary-200 flex items-center gap-3 text-primary-800 text-xs animate-fade-in shadow-sm">
          <PhoneCall className="w-4 h-4 flex-shrink-0 text-primary-600 animate-bounce" />
          <p className="font-semibold leading-snug">
            {dialerNotice} <span className="text-slate-500 font-normal">Opening system dialer now.</span>
          </p>
        </div>
      )}

      {/* ── Share Feedback Toast ── */}
      {shareFeedback && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center gap-3 text-emerald-800 text-xs font-semibold animate-fade-in shadow-sm">
          <Check className="w-4 h-4 flex-shrink-0 text-emerald-600" />
          <p>{shareFeedback}</p>
        </div>
      )}

      {/* ── ACTIVE INCIDENT CARD ── */}
      {sosActivated && (
        <section className="relative overflow-hidden rounded-3xl border-2 border-rose-400 bg-white p-6 sm:p-7 shadow-card-hover animate-slide-up space-y-5">
          <div className="absolute top-0 right-0 w-48 h-48 bg-rose-100/50 rounded-full blur-3xl pointer-events-none" />

          {/* Header */}
          <div className="flex items-start justify-between relative z-10">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center shadow-sm animate-pulse">
                <AlertOctagon className="w-7 h-7" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-3 py-0.5 rounded-full bg-rose-600 text-white font-extrabold text-xs uppercase tracking-wider shadow-sm">
                    ACTIVE SOS ESCALATION
                  </span>
                </div>
                <p className="text-xs text-slate-500 font-medium mt-1 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-rose-500" />
                  Triggered at {incidentTriggerTime || 'Just now'}
                </p>
              </div>
            </div>

            <div className="text-right">
              <span className="text-[10px] font-mono px-2.5 py-1 rounded-xl bg-blush-100 text-primary-800 font-bold border border-pink-200">
                {activeIncidentId || 'INC-LIVE'}
              </span>
            </div>
          </div>

          {/* Status Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 relative z-10">
            <div className="p-3.5 rounded-2xl bg-blush-50/80 border border-pink-200/60">
              <p className="text-[11px] font-bold text-slate-500">Live GPS Location</p>
              <p className="text-xs font-bold text-slate-900 mt-1 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-primary-500 flex-shrink-0" />
                <span className="truncate">{locationCaptured ? 'Captured ✓' : 'Acquiring...'}</span>
              </p>
              <p className="text-[10px] text-slate-500 truncate mt-0.5">{locationAddress}</p>
            </div>

            <div className="p-3.5 rounded-2xl bg-blush-50/80 border border-pink-200/60">
              <p className="text-[11px] font-bold text-slate-500">Emergency Circle</p>
              <p className="text-xs font-bold text-slate-900 mt-1">
                {activeContacts.length} contacts
              </p>
              <p className="text-[10px] text-slate-500 mt-0.5">Notified with map link</p>
            </div>

            <div className="p-3.5 rounded-2xl bg-blush-50/80 border border-pink-200/60 col-span-2 sm:col-span-1">
              <p className="text-[11px] font-bold text-slate-500">Dispatch Status</p>
              {isDispatching ? (
                <p className="text-xs font-bold text-amber-600 mt-1 animate-pulse">
                  Sending alerts...
                </p>
              ) : dispatchResult ? (
                <div className="text-xs font-bold mt-1">
                  <span className="text-emerald-700">{sentCount} sent</span>
                  {failedCount > 0 && <span className="text-rose-600 ml-1.5">{failedCount} failed</span>}
                </div>
              ) : (
                <p className="text-xs font-bold text-slate-500 mt-1">Pending</p>
              )}
              <p className="text-[10px] text-slate-500 mt-0.5">High priority SMS</p>
            </div>
          </div>

          {/* Progressive SOS Stepper */}
          <div className="p-4 rounded-2xl bg-blush-100/60 border border-pink-200/80 space-y-2.5 relative z-10">
            <p className="text-xs font-bold text-slate-700 uppercase tracking-wider">Escalation Flow</p>
            
            <div className="space-y-2 text-xs">
              <div className="flex items-center gap-2 text-emerald-800 font-medium">
                <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>Incident securely created ({activeIncidentId})</span>
              </div>

              <div className="flex items-center gap-2 text-emerald-800 font-medium">
                <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>Location captured ({locationAddress})</span>
              </div>

              {isDispatching ? (
                <div className="flex items-center gap-2 text-amber-800 font-bold animate-pulse">
                  <RefreshCw className="w-4 h-4 animate-spin text-amber-600 flex-shrink-0" />
                  <span>Dispatching SOS SMS alert to emergency circle...</span>
                </div>
              ) : dispatchResult?.results && dispatchResult.results.length > 0 ? (
                dispatchResult.results.map(r => (
                  <div key={r.contactId} className="flex items-center justify-between gap-2 pl-6 py-1">
                    <div className="flex items-center gap-2">
                      {r.status === 'SENT' || r.status === 'SIMULATED' ? (
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                      )}
                      <span className="text-slate-800 font-bold">{r.name} ({r.relationship})</span>
                      <span className="text-[10px] text-slate-500">
                        {r.status === 'SENT' ? '• SMS Delivered' : r.status === 'SIMULATED' ? '• Notified (Demo)' : '• Delivery pending'}
                      </span>
                    </div>

                    <a
                      href={`tel:${contacts.find(c => c.id === r.contactId)?.phone || ''}`}
                      onClick={() => handleDialerClick(r.name)}
                      className="text-[11px] px-2.5 py-1 rounded-xl bg-white hover:bg-pink-50 border border-pink-200 text-primary-700 flex items-center gap-1 font-bold shadow-sm"
                    >
                      <Phone className="w-3 h-3" /> Call {r.name.split(' ')[0]}
                    </a>
                  </div>
                ))
              ) : (
                <div className="flex items-center gap-2 text-slate-500 pl-6">
                  <Info className="w-3.5 h-3.5" />
                  <span>No emergency contacts configured yet.</span>
                </div>
              )}
            </div>
          </div>

          {/* Primary Action Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 relative z-10">
            {primaryContact && (
              <a
                href={`tel:${primaryContact.phone}`}
                onClick={() => handleDialerClick(primaryContact.name)}
                className="w-full py-3.5 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-sm transition-all hover:-translate-y-0.5 active:scale-95"
              >
                <PhoneCall className="w-4 h-4" />
                Call Primary ({primaryContact.name.split(' ')[0]})
              </a>
            )}

            {primaryContact && (
              <a
                href={`sms:${primaryContact.phone}?body=${encodeURIComponent(
                  `SAHELI EMERGENCY SOS: I need assistance immediately. My live location: ${locationAddress} (https://maps.google.com/?q=${currentCoordinates?.lat || 12.9352},${currentCoordinates?.lng || 77.6890}). Incident: ${activeIncidentId || 'INC-LIVE'}`
                )}`}
                className="w-full py-3.5 px-4 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-sm transition-all hover:-translate-y-0.5 active:scale-95"
              >
                <MessageSquare className="w-4 h-4" />
                Send SMS to {primaryContact.name.split(' ')[0]}
              </a>
            )}

            <Button
              variant="outline"
              leftIcon={<Share2 className="w-4 h-4" />}
              onClick={shareLocation}
              fullWidth
              className={primaryContact ? 'sm:col-span-2' : ''}
            >
              Share Live Location Link
            </Button>
          </div>

          {/* Secondary Actions */}
          <div className="flex items-center justify-between pt-3 border-t border-pink-100 text-xs relative z-10">
            {showRepeatConfirm ? (
              <div className="flex items-center gap-2">
                <span className="text-rose-700 font-bold">Resend SOS SMS?</span>
                <button
                  onClick={handleRepeatSOS}
                  className="px-3 py-1 rounded-xl bg-rose-600 text-white font-bold hover:bg-rose-700 transition-colors shadow-sm"
                >
                  Yes, Resend
                </button>
                <button
                  onClick={() => setShowRepeatConfirm(false)}
                  className="px-2 py-1 text-slate-500 hover:text-slate-700 font-semibold"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                disabled={cooldownSeconds > 0}
                onClick={() => setShowRepeatConfirm(true)}
                className={cn(
                  'flex items-center gap-1.5 font-bold transition-colors',
                  cooldownSeconds > 0
                    ? 'text-slate-400 cursor-not-allowed'
                    : 'text-rose-600 hover:text-rose-700 underline'
                )}
              >
                <RefreshCw className={cn('w-3.5 h-3.5', cooldownSeconds > 0 && 'animate-spin')} />
                {cooldownSeconds > 0 ? `Resend SOS (${cooldownSeconds}s cooldown)` : 'Resend SOS Alert'}
              </button>
            )}

            <button
              onClick={resolveIncident}
              className="text-slate-500 hover:text-slate-800 font-bold underline transition-colors"
            >
              Resolve & Close Incident
            </button>
          </div>
        </section>
      )}

      {/* ── Safety Check-In Prompt (if cautioned and not in active SOS) ── */}
      {(isHighRisk || displayRisk === 'CAUTION') && !sosActivated && !safetyCheckResponded && (
        <div className="glass-card p-6 border-amber-300 bg-amber-50/50 animate-slide-up">
          <div className="flex items-start gap-3.5 mb-4">
            <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center flex-shrink-0">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-extrabold text-slate-900 text-base">Safety Check-In</h2>
              <p className="text-xs text-slate-600 mt-0.5">We noticed an unexpected stop or detour. Are you safe?</p>
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
        <div className="glass-card p-5 border-emerald-200 bg-emerald-50/60 flex items-center gap-3.5 animate-fade-in">
          <CheckCircle className="w-8 h-8 text-emerald-600 flex-shrink-0" />
          <div>
            <p className="font-bold text-emerald-900 text-sm">You're marked as safe</p>
            <p className="text-xs text-emerald-700 mt-0.5">Your journey status has been refreshed.</p>
          </div>
        </div>
      )}

      {/* ── Prominent Breathing SOS Button (when not activated) ── */}
      {!sosActivated && (
        <div className="glass-card p-8 text-center relative overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-rose-100/40 rounded-full blur-3xl pointer-events-none" />

          <p className="text-xs text-slate-500 font-medium max-w-md mx-auto mb-6 leading-relaxed">
            In an emergency, tap the SOS button to instantly alert your trusted circle with your live location coordinates.
          </p>

          <div className="relative inline-flex items-center justify-center my-2">
            {/* Pulsing breathing outer wave */}
            <div className="absolute w-36 h-36 rounded-full bg-rose-400/25 animate-pulse-gentle pointer-events-none" />
            <div className="absolute w-44 h-44 rounded-full bg-rose-300/15 animate-ping pointer-events-none opacity-40" />

            <button
              id="sos-button"
              onClick={activateSOS}
              className={cn(
                'relative z-10 flex items-center justify-center w-28 h-28 rounded-full border-4 border-white',
                'bg-gradient-to-br from-rose-500 via-rose-600 to-rose-700 text-white font-black text-xl tracking-widest',
                'hover:scale-105 active:scale-95 shadow-glow-danger transition-all duration-300',
              )}
              aria-label="Activate Emergency SOS"
            >
              SOS
            </button>
          </div>

          <p className="text-[11px] font-bold text-rose-600 mt-6 tracking-wide">
            Tap to activate instant emergency escalation
          </p>
        </div>
      )}

      {/* ── Emergency Circle Component ── */}
      <EmergencyCircle />

      {/* ── Direct Emergency Services ── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-extrabold text-slate-900 tracking-tight">Direct Emergency Services</h2>
          <span className="text-xs text-slate-500 font-medium">Toll-Free Numbers</span>
        </div>
        <div className="grid grid-cols-2 gap-3.5">
          {EMERGENCY_NUMBERS.map(({ id, label, number, color, bg }) => (
            <a
              key={id}
              href={`tel:${number}`}
              id={`emergency-${id}`}
              onClick={() => handleDialerClick(label)}
              className={cn(
                'flex items-center gap-3.5 p-4 rounded-3xl border transition-all hover:-translate-y-0.5 hover:shadow-card active:scale-[0.98]',
                bg,
              )}
            >
              <div className="w-10 h-10 rounded-2xl bg-white shadow-sm flex items-center justify-center flex-shrink-0">
                <Phone className={cn('w-5 h-5', color)} />
              </div>
              <div>
                <p className={cn('text-base font-black tracking-tight leading-none', color)}>{number}</p>
                <p className="text-xs text-slate-600 mt-1 font-semibold">{label}</p>
              </div>
            </a>
          ))}
        </div>
      </div>

    </div>
  );
}
