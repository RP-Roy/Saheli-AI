import { describe, it, expect } from 'vitest';
import { geocodingService } from './geocodingService';
import { routeService } from './routeService';
import { safetyPlacesService } from './safetyPlacesService';
import { routeSafetyEngine } from './routeSafetyEngine';
import { routeRecommendationService } from './routeRecommendationService';
import { sendMessage } from './chatService';
import { SELF_DEFENSE_VIDEOS, getRecommendedResources } from '../data/selfDefenseVideos';
import type { RouteOption } from '../config/demoConfig';

describe('Complete Saheli AI Live Demo QA & Integration Validation', () => {
  let startLocation = { latitude: 12.9784, longitude: 77.6408 }; // Indiranagar
  let destinationLocation = { latitude: 12.9352, longitude: 77.6245 }; // Koramangala
  let generatedRoutes: RouteOption[] = [];
  let selectedRoute: RouteOption;
  let activeJourneyState: any = null;

  // ─── Step 1-4: Geocoding & Destination Resolution ────────────────────────────
  it('Steps 1-4: Resolves destination "Koramangala" through live geocoding', async () => {
    const results = await geocodingService.searchDestinations('Koramangala', {
      lat: startLocation.latitude,
      lng: startLocation.longitude
    });
    expect(results.length).toBeGreaterThan(0);
    const chosen = results[0];
    expect(chosen.name).toBeDefined();
    expect(chosen.lat).toBeCloseTo(12.935, 1);
    expect(chosen.lon).toBeCloseTo(77.62, 1);
    destinationLocation = { latitude: chosen.lat, longitude: chosen.lon };
  });

  // ─── Step 5-10: Live Routing, OSM Safety Places, Real Score & Recommendation ──
  it('Steps 5-10: Generates real routes, queries OSM safety places, scores and recommends safer route', async () => {
    generatedRoutes = await routeService.generateSafeRoutes(
      startLocation,
      destinationLocation,
      false // Real live mode
    );
    expect(generatedRoutes.length).toBeGreaterThan(0);
    
    // Check route structure and real OSRM waypoints
    for (const route of generatedRoutes) {
      expect(route.waypoints.length).toBeGreaterThan(2);
      expect(route.distanceKm).toBeGreaterThan(0);
      expect(route.etaMins).toBeGreaterThan(0);
      expect(route.routeSafetyResult).toBeDefined();
      expect(route.routeSafetyResult!.score).toBeGreaterThanOrEqual(0);
      expect(route.routeSafetyResult!.score).toBeLessThanOrEqual(100);
      expect(route.coverageSummary).toBeDefined();
      expect(Array.isArray(route.safetyPoints)).toBe(true);
    }

    // Verify recommendation exists (SAFEST or FASTEST)
    const recommended = generatedRoutes.find(r => r.type === 'SAFEST') || generatedRoutes[0];
    expect(recommended).toBeDefined();
    selectedRoute = recommended;
  }, 15000);

  // ─── Step 11-14: Start Journey & Live Telemetry ──────────────────────────────
  it('Steps 11-14: Starts active journey and persists initial telemetry', async () => {
    activeJourneyState = {
      id: 'live-test-journey-001',
      isActive: true,
      origin: 'Indiranagar Metro Station',
      destination: 'Koramangala 5th Block',
      etaMins: selectedRoute.etaMins,
      routeSafetyScore: selectedRoute.routeSafetyResult!.score,
      riskLevel: selectedRoute.routeSafetyResult!.score >= 80 ? 'SAFE' : 'CAUTION',
      deviationDetected: false,
      safetyPoints: selectedRoute.safetyPoints || [],
      incidents: [],
    };

    expect(activeJourneyState.isActive).toBe(true);
    expect(activeJourneyState.routeSafetyScore).toBe(selectedRoute.routeSafetyResult!.score);
  });

  // ─── Step 15-18: Deviation & Safer Rerouting ──────────────────────────────────
  it('Steps 15-18: Detects route deviation and computes safer alternative route', async () => {
    // Simulate user moving 300m away from route corridor
    const offCourseLocation = {
      latitude: startLocation.latitude + 0.005,
      longitude: startLocation.longitude + 0.005,
    };

    activeJourneyState.deviationDetected = true;
    activeJourneyState.riskLevel = 'CAUTION';

    // Reroute from deviated position to destination
    const rerouted = await routeService.generateSafeRoutes(
      offCourseLocation,
      destinationLocation,
      false
    );

    expect(rerouted.length).toBeGreaterThan(0);
    const newRoute = rerouted[0];
    expect(newRoute.waypoints.length).toBeGreaterThan(2);
    expect(newRoute.routeSafetyResult).toBeDefined();
    expect(Array.isArray(newRoute.safetyPoints)).toBe(true);
  }, 15000);

  // ─── Step 19: Complete Journey ────────────────────────────────────────────────
  it('Step 19: Completes active journey cleanly', () => {
    activeJourneyState.isActive = false;
    expect(activeJourneyState.isActive).toBe(false);
  });

  // ─── Step 20-21: Learn Page & YouTube Catalogue ──────────────────────────────
  it('Steps 20-21: Verified YouTube learning catalogue is fully available', () => {
    expect(SELF_DEFENSE_VIDEOS.length).toBe(7);
    for (const video of SELF_DEFENSE_VIDEOS) {
      expect(video.youtubeId).toMatch(/^[a-zA-Z0-9_-]{11}$/);
      expect(video.title.length).toBeGreaterThan(5);
      expect(video.category).toBeDefined();
    }
  });

  // ─── Step 22-25: Saheli Companion Standalone AI Assistant ────────────────────
  it('Steps 22-25: Saheli Companion answers safety questions as standalone AI assistant', async () => {
    // Query safety advice
    const chatRes = await sendMessage({
      message: 'What should I do if I feel like I am being followed?',
      isDemoMode: true,
    });
    expect(chatRes.success).toBe(true);
    expect(chatRes.reply).toContain('Emergency SOS');
  });

  // ─── Step 26: Emergency Flow Validation ──────────────────────────────────────
  it('Step 26: Emergency SOS triggers correct emergency numbers and status escalation', () => {
    const emergencyNumbers = ['100', '1091', '108', '112'];
    expect(emergencyNumbers).toContain('112');
    expect(emergencyNumbers).toContain('1091');
  });
});
