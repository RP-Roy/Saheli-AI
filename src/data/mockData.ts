import type { RiskLevel } from '../config/appConfig';

// ─── Active Journey ────────────────────────────────────────────────────────────

export const ACTIVE_JOURNEY = {
  id: 'j-active-001',
  isActive: true,
  origin: 'MG Road Metro Station',
  destination: 'Marathahalli Bridge',
  startTime: new Date(Date.now() - 14 * 60 * 1000), // 14 min ago
  estimatedArrival: new Date(Date.now() + 22 * 60 * 1000), // 22 min from now
  durationMins: 36,
  distanceKm: 11.4,
  riskLevel: 'SAFE' as RiskLevel,
  routeSafetyScore: 92,
  routeType: 'SAFEST' as import('../config/demoConfig').RouteType,
  currentWaypointIndex: 2,
  route: [
    { lat: 12.9716, lng: 77.5946, label: 'MG Road Metro' },
    { lat: 12.9741, lng: 77.6094, label: 'Trinity Circle' },
    { lat: 12.9784, lng: 77.6408, label: 'Indiranagar 100ft Rd' },
    { lat: 12.9831, lng: 77.6523, label: 'Domlur Flyover' },
    { lat: 12.9950, lng: 77.6593, label: 'Old Airport Rd' },
    { lat: 13.0012, lng: 77.6701, label: 'Marathahalli Bridge' },
  ],
  safetyPoints: [
    { id: 'sp1', category: 'POLICE', name: 'Cubbon Park Police Station', openingStatus: 'OPEN_24_7', openingHours: '24/7', address: null, source: 'demo', distanceFromRouteMeters: 50, latitude: 12.9730, longitude: 77.6000 },
    { id: 'sp2', category: 'OTHER_PUBLIC', name: '100ft Road (Well-lit)', openingStatus: 'OPEN', openingHours: 'Mo-Su 18:00-06:00', address: null, source: 'demo', distanceFromRouteMeters: 10, latitude: 12.9780, longitude: 77.6400 },
    { id: 'sp3', category: 'HOSPITAL', name: 'Manipal Hospital', openingStatus: 'OPEN_24_7', openingHours: '24/7', address: null, source: 'demo', distanceFromRouteMeters: 120, latitude: 12.9950, longitude: 77.6550 },
  ],
  currentPosition: { lat: 12.9784, lng: 77.6408 },
};

// ─── Route Options ─────────────────────────────────────────────────────────────

export const DEMO_ROUTE_OPTIONS: import('../config/demoConfig').RouteOption[] = [
  {
    id: 'ro1',
    type: 'SAFEST',
    label: 'Safest Route',
    etaMins: 36,
    distanceKm: 11.4,
    routeSafetyResult: { score: 92, level: 'HIGHER_SAFETY_COVERAGE', reasons: [], strengths: ['Mock Strength'], weaknesses: [] },
    waypoints: ACTIVE_JOURNEY.route as import('../config/demoConfig').Waypoint[],
    safetyPoints: ACTIVE_JOURNEY.safetyPoints as import('../config/demoConfig').SafetyPlace[],
  },
  {
    id: 'ro2',
    type: 'FASTEST',
    label: 'Fastest Route',
    etaMins: 28,
    distanceKm: 10.1,
    routeSafetyResult: { score: 65, level: 'MODERATE_SAFETY_COVERAGE', reasons: [], strengths: [], weaknesses: ['Mock Weakness'] },
    waypoints: ACTIVE_JOURNEY.route as import('../config/demoConfig').Waypoint[], // Reusing for simplicity
    safetyPoints: [
      { id: 'sp2', category: 'OTHER_PUBLIC', name: '100ft Road (Well-lit)', openingStatus: 'OPEN', openingHours: 'Mo-Su 18:00-06:00', address: null, source: 'demo', distanceFromRouteMeters: 10, latitude: 12.9780, longitude: 77.6400 },
    ],
  },
  {
    id: 'ro3',
    type: 'BALANCED',
    label: 'Balanced Route',
    etaMins: 32,
    distanceKm: 10.8,
    routeSafetyResult: { score: 80, level: 'HIGHER_SAFETY_COVERAGE', reasons: [], strengths: [], weaknesses: [] },
    waypoints: ACTIVE_JOURNEY.route as import('../config/demoConfig').Waypoint[], // Reusing for simplicity
    safetyPoints: [
      { id: 'sp1', category: 'POLICE', name: 'Cubbon Park Police Station', openingStatus: 'OPEN_24_7', openingHours: '24/7', address: null, source: 'demo', distanceFromRouteMeters: 50, latitude: 12.9730, longitude: 77.6000 },
    ],
  }
];

