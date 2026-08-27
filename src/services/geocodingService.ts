const GEOAPIFY_API_KEY = import.meta.env.VITE_GEOAPIFY_API_KEY || '';

export interface GeocodingResult {
  placeId: string;
  name: string;
  address: string;
  lat: number;
  lon: number;
}

export const geocodingService = {
  async searchDestinations(query: string, userLocation?: { lat: number; lng: number }): Promise<GeocodingResult[]> {
    if (!GEOAPIFY_API_KEY) {
      console.error('Geoapify API key is missing. Please set VITE_GEOAPIFY_API_KEY.');
      throw new Error('Geocoding service is not configured (missing API key).');
    }

    if (!query || query.length < 3) {
      return [];
    }

    try {
      let url = `https://api.geoapify.com/v1/geocode/autocomplete?text=${encodeURIComponent(query)}&apiKey=${GEOAPIFY_API_KEY}&limit=5`;
      
      if (userLocation) {
        url += `&bias=proximity:${userLocation.lng},${userLocation.lat}`;
      }

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const data = await response.json();
      
      if (!data.features) {
        return [];
      }

      return data.features.map((feature: any) => ({
        placeId: feature.properties.place_id,
        name: feature.properties.name || feature.properties.street || feature.properties.city || 'Unknown Place',
        address: feature.properties.formatted,
        lat: feature.properties.lat,
        lon: feature.properties.lon,
      }));
    } catch (error) {
      console.error('Autocomplete failed:', error);
      throw new Error('Unable to search destinations right now.');
    }
  },

  async geocodeDestination(query: string): Promise<GeocodingResult | null> {
    if (!GEOAPIFY_API_KEY) {
      throw new Error('Geocoding service is not configured (missing API key).');
    }

    try {
      const url = `https://api.geoapify.com/v1/geocode/search?text=${encodeURIComponent(query)}&apiKey=${GEOAPIFY_API_KEY}&limit=1`;
      const response = await fetch(url);
      const data = await response.json();

      if (data.features && data.features.length > 0) {
        const feature = data.features[0];
        return {
          placeId: feature.properties.place_id,
          name: feature.properties.name || feature.properties.formatted,
          address: feature.properties.formatted,
          lat: feature.properties.lat,
          lon: feature.properties.lon,
        };
      }
      return null;
    } catch (error) {
      console.error('Geocoding search failed:', error);
      throw new Error('Unable to find location right now.');
    }
  }
};
