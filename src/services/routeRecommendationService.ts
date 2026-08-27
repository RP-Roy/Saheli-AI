import type { RouteOption } from '../config/demoConfig';

export const routeRecommendationService = {
  /**
   * Recommends a route by balancing travel time against safety score.
   * Modifies the input array directly (or returns it mutated).
   */
  recommendRoute(routes: RouteOption[], maxDetourRatio: number = 1.25): RouteOption[] {
    if (!routes || routes.length === 0) return routes;

    const IS_DEBUG = import.meta.env?.MODE === 'development' || process.env.NODE_ENV === 'development';

    // First, sort by ETA to identify the fastest route
    routes.sort((a, b) => a.etaMins - b.etaMins);
    
    const fastestRoute = routes[0];
    const fastestTime = fastestRoute.etaMins;
    
    for (let i = 0; i < routes.length; i++) {
      routes[i].type = 'BALANCED';
      routes[i].label = `Route Option ${i + 1}`;
    }
    
    fastestRoute.type = 'FASTEST';
    fastestRoute.label = 'Fastest Route';

    let recommendedRoute = fastestRoute;
    
    for (const route of routes) {
      if (!route.routeSafetyResult || !route.coverageSummary) continue;
      
      const currentRecScore = recommendedRoute.routeSafetyResult?.score ?? 0;
      const candidateScore = route.routeSafetyResult.score;
      
      // Rule 4: Never recommend a route solely because it has more nearby businesses.
      // We require either a meaningfully higher score (e.g. +10) OR specific critical infrastructure advantages
      const scoreDiff = candidateScore - currentRecScore;
      const hasMeaningfulScoreIncrease = scoreDiff >= 5; // meaningfully better score
      
      const currentCoverage = recommendedRoute.coverageSummary!;
      const candidateCoverage = route.coverageSummary;
      
      const hasCriticalAdvantage = 
        (candidateCoverage.policeCount > currentCoverage.policeCount) ||
        (candidateCoverage.hospitalCount > currentCoverage.hospitalCount) ||
        (candidateCoverage.openPharmacyCount > currentCoverage.openPharmacyCount) ||
        (candidateCoverage.openHotelCount > currentCoverage.openHotelCount) ||
        (currentCoverage.maxStretchWithoutPlacesMeters - candidateCoverage.maxStretchWithoutPlacesMeters > 500); // significantly shorter dark stretch
      
      // Accept route if it's safer and within the detour limits
      if (candidateScore > currentRecScore && route.etaMins <= fastestTime * maxDetourRatio) {
        // Enforce the business rule: if it doesn't have a critical advantage, it needs a much bigger score difference
        if (hasCriticalAdvantage || scoreDiff >= 10) {
          recommendedRoute = route;
        }
      }
    }
    
    // Build data-driven explanation
    if (recommendedRoute.id !== fastestRoute.id) {
      recommendedRoute.type = 'SAFEST';
      recommendedRoute.label = 'Recommended Safer Route';
      
      const timeDiff = recommendedRoute.etaMins - fastestTime;
      const scoreDiff = (recommendedRoute.routeSafetyResult?.score ?? 0) - (fastestRoute.routeSafetyResult?.score ?? 0);
      
      // Extract specific features for the explanation
      const features: string[] = [];
      const coverage = recommendedRoute.coverageSummary!;
      if (coverage.policeCount > 0) features.push(coverage.policeCount > 1 ? 'police stations' : 'a police station');
      if (coverage.hospitalCount > 0) features.push(coverage.hospitalCount > 1 ? 'hospitals/clinics' : 'a hospital/clinic');
      if (coverage.openPharmacyCount > 0) features.push('an open pharmacy');
      if (coverage.openHotelCount > 0) features.push('an open hotel');
      if (coverage.openFuelCount > 0) features.push('an open fuel station');
      
      let featureString = '';
      if (features.length > 0) {
        if (features.length === 1) {
          featureString = `, including ${features[0]}`;
        } else if (features.length === 2) {
          featureString = `, including ${features[0]} and ${features[1]}`;
        } else {
          const last = features.pop();
          featureString = `, including ${features.join(', ')}, and ${last}`;
        }
      } else if (recommendedRoute.coverageSummary!.maxStretchWithoutPlacesMeters < fastestRoute.coverageSummary!.maxStretchWithoutPlacesMeters) {
         featureString = `, with fewer long stretches without safety coverage`;
      }
      
      recommendedRoute.recommendation = {
        reason: `Recommended because it adds ${timeDiff} minute${timeDiff !== 1 ? 's' : ''} but has stronger safety-supporting coverage${featureString}.`,
        comparison: {
          timeDiffMins: timeDiff,
          scoreDiff: scoreDiff,
          isFastest: false
        }
      };
    } else {
      recommendedRoute.type = 'SAFEST';
      recommendedRoute.label = 'Fastest & Safest Route';
      
      const coverage = recommendedRoute.coverageSummary!;
      const features: string[] = [];
      if (coverage.policeCount > 0) features.push('police');
      if (coverage.hospitalCount > 0) features.push('hospital');
      
      const bonus = features.length > 0 ? ` (includes ${features.join(' and ')})` : '';

      recommendedRoute.recommendation = {
        reason: `Recommended because it is the fastest route and has the highest safety coverage available${bonus}.`,
        comparison: {
          timeDiffMins: 0,
          scoreDiff: 0,
          isFastest: true
        }
      };
    }

    if (IS_DEBUG) {
      console.log('--- ROUTE RECOMMENDATION DEBUG ---');
      routes.forEach(r => {
        const isRec = r.id === recommendedRoute.id;
        const detour = r.etaMins - fastestTime;
        console.log(`Route [${r.id}] ${isRec ? '(RECOMMENDED)' : ''}: Score=${r.routeSafetyResult?.score}, ETA=${r.etaMins}m (+${detour}m)`);
      });
      console.log(`Reason: ${recommendedRoute.recommendation?.reason}`);
      console.log('----------------------------------');
    }
    
    // Sort array so that SAFEST is always first
    routes.sort((a, b) => {
      if (a.id === recommendedRoute.id) return -1;
      if (b.id === recommendedRoute.id) return 1;
      return a.etaMins - b.etaMins;
    });

    return routes;
  }
};
