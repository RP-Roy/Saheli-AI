import { DEMO_ROUTE_OPTIONS } from '../data/mockData';
import type { RouteOption, RouteType, Waypoint } from '../config/demoConfig';
import { safetyPlacesService } from './safetyPlacesService';
import { routeSafetyEngine } from './routeSafetyEngine';
import { routeRecommendationService } from './routeRecommendationService';

const OSRM_URL = 'https://router.project-osrm.org/route/v1/driving';

export interface LocationPoint {
  latitude: number;
  longitude: number;
}

export interface NormalizedRoute {
  id: string;
  geometry: any; // GeoJSON LineString
  distanceMeters: number;
  durationSeconds: number;
  source: string;
  isAlternative: boolean;
}

export const routeService = {
  /**
   * Fetches normalized route options from the routing provider.
   */
  async getRouteOptions(origin: LocationPoint, destination: LocationPoint): Promise<NormalizedRoute[]> {
    try {
      const osrmUrl = `${OSRM_URL}/${origin.longitude},${origin.latitude};${destination.longitude},${destination.latitude}?alternatives=3&overview=full&geometries=geojson`;
      const routeRes = await fetch(osrmUrl);
      
      if (!routeRes.ok) {
        throw new Error(`Routing API returned ${routeRes.status}`);
      }

      const routeData = await routeRes.json();
      
      if (routeData.code !== 'Ok' || !routeData.routes || routeData.routes.length === 0) {
        throw new Error("No routes found between these locations.");
      }

      return routeData.routes.map((r: any, index: number) => ({
        id: `osrm-route-${index}`,
        geometry: r.geometry,
        distanceMeters: r.distance,
        durationSeconds: r.duration,
        source: 'OSRM',
        isAlternative: index > 0
      }));
    } catch (error) {
      console.error('getRouteOptions failed:', error);
      throw new Error('Failed to fetch routes from routing service');
    }
  },

  /**
   * Main orchestrator function to generate scored routes.
   */
  async generateSafeRoutes(originInput: LocationPoint | string, destInput: LocationPoint | string, isDemoMode: boolean = false): Promise<RouteOption[]> {
    if (isDemoMode && typeof originInput === 'string' && typeof destInput === 'string' && originInput.toLowerCase() === 'college' && destInput.toLowerCase() === 'home') {
      // Deterministic Demo Scenario
      const route1: RouteOption = {
        id: 'demo-route-1', type: 'FASTEST', label: 'Fastest Route', etaMins: 20, distanceKm: 4.1,
        routeSafetyResult: routeSafetyEngine.calculateRouteSafety(
          { policeCount: 0, hospitalCount: 0, openPharmacyCount: 0, openFuelCount: 0, openHotelCount: 0, publicPlaceCount: 2, maxStretchWithoutPlacesMeters: 2500, _demoOverrideScore: 61, _demoWeaknesses: ['One lower-coverage segment'], _demoStrengths: ['Few nearby public places'] } as any, [], { detourRatio: 1.0 }
        ),
        coverageSummary: { label: 'Limited Coverage' } as any, waypoints: [{ lat: 12.9716, lng: 77.5946, label: 'College', timestampOffset: 0 }, { lat: 12.9352, lng: 77.6890, label: 'Home', timestampOffset: 0 }], safetyPoints: []
      };
      const route2: RouteOption = {
        id: 'demo-route-2', type: 'SAFEST', label: 'Recommended Safer Route', etaMins: 25, distanceKm: 4.7,
        routeSafetyResult: routeSafetyEngine.calculateRouteSafety(
          { policeCount: 1, hospitalCount: 0, openPharmacyCount: 1, openFuelCount: 1, openHotelCount: 1, publicPlaceCount: 5, maxStretchWithoutPlacesMeters: 500, _demoOverrideScore: 88, _demoStrengths: ['Police station', 'Open pharmacy', 'Open fuel station', 'Hotel', 'Multiple public places'] } as any, [], { detourRatio: 1.25 }
        ),
        coverageSummary: { label: 'High Coverage' } as any, waypoints: [{ lat: 12.9716, lng: 77.5946, label: 'College', timestampOffset: 0 }, { lat: 12.9500, lng: 77.6500, label: 'Via Safe Zone', timestampOffset: 0 }, { lat: 12.9352, lng: 77.6890, label: 'Home', timestampOffset: 0 }], safetyPoints: [
          { id: 'sp1', category: 'POLICE', name: 'Local Police Station', openingStatus: 'OPEN_24_7', latitude: 12.96, longitude: 77.63, distanceFromRouteMeters: 10 } as any,
          { id: 'sp2', category: 'PHARMACY', name: '24/7 Pharmacy', openingStatus: 'OPEN', latitude: 12.955, longitude: 77.64, distanceFromRouteMeters: 20 } as any,
        ]
      };
      const route3: RouteOption = {
        id: 'demo-route-3', type: 'BALANCED', label: 'Alternative Route', etaMins: 23, distanceKm: 4.5,
        routeSafetyResult: routeSafetyEngine.calculateRouteSafety(
          { policeCount: 0, hospitalCount: 1, openPharmacyCount: 0, openFuelCount: 0, openHotelCount: 0, publicPlaceCount: 3, maxStretchWithoutPlacesMeters: 1500, _demoOverrideScore: 75, _demoStrengths: ['Hospital nearby'] } as any, [], { detourRatio: 1.15 }
        ),
        coverageSummary: { label: 'Moderate Coverage' } as any, waypoints: [{ lat: 12.9716, lng: 77.5946, label: 'College', timestampOffset: 0 }, { lat: 12.9352, lng: 77.6890, label: 'Home', timestampOffset: 0 }], safetyPoints: []
      };
      return routeRecommendationService.recommendRoute([route1, route2, route3]);
    }

    if (typeof originInput === 'string' || typeof destInput === 'string') {
      throw new Error("Invalid locations. Please use the map search to select destinations.");
    }

    // 2. Fetch Routes using getRouteOptions
    const normalizedRoutes = await this.getRouteOptions(originInput, destInput);
    if (!normalizedRoutes || normalizedRoutes.length === 0) {
      throw new Error("No routes found.");
    }

    const fastestTimeMins = Math.min(...normalizedRoutes.map(r => Math.max(1, Math.round(r.durationSeconds / 60))));

    // 3 & 4. Process, Fetch Safety Places, and Score Routes
    const processedRoutes: RouteOption[] = await Promise.all(normalizedRoutes.map(async (route, index) => {
      const distanceKm = +(route.distanceMeters / 1000).toFixed(1);
      const etaMins = Math.max(1, Math.round(route.durationSeconds / 60));
      const detourRatio = etaMins / fastestTimeMins;
      
      // Convert GeoJSON to Waypoints
      const waypoints: Waypoint[] = route.geometry.coordinates.map((coord: [number, number], i: number) => ({
        lat: coord[1],
        lng: coord[0],
        label: i === 0 ? 'Start' : i === route.geometry.coordinates.length - 1 ? 'End' : 'Via',
        timestampOffset: i * 30
      }));

      // Fetch nearby safety places specifically for this route geometry
      const { relevantPlaces, summary } = await safetyPlacesService.findSafetyPlacesAroundRoute(route.geometry.coordinates, 300);
      
      // Calculate deterministic score
      const safetyResult = routeSafetyEngine.calculateRouteSafety(summary, relevantPlaces, { detourRatio });

      return {
        id: route.id,
        type: 'BALANCED' as RouteType,
        label: `Route Option ${index + 1}`,
        etaMins,
        distanceKm,
        routeSafetyResult: safetyResult,
        coverageSummary: summary,
        waypoints,
        safetyPoints: relevantPlaces
      };
    }));

    return routeRecommendationService.recommendRoute(processedRoutes);
  }
};
