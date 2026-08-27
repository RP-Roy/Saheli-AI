import { useState, useCallback } from 'react';

export interface LocationState {
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
  loading: boolean;
  error: string | null;
  permissionState: PermissionState | 'unknown';
}

export function useGeolocation() {
  const [state, setState] = useState<LocationState>({
    latitude: null,
    longitude: null,
    accuracy: null,
    loading: false,
    error: null,
    permissionState: 'unknown',
  });
  
  const [watchId, setWatchId] = useState<number | null>(null);

  const updatePermissionState = useCallback(async () => {
    if (navigator.permissions && navigator.permissions.query) {
      try {
        const result = await navigator.permissions.query({ name: 'geolocation' });
        setState(s => ({ ...s, permissionState: result.state }));
        result.onchange = () => {
          setState(s => ({ ...s, permissionState: result.state }));
        };
      } catch (e) {
        // Ignored
      }
    }
  }, []);

  const requestLocation = useCallback(async () => {
    setState(s => ({ ...s, loading: true, error: null }));
    
    if (!navigator.geolocation) {
      setState(s => ({
        ...s,
        loading: false,
        error: 'Geolocation is not supported by your browser.',
        permissionState: 'denied',
      }));
      return;
    }

    await updatePermissionState();

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setState({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          loading: false,
          error: null,
          permissionState: 'granted',
        });
      },
      (error) => {
        let errorMsg = 'Unable to retrieve your location.';
        let newPermissionState: PermissionState | 'unknown' = state.permissionState;

        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMsg = 'Location access is required to plan a route from your current position.';
            newPermissionState = 'denied';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMsg = 'Location information is unavailable.';
            break;
          case error.TIMEOUT:
            errorMsg = 'The request to get user location timed out.';
            break;
        }

        setState(s => ({
          ...s,
          loading: false,
          error: errorMsg,
          permissionState: newPermissionState,
        }));
      },
      {
        enableHighAccuracy: true,
        maximumAge: 30000,
        timeout: 27000,
      }
    );
  }, [state.permissionState, updatePermissionState]);

  const startWatching = useCallback(() => {
    if (!navigator.geolocation) return;
    
    if (watchId !== null) {
      return; // Already watching
    }

    const id = navigator.geolocation.watchPosition(
      (position) => {
        setState(s => ({
          ...s,
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          error: null,
        }));
      },
      (error) => {
        console.warn('Watch position error:', error);
      },
      {
        enableHighAccuracy: true,
        maximumAge: 30000,
        timeout: 27000,
      }
    );
    setWatchId(id);
  }, [watchId]);

  const stopWatching = useCallback(() => {
    if (watchId !== null && navigator.geolocation) {
      navigator.geolocation.clearWatch(watchId);
      setWatchId(null);
    }
  }, [watchId]);

  return {
    ...state,
    requestLocation,
    startWatching,
    stopWatching,
  };
}
