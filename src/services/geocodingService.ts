const GEOAPIFY_API_KEY = import.meta.env.VITE_GEOAPIFY_API_KEY || '';

export interface GeocodingResult {
  placeId: string;
  name: string;
  address: string;
  lat: number;
  lon: number;
}

export const geocodingService = {
  /**
   * Searches destinations using Geoapify with automatic fallback to OpenStreetMap Nominatim
   */
  async searchDestinations(query: string, userLocation?: { lat: number; lng: number }): Promise<GeocodingResult[]> {
    const trimmed = query.trim();
    if (!trimmed || trimmed.length < 2) {
      return [];
    }

    // 1. Try Geoapify if valid API key is configured
    if (GEOAPIFY_API_KEY && !GEOAPIFY_API_KEY.includes('your-') && GEOAPIFY_API_KEY.length > 10) {
      try {
        let url = `https://api.geoapify.com/v1/geocode/autocomplete?text=${encodeURIComponent(trimmed)}&apiKey=${GEOAPIFY_API_KEY}&limit=5`;
        if (userLocation) {
          url += `&bias=proximity:${userLocation.lng},${userLocation.lat}`;
        }

        const response = await fetch(url);
        if (response.ok) {
          const data = await response.json();
          if (data?.features && data.features.length > 0) {
            return data.features.map((feature: any) => ({
              placeId: String(feature.properties.place_id || feature.properties.osm_id || Math.random()),
              name: feature.properties.name || feature.properties.street || feature.properties.city || trimmed,
              address: feature.properties.formatted || feature.properties.address_line2 || feature.properties.city || '',
              lat: Number(feature.properties.lat),
              lon: Number(feature.properties.lon),
            }));
          }
        }
      } catch (geoapifyErr) {
        console.warn('Geoapify autocomplete failed, falling back to OpenStreetMap Nominatim:', geoapifyErr);
      }
    }

    // 2. OpenStreetMap Nominatim Fallback (Free, no key required)
    try {
      const nominatimUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(trimmed)}&limit=5&addressdetails=1`;
      const response = await fetch(nominatimUrl, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Saheli-Safety-Companion/1.0',
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data) && data.length > 0) {
          return data.map((item: any) => ({
            placeId: String(item.place_id || item.osm_id),
            name: item.namedetails?.name || item.name || item.display_name.split(',')[0] || trimmed,
            address: item.display_name || '',
            lat: parseFloat(item.lat),
            lon: parseFloat(item.lon),
          }));
        }
      }
    } catch (nominatimErr) {
      console.warn('Nominatim geocoding failed:', nominatimErr);
    }

    // 3. Fallback for offline / network issues: curated landmark matching
    const curatedLandmarks: GeocodingResult[] = [
      { placeId: 'c1', name: 'Indiranagar 100ft Road', address: 'Indiranagar, Bengaluru, Karnataka, India', lat: 12.9784, lon: 77.6408 },
      { placeId: 'c2', name: 'MG Road Metro Station', address: 'Mahatma Gandhi Rd, Bengaluru, Karnataka, India', lat: 12.9756, lon: 77.6066 },
      { placeId: 'c3', name: 'Koramangala Sony World Signal', address: 'Koramangala, Bengaluru, Karnataka, India', lat: 12.9352, lon: 77.6245 },
      { placeId: 'c4', name: 'Connaught Place', address: 'Connaught Place, New Delhi, Delhi, India', lat: 28.6315, lon: 77.2167 },
      { placeId: 'c5', name: 'Bandra Bandstand', address: 'Bandra West, Mumbai, Maharashtra, India', lat: 19.0435, lon: 72.8197 },
      { placeId: 'c6', name: 'Hauz Khas Village', address: 'Hauz Khas, New Delhi, Delhi, India', lat: 28.5534, lon: 77.1944 },
    ];

    const matched = curatedLandmarks.filter(l => 
      l.name.toLowerCase().includes(trimmed.toLowerCase()) || 
      l.address.toLowerCase().includes(trimmed.toLowerCase())
    );

    if (matched.length > 0) {
      return matched;
    }

    return [];
  },

  /**
   * Geocodes a single destination string
   */
  async geocodeDestination(query: string): Promise<GeocodingResult | null> {
    const results = await this.searchDestinations(query);
    return results.length > 0 ? results[0] : null;
  }
};
