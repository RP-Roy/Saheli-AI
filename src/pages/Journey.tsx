import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Play, Square, MapPin, Clock, ChevronRight, ChevronDown,
  AlertTriangle, CheckCircle, Radio, Target, ShieldCheck, Route, Search, Loader2, BookOpen,
  Navigation2, Sparkles, Shield
} from 'lucide-react';
import { useDemo } from '../context/DemoContext';
import { Button } from '../components/ui/Button';
import { RiskBadge } from '../components/ui/Badge';
import { RouteSafetyScore } from '../components/ui/RouteSafetyScore';
import { Modal } from '../components/ui/Spinner';
import { JourneyMap } from '../components/ui/JourneyMap';
import { RECENT_EVENTS, DEMO_ROUTE_OPTIONS } from '../data/mockData';
import { getRecommendedResources } from '../data/selfDefenseVideos';
import { formatTime, cn } from '../utils/formatters';
import type { RiskLevel } from '../config/appConfig';
import { routeService } from '../services/routeService';
import type { RouteOption } from '../config/demoConfig';
import { useJourneyMonitor } from '../hooks/useJourneyMonitor';
import { useGeolocation } from '../hooks/useGeolocation';
import { LocationAutocomplete } from '../components/ui/LocationAutocomplete';
import type { GeocodingResult } from '../services/geocodingService';
import { journeyService } from '../services/journeyService';

