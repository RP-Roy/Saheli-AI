import type { RiskLevel } from '../config/appConfig';
import { APP_CONFIG } from '../config/appConfig';
import { haversineDistance } from './formatters';
import type { Waypoint } from '../config/demoConfig';

// ─── Risk Engine ──────────────────────────────────────────────────────────────
// Deterministic, explainable, rule-based risk scoring.
// Score range: 0 (fully confident safe) → 100 (maximum risk)
// ─────────────────────────────────────────────────────────────────────────────

export interface RiskFactor {
  id: string;
  label: string;
  score: number;     // contribution to total risk score
  weight: number;    // weight relative to other factors
  triggered: boolean;
  details: string;
}

export interface RiskEvaluation {
  totalScore: number;       // 0–100
  confidenceScore: number;  // 100 - totalScore (displayed to user)
  riskLevel: RiskLevel;
  factors: RiskFactor[];
  primaryReason: string;
}

// ─── Inputs for risk evaluation ───────────────────────────────────────────────

export interface RiskInputs {
  currentPosition: Waypoint | null;
  plannedRoute: Waypoint[];
  waypointIndex: number;
  journeyStartTime: Date | null;
  stopDurationSecs: number;   // how long stationary at non-stop point
  hourOfDay: number;          // 0–23
  isRouteDeviating: boolean;
  deviationMeters: number;
  delayMins: number;          // how far behind schedule
}

// ─── Scoring factors ──────────────────────────────────────────────────────────

const FACTOR_WEIGHTS = {
  routeDeviation:    35,
  unexpectedStop:    25,
  timeOfDay:         15,
  scheduleDelay:     15,
  patternAnomaly:    10,
} as const;

function scoreRouteDeviation(deviationMeters: number, isDeviating: boolean): RiskFactor {
  const triggered = isDeviating && deviationMeters > 150;
  const score = triggered
    ? Math.min(100, Math.round((deviationMeters - 150) / 10))
    : 0;
  return {
    id: 'route_deviation',
    label: 'Route Deviation',
    score: Math.min(score, 100),
    weight: FACTOR_WEIGHTS.routeDeviation,
    triggered,
    details: triggered
      ? `Deviated ${deviationMeters}m from planned route`
      : 'On planned route',
  };
}

function scoreUnexpectedStop(stopDurationSecs: number): RiskFactor {
  const triggered = stopDurationSecs > 120; // 2 minutes
  const score = triggered
    ? Math.min(100, Math.round((stopDurationSecs - 120) / 6))
    : 0;
  return {
    id: 'unexpected_stop',
    label: 'Unexpected Stop',
    score,
    weight: FACTOR_WEIGHTS.unexpectedStop,
    triggered,
    details: triggered
      ? `Stationary for ${Math.round(stopDurationSecs / 60)} mins at unplanned location`
      : 'Moving normally',
  };
}

function scoreTimeOfDay(hourOfDay: number): RiskFactor {
  // Risk is higher late night (22:00–05:00) and early evening (19:00–21:00)
  let score = 0;
  if (hourOfDay >= 22 || hourOfDay < 5) score = 80;
  else if (hourOfDay >= 19) score = 40;
  else if (hourOfDay >= 17) score = 15;

  return {
    id: 'time_of_day',
    label: 'Time of Day',
    score,
    weight: FACTOR_WEIGHTS.timeOfDay,
    triggered: score > 30,
    details: score > 50
      ? 'Late night travel — elevated risk window'
      : score > 20
        ? 'Evening travel — moderate risk window'
        : 'Daytime travel — low time risk',
  };
}

function scoreScheduleDelay(delayMins: number): RiskFactor {
  const triggered = delayMins > 10;
  const score = triggered ? Math.min(100, delayMins * 4) : 0;
  return {
    id: 'schedule_delay',
    label: 'Schedule Delay',
    score,
    weight: FACTOR_WEIGHTS.scheduleDelay,
    triggered,
    details: triggered
      ? `${delayMins} mins behind expected schedule`
      : 'On schedule',
  };
}

function scorePatternAnomaly(inputs: RiskInputs): RiskFactor {
  // Simplified: checks if off-route during risky hours
  const anomaly = inputs.isRouteDeviating && (inputs.hourOfDay >= 20 || inputs.hourOfDay < 6);
  return {
    id: 'pattern_anomaly',
    label: 'Pattern Anomaly',
    score: anomaly ? 70 : 0,
    weight: FACTOR_WEIGHTS.patternAnomaly,
    triggered: anomaly,
    details: anomaly
      ? 'Route deviation during high-risk hours'
      : 'No anomalies detected',
  };
}

// ─── Main evaluation function ─────────────────────────────────────────────────

export function evaluateRisk(inputs: RiskInputs): RiskEvaluation {
  const factors: RiskFactor[] = [
    scoreRouteDeviation(inputs.deviationMeters, inputs.isRouteDeviating),
    scoreUnexpectedStop(inputs.stopDurationSecs),
    scoreTimeOfDay(inputs.hourOfDay),
    scoreScheduleDelay(inputs.delayMins),
    scorePatternAnomaly(inputs),
  ];

  // Weighted average
  const totalWeight = Object.values(FACTOR_WEIGHTS).reduce((a, b) => a + b, 0);
  const weightedScore = factors.reduce(
    (sum, f) => sum + (f.score * f.weight) / totalWeight,
    0,
  );

  const totalScore = Math.round(Math.min(100, Math.max(0, weightedScore)));
  const confidenceScore = 100 - totalScore;

  let riskLevel: RiskLevel = 'SAFE';
  if (totalScore > APP_CONFIG.riskThresholds.caution) riskLevel = 'HIGH_RISK';
  else if (totalScore > APP_CONFIG.riskThresholds.safe) riskLevel = 'CAUTION';

  const primaryFactor = factors
    .filter(f => f.triggered)
    .sort((a, b) => b.score * b.weight - a.score * a.weight)[0];

  const primaryReason = primaryFactor
    ? primaryFactor.details
    : 'All signals within normal range';

  return { totalScore, confidenceScore, riskLevel, factors, primaryReason };
}

// ─── Deviation checker ────────────────────────────────────────────────────────

export function checkRouteDeviation(
  currentLat: number,
  currentLng: number,
  plannedRoute: Waypoint[],
): { isDeviating: boolean; deviationMeters: number } {
  if (!plannedRoute.length) return { isDeviating: false, deviationMeters: 0 };

  const minDist = plannedRoute.reduce((min, wp) => {
    const d = haversineDistance(currentLat, currentLng, wp.lat, wp.lng);
    return d < min ? d : min;
  }, Infinity);

  return {
    isDeviating: minDist > 200, // 200m tolerance
    deviationMeters: Math.round(minDist),
  };
}
