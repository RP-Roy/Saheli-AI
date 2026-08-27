import type { SafetyPlace, RouteCoverageSummary, RouteOption, RouteSafetyResult, RouteSafetyLevel } from '../config/demoConfig';

export interface RouteSafetyContext {
  detourRatio: number; // e.g. 1.0 (no detour), 1.25 (25% longer than fastest)
}

export const routeSafetyEngine = {
  calculateRouteSafety(
    coverageSummary: RouteCoverageSummary & { _demoOverrideScore?: number, _demoStrengths?: string[], _demoWeaknesses?: string[], _demoReasons?: string[] },
    safetyPlaces: SafetyPlace[],
    context: RouteSafetyContext
  ): RouteSafetyResult {
    if (coverageSummary._demoOverrideScore !== undefined) {
      const score = coverageSummary._demoOverrideScore;
      return {
        score,
        level: score >= 80 ? 'HIGHER_SAFETY_COVERAGE' : (score >= 60 ? 'MODERATE_SAFETY_COVERAGE' : 'LIMITED_SAFETY_COVERAGE'),
        reasons: coverageSummary._demoReasons || [],
        strengths: coverageSummary._demoStrengths || [],
        weaknesses: coverageSummary._demoWeaknesses || [],
        coverage: coverageSummary,
        safetyPlacesUsed: safetyPlaces.length
      };
    }
    
    let score = 50; // Starting baseline
    
    const strengths: string[] = [];
    const weaknesses: string[] = [];
    const reasons: string[] = [];
    
    // -- Helper to get min distance for a category --
    const getMinDistance = (filterFn: (p: SafetyPlace) => boolean): number | null => {
      const places = safetyPlaces.filter(filterFn);
      if (places.length === 0) return null;
      return Math.min(...places.map(p => p.distanceFromRouteMeters));
    };

    // -- POSITIVE SIGNALS --
    
    const minPoliceDist = getMinDistance(p => p.category === 'POLICE');
    if (minPoliceDist !== null) {
      if (coverageSummary.policeCount >= 2) {
        score += 20;
        strengths.push(`Multiple police stations nearby (closest is ${minPoliceDist}m)`);
      } else {
        score += 10;
        strengths.push(`Police station within ${minPoliceDist}m of route`);
      }
    }
    
    const validPublicPlaces = safetyPlaces.filter(p => ['SHOP', 'CAFE_RESTAURANT', 'OTHER_PUBLIC'].includes(p.category));
    if (validPublicPlaces.length >= 3) {
      score += 15;
      strengths.push(`High density of safety-supporting public places (${validPublicPlaces.length})`);
    } else if (validPublicPlaces.length > 0) {
      score += 8;
      strengths.push(`Some public places mapped along route (${validPublicPlaces.length})`);
    }
    
    const minHospitalDist = getMinDistance(p => p.category === 'HOSPITAL');
    if (minHospitalDist !== null) {
      score += 10;
      strengths.push(`Hospital/clinic within ${minHospitalDist}m`);
    }
    
    const minPharmacyDist = getMinDistance(p => p.category === 'PHARMACY' && (p.openingStatus === 'OPEN' || p.openingStatus === 'OPEN_24_7'));
    if (minPharmacyDist !== null) {
      score += 5;
      strengths.push(`Open pharmacy within ${minPharmacyDist}m`);
    }
    
    const minFuelDist = getMinDistance(p => p.category === 'FUEL' && (p.openingStatus === 'OPEN' || p.openingStatus === 'OPEN_24_7'));
    if (minFuelDist !== null) {
      score += 5;
      strengths.push(`Open fuel station within ${minFuelDist}m`);
    }
    
    const minHotelDist = getMinDistance(p => p.category === 'HOTEL' && (p.openingStatus === 'OPEN' || p.openingStatus === 'OPEN_24_7'));
    if (minHotelDist !== null) {
      score += 5;
      strengths.push(`Open hotel within ${minHotelDist}m`);
    }
    
    // -- NEGATIVE SIGNALS --
    
    if (coverageSummary.maxStretchWithoutPlacesMeters > 4000) {
      score -= 15;
      weaknesses.push(`Very long segment (${(coverageSummary.maxStretchWithoutPlacesMeters/1000).toFixed(1)}km) with limited mapped safety-supporting places`);
    } else if (coverageSummary.maxStretchWithoutPlacesMeters > 2000) {
      score -= 10;
      weaknesses.push(`Longer segment (${(coverageSummary.maxStretchWithoutPlacesMeters/1000).toFixed(1)}km) with limited mapped safety-supporting places`);
    }
    
    // Detour penalty
    if (context.detourRatio > 1.3) {
      score -= 10;
      weaknesses.push(`Excessive route detour (approx ${Math.round((context.detourRatio - 1) * 100)}% longer)`);
    }
    
    // Ensure 0-100 bounds
    score = Math.max(0, Math.min(100, Math.round(score)));
    
    let level: RouteSafetyLevel = 'LIMITED_SAFETY_COVERAGE';
    if (score >= 80) level = 'HIGHER_SAFETY_COVERAGE';
    else if (score >= 60) level = 'MODERATE_SAFETY_COVERAGE';

    return {
      score,
      level,
      reasons: [...strengths, ...weaknesses], // Combine them to fulfill legacy `reasons` just in case, but rely on strengths/weaknesses in UI
      strengths,
      weaknesses,
      coverage: coverageSummary,
      safetyPlacesUsed: safetyPlaces.length
    };
  }
};
