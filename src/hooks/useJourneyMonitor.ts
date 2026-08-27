import { useEffect, useRef } from 'react';
import { useDemo } from '../context/DemoContext';
import type { Waypoint } from '../config/demoConfig';
import { journeyService } from '../services/journeyService';
import type { LocationStatus } from '../data/demoJourney';

const DEVIATION_THRESHOLD_METERS = 200;
const NOISE_FILTER_TICKS = 3;
const PERSIST_DISTANCE_THRESHOLD = 20; // meters
const PERSIST_TIME_THRESHOLD = 15000; // ms (15 seconds)

export function useJourneyMonitor() {
  const { journey, isDemoMode, setJourney, setDeviation, updateRiskLevel } = useDemo();
  
  const deviationTicks = useRef(0);
  const geoWatchId = useRef<number | null>(null);
  const lastPersistedLoc = useRef<{ lat: number, lng: number, time: number } | null>(null);
  const lastDeviationAlertTime = useRef(0);
  
  // Keep a ref to the latest journey details needed for persistence to avoid restarting the watcher
  const latestJourneyRef = useRef({
    id: journey.id,
    routeSafetyScore: journey.routeSafetyScore,
    riskLevel: journey.riskLevel
  });
  useEffect(() => {
    latestJourneyRef.current = {
      id: journey.id,
      routeSafetyScore: journey.routeSafetyScore,
      riskLevel: journey.riskLevel
    };
  }, [journey.id, journey.routeSafetyScore, journey.riskLevel]);
  
  // Start simulation or actual watch
  useEffect(() => {
    if (!journey.isActive) {
      if (geoWatchId.current !== null) {
        navigator.geolocation.clearWatch(geoWatchId.current);
        geoWatchId.current = null;
      }
      return;
    }

    if (isDemoMode) {
      // Simulated movement
      setJourney(prev => ({ ...prev, locationStatus: 'simulated' as LocationStatus }));
      const interval = setInterval(() => {
        setJourney(prev => {
          if (!prev.isActive || prev.waypointIndex >= prev.plannedRoute.length - 1) {
            clearInterval(interval);
            return prev;
          }
          const nextIndex = prev.waypointIndex + 1;
          const nextPos = { ...prev.plannedRoute[nextIndex] };

          // Demo script: force deviation at index 1 for the College -> Home scenario
          if (prev.origin.toLowerCase() === 'college' && nextIndex === 1 && !prev.deviationDetected) {
            nextPos.lat += 0.005; // 500m away
            nextPos.lng += 0.005;
          }

          return {
            ...prev,
            waypointIndex: nextIndex,
            currentPosition: nextPos
          };
        });
      }, 3000); // 3s interval for snappier demo
      return () => clearInterval(interval);
    } else {
      // Real Geolocation
      if ('geolocation' in navigator) {
        geoWatchId.current = navigator.geolocation.watchPosition(
          async (position) => {
            const accuracy = position.coords.accuracy;
            const lat = position.coords.latitude;
            const lng = position.coords.longitude;
            
            let status: LocationStatus = 'live';
            if (accuracy > 100) {
              status = 'low_accuracy';
            }

            const currentPos: Waypoint = {
              lat,
              lng,
              label: 'Current',
              timestampOffset: 0
            };
            
            setJourney(prev => ({
              ...prev,
              currentPosition: currentPos,
              locationStatus: status
            }));

            // Throttling logic for Supabase persistence
            const now = Date.now();
            let shouldPersist = false;
            
            if (!lastPersistedLoc.current) {
              shouldPersist = true;
            } else {
              const d = getDistanceFromLatLonInM(lat, lng, lastPersistedLoc.current.lat, lastPersistedLoc.current.lng);
              const timePassed = now - lastPersistedLoc.current.time;
              if (d >= PERSIST_DISTANCE_THRESHOLD || timePassed >= PERSIST_TIME_THRESHOLD) {
                shouldPersist = true;
              }
            }

            if (shouldPersist && latestJourneyRef.current.id) {
              lastPersistedLoc.current = { lat, lng, time: now };
              await journeyService.updatePosition(
                latestJourneyRef.current.id, 
                lat, 
                lng, 
                latestJourneyRef.current.routeSafetyScore, 
                latestJourneyRef.current.riskLevel
              );
            }
          },
          (error) => {
            console.error("Error watching position", error);
            let status: LocationStatus = 'unavailable';
            if (error.code === 1) status = 'denied';
            else if (error.code === 2) status = 'unavailable';
            else if (error.code === 3) status = 'timeout';
            
            setJourney(prev => ({ ...prev, locationStatus: status }));
          },
          { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 }
        );
      } else {
        setJourney(prev => ({ ...prev, locationStatus: 'unavailable' }));
      }
      
      return () => {
        if (geoWatchId.current !== null) {
          navigator.geolocation.clearWatch(geoWatchId.current);
          geoWatchId.current = null;
        }
      };
    }
  }, [journey.isActive, isDemoMode, setJourney]);

  // Deviation Detection (runs whenever currentPosition changes)
  useEffect(() => {
    if (!journey.isActive || !journey.currentPosition || journey.plannedRoute.length === 0) return;
    
    let minDistance = Infinity;
    const { lat, lng } = journey.currentPosition;
    
    for (const wp of journey.plannedRoute) {
      const d = getDistanceFromLatLonInM(lat, lng, wp.lat, wp.lng);
      if (d < minDistance) minDistance = d;
    }
    
    if (minDistance > DEVIATION_THRESHOLD_METERS) {
      deviationTicks.current += 1;
      const threshold = isDemoMode ? 1 : NOISE_FILTER_TICKS;
      if (deviationTicks.current >= threshold && !journey.deviationDetected) {
        if (Date.now() - lastDeviationAlertTime.current > 60000) {
          setDeviation(true);
          updateRiskLevel('CAUTION');
          lastDeviationAlertTime.current = Date.now();
        }
      }
    } else {
      deviationTicks.current = 0;
      if (journey.deviationDetected) {
         setDeviation(false);
         updateRiskLevel('SAFE');
      }
    }
    
  }, [journey.currentPosition, journey.isActive, journey.plannedRoute, journey.deviationDetected, setDeviation, updateRiskLevel, isDemoMode]);

}

function getDistanceFromLatLonInM(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371e3; // Radius of the earth in m
  const dLat = deg2rad(lat2-lat1);
  const dLon = deg2rad(lon2-lon1); 
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2)
    ; 
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  return R * c; 
}

function deg2rad(deg: number) {
  return deg * (Math.PI/180);
}
