import React, { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import { useAuth } from './AuthContext';
import type { RiskLevel } from '../config/appConfig';
import { DEMO_SCENARIOS, type DemoScenario } from '../config/demoConfig';
import { INITIAL_JOURNEY, type JourneyState } from '../data/demoJourney';

// ─── Demo Context Types ────────────────────────────────────────────────────────

interface DemoContextValue {
  isDemoMode: boolean;
  toggleDemoMode: () => void;
  activeScenario: DemoScenario;
  setScenario: (id: string) => void;
  journey: JourneyState;
  setJourney: React.Dispatch<React.SetStateAction<JourneyState>>;
  updateRiskLevel: (level: RiskLevel) => void;
  updateRouteSafetyScore: (score: number) => void; // Keep for fallback/legacy logic if needed, but update signature if necessary. Actually let's just leave it since it's just a number.
  startJourney: (route: import('../config/demoConfig').RouteOption, origin: string, dest: string) => void;
  updateActiveRoute: (route: import('../config/demoConfig').RouteOption) => void;
  endJourney: () => void;
  triggerSafetyCheck: () => void;
  acknowledgeSafetyCheck: () => void;
  setDeviation: (detected: boolean) => void;
  addIncident: (incident: import('../data/demoJourney').Incident) => void;
}

const DemoContext = createContext<DemoContextValue | undefined>(undefined);

// ─── Demo Provider ─────────────────────────────────────────────────────────────

export function DemoProvider({ children }: { children: ReactNode }) {
  const { isDemoUser } = useAuth();
  const [isDemoMode, setIsDemoMode] = useState<boolean>(isDemoUser || true); // ON by default for hackathon
  const [activeScenario, setActiveScenario] = useState<DemoScenario>(DEMO_SCENARIOS[0]);
  const [journey, setJourney] = useState<JourneyState>(INITIAL_JOURNEY);

  useEffect(() => {
    if (isDemoUser) {
      setIsDemoMode(true);
    }
  }, [isDemoUser]);

  const toggleDemoMode = useCallback(() => {
    setIsDemoMode(prev => !prev);
  }, []);

  const setScenario = useCallback((id: string) => {
    const found = DEMO_SCENARIOS.find(s => s.id === id);
    if (found) setActiveScenario(found);
  }, []);

  const updateRiskLevel = useCallback((level: RiskLevel) => {
    setJourney(prev => ({ ...prev, riskLevel: level }));
  }, []);

  const updateRouteSafetyScore = useCallback((score: number) => {
    setJourney(prev => ({ ...prev, routeSafetyScore: Math.max(0, Math.min(100, score)) }));
  }, []);

  const startJourney = useCallback((route: import('../config/demoConfig').RouteOption, origin: string, dest: string) => {
    setJourney(prev => ({
      ...prev,
      isActive: true,
      startTime: new Date(),
      endTime: null,
      origin: origin,
      destination: dest,
      etaMins: route.etaMins,
      riskLevel: 'SAFE',
      routeSafetyScore: route.routeSafetyResult?.score ?? prev.routeSafetyScore,
      routeType: route.type,
      plannedRoute: route.waypoints,
      safetyPoints: route.safetyPoints,
      incidents: [],
      safetyCheckPending: false,
      deviationDetected: false,
      waypointIndex: 0,
      currentPosition: route.waypoints[0],
      locationStatus: 'pending',
    }));
  }, []);

  const updateActiveRoute = useCallback((route: import('../config/demoConfig').RouteOption) => {
    setJourney(prev => ({
      ...prev,
      routeType: route.type,
      plannedRoute: route.waypoints,
      safetyPoints: route.safetyPoints,
      routeSafetyScore: route.routeSafetyResult?.score ?? prev.routeSafetyScore,
      etaMins: route.etaMins,
      deviationDetected: false,
      safetyCheckPending: false,
      riskLevel: 'SAFE'
    }));
  }, []);

  const endJourney = useCallback(() => {
    setJourney(prev => ({
      ...prev,
      isActive: false,
      endTime: new Date(),
      safetyCheckPending: false,
      deviationDetected: false,
      locationStatus: 'pending',
    }));
  }, []);

  const triggerSafetyCheck = useCallback(() => {
    setJourney(prev => ({ ...prev, safetyCheckPending: true }));
  }, []);

  const acknowledgeSafetyCheck = useCallback(() => {
    setJourney(prev => ({ ...prev, safetyCheckPending: false }));
  }, []);

  const setDeviation = useCallback((detected: boolean) => {
    setJourney(prev => ({ ...prev, deviationDetected: detected }));
  }, []);

  const addIncident = useCallback((incident: import('../data/demoJourney').Incident) => {
    setJourney(prev => ({ ...prev, incidents: [...prev.incidents, incident] }));
  }, []);

  return (
    <DemoContext.Provider value={{
      isDemoMode,
      toggleDemoMode,
      activeScenario,
      setScenario,
      journey,
      setJourney,
      updateRiskLevel,
      updateRouteSafetyScore,
      startJourney,
      endJourney,
      triggerSafetyCheck,
      acknowledgeSafetyCheck,
      setDeviation,
      addIncident,
      updateActiveRoute,
    }}>
      {children}
    </DemoContext.Provider>
  );
}

// ─── Hook ──────────────────────────────────────────────────────────────────────

export function useDemo(): DemoContextValue {
  const ctx = useContext(DemoContext);
  if (!ctx) throw new Error('useDemo must be used inside DemoProvider');
  return ctx;
}
