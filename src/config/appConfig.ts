// ─── App Configuration ────────────────────────────────────────────────────────

export const APP_CONFIG = {
  name: 'Saheli AI',
  tagline: 'Your Predictive Safety Companion',
  version: '1.0.0-beta',

  // Journey check-in window (seconds) before auto-escalation
  safetyCheckTimeoutSecs: 60,

  // Risk score thresholds (0–100)
  riskThresholds: {
    safe: 40,      // 0–40  → SAFE
    caution: 70,   // 41–70 → CAUTION
    // >70 → HIGH RISK
  },

  // How often the risk engine re-evaluates (ms)
  riskEvalIntervalMs: 5_000,

  // Demo mode auto-advance interval (ms) — progresses journey state
  demoAdvanceIntervalMs: 8_000,

  // Supabase
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL ?? '',
  supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY ?? '',

  // Gemini (via Supabase Edge Function)
  geminiEdgeFunctionUrl: '/functions/v1/saheli-chat',
  saheliEdgeFunctionUrl: '/functions/v1/saheli-chat',
} as const;

export type RiskLevel = 'SAFE' | 'CAUTION' | 'HIGH_RISK';

export const RISK_COLORS: Record<RiskLevel, string> = {
  SAFE: 'text-safe-400',
  CAUTION: 'text-caution-400',
  HIGH_RISK: 'text-danger-400',
};

export const RISK_BG: Record<RiskLevel, string> = {
  SAFE: 'bg-status-safe',
  CAUTION: 'bg-status-caution',
  HIGH_RISK: 'bg-status-danger',
};

export const RISK_LABELS: Record<RiskLevel, string> = {
  SAFE: 'Safe',
  CAUTION: 'Caution',
  HIGH_RISK: 'High Risk',
};