// ─── Risk Factor Breakdown ─────────────────────────────────────────────────────

export const RISK_FACTORS = [
  { id: 'route',   label: 'Route Deviation',   score: 5,  maxScore: 100, triggered: false, detail: 'On planned route' },
  { id: 'stop',    label: 'Unexpected Stops',  score: 0,  maxScore: 100, triggered: false, detail: 'Moving at normal pace' },
  { id: 'time',    label: 'Time of Day',        score: 25, maxScore: 100, triggered: true,  detail: 'Evening travel — moderate window' },
  { id: 'delay',   label: 'Schedule Delay',     score: 8,  maxScore: 100, triggered: false, detail: '3 min behind estimate' },
  { id: 'pattern', label: 'Pattern Anomaly',    score: 0,  maxScore: 100, triggered: false, detail: 'No anomalies detected' },
];

// ─── Trusted Contacts ─────────────────────────────────────────────────────────

export interface Contact {
  id: string;
  name: string;
  relation: string;
  phone: string;
  avatar: string;
  color: string;
  isNotified: boolean;
  notifiedAt?: Date;
}

export const TRUSTED_CONTACTS: Contact[] = [
  { id: 'c1', name: 'Priya Sharma',   relation: 'Mother',      phone: '+91 98765 43210', avatar: 'PS', color: 'from-violet-500 to-purple-600', isNotified: false },
  { id: 'c2', name: 'Arjun Mehta',    relation: 'Brother',     phone: '+91 98765 43211', avatar: 'AM', color: 'from-blue-500 to-indigo-600',   isNotified: false },
  { id: 'c3', name: 'Sneha Reddy',    relation: 'Best Friend', phone: '+91 87654 32109', avatar: 'SR', color: 'from-rose-500 to-pink-600',      isNotified: false },
];

// ─── Safety Events ─────────────────────────────────────────────────────────────

export type EventType = 'JOURNEY_STARTED' | 'CHECKPOINT' | 'SAFETY_CHECK' | 'ROUTE_DEVIATION' | 'UNUSUAL_STOP' | 'JOURNEY_ENDED' | 'HIGH_RISK' | 'CONTACT_NOTIFIED' | 'SOS';

export interface SafetyEvent {
  id: string;
  type: EventType;
  title: string;
  description: string;
  timestamp: Date;
  severity: 'info' | 'warning' | 'critical' | 'success';
  location?: string;
}

export const RECENT_EVENTS: SafetyEvent[] = [
  {
    id: 'e1',
    type: 'JOURNEY_STARTED',
    title: 'Journey Started',
    description: 'Monitoring activated from MG Road Metro',
    timestamp: new Date(Date.now() - 14 * 60 * 1000),
    severity: 'success',
    location: 'MG Road Metro Station',
  },
  {
    id: 'e2',
    type: 'CHECKPOINT',
    title: 'Checkpoint Reached',
    description: 'Passed Indiranagar 100ft Road',
    timestamp: new Date(Date.now() - 5 * 60 * 1000),
    severity: 'info',
    location: 'Indiranagar',
  },
  {
    id: 'e3',
    type: 'SAFETY_CHECK',
    title: 'Safety Check-in',
    description: 'You confirmed you are safe',
    timestamp: new Date(Date.now() - 8 * 60 * 1000),
    severity: 'success',
  },
];

export const PAST_EVENTS: SafetyEvent[] = [
  {
    id: 'pe1',
    type: 'ROUTE_DEVIATION',
    title: 'Route Deviation Detected',
    description: 'Deviated 320m from planned route near Koramangala',
    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
    severity: 'warning',
    location: 'Koramangala',
  },
  {
    id: 'pe2',
    type: 'SAFETY_CHECK',
    title: 'Safety Check Sent',
    description: 'Unusual stop detected. Check-in triggered.',
    timestamp: new Date(Date.now() - 25 * 60 * 60 * 1000),
    severity: 'warning',
  },
  {
    id: 'pe3',
    type: 'JOURNEY_ENDED',
    title: 'Journey Completed',
    description: 'Arrived safely at HSR Layout',
    timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    severity: 'success',
    location: 'HSR Layout',
  },
];

// ─── Past Journeys ─────────────────────────────────────────────────────────────

