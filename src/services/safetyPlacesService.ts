import type { SafetyPlace, OpeningStatus, RouteCoverageSummary, Waypoint, RouteOption } from '../config/demoConfig';

const OVERPASS_URLS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
];

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
   * Calculates the bounding box of a route and fetches safety places within it.
   * Uses Geoapify Places API (fast & reliable) with Overpass OSM API fallback.
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
    
    const s = (minLat - latBuffer).toFixed(4);
    const w = (minLon - lonBuffer).toFixed(4);
    const n = (maxLat + latBuffer).toFixed(4);
    const e = (maxLon + lonBuffer).toFixed(4);
    
    const cacheKey = `${s},${w},${n},${e}`;
    const cached = bboxCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      return cached.places;
    }

    // ─── 1. Try Geoapify Places API first (Instant & highly reliable) ─────────
    const geoapifyKey = import.meta.env.VITE_GEOAPIFY_API_KEY;
    if (geoapifyKey) {
      try {
        const categories = 'service.police,healthcare.hospital,healthcare.pharmacy,service.vehicle.fuel,commercial.supermarket,commercial.convenience,commercial.shopping_mall,catering.restaurant,catering.fast_food,catering.cafe,accommodation.hotel,service.financial.bank,service.financial.atm,public_transport';
        const url = `https://api.geoapify.com/v2/places?categories=${categories}&filter=rect:${w},${s},${e},${n}&limit=100&apiKey=${geoapifyKey}`;
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 4000);
        
        const res = await fetch(url, { signal: controller.signal }).finally(() => clearTimeout(timeoutId));
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data?.features) && data.features.length > 0) {
            const places: SafetyPlace[] = data.features.map((f: any) => {
              const props = f.properties || {};
              const catList = props.categories || [];
              const nameLower = (props.name || '').toLowerCase();
              
              let category: SafetyPlace['category'] = 'OTHER_PUBLIC';
              if (catList.some((c: string) => c.includes('police')) || nameLower.includes('police') || nameLower.includes('thana')) {
                category = 'POLICE';
              } else if (catList.some((c: string) => c.includes('hospital') || c.includes('clinic')) || nameLower.includes('hospital') || nameLower.includes('nursing home')) {
                category = 'HOSPITAL';
              } else if (catList.some((c: string) => c.includes('pharmacy')) || nameLower.includes('pharmacy') || nameLower.includes('medical') || nameLower.includes('chemist')) {
                category = 'PHARMACY';
              } else if (catList.some((c: string) => c.includes('bank') || c.includes('atm') || c.includes('financial')) || nameLower.includes('bank') || nameLower.includes('atm')) {
                category = 'BANK_ATM';
              } else if (catList.some((c: string) => c.includes('fuel') || c.includes('gas_station')) || nameLower.includes('petrol') || nameLower.includes('fuel')) {
                category = 'FUEL';
              } else if (catList.some((c: string) => c.includes('hotel') || c.includes('accommodation') || c.includes('hostel')) || nameLower.includes('hotel') || nameLower.includes('lodge')) {
                category = 'HOTEL';
              } else if (catList.some((c: string) => c.includes('public_transport') || c.includes('bus') || c.includes('train'))) {
                category = 'TRANSIT';
              } else if (catList.some((c: string) => c.includes('catering') || c.includes('restaurant') || c.includes('cafe') || c.includes('fast_food'))) {
                category = 'CAFE_RESTAURANT';
              } else if (catList.some((c: string) => c.includes('supermarket') || c.includes('convenience') || c.includes('shopping_mall') || c.includes('commercial'))) {
                category = 'SHOP';
              }

              let openingStatus: OpeningStatus = 'UNKNOWN';
              const rawHours = props.opening_hours || props.datasource?.raw?.opening_hours || '';
              if (rawHours.toLowerCase().includes('24/7')) {
                openingStatus = 'OPEN_24_7';
              } else if (rawHours) {
                openingStatus = 'OPEN';
              }

              const cleanName = props.name || props.street || category.replace(/_/g, ' ');

              return {
                id: props.place_id || `geo-${props.lat}-${props.lon}`,
                name: cleanName,
                category,
                latitude: props.lat,
                longitude: props.lon,
                distanceFromRouteMeters: 0,
                openingStatus,
                openingHours: rawHours || null,
                address: props.formatted || props.address_line2 || null,
                source: 'osm',
              };
            });

            bboxCache.set(cacheKey, { places, timestamp: Date.now() });
            return places;
          }
        }
      } catch (geoErr) {
        console.warn('Geoapify Places fetch failed, falling back to Overpass:', geoErr);
      }
    }

    // ─── 2. Fallback: Overpass OSM API ───────────────────────────────────────
    for (const overpassUrl of OVERPASS_URLS) {
      try {
        const query = `
          [out:json][timeout:10];
          (
            node["amenity"~"police|pharmacy|hospital|clinic|cafe|restaurant|fuel"](${s},${w},${n},${e});
            node["tourism"~"hotel"](${s},${w},${n},${e});
            node["shop"](${s},${w},${n},${e});
          );
          out body;
        `;

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 4000);

        const res = await fetch(overpassUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Accept': 'application/json',
            'User-Agent': 'SaheliSafetyApp/1.0 (https://saheli.ai)',
          },
          body: `data=${encodeURIComponent(query)}`,
          signal: controller.signal,
        }).finally(() => clearTimeout(timeoutId));
        
        if (!res.ok) continue;
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
          const openingHours = tags.opening_hours || null;
          
          if (openingHours) {
            const hoursStr = openingHours.toLowerCase();
            if (hoursStr === '24/7' || hoursStr.includes('24/7')) {
              openingStatus = 'OPEN_24_7';
            } else {
              openingStatus = 'OPEN';
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
        
        if (places.length > 0) {
          bboxCache.set(cacheKey, { places, timestamp: Date.now() });
          return places;
        }
      } catch (error) {
        console.warn(`Overpass fetch to ${overpassUrl} failed:`, error);
      }
    }

    return [];
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
      if (['SHOP', 'CAFE_RESTAURANT', 'BANK_ATM', 'TRANSIT', 'OTHER_PUBLIC'].includes(p.category)) publicPlaceCount++;
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
