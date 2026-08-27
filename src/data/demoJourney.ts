import type { RiskLevel } from '../config/appConfig';
import type { Waypoint } from '../config/demoConfig';
import { DEMO_WAYPOINTS } from '../config/demoConfig';

// ─── Journey State ────────────────────────────────────────────────────────────

export interface JourneyState {
  id: string;
  isActive: boolean;
  startTime: Date | null;
  endTime: Date | null;
  origin: string;
  destination: string;
  etaMins: number;
  plannedRoute: Waypoint[];
  safetyPoints: import('../config/demoConfig').SafetyPlace[];
  routeType: import('../config/demoConfig').RouteType;
  currentPosition: Waypoint | null;
  waypointIndex: number;
  riskLevel: RiskLevel;
  routeSafetyScore: number; // 0-100 (replaces confidenceScore)
  incidents: Incident[];
  safetyCheckPending: boolean;
  deviationDetected: boolean;
  locationStatus: LocationStatus;
}

export type LocationStatus = 'pending' | 'live' | 'simulated' | 'denied' | 'unavailable' | 'low_accuracy' | 'timeout';

export interface Incident {
  id: string;
  timestamp: Date;
  type: 'ROUTE_DEVIATION' | 'UNEXPECTED_STOP' | 'DELAY' | 'TIME_RISK' | 'SOS' | 'ROUTE_RECALCULATED';
  severity: RiskLevel;
  description: string;
  acknowledged: boolean;
  location?: Waypoint;
}

// ─── Initial Demo Journey ─────────────────────────────────────────────────────

export const INITIAL_JOURNEY: JourneyState = {
  id: 'demo-journey-001',
  isActive: false,
  startTime: null,
  endTime: null,
  origin: 'MG Road Metro, Bengaluru',
  destination: 'Marathahalli Bridge, Bengaluru',
  etaMins: 36,
  plannedRoute: DEMO_WAYPOINTS,
  safetyPoints: [],
  routeType: 'SAFEST',
  currentPosition: DEMO_WAYPOINTS[0],
  waypointIndex: 0,
  riskLevel: 'SAFE',
  routeSafetyScore: 95,
  incidents: [],
  safetyCheckPending: false,
  deviationDetected: false,
  locationStatus: 'pending',
};

// ─── Demo Recent Journeys ─────────────────────────────────────────────────────

export interface PastJourney {
  id: string;
  date: string;
  origin: string;
  destination: string;
  durationMins: number;
  riskLevel: RiskLevel;
  incidents: number;
}

export const DEMO_PAST_JOURNEYS: PastJourney[] = [
  { id: 'pj1', date: 'Today, 9:15 AM',      origin: 'Home',          destination: 'Office',         durationMins: 34, riskLevel: 'SAFE',     incidents: 0 },
  { id: 'pj2', date: 'Yesterday, 8:45 PM',  origin: 'Phoenix Mall',  destination: 'Home',           durationMins: 28, riskLevel: 'CAUTION',  incidents: 1 },
  { id: 'pj3', date: 'Mon, 7:30 PM',        origin: 'Office',        destination: 'Gym',            durationMins: 15, riskLevel: 'SAFE',     incidents: 0 },
  { id: 'pj4', date: 'Sun, 10:00 PM',       origin: 'Indiranagar',   destination: 'Home',           durationMins: 22, riskLevel: 'HIGH_RISK',incidents: 2 },
];
