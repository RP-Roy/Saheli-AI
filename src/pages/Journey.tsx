import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Play, Square, MapPin, Clock, ChevronRight,
  AlertTriangle, CheckCircle, Radio, Target, ShieldCheck, Route, Search, Loader2, BookOpen
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
    console.log("USER_CONTINUED_AFTER_DEVIATION");
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
    <div className="flex flex-col lg:flex-row h-[calc(100dvh-9rem)] lg:h-[calc(100dvh-4.5rem)] overflow-hidden">
      {/* ── Map Area ── */}
      <div className="relative flex-1 min-h-[40vh] lg:min-h-0">
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

        {/* Map overlay — status pill */}
        <div className="absolute top-4 left-4 right-4 pointer-events-none">
          {phase === 'MONITORING' ? (
            <div className={cn(
              'inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border backdrop-blur-md text-sm font-semibold pointer-events-auto shadow-glass-sm',
              ['denied', 'unavailable', 'timeout', 'low_accuracy'].includes(journey.locationStatus)
                ? 'bg-danger-500/20 border-danger-500/40 text-danger-300'
                : riskLevel === 'SAFE'      ? 'bg-safe-500/20 border-safe-500/40 text-safe-300'       :
                  riskLevel === 'CAUTION'   ? 'bg-caution-500/20 border-caution-500/40 text-caution-300' :
                                              'bg-danger-500/20 border-danger-500/40 text-danger-300 animate-pulse',
            )}>
              {['denied', 'unavailable', 'timeout', 'low_accuracy'].includes(journey.locationStatus) ? (
                <AlertTriangle className="w-4 h-4" />
              ) : (
                <Radio className={cn("w-4 h-4", journey.locationStatus === 'live' && "animate-pulse")} />
              )}
              
              <span>
                {journey.locationStatus === 'live' ? 'Live location active' :
                 journey.locationStatus === 'simulated' ? 'Simulation Active' :
                 journey.locationStatus === 'denied' ? 'Location Permission Denied' :
                 journey.locationStatus === 'low_accuracy' ? 'Low Location Accuracy' :
                 journey.locationStatus === 'pending' ? 'Acquiring Location...' :
                 'Location Unavailable'}
              </span>
            </div>
          ) : phase === 'SELECTING' ? (
            <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-surface-800/90 border border-white/10 backdrop-blur-md text-sm text-slate-200 shadow-glass-sm pointer-events-auto">
              <Route className="w-4 h-4 text-primary-400" />
              <span>Route Preview</span>
            </div>
          ) : null}
        </div>

        {/* Map overlay — ETA pill */}
        {phase === 'MONITORING' && (
          <div className="absolute bottom-4 left-4 pointer-events-none">
            <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-surface-800/90 border border-white/10 backdrop-blur-md text-sm text-slate-200 shadow-glass-sm pointer-events-auto">
              <Clock className="w-4 h-4 text-primary-400" />
              <span className="font-medium">{journey.etaMins} min</span>
              <span className="text-slate-500">ETA</span>
            </div>
          </div>
        )}
      </div>

      {/* ── Info Panel ── */}
      <div className="lg:w-[420px] flex flex-col overflow-y-auto bg-surface-900 border-t lg:border-t-0 lg:border-l border-white/10 relative">
        
        {phase === 'PLANNING' && (
          <div className="p-6 flex flex-col h-full animate-fade-in">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-white mb-2">Plan a Safe Route</h2>
              <p className="text-sm text-slate-400">Enter your destination to find the safest way there.</p>
            </div>
            
            <form onSubmit={handleGenerateRoutes} className="space-y-4 flex-1">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider ml-1">Current Location</label>
                <div 
                  onClick={() => !loc.latitude && loc.requestLocation()}
                  className={cn(
                    "w-full bg-surface-800 border rounded-xl py-3 px-4 flex items-center gap-3 transition-colors",
                    loc.latitude ? "border-safe-500/50 cursor-default" : "border-white/10 cursor-pointer hover:border-primary-500/50",
                    loc.permissionState === 'denied' && "border-danger-500/50"
                  )}
                >
                  <Target className={cn("w-5 h-5", loc.latitude ? "text-safe-400" : loc.permissionState === 'denied' ? "text-danger-400" : "text-primary-400")} />
                  <span className={cn("text-sm", loc.latitude || loc.permissionState === 'denied' ? "text-white" : "text-slate-400")}>
                    {loc.loading ? 'Detecting your location...' : 
                     loc.latitude ? 'Your location ✓' : 
                     loc.permissionState === 'denied' ? '⚠ Enable location' : 
                     '◎ Your location'}
                  </span>
                </div>
                {loc.error && <p className="text-xs text-danger-400 mt-1 ml-1">{loc.error}</p>}
                {loc.permissionState === 'denied' && (
                  <Button variant="outline" size="sm" className="mt-2" onClick={() => loc.requestLocation()}>
                    Allow Location
                  </Button>
                )}
              </div>
              
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider ml-1">Destination</label>
                <LocationAutocomplete 
                  onSelect={setRealDest} 
                  userLocation={loc.latitude && loc.longitude ? { lat: loc.latitude, lng: loc.longitude } : null}
                />
              </div>

              <div className="pt-4">
                {routeError && (
                  <div className="mb-4 p-3 rounded-xl bg-danger-500/10 border border-danger-500/30 text-danger-400 text-sm flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span>{routeError}</span>
                  </div>
                )}
                <Button 
                  type="submit" 
                  variant="primary" 
                  fullWidth 
                  size="lg" 
                  disabled={isLoading || (!loc.latitude || !realDest)} 
                  leftIcon={isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
                >
                  {isLoading ? 'Analyzing routes...' : 'Show safer routes'}
                </Button>
              </div>
            </form>
          </div>
        )}

        {phase === 'SELECTING' && (
          <div className="flex flex-col h-full animate-fade-in">
            <div className="px-5 pt-5 pb-4 border-b border-white/10 flex-shrink-0">
              <button 
                onClick={() => setLocalPhase('PLANNING')}
                className="text-xs text-primary-400 hover:text-primary-300 font-medium flex items-center gap-1 mb-4"
              >
                <ChevronRight className="w-4 h-4 rotate-180" /> Back to planning
              </button>
              <h2 className="text-lg font-bold text-white">Select Route</h2>
              <p className="text-xs text-slate-400 mt-1">Found {generatedRoutes.length} options. We analyzed points of interest along the way.</p>
            </div>
            
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {generatedRoutes.map(route => {
                const isSelected = route.id === selectedRouteId;
                const isSafest = route.type === 'SAFEST';
                return (
                  <div
                    key={route.id}
                    onClick={() => setSelectedRouteId(route.id)}
                    className={cn(
                      'relative p-4 rounded-2xl border cursor-pointer transition-all duration-300',
                      isSelected ? 'bg-primary-900/30 border-primary-500 shadow-glow-primary/20' : 'bg-surface-800 border-white/10 hover:border-white/20'
                    )}
                  >
                    {isSafest && (
                      <div className="absolute -top-3 left-4 bg-safe-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3" /> RECOMMENDED
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-white flex items-center gap-2">
                          {route.label}
                        </h3>
                        <p className="text-xs text-slate-400 mt-0.5">{route.distanceKm} km • {route.etaMins} min</p>
                      </div>
                      <RouteSafetyScore score={route.routeSafetyResult?.score ?? 50} riskLevel={(route.routeSafetyResult?.score ?? 50) > 80 ? 'SAFE' : (route.routeSafetyResult?.score ?? 50) > 50 ? 'CAUTION' : 'HIGH_RISK'} size="sm" showLabel={false} />
                    </div>
                    
                    {isSelected && route.routeSafetyResult && (
                      <div className="mb-3 bg-surface-900/50 rounded-lg p-3 text-xs border border-white/5">
                        <p className="font-semibold text-slate-300 mb-2">Why this route?</p>
                        <div className="space-y-1.5">
                          {route.routeSafetyResult.strengths.map((str, i) => (
                            <div key={i} className="flex items-start gap-1.5 text-safe-300">
                              <span className="shrink-0 mt-0.5">✓</span>
                              <span>{str}</span>
                            </div>
                          ))}
                          {route.routeSafetyResult.weaknesses.map((weak, i) => (
                            <div key={i} className="flex items-start gap-1.5 text-caution-400">
                              <AlertTriangle className="w-3 h-3 shrink-0 mt-0.5" />
                              <span>{weak}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {isSafest && route.recommendation && (
                      <div className="mb-3">
                        <div className="bg-safe-500/10 border border-safe-500/30 rounded-lg p-3">
                          <p className="text-xs text-safe-200 mb-2 leading-relaxed">
                            {route.recommendation.reason}
                          </p>
                          {!route.recommendation.comparison.isFastest && (
                            <div className="flex gap-2 text-[10px] font-bold uppercase tracking-wider">
                              <span className="bg-surface-800 text-slate-300 px-2 py-1 rounded">
                                +{route.recommendation.comparison.timeDiffMins} min
                              </span>
                              <span className="bg-safe-500/20 text-safe-400 px-2 py-1 rounded">
                                +{route.recommendation.comparison.scoreDiff} safety points
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                    
                    <div className="flex items-center gap-2 text-xs text-slate-300">
                      <span className="flex items-center gap-1 bg-surface-700/50 px-2 py-1 rounded-md">
                        <ShieldCheck className="w-3.5 h-3.5 text-safe-400" /> {route.coverageSummary?.label || `${route.safetyPoints.length} Safety Points`}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
            
            <div className="p-5 border-t border-white/10 bg-surface-900 flex-shrink-0">
              <div className="mb-4">
                <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Before You Go</h3>
                {(() => {
                  const isNight = new Date().getHours() >= 18 || new Date().getHours() <= 5;
                  const hasLimitedCoverage = (selectedRoute.routeSafetyResult?.score ?? 100) < 60;
                  const recommendedQuery = isNight ? 'night' : hasLimitedCoverage ? 'awareness' : 'basics';
                  const contextualVideos = getRecommendedResources(recommendedQuery).slice(0, 2);

                  return (
                    <div className="space-y-2">
                      {contextualVideos.map(v => (
                        <div key={v.id} className="flex items-center justify-between bg-surface-800 p-2.5 rounded-xl border border-white/5">
                          <div className="flex items-center gap-3 min-w-0">
                            <img src={v.thumbnailUrl} alt={v.title} className="w-10 h-8 rounded-md object-cover flex-shrink-0" />
                            <p className="text-xs font-medium text-slate-200 truncate pr-2">{v.title}</p>
                          </div>
                          <button onClick={() => navigate('/learn')} className="text-[10px] bg-primary-500/20 text-primary-300 px-2 py-1 rounded font-semibold hover:bg-primary-500/30 whitespace-nowrap flex-shrink-0">
                            Watch
                          </button>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>
              <Button onClick={handleStartJourney} variant="primary" fullWidth size="lg" leftIcon={<Play className="w-5 h-5" />}>
                Start Journey
              </Button>
            </div>
          </div>
        )}

        {phase === 'MONITORING' && (
          <div className="flex flex-col h-full animate-fade-in">
            {/* Route header */}
            <div className="px-5 pt-5 pb-3 border-b border-white/10 flex-shrink-0">
              <div className="flex items-center gap-2 text-sm text-slate-400 mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-primary-500 ring-2 ring-primary-500/30" />
                  <span className="font-medium text-slate-200 text-xs truncate max-w-[130px]">{journey.origin.split(',')[0]}</span>
                </div>
                <div className="flex-1 h-px bg-white/10 mx-1" />
                <div className="flex items-center gap-2">
                  <span className="font-medium text-slate-200 text-xs truncate max-w-[130px]">{journey.destination.split(',')[0]}</span>
                  <div className="w-2.5 h-2.5 rounded-full bg-safe-500 ring-2 ring-safe-500/30" />
                </div>
              </div>

              {/* Journey controls */}
              <div className="flex gap-2">
                <Button id="safe-checkin-btn" variant="safe" fullWidth leftIcon={<CheckCircle className="w-4 h-4" />} onClick={acknowledgeSafetyCheck}>
                  I'm Safe
                </Button>
                <Button id="end-journey-btn" variant="secondary" leftIcon={<Square className="w-4 h-4" />} onClick={handleEndJourney} className="flex-shrink-0">
                  End
                </Button>
              </div>
            </div>

            {/* Deviation Alert */}
            {journey.deviationDetected && (
              <div className="px-5 py-4 border-b border-danger-500/30 bg-danger-500/10 flex-shrink-0 animate-fade-in">
                <div className="flex items-start gap-3 mb-3">
                  <AlertTriangle className="w-5 h-5 text-danger-400 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-bold text-danger-200">You're moving away from your selected route.</h4>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <Button variant="danger" size="sm" fullWidth onClick={handleFindSaferRoute} disabled={isLoading}>
                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Find Safer Route'}
                  </Button>
                  <Button variant="secondary" size="sm" fullWidth onClick={handleContinueRoute} disabled={isLoading}>Continue Anyway</Button>
                  <Button variant="outline" size="sm" fullWidth className="text-danger-400 border-danger-500/30" onClick={() => navigate('/emergency')}>Emergency</Button>
                </div>
              </div>
            )}

            {/* Safety score */}
            <div className="px-5 py-4 border-b border-white/10 flex-shrink-0">
              <div className="flex items-center gap-5">
                <RouteSafetyScore score={journey.routeSafetyScore} riskLevel={riskLevel} size="sm" />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-base font-bold text-white">{journey.routeSafetyScore}/100</p>
                    <RiskBadge level={riskLevel} />
                  </div>
                  <p className="text-xs text-slate-400">Route Safety Score</p>
                  <p className="text-[10px] text-primary-400 font-medium mt-1 uppercase tracking-wider">{journey.routeType} ROUTE ACTIVE</p>
                </div>
              </div>
            </div>
            
            {/* Nearby Safety Places Detail Panel */}
            <div className="px-5 py-4 border-b border-white/10 flex-shrink-0">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Nearby Safety Support</h3>
              {safetyPoints.length === 0 ? (
                <p className="text-xs text-slate-500">No known safety locations mapped nearby.</p>
              ) : (
                <div className="space-y-3">
                  {safetyPoints.slice(0, 4).map(sp => (
                    <div key={sp.id} className="flex justify-between items-center text-xs">
                      <div className="flex items-center gap-2 truncate pr-2">
                        <span className="text-white font-medium truncate max-w-[160px]" title={sp.name}>{sp.name}</span>
                        {sp.openingStatus === 'OPEN_24_7' && <span className="text-[9px] bg-safe-500/20 text-safe-400 px-1.5 py-0.5 rounded uppercase font-bold flex-shrink-0" title="Open 24/7">24/7</span>}
                        {sp.openingStatus === 'OPEN' && <span className="text-[9px] bg-safe-500/20 text-safe-400 px-1.5 py-0.5 rounded uppercase font-bold flex-shrink-0" title="Open according to mapped hours">Open</span>}
                        {sp.openingStatus === 'CLOSED' && <span className="text-[9px] bg-danger-500/20 text-danger-400 px-1.5 py-0.5 rounded uppercase font-bold flex-shrink-0">Closed</span>}
                        {sp.openingStatus === 'UNKNOWN' && <span className="text-[9px] bg-surface-700 text-slate-400 px-1.5 py-0.5 rounded uppercase font-bold flex-shrink-0">Hours Unknown</span>}
                      </div>
                      <span className="text-slate-400 flex-shrink-0">{sp.distanceFromRouteMeters}m</span>
                    </div>
                  ))}
                  {safetyPoints.length > 4 && (
                    <div className="text-xs text-primary-400 pt-1">+ {safetyPoints.length - 4} more places along route</div>
                  )}
                </div>
              )}
            </div>

            {/* Event timeline */}
            <div className="px-5 py-4 flex-1">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Monitoring Events</h3>
              {RECENT_EVENTS.length === 0 ? (
                <div className="text-center py-6 text-slate-600 text-xs">No events yet</div>
              ) : (
                <div className="space-y-3">
                  {RECENT_EVENTS.map(event => (
                    <div key={event.id} className="flex items-start gap-3">
                      <div className={cn('w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0',
                        event.severity === 'success' ? 'bg-safe-500' :
                        event.severity === 'warning' ? 'bg-caution-500' :
                        event.severity === 'critical' ? 'bg-danger-500 animate-pulse' : 'bg-primary-500'
                      )} />
                      <div className="flex-1">
                        <p className="text-xs font-semibold text-slate-300">{event.title}</p>
                        <p className="text-[10px] text-slate-500 mt-0.5">{event.description}</p>
                      </div>
                      <p className="text-[10px] text-slate-600 flex-shrink-0">{formatTime(event.timestamp)}</p>
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
          <div className="flex items-start gap-3 p-4 rounded-xl bg-caution-500/10 border border-caution-500/30">
            <AlertTriangle className="w-5 h-5 text-caution-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-caution-200">We noticed something unusual. Are you safe?</p>
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
             <div className="p-4 rounded-xl bg-surface-800 border border-white/10 flex items-start gap-3">
               <AlertTriangle className="w-5 h-5 text-caution-400 flex-shrink-0 mt-0.5" />
               <p className="text-sm text-slate-300">{rerouteMessage}</p>
             </div>
          ) : rerouteOptions.length === 0 && !isLoading ? (
            <p className="text-sm text-slate-400">No alternatives found from this location.</p>
          ) : (
            rerouteOptions.map(route => {
              const isSelected = route.id === selectedRerouteId;
              const isSafest = route.type === 'SAFEST';
              return (
                <div
                  key={route.id}
                  onClick={() => setSelectedRerouteId(route.id)}
                  className={cn(
                    'relative p-4 rounded-2xl border cursor-pointer transition-all duration-300',
                    isSelected ? 'bg-primary-900/30 border-primary-500' : 'bg-surface-800 border-white/10'
                  )}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-white">{route.label}</h3>
                      <p className="text-xs text-slate-400 mt-0.5">{route.distanceKm} km • {route.etaMins} min</p>
                    </div>
                    <RouteSafetyScore score={route.routeSafetyResult?.score ?? 50} riskLevel={(route.routeSafetyResult?.score ?? 50) > 80 ? 'SAFE' : (route.routeSafetyResult?.score ?? 50) > 50 ? 'CAUTION' : 'HIGH_RISK'} size="sm" showLabel={false} />
                  </div>
                  
                  {isSelected && route.routeSafetyResult && (
                    <div className="mb-3 bg-surface-900/50 rounded-lg p-3 text-xs border border-white/5">
                      <div className="space-y-1.5">
                        {route.routeSafetyResult.strengths.map((str, i) => (
                          <div key={i} className="flex items-start gap-1.5 text-safe-300">
                            <span className="shrink-0 mt-0.5">✓</span><span>{str}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
        <div className="pt-4 border-t border-white/10 mt-4 flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setIsRerouting(false)}>{rerouteMessage ? "Close" : "Cancel"}</Button>
          {!rerouteMessage && <Button variant="primary" onClick={handleConfirmReroute} disabled={!selectedRerouteId}>Confirm Reroute</Button>}
        </div>
      </Modal>

    </div>
  );
}
