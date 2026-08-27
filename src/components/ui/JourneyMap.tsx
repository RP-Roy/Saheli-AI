import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { RiskLevel } from '../../config/appConfig';
import { Locate } from 'lucide-react';

// ─── Fix Leaflet default icon ─────────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// ─── Types ────────────────────────────────────────────────────────────────────

interface LatLng { lat: number; lng: number; }

interface JourneyMapProps {
  origin?: LatLng & { label: string };
  destination?: LatLng & { label: string };
  currentPosition: LatLng;
  waypoints: Array<LatLng & { label?: string }>;
  safetyPoints?: import('../../config/demoConfig').SafetyPlace[];
  riskLevel: RiskLevel;
  isActive?: boolean;
  className?: string;
}

// ─── Status colors ────────────────────────────────────────────────────────────

const RISK_COLOR: Record<RiskLevel, string> = {
  SAFE:      '#10b981',
  CAUTION:   '#f59e0b',
  HIGH_RISK: '#ef4444',
};

// ─── Custom marker HTML ───────────────────────────────────────────────────────

function originMarkerHtml() {
  return `
    <div style="width:32px;height:32px;border-radius:50%;background:#4f46e5;border:3px solid white;
      box-shadow:0 2px 8px rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;
      color:white;font-size:11px;font-weight:700;">A</div>`;
}

function destinationMarkerHtml() {
  return `
    <div style="width:32px;height:32px;border-radius:50%;background:#059669;border:3px solid white;
      box-shadow:0 2px 8px rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;
      color:white;font-size:11px;font-weight:700;">B</div>`;
}

function currentPositionHtml(color: string) {
  return `
    <div style="position:relative;width:40px;height:40px;">
      <div style="position:absolute;inset:0;border-radius:50%;background:${color};opacity:0.25;
        animation:saheli-pulse 2s ease-in-out infinite;"></div>
      <div style="position:absolute;inset:10px;border-radius:50%;background:${color};
        border:2.5px solid white;box-shadow:0 0 12px ${color}88;"></div>
    </div>`;
}

function safetyPointHtml(type: string) {
  const icon = 
    type === 'POLICE' ? '👮' :
    type === 'HOSPITAL' ? '🏥' :
    type === 'PHARMACY' ? '🏪' :
    type === 'FUEL' ? '⛽' :
    type === 'HOTEL' ? '🏨' :
    type === 'SHOP' ? '🛍️' :
    type === 'CAFE_RESTAURANT' || type === 'OTHER_PUBLIC' ? '☕' : '📍';
  
  const borderColor = 
    type === 'POLICE' ? '#3b82f6' :
    type === 'HOSPITAL' ? '#ef4444' :
    type === 'PHARMACY' ? '#10b981' : '#6366f1';

  return `
    <div style="width:30px;height:30px;border-radius:10px;background:#0f172a;border:2px solid ${borderColor};
      box-shadow:0 3px 10px rgba(0,0,0,0.6);display:flex;align-items:center;justify-content:center;
      font-size:15px;cursor:pointer;">${icon}</div>`;
}

// ─── Keyframe injection (once) ────────────────────────────────────────────────

let keyframesInjected = false;
function injectKeyframes() {
  if (keyframesInjected) return;
  keyframesInjected = true;
  const style = document.createElement('style');
  style.textContent = `
    @keyframes saheli-pulse {
      0%, 100% { transform: scale(1); opacity: 0.25; }
      50% { transform: scale(1.6); opacity: 0.1; }
    }
  `;
  document.head.appendChild(style);
}