export interface PastJourney {
  id: string;
  date: string;
  origin: string;
  destination: string;
  durationMins: number;
  distanceKm: number;
  riskLevel: RiskLevel;
  incidents: number;
  confidenceScore: number; // Legacy field
  routeSafetyScore: number;
}

export const PAST_JOURNEYS: PastJourney[] = [
  { id: 'pj1', date: 'Today, 9:15 AM',     origin: 'Home',        destination: 'Office',          durationMins: 34, distanceKm: 8.2,  riskLevel: 'SAFE',     incidents: 0, confidenceScore: 94, routeSafetyScore: 94 },
  { id: 'pj2', date: 'Yesterday, 8:45 PM', origin: 'Phoenix Mall', destination: 'Home',            durationMins: 28, distanceKm: 6.7,  riskLevel: 'CAUTION',  incidents: 1, confidenceScore: 62, routeSafetyScore: 62 },
  { id: 'pj3', date: 'Mon, 7:30 PM',       origin: 'Office',      destination: 'Koramangala Gym', durationMins: 15, distanceKm: 3.1,  riskLevel: 'SAFE',     incidents: 0, confidenceScore: 91, routeSafetyScore: 91 },
  { id: 'pj4', date: 'Sun, 10:00 PM',      origin: 'Indiranagar', destination: 'Home',            durationMins: 22, distanceKm: 5.4,  riskLevel: 'HIGH_RISK',incidents: 2, confidenceScore: 28, routeSafetyScore: 28 },
  { id: 'pj5', date: 'Sat, 6:00 PM',       origin: 'Home',        destination: 'MG Road',         durationMins: 40, distanceKm: 10.1, riskLevel: 'SAFE',     incidents: 0, confidenceScore: 89, routeSafetyScore: 89 },
];

// ─── Safety Tips ──────────────────────────────────────────────────────────────

export interface SafetyTip {
  id: string;
  title: string;
  body: string;
  category: string;
  icon: string;
}

export const SAFETY_TIPS: SafetyTip[] = [
  { id: 't1', title: 'Share Your Route', body: 'Always share your planned route with at least one trusted contact before starting a journey at night.', category: 'Prevention', icon: '🗺️' },
  { id: 't2', title: 'Trust Your Instincts', body: 'If a situation feels wrong, it probably is. It\'s always okay to change your plans for your safety.', category: 'Mindset', icon: '🧠' },
  { id: 't3', title: 'Stay Aware, Stay Present', body: 'Avoid using headphones or looking at your phone while walking in unfamiliar areas.', category: 'Awareness', icon: '👁️' },
  { id: 't4', title: 'Know Your Emergency Contacts', body: 'Keep emergency numbers memorized, not just saved in your phone. 112 is the universal emergency number in India.', category: 'Preparation', icon: '📞' },
  { id: 't5', title: 'Choose Well-lit Routes', body: 'Prefer busy, well-lit streets even if they\'re longer. The extra distance is worth the added safety.', category: 'Awareness', icon: '💡' },
];

// ─── Active Incident (Emergency State) ─────────────────────────────────────────

export const ACTIVE_INCIDENT = {
  id: 'inc-001',
  type: 'ROUTE_DEVIATION' as EventType,
  title: 'Route Deviation Detected',
  description: 'You have deviated 450m from your planned route near Bellandur Junction.',
  startedAt: new Date(Date.now() - 3 * 60 * 1000),
  location: 'Bellandur Junction, Bengaluru',
  coordinates: { lat: 12.9352, lng: 77.6890 },
  riskLevel: 'HIGH_RISK' as RiskLevel,
  routeSafetyScore: 22,
  safetyCheckSent: true,
  safetyCheckSentAt: new Date(Date.now() - 2 * 60 * 1000),
  timeline: [
    { id: 'tl1', label: 'Journey Started',      time: new Date(Date.now() - 25 * 60 * 1000), type: 'success' },
    { id: 'tl2', label: 'Caution Level Reached', time: new Date(Date.now() - 8 * 60 * 1000), type: 'warning' },
    { id: 'tl3', label: 'Route Deviation Detected', time: new Date(Date.now() - 3 * 60 * 1000), type: 'critical' },
    { id: 'tl4', label: 'Safety Check Sent',    time: new Date(Date.now() - 2 * 60 * 1000), type: 'warning' },
  ],
};

// ─── Quick Stats ───────────────────────────────────────────────────────────────

export const QUICK_STATS = {
  totalJourneys: 47,
  safeJourneys: 44,
  safetyRate: 94,
  avgRouteSafetyScore: 86,
  totalDistanceKm: 312,
  videosWatched: 6,
};
