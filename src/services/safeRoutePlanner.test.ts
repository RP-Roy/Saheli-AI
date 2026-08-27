import { describe, it, expect, vi, beforeEach } from 'vitest';
import { geocodingService } from './geocodingService';
import { routeService } from './routeService';
import { safetyPlacesService } from './safetyPlacesService';
import { routeSafetyEngine } from './routeSafetyEngine';
import { routeRecommendationService } from './routeRecommendationService';
import { journeyService } from './journeyService';
import type { RouteOption } from '../config/demoConfig';

describe('Complete Safe Route Planner Integration & Fault-Tolerance Tests', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('Steps 3-4: Resolves destination location via geocoding service (with Nominatim & fallback support)', async () => {
    // 1. Curated / live search
    const results = await geocodingService.searchDestinations('Indiranagar, Bengaluru');
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].lat).toBeCloseTo(12.97, 1);
    expect(results[0].lon).toBeCloseTo(77.64, 1);

    // 2. Geocode single destination
    const single = await geocodingService.geocodeDestination('Connaught Place');
    expect(single).not.toBeNull();
    expect(single?.name).toContain('Connaught');
  });

  it('Steps 5-6: Requests real route from OSRM and generates normalized waypoints', async () => {
    const origin = { latitude: 12.9716, longitude: 77.5946 }; // MG Road
    const dest = { latitude: 12.9784, longitude: 77.6408 };   // Indiranagar

    const routes = await routeService.getRouteOptions(origin, dest);
    expect(routes.length).toBeGreaterThan(0);
    expect(routes[0].geometry.type).toBe('LineString');
    expect(routes[0].distanceMeters).toBeGreaterThan(1000);
    expect(routes[0].durationSeconds).toBeGreaterThan(60);
  });

  it('Steps 7-8: Queries real OpenStreetMap safety places along route geometry', async () => {
    // MG Road to Indiranagar corridor coordinates
    const routeCoords: [number, number][] = [
      [77.5946, 12.9716],
      [77.6100, 12.9730],
      [77.6250, 12.9750],
      [77.6408, 12.9784],
    ];

    const { relevantPlaces, summary } = await safetyPlacesService.findSafetyPlacesAroundRoute(routeCoords, 500);
    expect(Array.isArray(relevantPlaces)).toBe(true);
    expect(summary).toBeDefined();
    expect(typeof summary.policeCount).toBe('number');
    expect(typeof summary.openPharmacyCount).toBe('number');
  }, 15000);

  it('Steps 9-12: Calculates Route Safety Score, explains score, compares routes, and recommends safer route', async () => {
    const origin = { latitude: 12.9716, longitude: 77.5946 };
    const dest = { latitude: 12.9352, longitude: 77.6245 };

    const routes = await routeService.generateSafeRoutes(origin, dest, false);
    expect(routes.length).toBeGreaterThan(0);

    const primaryRoute = routes[0];
    expect(primaryRoute.routeSafetyResult).toBeDefined();
    expect(primaryRoute.routeSafetyResult!.score).toBeGreaterThanOrEqual(0);
    expect(primaryRoute.routeSafetyResult!.score).toBeLessThanOrEqual(100);
    expect(primaryRoute.waypoints.length).toBeGreaterThan(2);

    // Either strengths or weaknesses must explain the route score
    const hasExplanation = (primaryRoute.routeSafetyResult!.strengths.length > 0) || (primaryRoute.routeSafetyResult!.weaknesses.length > 0);
    expect(hasExplanation).toBe(true);

    // Recommended route should be flagged
    const recommended = routes.find(r => r.type === 'SAFEST') || routes[0];
    expect(recommended).toBeDefined();
    expect(recommended.recommendation?.reason).toBeDefined();
  }, 15000);

  it('Steps 13-16: User starts journey and tracks live position with throttled persistence', async () => {
    const mockJourneyData = {
      user_id: 'test-user-123',
      start_lat: 12.9716,
      start_lng: 77.5946,
      destination_name: 'Indiranagar 100ft Road',
      destination_lat: 12.9784,
      destination_lng: 77.6408,
      expected_duration_minutes: 18,
      route_safety_score: 85,
      risk_level: 'SAFE' as const,
      status: 'ACTIVE',
    };

    const created = await journeyService.createJourney(mockJourneyData);
    expect(created.data).toBeDefined();

    // Position updates
    const updateRes = await journeyService.updatePosition('test-journey-id', 12.9730, 77.6100, 85, 'SAFE');
    expect(updateRes).toBeDefined();

    // Completion
    const endRes = await journeyService.endJourney('test-journey-id');
    expect(endRes).toBeDefined();
  });

  it('Steps 17-19: Deviation detection and Safer Rerouting calculation', async () => {
    // Current deviated position
    const currentPos = { latitude: 12.9600, longitude: 77.6200 };
    const dest = { latitude: 12.9784, longitude: 77.6408 };

    const reroutes = await routeService.generateSafeRoutes(currentPos, dest, false);
    expect(reroutes.length).toBeGreaterThan(0);
    expect(reroutes[0].waypoints[0].lat).toBeCloseTo(currentPos.latitude, 2);
    expect(reroutes[0].waypoints[0].lng).toBeCloseTo(currentPos.longitude, 2);
  }, 15000);

  it('Fault Tolerance 1: Routing server failure falls back gracefully to estimated corridor', async () => {
    // Mock fetch to simulate OSRM timeout / failure
    global.fetch = vi.fn().mockRejectedValueOnce(new Error('OSRM 504 Gateway Timeout'));

    const origin = { latitude: 12.9716, longitude: 77.5946 };
    const dest = { latitude: 12.9784, longitude: 77.6408 };

    const fallbackRoutes = await routeService.getRouteOptions(origin, dest);
    expect(fallbackRoutes.length).toBe(1);
    expect(fallbackRoutes[0].source).toBe('DIRECT_ESTIMATE');
    expect(fallbackRoutes[0].geometry.coordinates.length).toBeGreaterThan(2);
  });

  it('Fault Tolerance 2: Safety places API failure returns empty list without breaking route generation', async () => {
    // Mock fetch failure for Overpass API
    global.fetch = vi.fn().mockRejectedValueOnce(new Error('Overpass 429 Too Many Requests'));

    const routeCoords: [number, number][] = [
      [77.5946, 12.9716],
      [77.6408, 12.9784],
    ];

    const { relevantPlaces, summary } = await safetyPlacesService.findSafetyPlacesAroundRoute(routeCoords, 300);
    expect(relevantPlaces).toEqual([]);
    expect(summary.policeCount).toBe(0);

    // Route safety engine still scores cleanly
    const scoreResult = routeSafetyEngine.calculateRouteSafety(summary, relevantPlaces, { detourRatio: 1.0 });
    expect(scoreResult.score).toBeGreaterThan(0);
  });

  it('Demo Mode: Returns deterministic offline routes for College -> Home scenario', async () => {
    const demoRoutes = await routeService.generateSafeRoutes('College', 'Home', true);
    expect(demoRoutes.length).toBe(3);
    expect(demoRoutes[0].label).toBe('Recommended Safer Route');
    expect(demoRoutes[0].type).toBe('SAFEST');
    expect(demoRoutes[0].routeSafetyResult?.score).toBe(88);
    expect(demoRoutes.some(r => r.label === 'Fastest Route')).toBe(true);
  });
});