export default function Journey() {
  const {
    journey, startJourney, endJourney, setJourney,
    acknowledgeSafetyCheck, updateRiskLevel, setDeviation,
    addIncident, updateActiveRoute
  } = useDemo();

  const navigate = useNavigate();
  useJourneyMonitor();

  type Phase = 'PLANNING' | 'SELECTING' | 'MONITORING';
  const [localPhase, setLocalPhase] = useState<Phase>('PLANNING');
  const phase: Phase = journey.isActive ? 'MONITORING' : localPhase;

  const [routeError, setRouteError] = useState<string | null>(null);

  const loc = useGeolocation();
  const [realDest, setRealDest] = useState<GeocodingResult | null>(null);

  const [generatedRoutes, setGeneratedRoutes] = useState<RouteOption[]>(DEMO_ROUTE_OPTIONS);
  const [selectedRouteId, setSelectedRouteId] = useState(DEMO_ROUTE_OPTIONS[0].id);
  const [isLoading, setIsLoading] = useState(false);
  const [expandedWhyRoute, setExpandedWhyRoute] = useState<string | null>(DEMO_ROUTE_OPTIONS[0].id);

  // Reroute specific states
  const [isRerouting, setIsRerouting] = useState(false);
  const [rerouteOptions, setRerouteOptions] = useState<RouteOption[]>([]);
  const [selectedRerouteId, setSelectedRerouteId] = useState('');
  const [rerouteMessage, setRerouteMessage] = useState<string | null>(null);

  const selectedRoute = generatedRoutes.find(r => r.id === selectedRouteId) || generatedRoutes[0];
  const selectedReroute = rerouteOptions.find(r => r.id === selectedRerouteId) || rerouteOptions[0];

  const handleGenerateRoutes = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loc.latitude || !loc.longitude || !realDest) return;
    
    setIsLoading(true);
    setRouteError(null);
    try {
      const originParam = { latitude: loc.latitude, longitude: loc.longitude };
      const destParam = { latitude: realDest.lat, longitude: realDest.lon };

      const routes = await routeService.generateSafeRoutes(originParam, destParam, false);
      setGeneratedRoutes(routes);
      if (routes.length > 0) {
        setSelectedRouteId(routes[0].id);
        setExpandedWhyRoute(routes[0].id);
        setLocalPhase('SELECTING');
      }
    } catch (error: any) {
      console.error(error);
      setRouteError(error.message || 'Failed to generate routes. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartJourney = () => {
    const originLabel = loc.latitude ? 'Current Location' : 'Start Point';
    const destLabel = realDest?.name || 'Destination';
    startJourney(selectedRoute, originLabel, destLabel);

    if (selectedRoute.waypoints.length > 0) {
      const startWp = selectedRoute.waypoints[0];
      const endWp = selectedRoute.waypoints[selectedRoute.waypoints.length - 1];
      journeyService.createJourney({
        user_id: 'user_active_session',
        start_lat: startWp.lat,
        start_lng: startWp.lng,
        destination_name: destLabel,
        destination_lat: endWp.lat,
        destination_lng: endWp.lng,
        expected_duration_minutes: selectedRoute.etaMins,
        route_safety_score: selectedRoute.routeSafetyResult?.score ?? 75,
        risk_level: (selectedRoute.routeSafetyResult?.score ?? 75) > 80 ? 'SAFE' : 'CAUTION',
        status: 'ACTIVE',
      }).catch((err: any) => console.warn('Supabase createJourney background log:', err));
    }
  };

  const handleEndJourney = () => {
    if (journey.id) {
      journeyService.endJourney(journey.id).catch((err: any) => console.warn('Supabase endJourney background log:', err));
    }
    endJourney();
    setLocalPhase('PLANNING');
  };

  const handleContinueRoute = () => {
    setDeviation(false);
    if (journey.isActive) {
      setJourney(prev => ({
        ...prev,
        waypointIndex: Math.min(prev.waypointIndex + 1, prev.plannedRoute.length - 1)
      }));
    }
  };

  const handleFindSaferRoute = async () => {
    if (!journey.currentPosition) return;
    setIsLoading(true);
    setIsRerouting(true);
    setRerouteMessage(null);
    try {
      const originParam = { latitude: journey.currentPosition.lat, longitude: journey.currentPosition.lng };
      const destParam = journey.plannedRoute.length > 0
        ? { latitude: journey.plannedRoute[journey.plannedRoute.length - 1].lat, longitude: journey.plannedRoute[journey.plannedRoute.length - 1].lng }
        : (realDest ? { latitude: realDest.lat, longitude: realDest.lon } : { latitude: journey.currentPosition.lat + 0.01, longitude: journey.currentPosition.lng + 0.01 });

      const routes = await routeService.generateSafeRoutes(originParam, destParam, false);
      
      const bestNewRoute = routes.reduce((best, curr) => 
        (curr.routeSafetyResult?.score ?? 0) > (best.routeSafetyResult?.score ?? 0) ? curr : best
      , routes[0]);
      
      const bestScore = bestNewRoute?.routeSafetyResult?.score ?? 0;
      
      if (bestScore < journey.routeSafetyScore + 3 && routes.length <= 1) {
        setRerouteMessage("Current path already provides optimal safety coverage.");
        setRerouteOptions(routes);
      } else {
        setRerouteOptions(routes);
        if (routes.length > 0) setSelectedRerouteId(routes[0].id);
      }
    } catch (error: any) {
      console.error('Rerouting error:', error);
      setRerouteMessage(error.message || 'Failed to calculate alternative route.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmReroute = () => {
    if (!selectedReroute) return;
    updateActiveRoute(selectedReroute);
    addIncident({
      id: `incident-${Date.now()}`,
      timestamp: new Date(),
      type: 'ROUTE_RECALCULATED',
      severity: 'SAFE',
      description: `Rerouted to safer option. Score improved from ${journey.routeSafetyScore} to ${selectedReroute.routeSafetyResult?.score ?? 0}.`,
      acknowledged: true
    });
    setIsRerouting(false);
  };

  // Map display data
  const hasLocation = journey.isActive || Boolean(loc.latitude && loc.longitude);

  const mapOrigin = phase !== 'PLANNING'
    ? { lat: selectedRoute.waypoints[0].lat, lng: selectedRoute.waypoints[0].lng, label: 'Current Location' }
    : (loc.latitude && loc.longitude ? { lat: loc.latitude, lng: loc.longitude, label: 'Your Location' } : undefined);

  const mapDest = phase !== 'PLANNING'
    ? { lat: selectedRoute.waypoints[selectedRoute.waypoints.length - 1].lat, lng: selectedRoute.waypoints[selectedRoute.waypoints.length - 1].lng, label: realDest?.name || 'Destination' }
    : (realDest ? { lat: realDest.lat, lng: realDest.lon, label: realDest.name } : undefined);

  const mapPos = journey.isActive 
    ? (journey.currentPosition ?? selectedRoute.waypoints[0]) 
    : (loc.latitude && loc.longitude ? { lat: loc.latitude, lng: loc.longitude } : null);

  const mapRoute = phase === 'PLANNING' ? [] : (journey.isActive ? journey.plannedRoute : selectedRoute.waypoints);
  const safetyPoints = phase === 'PLANNING' ? [] : (journey.isActive ? journey.safetyPoints : selectedRoute.safetyPoints);
  const riskLevel = journey.riskLevel;

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100dvh-9rem)] lg:h-[calc(100dvh-4.5rem)] overflow-hidden bg-blush-200">
      
      {/* ── Map Container ── */}
      <div className="relative flex-1 min-h-[42vh] lg:min-h-0 p-3 sm:p-4 lg:p-5">
        <JourneyMap
          origin={mapOrigin}
          destination={mapDest}
          currentPosition={mapPos}
          hasLocation={hasLocation}
          waypoints={mapRoute}
          safetyPoints={safetyPoints}
          riskLevel={riskLevel}
          isActive={journey.isActive}
          className="w-full h-full"
        />

        {/* Map overlay — Status Pill Top Left */}
        <div className="absolute top-7 left-7 right-7 pointer-events-none flex items-center justify-between">
          {phase === 'MONITORING' ? (
            <div className={cn(
              'inline-flex items-center gap-2.5 px-4 py-2.5 rounded-2xl bg-white/95 border backdrop-blur-md text-xs font-bold pointer-events-auto shadow-card-hover',
              ['denied', 'unavailable', 'timeout', 'low_accuracy'].includes(journey.locationStatus)
                ? 'border-rose-300 text-rose-700'
                : 'border-pink-200 text-slate-800'
            )}>
              {['denied', 'unavailable', 'timeout', 'low_accuracy'].includes(journey.locationStatus) ? (
                <AlertTriangle className="w-4 h-4 text-rose-500" />
              ) : (
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              )}
              
              <span>
                {journey.locationStatus === 'live' ? 'Live GPS Guard Active' :
                 journey.locationStatus === 'simulated' ? 'Safe Route Simulation Active' :
                 journey.locationStatus === 'denied' ? 'Location Permission Denied' :
                 journey.locationStatus === 'low_accuracy' ? 'Low Location Accuracy' :
                 journey.locationStatus === 'pending' ? 'Acquiring GPS...' :
                 'Location Unavailable'}
              </span>
            </div>
          ) : phase === 'SELECTING' ? (
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-white/95 border border-pink-200 backdrop-blur-md text-xs font-bold text-slate-800 shadow-card pointer-events-auto">
              <Route className="w-4 h-4 text-primary-500" />
              <span>Route Preview</span>
            </div>
          ) : null}
        </div>

        {/* Map overlay — ETA Pill Bottom Left */}
        {phase === 'MONITORING' && (
          <div className="absolute bottom-9 left-7 pointer-events-none">
            <div className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white/95 border border-pink-200 backdrop-blur-md text-xs text-slate-800 shadow-card pointer-events-auto">
              <Clock className="w-4 h-4 text-primary-500" />
              <span className="font-extrabold text-slate-900">{journey.etaMins} min</span>
              <span className="text-slate-500 font-medium">ETA</span>
            </div>
          </div>
        )}
      </div>

      {/* ── Side Control & Route Card Panel ── */}
      <div className="lg:w-[440px] flex flex-col overflow-y-auto bg-white/90 backdrop-blur-xl border-t lg:border-t-0 lg:border-l border-pink-200/80 shadow-[-4px_0_24px_rgba(232,93,117,0.04)] relative">
        
        {/* Phase 1: Planning */}
        {phase === 'PLANNING' && (
          <div className="p-6 sm:p-7 flex flex-col h-full animate-fade-in space-y-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-50 border border-primary-200/60 text-primary-700 text-xs font-bold mb-2 shadow-sm">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Predictive Safe Navigation</span>
              </div>
              <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Plan a Safer Route</h2>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Choose a destination. Saheli scores real corridors by police presence, lighting, and 24/7 open businesses.
              </p>
            </div>
            
            <form onSubmit={handleGenerateRoutes} className="space-y-4 flex-1">
              {/* Origin / Current Location Button */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider ml-1">Starting Point</label>
                <div 
                  onClick={() => !loc.latitude && loc.requestLocation()}
                  className={cn(
                    "w-full bg-white border rounded-2xl py-3.5 px-4 flex items-center justify-between transition-all duration-200 shadow-sm",
                    loc.latitude
                      ? "border-emerald-200 bg-emerald-50/40 cursor-default"
                      : "border-pink-200 cursor-pointer hover:border-primary-300 hover:bg-blush-50/50",
                    loc.permissionState === 'denied' && "border-rose-300 bg-rose-50/40"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <Target className={cn("w-5 h-5", loc.latitude ? "text-emerald-600" : loc.permissionState === 'denied' ? "text-rose-500" : "text-primary-500")} />
                    <span className={cn("text-xs font-bold truncate", loc.latitude ? "text-emerald-800" : loc.permissionState === 'denied' ? "text-rose-700" : "text-slate-700")}>
                      {loc.loading ? 'Detecting GPS location...' : 
                       loc.latitude ? 'Your current location detected' : 
                       loc.permissionState === 'denied' ? 'Location permission needed' : 
                       '◎ Tap to use current location'}
                    </span>
                  </div>
                  {loc.latitude && (
                    <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded-full">
                      GPS Active
                    </span>
                  )}
                </div>
                {loc.error && <p className="text-xs text-rose-600 mt-1 ml-1">{loc.error}</p>}
                {loc.permissionState === 'denied' && (
                  <Button variant="outline" size="sm" className="mt-2" onClick={() => loc.requestLocation()}>
                    Grant Location Permission
                  </Button>
                )}
              </div>
              
              {/* Destination Autocomplete */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider ml-1">Destination</label>
                <LocationAutocomplete 
                  onSelect={setRealDest} 
                  userLocation={loc.latitude && loc.longitude ? { lat: loc.latitude, lng: loc.longitude } : null}
                  placeholder="Where are you heading?"
                />
              </div>

              {/* Submit CTA */}
              <div className="pt-3">
                {routeError && (
                  <div className="mb-4 p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0 text-rose-600" />
                    <span>{routeError}</span>
                  </div>
                )}
                
                <Button 
                  type="submit" 
                  variant="primary" 
                  fullWidth 
                  size="lg" 
                  disabled={isLoading || (!loc.latitude || !realDest)} 
                  leftIcon={isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Navigation2 className="w-5 h-5" />}
                >
                  {isLoading ? 'Finding a safer way...' : 'Show Safer Routes'}
                </Button>
              </div>
            </form>
          </div>
        )}

        {/* Phase 2: Route Selection */}
        {phase === 'SELECTING' && (
          <div className="flex flex-col h-full animate-fade-in">
            <div className="px-6 pt-6 pb-4 border-b border-pink-100 flex-shrink-0">
              <button 
                onClick={() => setLocalPhase('PLANNING')}
                className="text-xs text-primary-600 hover:text-primary-700 font-bold flex items-center gap-1 mb-3 transition-colors"
              >
                <ChevronRight className="w-4 h-4 rotate-180" /> Change Destination
              </button>
              <h2 className="text-lg font-extrabold text-slate-900 tracking-tight">Select Safe Route</h2>
              <p className="text-xs text-slate-500 mt-0.5">Found {generatedRoutes.length} route options evaluated with safety landmarks.</p>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {generatedRoutes.map(route => {
                const isSelected = route.id === selectedRouteId;
                const isSafest = route.type === 'SAFEST';
                const isExpanded = expandedWhyRoute === route.id;
                
                return (
                  <div
                    key={route.id}
                    onClick={() => setSelectedRouteId(route.id)}
                    className={cn(
                      'relative p-5 rounded-3xl border transition-all duration-300 cursor-pointer shadow-card',
                      isSelected
                        ? 'bg-white border-primary-400 ring-2 ring-primary-200/50 shadow-card-hover -translate-y-0.5'
                        : 'bg-white/80 border-pink-200/80 hover:border-primary-300 hover:bg-white'
                    )}
                  >
                    {isSafest && (
                      <div className="absolute -top-3 left-5 bg-gradient-to-r from-primary-500 to-rose-400 text-white text-[10px] font-extrabold px-3 py-0.5 rounded-full flex items-center gap-1 shadow-soft-pink">
                        <ShieldCheck className="w-3.5 h-3.5" /> RECOMMENDED SAFE ROUTE
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between gap-3 mb-3">
                      <div>
                        <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                          {route.label}
                        </h3>
                        <p className="text-xs text-slate-500 mt-0.5 font-medium">{route.distanceKm} km • {route.etaMins} min</p>
                      </div>
                      <RouteSafetyScore
                        score={route.routeSafetyResult?.score ?? 50}
                        riskLevel={(route.routeSafetyResult?.score ?? 50) > 80 ? 'SAFE' : (route.routeSafetyResult?.score ?? 50) > 50 ? 'CAUTION' : 'HIGH_RISK'}
                        size="sm"
                        showLabel={false}
                      />
                    </div>

                    {/* Coverage badge */}
                    <div className="flex items-center gap-2 text-xs text-slate-600 mb-3">
                      <span className="flex items-center gap-1.5 bg-blush-100 text-primary-700 font-bold px-2.5 py-1 rounded-xl border border-pink-200/60 text-[11px]">
                        <Shield className="w-3.5 h-3.5 text-primary-500" />
                        {route.coverageSummary?.label || `${route.safetyPoints.length} Safety Points`}
                      </span>
                    </div>

                    {/* Recommendation reason if safest */}
                    {isSafest && route.recommendation && (
                      <div className="mb-3 p-3 rounded-2xl bg-primary-50/70 border border-primary-200/70 text-xs">
                        <p className="text-primary-900 font-medium leading-relaxed">
                          {route.recommendation.reason}
                        </p>
                      </div>
                    )}

                    {/* Expandable Accordion: Why this route? */}
                    {route.routeSafetyResult && (
                      <div className="mt-2 pt-2 border-t border-pink-50">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setExpandedWhyRoute(isExpanded ? null : route.id);
                          }}
                          className="w-full flex items-center justify-between text-xs font-bold text-slate-700 hover:text-primary-600 py-1 transition-colors"
                        >
                          <span>Why this route?</span>
                          <ChevronDown className={cn("w-4 h-4 transition-transform duration-200", isExpanded && "rotate-180")} />
                        </button>

                        {isExpanded && (
                          <div className="mt-2 space-y-1.5 text-xs animate-slide-up">
                            {route.routeSafetyResult.strengths.map((str, i) => (
                              <div key={i} className="flex items-start gap-2 text-emerald-800 font-medium">
                                <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                                <span>{str}</span>
                              </div>
                            ))}
                            {route.routeSafetyResult.weaknesses.map((weak, i) => (
                              <div key={i} className="flex items-start gap-2 text-amber-800 font-medium">
                                <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                                <span>{weak}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            
            {/* Start Journey CTA */}
            <div className="p-6 border-t border-pink-100 bg-white/95 flex-shrink-0">
              <Button onClick={handleStartJourney} variant="primary" fullWidth size="lg" leftIcon={<Play className="w-5 h-5" />}>
                Start Safe Journey
              </Button>
            </div>
          </div>
        )}

        {/* Phase 3: Active Monitoring */}
        {phase === 'MONITORING' && (
          <div className="flex flex-col h-full animate-fade-in">
            {/* Origin & Destination Bar */}
            <div className="px-6 pt-6 pb-4 border-b border-pink-100 flex-shrink-0">
              <div className="flex items-center gap-3 text-xs font-bold text-slate-600 mb-4 bg-blush-50 p-3 rounded-2xl border border-pink-200/60">
                <div className="flex items-center gap-1.5 truncate">
                  <div className="w-2.5 h-2.5 rounded-full bg-primary-500" />
                  <span className="truncate">{journey.origin.split(',')[0]}</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                <div className="flex items-center gap-1.5 truncate">
                  <span className="truncate text-slate-900">{journey.destination.split(',')[0]}</span>
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2.5">
                <Button id="safe-checkin-btn" variant="safe" fullWidth leftIcon={<CheckCircle className="w-4 h-4" />} onClick={acknowledgeSafetyCheck}>
                  I'm Safe
                </Button>
                <Button id="end-journey-btn" variant="secondary" leftIcon={<Square className="w-4 h-4" />} onClick={handleEndJourney} className="flex-shrink-0">
                  End Journey
                </Button>
              </div>
            </div>

            {/* Deviation Alert Card */}
            {journey.deviationDetected && (
              <div className="px-6 py-5 border-b border-rose-200 bg-rose-50/90 flex-shrink-0 animate-fade-in">
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <AlertTriangle className="w-5 h-5 text-rose-600" />
                  </div>
                  <div>
                    <h4 className="text-sm font-extrabold text-rose-900">Route Deviation Detected</h4>
                    <p className="text-xs text-rose-700 mt-0.5">You're moving away from your selected safe corridor.</p>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <Button variant="danger" size="sm" fullWidth onClick={handleFindSaferRoute} disabled={isLoading}>
                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Find Safer Reroute'}
                  </Button>
                  <Button variant="secondary" size="sm" fullWidth onClick={handleContinueRoute} disabled={isLoading}>
                    Continue Anyway
                  </Button>
                  <Button variant="outline" size="sm" fullWidth className="text-rose-700 border-rose-300 hover:bg-rose-100" onClick={() => navigate('/emergency')}>
                    Emergency SOS
                  </Button>
                </div>
              </div>
            )}

            {/* Live Safety Score Card */}
            <div className="px-6 py-4 border-b border-pink-100 flex-shrink-0 bg-white">
              <div className="flex items-center gap-5">
                <RouteSafetyScore score={journey.routeSafetyScore} riskLevel={riskLevel} size="sm" />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-base font-extrabold text-slate-900">{journey.routeSafetyScore}/100</p>
                    <RiskBadge level={riskLevel} />
                  </div>
                  <p className="text-xs text-slate-500 font-medium">Live Journey Safety Score</p>
                  <p className="text-[10px] text-primary-600 font-bold mt-1 uppercase tracking-wider">{journey.routeType} ROUTE MONITORED</p>
                </div>
              </div>
            </div>
            
            {/* Nearby Safety Support Locations */}
            <div className="px-6 py-4 border-b border-pink-100 flex-shrink-0">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Nearby Safety Support ({safetyPoints.length})</h3>
              {safetyPoints.length === 0 ? (
                <p className="text-xs text-slate-500">No registered safety locations on this section.</p>
              ) : (
                <div className="space-y-2.5">
                  {safetyPoints.slice(0, 4).map(sp => (
                    <div key={sp.id} className="flex justify-between items-center text-xs p-2 rounded-xl bg-blush-50/60 border border-pink-100">
                      <div className="flex items-center gap-2 truncate pr-2">
                        <span className="text-slate-800 font-bold truncate max-w-[170px]" title={sp.name}>{sp.name}</span>
                        {sp.openingStatus === 'OPEN_24_7' && <span className="text-[9px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold flex-shrink-0">24/7</span>}
                        {sp.openingStatus === 'OPEN' && <span className="text-[9px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold flex-shrink-0">Open</span>}
                        {sp.openingStatus === 'CLOSED' && <span className="text-[9px] bg-rose-100 text-rose-700 px-2 py-0.5 rounded-full font-bold flex-shrink-0">Closed</span>}
                      </div>
                      <span className="text-slate-500 font-semibold flex-shrink-0">{sp.distanceFromRouteMeters}m</span>
                    </div>
                  ))}
                  {safetyPoints.length > 4 && (
                    <p className="text-xs font-bold text-primary-600 pt-1">+ {safetyPoints.length - 4} more safety points along path</p>
                  )}
                </div>
              )}
            </div>

            {/* Live Monitoring Events */}
            <div className="px-6 py-4 flex-1">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Journey Events</h3>
              {RECENT_EVENTS.length === 0 ? (
                <div className="text-center py-6 text-slate-400 text-xs">No anomalies recorded</div>
              ) : (
                <div className="space-y-3">
                  {RECENT_EVENTS.map(event => (
                    <div key={event.id} className="flex items-start gap-3">
                      <div className={cn('w-2 h-2 rounded-full mt-1.5 flex-shrink-0',
                        event.severity === 'success' ? 'bg-emerald-500' :
                        event.severity === 'warning' ? 'bg-amber-500' :
                        event.severity === 'critical' ? 'bg-rose-500 animate-pulse' : 'bg-primary-500'
                      )} />
                      <div className="flex-1">
                        <p className="text-xs font-bold text-slate-800">{event.title}</p>
                        <p className="text-[11px] text-slate-500 mt-0.5">{event.description}</p>
                      </div>
                      <p className="text-[10px] text-slate-400 font-semibold flex-shrink-0">{formatTime(event.timestamp)}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Safety Check Modal */}
      <Modal isOpen={journey.safetyCheckPending} onClose={acknowledgeSafetyCheck} title="Safety Check-In" size="sm">
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-4 rounded-2xl bg-amber-50 border border-amber-200">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm font-bold text-amber-900">We noticed something unusual. Are you safe?</p>
          </div>
          <div className="flex gap-3">
            <Button variant="safe" fullWidth leftIcon={<CheckCircle className="w-4 h-4" />} onClick={acknowledgeSafetyCheck}>
              Yes, I'm Safe
            </Button>
            <Button variant="danger" fullWidth leftIcon={<AlertTriangle className="w-4 h-4" />} onClick={() => { acknowledgeSafetyCheck(); updateRiskLevel('HIGH_RISK'); }}>
              Need Help
            </Button>
          </div>
        </div>
      </Modal>

      {/* Rerouting Modal */}
      <Modal isOpen={isRerouting} onClose={() => setIsRerouting(false)} title="Select Safer Route" size="md">
        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
          {rerouteMessage ? (
             <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-start gap-3">
               <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
               <p className="text-sm font-semibold text-amber-900">{rerouteMessage}</p>
             </div>
          ) : rerouteOptions.length === 0 && !isLoading ? (
            <p className="text-sm text-slate-500">No alternatives found from this location.</p>
          ) : (
            rerouteOptions.map(route => {
              const isSelected = route.id === selectedRerouteId;
              return (
                <div
                  key={route.id}
                  onClick={() => setSelectedRerouteId(route.id)}
                  className={cn(
                    'relative p-4 rounded-2xl border cursor-pointer transition-all duration-200',
                    isSelected ? 'bg-primary-50/80 border-primary-500 shadow-sm' : 'bg-white border-pink-200/80'
                  )}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm">{route.label}</h3>
                      <p className="text-xs text-slate-500 mt-0.5">{route.distanceKm} km • {route.etaMins} min</p>
                    </div>
                    <RouteSafetyScore score={route.routeSafetyResult?.score ?? 50} riskLevel={(route.routeSafetyResult?.score ?? 50) > 80 ? 'SAFE' : 'CAUTION'} size="sm" showLabel={false} />
                  </div>
                </div>
              );
            })
          )}
        </div>
        <div className="pt-4 border-t border-pink-100 mt-4 flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setIsRerouting(false)}>{rerouteMessage ? "Close" : "Cancel"}</Button>
          {!rerouteMessage && <Button variant="primary" onClick={handleConfirmReroute} disabled={!selectedRerouteId}>Confirm Safer Route</Button>}
        </div>
      </Modal>

    </div>
  );
}
