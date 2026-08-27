import type { SafetyPlace, OpeningStatus, RouteCoverageSummary, Waypoint, RouteOption } from '../config/demoConfig';

const OVERPASS_URL = 'https://overpass-api.de/api/interpreter';

// ─── Helper: Haversine Distance ───────────────────────────────────────────────

function getDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // metres
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

// ─── Service ──────────────────────────────────────────────────────────────────

// ─── Cache ────────────────────────────────────────────────────────────────────
interface CacheEntry {
  places: SafetyPlace[];
  timestamp: number;
}
const bboxCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

export const safetyPlacesService = {
  
  /**
   * Calculates the bounding box of a route and fetches OSM places within it.
   * Caches the results based on the rounded bounding box.
   */
  async fetchCachedPlacesInBBox(routeGeometry: [number, number][], radiusMeters: number): Promise<SafetyPlace[]> {
    let minLat = 90, minLon = 180, maxLat = -90, maxLon = -180;
    
    routeGeometry.forEach(coord => {
      minLon = Math.min(minLon, coord[0]);
      maxLon = Math.max(maxLon, coord[0]);
      minLat = Math.min(minLat, coord[1]);
      maxLat = Math.max(maxLat, coord[1]);
    });

    // Expand bbox by roughly the radius (1 deg lat ~ 111km, 1 deg lon varies)
    const latBuffer = (radiusMeters / 111000) * 1.5; 
    const lonBuffer = latBuffer / Math.cos(minLat * (Math.PI / 180));
    
    const s = (minLat - latBuffer).toFixed(3);
    const w = (minLon - lonBuffer).toFixed(3);
    const n = (maxLat + latBuffer).toFixed(3);
    const e = (maxLon + lonBuffer).toFixed(3);
    
    const cacheKey = `${s},${w},${n},${e}`;
    const cached = bboxCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      return cached.places;
    }

    try {
      const query = `
        [out:json][timeout:15];
        (
          node["amenity"~"police|pharmacy|hospital|clinic|cafe|restaurant|fuel"](${s},${w},${n},${e});
          node["tourism"~"hotel"](${s},${w},${n},${e});
          node["shop"](${s},${w},${n},${e});
        );
        out body;
      `;

      const res = await fetch(OVERPASS_URL, {
        method: 'POST',
        body: query
      });
      if (!res.ok) throw new Error(`Overpass API error: ${res.status}`);
      const data = await res.json();
      
      const places: SafetyPlace[] = [];
      data.elements?.forEach((el: any) => {
        let category: SafetyPlace['category'] = 'OTHER_PUBLIC';
        
        const tags = el.tags || {};
        
        if (tags.amenity === 'police') category = 'POLICE';
        else if (tags.amenity === 'hospital' || tags.amenity === 'clinic') category = 'HOSPITAL';
        else if (tags.amenity === 'pharmacy') category = 'PHARMACY';
        else if (tags.amenity === 'fuel') category = 'FUEL';
        else if (tags.shop) category = 'SHOP';
        else if (tags.tourism === 'hotel') category = 'HOTEL';
        else if (tags.amenity === 'cafe' || tags.amenity === 'restaurant') category = 'CAFE_RESTAURANT';
        
        let openingStatus: OpeningStatus = 'UNKNOWN';
        let openingHours = tags.opening_hours || null;
        
        if (openingHours) {
          const hoursStr = openingHours.toLowerCase();
          if (hoursStr === '24/7' || hoursStr.includes('24/7')) {
            openingStatus = 'OPEN_24_7';
          } else {
            const timeMatch = hoursStr.match(/(\d{1,2}:\d{2})\s*-\s*(\d{1,2}:\d{2})/);
            if (timeMatch) {
              const now = new Date();
              const currentMinutes = now.getHours() * 60 + now.getMinutes();
              const parseTime = (t: string) => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };
              const startMins = parseTime(timeMatch[1]);
              const endMins = parseTime(timeMatch[2]);
              
              if (endMins < startMins) {
                if (currentMinutes >= startMins || currentMinutes <= endMins) openingStatus = 'OPEN';
                else openingStatus = 'CLOSED';
              } else {
                if (currentMinutes >= startMins && currentMinutes <= endMins) openingStatus = 'OPEN';
                else openingStatus = 'CLOSED';
              }
            } else {
              openingStatus = 'UNKNOWN';
            }
          }
        }
        
        places.push({
          id: el.id.toString(),
          name: tags.name || category.replace(/_/g, ' '),
          category,
          latitude: el.lat,
          longitude: el.lon,
          distanceFromRouteMeters: 0, 
          openingStatus,
          openingHours,
          address: tags['addr:full'] || tags['addr:street'] || null,
          source: 'osm'
        });
      });
      
      bboxCache.set(cacheKey, { places, timestamp: Date.now() });
      return places;
    } catch (error) {
      console.error('Overpass fetch failed:', error);
      // Ensure we don't block routing, return empty gracefully.
      return [];
    }
  },

  /**
   * Finds safety places around a specific route geometry, filters by radius, 
   * and calculates coverage summary.
   */
  async findSafetyPlacesAroundRoute(routeGeometry: [number, number][], radiusMeters: number = 300): Promise<{ relevantPlaces: SafetyPlace[], summary: RouteCoverageSummary }> {
    const allPlaces = await this.fetchCachedPlacesInBBox(routeGeometry, radiusMeters);
    
    const nearbyPois = new Map<string, SafetyPlace>();
    let maxStretchWithoutPlacesMeters = 0;
    let currentStretch = 0;
    
    // Sample coordinates to simulate waypoints for distance calculation
    for (let i = 0; i < routeGeometry.length; i++) {
      const coord = routeGeometry[i];
      let foundPlaceNearby = false;
      
      if (i > 0) {
        const prev = routeGeometry[i - 1];
        currentStretch += getDistance(prev[1], prev[0], coord[1], coord[0]);
      }

      for (const place of allPlaces) {
        const d = getDistance(coord[1], coord[0], place.latitude, place.longitude);
        if (d <= radiusMeters) {
          foundPlaceNearby = true;
          if (!nearbyPois.has(place.id)) {
            nearbyPois.set(place.id, { ...place, distanceFromRouteMeters: Math.round(d) });
          } else {
            const existing = nearbyPois.get(place.id)!;
            if (d < existing.distanceFromRouteMeters) {
               nearbyPois.set(place.id, { ...existing, distanceFromRouteMeters: Math.round(d) });
            }
          }
        }
      }
      
      if (foundPlaceNearby) {
        if (currentStretch > maxStretchWithoutPlacesMeters) {
          maxStretchWithoutPlacesMeters = currentStretch;
        }
        currentStretch = 0;
      }
    }
    
    if (currentStretch > maxStretchWithoutPlacesMeters) {
      maxStretchWithoutPlacesMeters = currentStretch;
    }

    const routePOIs = Array.from(nearbyPois.values());
    
    let policeCount = 0;
    let openPharmacyCount = 0;
    let openFuelCount = 0;
    let openHotelCount = 0;
    let hospitalCount = 0;
    let publicPlaceCount = 0;

    routePOIs.forEach(p => {
      const isOpen = p.openingStatus === 'OPEN' || p.openingStatus === 'OPEN_24_7';
      
      if (p.category === 'POLICE') policeCount++;
      if (p.category === 'PHARMACY' && isOpen) openPharmacyCount++;
      if (p.category === 'FUEL' && isOpen) openFuelCount++;
      if (p.category === 'HOTEL' && isOpen) openHotelCount++;
      if (p.category === 'HOSPITAL') hospitalCount++;
      if (['SHOP', 'CAFE_RESTAURANT', 'OTHER_PUBLIC'].includes(p.category)) publicPlaceCount++;
    });

    let label = 'Limited coverage';
    if (policeCount > 0 && routePOIs.length > 5 && maxStretchWithoutPlacesMeters < 2000) {
      label = 'Best coverage';
    } else if (routePOIs.length > 3) {
      label = 'More public places nearby';
    }

    return {
      relevantPlaces: routePOIs,
      summary: {
        policeCount,
        openPharmacyCount,
        openFuelCount,
        openHotelCount,
        hospitalCount,
        publicPlaceCount,
        maxStretchWithoutPlacesMeters: Math.round(maxStretchWithoutPlacesMeters),
        label
      }
    };
  }
};
