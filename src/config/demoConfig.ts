import type { RiskLevel } from './appConfig';

// ─── Demo Waypoints (Bangalore route) ─────────────────────────────────────────

export interface Waypoint {
  lat: number;
  lng: number;
  label: string;
  timestampOffset: number; // seconds from journey start
}

export type RouteType = 'SAFEST' | 'FASTEST' | 'BALANCED';

export interface RouteOption {
  id: string;
  type: RouteType;
  label: string;
  etaMins: number;
  distanceKm: number;
  routeSafetyResult?: RouteSafetyResult; // Replaces routeSafetyScore
  recommendation?: RouteRecommendation;
  coverageSummary?: RouteCoverageSummary;
  waypoints: Waypoint[];
  safetyPoints: SafetyPlace[];
}

export type RouteSafetyLevel = 'HIGHER_SAFETY_COVERAGE' | 'MODERATE_SAFETY_COVERAGE' | 'LIMITED_SAFETY_COVERAGE';

export interface RouteSafetyResult {
  score: number;
  level: RouteSafetyLevel;
  reasons: string[];
  strengths: string[];
  weaknesses: string[];
  coverage?: RouteCoverageSummary;
  safetyPlacesUsed?: number;
}

export interface RouteRecommendation {
  reason: string;
  comparison: {
    timeDiffMins: number;
    scoreDiff: number;
    isFastest: boolean;
  };
}

export type OpeningStatus = 'OPEN' | 'CLOSED' | 'OPEN_24_7' | 'UNKNOWN';

export interface SafetyPlace {
  id: string;
  name: string;
  category: 'POLICE' | 'HOSPITAL' | 'PHARMACY' | 'HOTEL' | 'FUEL' | 'SHOP' | 'CAFE_RESTAURANT' | 'OTHER_PUBLIC';
  latitude: number;
  longitude: number;
  distanceFromRouteMeters: number;
  openingStatus: OpeningStatus;
  openingHours: string | null;
  address: string | null;
  source: string;
}

export interface RouteCoverageSummary {
  policeCount: number;
  openPharmacyCount: number;
  openFuelCount: number;
  openHotelCount: number;
  hospitalCount: number;
  publicPlaceCount: number;
  maxStretchWithoutPlacesMeters: number;
  label: string; // e.g. "Best coverage", "Limited coverage"
}

export const DEMO_WAYPOINTS: Waypoint[] = [
  { lat: 12.9716,  lng: 77.5946,  label: 'MG Road',          timestampOffset: 0   },
  { lat: 12.9741,  lng: 77.6094,  label: 'Trinity Circle',    timestampOffset: 120 },
  { lat: 12.9784,  lng: 77.6408,  label: 'Indiranagar',       timestampOffset: 300 },
  { lat: 12.9831,  lng: 77.6523,  label: 'Domlur Flyover',    timestampOffset: 480 },
  { lat: 12.9950,  lng: 77.6593,  label: 'Old Airport Road',  timestampOffset: 660 },
  { lat: 13.0012,  lng: 77.6701,  label: 'Marathahalli',      timestampOffset: 900 },
];

// ─── Demo Trusted Contacts ────────────────────────────────────────────────────

export interface TrustedContact {
  id: string;
  name: string;
  relation: string;
  phone: string;
  avatar: string;
  notified: boolean;
}

export const DEMO_TRUSTED_CONTACTS: TrustedContact[] = [
  { id: 'c1', name: 'Priya Sharma',  relation: 'Mother',       phone: '+91 98765 43210', avatar: 'PS', notified: false },
  { id: 'c2', name: 'Arjun Mehta',   relation: 'Brother',      phone: '+91 98765 43211', avatar: 'AM', notified: false },
  { id: 'c3', name: 'Sneha Reddy',   relation: 'Best Friend',  phone: '+91 98765 43212', avatar: 'SR', notified: false },
];

// ─── Demo Journey Scenarios ───────────────────────────────────────────────────

export interface DemoScenario {
  id: string;
  label: string;
  description: string;
  events: DemoEvent[];
}

export interface DemoEvent {
  offsetMs: number;
  type: 'ROUTE_DEVIATION' | 'UNEXPECTED_STOP' | 'DELAY' | 'TIME_RISK' | 'SAFETY_CHECK' | 'STATUS_CHANGE';
  payload: Record<string, unknown>;
}

export const DEMO_SCENARIOS: DemoScenario[] = [
  {
    id: 'normal',
    label: 'Normal Journey',
    description: 'Journey proceeds on route with no anomalies detected.',
    events: [],
  },
  {
    id: 'route_deviation',
    label: 'Route Deviation',
    description: 'Journey deviates from the planned route, triggering a safety check.',
    events: [
      { offsetMs: 8_000,  type: 'STATUS_CHANGE',    payload: { riskLevel: 'CAUTION' as RiskLevel } },
      { offsetMs: 16_000, type: 'ROUTE_DEVIATION',  payload: { deviationMeters: 320 } },
      { offsetMs: 24_000, type: 'SAFETY_CHECK',     payload: { message: 'You appear to have deviated from your planned route.' } },
      { offsetMs: 48_000, type: 'STATUS_CHANGE',    payload: { riskLevel: 'HIGH_RISK' as RiskLevel } },
    ],
  },
  {
    id: 'unexpected_stop',
    label: 'Unexpected Stop',
    description: 'Journey stops in an unplanned location for an extended period.',
    events: [
      { offsetMs: 8_000,  type: 'UNEXPECTED_STOP', payload: { durationSecs: 180, location: 'Unknown area' } },
      { offsetMs: 12_000, type: 'STATUS_CHANGE',   payload: { riskLevel: 'CAUTION' as RiskLevel } },
      { offsetMs: 20_000, type: 'SAFETY_CHECK',    payload: { message: "You've been stationary for an unusual amount of time." } },
      { offsetMs: 40_000, type: 'STATUS_CHANGE',   payload: { riskLevel: 'HIGH_RISK' as RiskLevel } },
    ],
  },
];

// ─── Demo User ────────────────────────────────────────────────────────────────

export const DEMO_USER = {
  id: 'demo-user-001',
  name: 'Anjali Sharma',
  email: 'anjali@saheliai.demo',
  avatar: 'AS',
  phone: '+91 99999 00000',
};
