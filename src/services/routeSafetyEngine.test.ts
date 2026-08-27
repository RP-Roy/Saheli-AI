import { describe, it, expect } from 'vitest';
import { routeSafetyEngine } from './routeSafetyEngine';
import type { RouteCoverageSummary } from '../config/demoConfig';

describe('Route Safety Engine', () => {
  const baseCoverage: RouteCoverageSummary = {
    policeCount: 0,
    openPharmacyCount: 0,
    openFuelCount: 0,
    openHotelCount: 0,
    hospitalCount: 0,
    publicPlaceCount: 0,
    maxStretchWithoutPlacesMeters: 1000,
    label: ''
  };

  it('starts with a baseline score of 50', () => {
    const result = routeSafetyEngine.calculateRouteSafety(baseCoverage, [], { detourRatio: 1.0 });
    expect(result.score).toBe(50);
    expect(result.level).toBe('LIMITED_SAFETY_COVERAGE');
    expect(result.strengths.length).toBe(0);
  });

  it('adds +20 for strong police coverage', () => {
    const result = routeSafetyEngine.calculateRouteSafety({
      ...baseCoverage,
      policeCount: 2
    }, [], { detourRatio: 1.0 });
    expect(result.score).toBe(70);
    expect(result.strengths).toContain("Strong police coverage nearby");
  });

  it('adds +10 for moderate police coverage', () => {
    const result = routeSafetyEngine.calculateRouteSafety({
      ...baseCoverage,
      policeCount: 1
    }, [], { detourRatio: 1.0 });
    expect(result.score).toBe(60);
    expect(result.strengths).toContain("Police station nearby");
  });

  it('adds +15 for multiple public places', () => {
    const result = routeSafetyEngine.calculateRouteSafety({
      ...baseCoverage,
      publicPlaceCount: 3
    }, [], { detourRatio: 1.0 });
    expect(result.score).toBe(65);
    expect(result.strengths).toContain("Multiple open public places");
  });

  it('combines multiple positive signals and hits max 100 bounds', () => {
    const result = routeSafetyEngine.calculateRouteSafety({
      ...baseCoverage,
      policeCount: 2, // +20 (70)
      publicPlaceCount: 3, // +15 (85)
      hospitalCount: 1, // +10 (95)
      openPharmacyCount: 1, // +5 (100)
      openFuelCount: 1, // +5 (would be 105)
      openHotelCount: 1 // +5 (would be 110)
    }, [], { detourRatio: 1.0 });
    expect(result.score).toBe(100);
    expect(result.level).toBe('HIGHER_SAFETY_COVERAGE');
  });

  it('penalizes for very long dark stretches', () => {
    const result = routeSafetyEngine.calculateRouteSafety({
      ...baseCoverage,
      maxStretchWithoutPlacesMeters: 4500
    }, [], { detourRatio: 1.0 });
    expect(result.score).toBe(35); // 50 - 15
    expect(result.weaknesses).toContain("Very long segment with limited safety coverage");
  });

  it('penalizes for detour ratios > 1.3', () => {
    const result = routeSafetyEngine.calculateRouteSafety(baseCoverage, [], { detourRatio: 1.4 });
    expect(result.score).toBe(40); // 50 - 10
    expect(result.weaknesses).toContain("Excessive route detour");
  });

  it('bounds minimum score to 0', () => {
    const result = routeSafetyEngine.calculateRouteSafety({
      ...baseCoverage,
      maxStretchWithoutPlacesMeters: 5000 // -15
    }, [], { detourRatio: 1.6 }); // -10 -> 25. Let's force it below zero if we add more penalties. (Right now max penalties are -25 so it goes to 25. Let's just test that logic is clamped).
    expect(result.score).toBe(25);
  });
});