export function JourneyMap({
  origin, destination, currentPosition,
  waypoints, safetyPoints = [], riskLevel, isActive = true, className = '',
}: JourneyMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  
  // Keep refs to layers so we can update them
  const layersRef = useRef({
    routeLine: null as L.Polyline | null,
    completedLine: null as L.Polyline | null,
    originMarker: null as L.Marker | null,
    destMarker: null as L.Marker | null,
    posMarker: null as L.Marker | null,
    safetyMarkers: [] as L.Marker[],
  });

  // 1. Initialize Map exactly once
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    injectKeyframes();

    const map = L.map(containerRef.current, {
      center: [currentPosition.lat, currentPosition.lng],
      zoom: 13,
      zoomControl: false,
      attributionControl: false,
    });

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
    }).addTo(map);

    L.control.attribution({ position: 'bottomright' })
      .addAttribution('© <a href="https://openstreetmap.org">OSM</a> © <a href="https://carto.com">CARTO</a>')
      .addTo(map);

    L.control.zoom({ position: 'topright' }).addTo(map);
    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty deps to strictly initialize once

  // 2. Sync layers when props change
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const layers = layersRef.current;

    // Clear old safety markers
    layers.safetyMarkers.forEach(m => m.remove());
    layers.safetyMarkers = [];

    const hasRoute = waypoints && waypoints.length > 0;

    // --- Origin Marker ---
    if (origin) {
      if (!layers.originMarker) {
        layers.originMarker = L.marker([origin.lat, origin.lng], {
          icon: L.divIcon({ html: originMarkerHtml(), className: '', iconSize: [32, 32], iconAnchor: [16, 16] })
        }).addTo(map);
      } else {
        layers.originMarker.setLatLng([origin.lat, origin.lng]);
      }
      layers.originMarker.bindPopup(`<b>Start:</b> ${origin.label}`);
    } else if (layers.originMarker) {
      layers.originMarker.remove();
      layers.originMarker = null;
    }

    // --- Destination Marker ---
    if (destination) {
      if (!layers.destMarker) {
        layers.destMarker = L.marker([destination.lat, destination.lng], {
          icon: L.divIcon({ html: destinationMarkerHtml(), className: '', iconSize: [32, 32], iconAnchor: [16, 16] })
        }).addTo(map);
      } else {
        layers.destMarker.setLatLng([destination.lat, destination.lng]);
      }
      layers.destMarker.bindPopup(`<b>Destination:</b> ${destination.label}`);
    } else if (layers.destMarker) {
      layers.destMarker.remove();
      layers.destMarker = null;
    }

    // --- Current Position Marker ---
    const posColor = RISK_COLOR[riskLevel] || RISK_COLOR.SAFE;
    const posIcon = L.divIcon({ html: currentPositionHtml(posColor), className: '', iconSize: [40, 40], iconAnchor: [20, 20] });
    
    if (!layers.posMarker) {
      layers.posMarker = L.marker([currentPosition.lat, currentPosition.lng], {
        icon: posIcon,
        zIndexOffset: 1000,
      }).addTo(map);
    } else {
      layers.posMarker.setLatLng([currentPosition.lat, currentPosition.lng]);
      layers.posMarker.setIcon(posIcon);
    }
    layers.posMarker.bindPopup('You are here');

    // --- Route Polyline ---
    if (hasRoute) {
      const routePoints: L.LatLngExpression[] = waypoints.map(w => [w.lat, w.lng]);
      if (!layers.routeLine) {
        layers.routeLine = L.polyline(routePoints, {
          color: '#6366f1', weight: 5, opacity: 0.85, dashArray: '10 5', lineJoin: 'round',
        }).addTo(map);
      } else {
        layers.routeLine.setLatLngs(routePoints);
      }
    } else if (layers.routeLine) {
      layers.routeLine.remove();
      layers.routeLine = null;
    }

    // --- Completed Polyline ---
    if (hasRoute && isActive && origin) {
      const completedPoints: L.LatLngExpression[] = [
        [origin.lat, origin.lng],
        [currentPosition.lat, currentPosition.lng],
      ];
      if (!layers.completedLine) {
        layers.completedLine = L.polyline(completedPoints, {
          color: posColor, weight: 5, opacity: 0.9, lineJoin: 'round',
        }).addTo(map);
      } else {
        layers.completedLine.setLatLngs(completedPoints);
        layers.completedLine.setStyle({ color: posColor });
      }
    } else if (layers.completedLine) {
      layers.completedLine.remove();
      layers.completedLine = null;
    }

    // --- Safety Points ---
    if (hasRoute) {
      safetyPoints.forEach(sp => {
        const statusBadge = sp.openingStatus === 'OPEN_24_7' ? '<span style="color:#10b981;font-weight:700;">• Open 24/7</span>' :
          sp.openingStatus === 'OPEN' ? '<span style="color:#10b981;">• Open</span>' :
          sp.openingStatus === 'CLOSED' ? '<span style="color:#ef4444;">• Closed</span>' : '';
        
        const popupContent = `
          <div style="font-family:sans-serif;font-size:12px;color:#0f172a;line-height:1.4;min-width:140px;">
            <div style="font-weight:700;font-size:13px;margin-bottom:2px;">${sp.name}</div>
            <div style="color:#64748b;font-size:11px;text-transform:capitalize;">${sp.category.toLowerCase().replace(/_/g, ' ')} ${statusBadge}</div>
            ${sp.distanceFromRouteMeters !== undefined ? `<div style="margin-top:4px;color:#475569;font-size:10px;">${sp.distanceFromRouteMeters}m from route</div>` : ''}
          </div>
        `;
        const marker = L.marker([sp.latitude, sp.longitude], {
          icon: L.divIcon({ html: safetyPointHtml(sp.category), className: '', iconSize: [30, 30], iconAnchor: [15, 15] }),
        }).addTo(map).bindPopup(popupContent);
        layers.safetyMarkers.push(marker);
      });
    }

    // --- Fit Bounds ---
    if (hasRoute && layers.routeLine && layers.routeLine.getBounds().isValid()) {
      map.fitBounds(layers.routeLine.getBounds(), { padding: [50, 50], maxZoom: 16 });
    } else {
      map.setView([currentPosition.lat, currentPosition.lng], 14);
    }

  }, [origin, destination, currentPosition, waypoints, safetyPoints, riskLevel, isActive]);

  return (
    <div className={`relative ${className}`} style={{ minHeight: '100%' }}>
      <div ref={containerRef} className="absolute inset-0 z-0" />
      <button 
        onClick={(e) => {
          e.preventDefault();
          if (mapRef.current && currentPosition) {
            mapRef.current.setView([currentPosition.lat, currentPosition.lng], 16);
          }
        }}
        className="absolute bottom-6 right-4 z-[400] bg-surface-800 text-white p-2.5 rounded-full shadow-lg border border-white/10 hover:bg-surface-700 transition-colors"
        title="Recenter on me"
      >
        <Locate className="w-5 h-5 text-primary-400" />
      </button>
    </div>
  );
}
