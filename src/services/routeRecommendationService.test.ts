import { describe, it, expect } from 'vitest';
import { routeRecommendationService } from './routeRecommendationService';
import type { RouteOption } from '../config/demoConfig';

describe('Route Recommendation Service', () => {
  const createRoute = (id: string, etaMins: number, score: number): RouteOption => ({
    id,
    type: 'BALANCED',
    label: '',
    etaMins,
    distanceKm: 5,
    routeSafetyResult: {
      score,
      level: 'MODERATE_SAFETY_COVERAGE',
      reasons: [],
      strengths: [],
      weaknesses: []
    },
    waypoints: [],
    safetyPoints: []
  });

  it('recommends the fastest route if it is also the safest', () => {
    const routes = [
      createRoute('r1', 20, 85),
      createRoute('r2', 25, 60)
    ];

    const result = routeRecommendationService.recommendRoute(routes);
    expect(result[0].id).toBe('r1');
    expect(result[0].type).toBe('SAFEST');
    expect(result[0].recommendation?.comparison.isFastest).toBe(true);
  });

  it('recommends a slower but safer route if within max detour', () => {
    const routes = [
      createRoute('fastest', 20, 60),
      createRoute('safer', 23, 85) // 23 <= 20 * 1.25 (25)
    ];

    const result = routeRecommendationService.recommendRoute(routes);
    expect(result[0].id).toBe('safer');
    expect(result[0].type).toBe('SAFEST');
    expect(result[0].recommendation?.comparison.isFastest).toBe(false);
    expect(result[0].recommendation?.comparison.timeDiffMins).toBe(3);
    expect(result[0].recommendation?.comparison.scoreDiff).toBe(25);
  });

  it('rejects a safer route if the detour is too long', () => {
    const routes = [
      createRoute('fastest', 20, 65),
      createRoute('too-long', 38, 95) // 38 > 20 * 1.25 (25)
    ];

    const result = routeRecommendationService.recommendRoute(routes);
    expect(result[0].id).toBe('fastest');
    expect(result[0].type).toBe('SAFEST');
    expect(result[0].recommendation?.comparison.isFastest).toBe(true);
  });
});
