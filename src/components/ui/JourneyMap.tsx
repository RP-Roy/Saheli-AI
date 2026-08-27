import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { RiskLevel } from '../../config/appConfig';
import { Locate, Shield, Plus, Cross, Bed, Fuel, Train, Coffee, ShoppingBag, MapPin } from 'lucide-react';

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
  currentPosition?: LatLng | null;
  hasLocation?: boolean;
  waypoints: Array<LatLng & { label?: string }>;
  safetyPoints?: import('../../config/demoConfig').SafetyPlace[];
  riskLevel: RiskLevel;
  isActive?: boolean;
  className?: string;
  onRecenter?: () => void;
}

// ─── Constants ────────────────────────────────────────────────────────────────
const INDIA_CENTER: [number, number] = [20.5937, 78.9629];
const INDIA_ZOOM = 5;

// ─── Soft Rose / Status Colors ────────────────────────────────────────────────
const BRAND_ROSE = '#E85D75';
const BRAND_ROSE_MUTED = '#F48FB1';

// ─── Custom HTML Markers ──────────────────────────────────────────────────────

function originMarkerHtml(label: string = 'A') {
  return `
    <div style="width:34px;height:34px;border-radius:18px;background:#FFFFFF;border:2.5px solid #E85D75;
      box-shadow:0 4px 14px rgba(232,93,117,0.35);display:flex;align-items:center;justify-content:center;
      color:#E85D75;font-size:12px;font-weight:800;font-family:'Plus Jakarta Sans',sans-serif;
      animation:saheli-pop-in 0.4s cubic-bezier(0.16, 1, 0.3, 1);">
      ${label === 'Current Location' || label === 'Your Location' ? '◎' : 'A'}
    </div>`;
}

function destinationMarkerHtml() {
  return `
    <div style="width:34px;height:34px;border-radius:18px;background:#E85D75;border:2.5px solid #FFFFFF;
      box-shadow:0 4px 16px rgba(232,93,117,0.45);display:flex;align-items:center;justify-content:center;
      color:#FFFFFF;font-size:12px;font-weight:800;font-family:'Plus Jakarta Sans',sans-serif;
      animation:saheli-pop-in 0.4s cubic-bezier(0.16, 1, 0.3, 1);">
      📍
    </div>`;
}

function userLocationMarkerHtml() {
  return `
    <div style="position:relative;width:44px;height:44px;display:flex;align-items:center;justify-content:center;">
      <div style="position:absolute;inset:0;border-radius:50%;background:#E85D75;opacity:0.22;
        animation:saheli-gentle-pulse 2.2s ease-in-out infinite;"></div>
      <div style="position:absolute;width:24px;height:24px;border-radius:50%;background:#FFF0F3;border:2px solid #E85D75;box-shadow:0 0 10px rgba(232,93,117,0.35);"></div>
      <div style="position:relative;width:12px;height:12px;border-radius:50%;background:#E85D75;box-shadow:0 0 6px rgba(232,93,117,0.8);"></div>
    </div>`;
}

function safetyPointHtml(type: string) {
  const icon = 
    type === 'POLICE' ? '👮' :
    type === 'HOSPITAL' ? '🏥' :
    type === 'PHARMACY' ? '💊' :
    type === 'BANK_ATM' ? '🏧' :
    type === 'FUEL' ? '⛽' :
    type === 'HOTEL' ? '🏨' :
    type === 'TRANSIT' ? '🚉' :
    type === 'CAFE_RESTAURANT' ? '☕' :
    type === 'SHOP' ? '🛍️' : '✨';
  
  return `
    <div style="width:32px;height:32px;border-radius:12px;background:#FFFFFF;border:1.5px solid #F8BBD0;
      box-shadow:0 4px 12px rgba(232,93,117,0.18);display:flex;align-items:center;justify-content:center;
      font-size:14px;cursor:pointer;transition:transform 0.2s cubic-bezier(0.16, 1, 0.3, 1);"
      onmouseover="this.style.transform='scale(1.15) translateY(-2px)'"
      onmouseout="this.style.transform='scale(1) translateY(0)'"
    >${icon}</div>`;
}

// ─── Keyframe injection (once) ────────────────────────────────────────────────
let keyframesInjected = false;
function injectKeyframes() {
  if (keyframesInjected) return;
  keyframesInjected = true;
  const style = document.createElement('style');
  style.textContent = `
    @keyframes saheli-gentle-pulse {
      0%, 100% { transform: scale(0.9); opacity: 0.25; }
      50% { transform: scale(1.4); opacity: 0.08; }
    }
    @keyframes saheli-pop-in {
      0% { transform: scale(0.6); opacity: 0; }
      100% { transform: scale(1); opacity: 1; }
    }
    .leaflet-popup-content-wrapper {
      border-radius: 18px !important;
      padding: 4px !important;
      box-shadow: 0 12px 32px rgba(232, 93, 117, 0.15), 0 2px 8px rgba(59, 41, 48, 0.05) !important;
      border: 1px solid rgba(248, 187, 208, 0.8) !important;
      background: rgba(255, 255, 255, 0.98) !important;
    }
    .leaflet-popup-tip {
      background: #FFFFFF !important;
      border: 1px solid rgba(248, 187, 208, 0.6) !important;
    }
    .leaflet-container {
      font-family: 'Plus Jakarta Sans', sans-serif !important;
    }
  `;
  document.head.appendChild(style);
}

export function JourneyMap({
  origin,
  destination,
  currentPosition,
  hasLocation = true,
  waypoints,
  safetyPoints = [],
  riskLevel,
  isActive = true,
  className = '',
  onRecenter,
}: JourneyMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  
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

    const initialCenter: [number, number] = (hasLocation && currentPosition)
      ? [currentPosition.lat, currentPosition.lng]
      : INDIA_CENTER;
    const initialZoom = (hasLocation && currentPosition) ? 14 : INDIA_ZOOM;

    const map = L.map(containerRef.current, {
      center: initialCenter,
      zoom: initialZoom,
      zoomControl: false,
      attributionControl: false,
    });

    const geoapifyKey = import.meta.env.VITE_GEOAPIFY_API_KEY;
    const tileUrl = (geoapifyKey && geoapifyKey.length > 10 && !geoapifyKey.includes('your-'))
      ? `https://maps.geoapify.com/v1/tile/osm-bright-smooth/{z}/{x}/{y}.png?apiKey=${geoapifyKey}`
      : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
    const tileAttribution = geoapifyKey
      ? '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> © <a href="https://www.geoapify.com/">Geoapify</a>'
      : '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';

    L.tileLayer(tileUrl, {
      maxZoom: 19,
      subdomains: ['a', 'b', 'c'],
    }).addTo(map);

    L.control.attribution({ position: 'bottomright' })
      .addAttribution(tileAttribution)
      .addTo(map);

    L.control.zoom({ position: 'topright' }).addTo(map);
    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
          icon: L.divIcon({ html: originMarkerHtml(origin.label), className: '', iconSize: [34, 34], iconAnchor: [17, 17] })
        }).addTo(map);
      } else {
        layers.originMarker.setLatLng([origin.lat, origin.lng]);
        layers.originMarker.setIcon(L.divIcon({ html: originMarkerHtml(origin.label), className: '', iconSize: [34, 34], iconAnchor: [17, 17] }));
      }
      layers.originMarker.bindPopup(`
        <div style="padding:6px 8px;font-size:12px;color:#3B2930;">
          <div style="font-weight:700;color:#E85D75;margin-bottom:2px;">Origin</div>
          <div>${origin.label}</div>
        </div>
      `);
    } else if (layers.originMarker) {
      layers.originMarker.remove();
      layers.originMarker = null;
    }

    // --- Destination Marker ---
    if (destination) {
      if (!layers.destMarker) {
        layers.destMarker = L.marker([destination.lat, destination.lng], {
          icon: L.divIcon({ html: destinationMarkerHtml(), className: '', iconSize: [34, 34], iconAnchor: [17, 17] })
        }).addTo(map);
      } else {
        layers.destMarker.setLatLng([destination.lat, destination.lng]);
      }
      layers.destMarker.bindPopup(`
        <div style="padding:6px 8px;font-size:12px;color:#3B2930;">
          <div style="font-weight:700;color:#E85D75;margin-bottom:2px;">Destination</div>
          <div>${destination.label}</div>
        </div>
      `);
    } else if (layers.destMarker) {
      layers.destMarker.remove();
      layers.destMarker = null;
    }

    // --- Current User Position Marker ---
    if (hasLocation && currentPosition) {
      const posIcon = L.divIcon({ html: userLocationMarkerHtml(), className: '', iconSize: [44, 44], iconAnchor: [22, 22] });
      
      if (!layers.posMarker) {
        layers.posMarker = L.marker([currentPosition.lat, currentPosition.lng], {
          icon: posIcon,
          zIndexOffset: 1000,
        }).addTo(map);
      } else {
        layers.posMarker.setLatLng([currentPosition.lat, currentPosition.lng]);
        layers.posMarker.setIcon(posIcon);
      }
      layers.posMarker.bindPopup(`
        <div style="padding:6px 8px;font-size:12px;color:#3B2930;">
          <div style="font-weight:700;color:#E85D75;">Your Live Position</div>
          <div style="color:#806B73;font-size:11px;">Protected by Saheli AI</div>
        </div>
      `);
    } else if (layers.posMarker) {
      layers.posMarker.remove();
      layers.posMarker = null;
    }

    // --- Route Polyline in Vibrant Rose with Soft Glow ---
    if (hasRoute) {
      const routePoints: L.LatLngExpression[] = waypoints.map(w => [w.lat, w.lng]);
      if (!layers.routeLine) {
        layers.routeLine = L.polyline(routePoints, {
          color: BRAND_ROSE,
          weight: 6,
          opacity: 0.92,
          lineJoin: 'round',
          lineCap: 'round',
        }).addTo(map);
      } else {
        layers.routeLine.setLatLngs(routePoints);
      }
    } else if (layers.routeLine) {
      layers.routeLine.remove();
      layers.routeLine = null;
    }

    // --- Completed Route Segment Polyline ---
    if (hasRoute && isActive && origin && currentPosition) {
      const completedPoints: L.LatLngExpression[] = [
        [origin.lat, origin.lng],
        [currentPosition.lat, currentPosition.lng],
      ];
      if (!layers.completedLine) {
        layers.completedLine = L.polyline(completedPoints, {
          color: '#10B981',
          weight: 6,
          opacity: 0.95,
          lineJoin: 'round',
          lineCap: 'round',
        }).addTo(map);
      } else {
        layers.completedLine.setLatLngs(completedPoints);
      }
    } else if (layers.completedLine) {
      layers.completedLine.remove();
      layers.completedLine = null;
    }

    // --- Safety Supporting Places ---
    if (hasRoute) {
      safetyPoints.forEach(sp => {
        const statusBadge = sp.openingStatus === 'OPEN_24_7'
          ? '<span style="color:#059669;font-weight:700;background:#ECFDF5;padding:2px 6px;border-radius:6px;">• Open 24/7</span>'
          : sp.openingStatus === 'OPEN'
          ? '<span style="color:#059669;background:#ECFDF5;padding:2px 6px;border-radius:6px;">• Open</span>'
          : '<span style="color:#BE123C;background:#FFE4E6;padding:2px 6px;border-radius:6px;">• Closed</span>';
        
        const popupContent = `
          <div style="font-family:'Plus Jakarta Sans',sans-serif;font-size:12px;color:#3B2930;line-height:1.4;min-width:160px;padding:4px 6px;">
            <div style="font-weight:700;font-size:13px;color:#3B2930;margin-bottom:3px;">${sp.name}</div>
            <div style="display:flex;align-items:center;justify-content:space-between;gap:6px;margin-top:4px;">
              <span style="color:#806B73;font-size:11px;text-transform:capitalize;font-weight:600;">${sp.category.toLowerCase().replace(/_/g, ' ')}</span>
              ${statusBadge}
            </div>
            ${sp.distanceFromRouteMeters !== undefined ? `<div style="margin-top:6px;color:#806B73;font-size:11px;font-weight:500;">📍 ${sp.distanceFromRouteMeters}m from safe route</div>` : ''}
          </div>
        `;

        const marker = L.marker([sp.latitude, sp.longitude], {
          icon: L.divIcon({ html: safetyPointHtml(sp.category), className: '', iconSize: [32, 32], iconAnchor: [16, 16] }),
        }).addTo(map).bindPopup(popupContent);
        layers.safetyMarkers.push(marker);
      });
    }

    // --- Fit Bounds / Map Center ---
    if (hasRoute && layers.routeLine && layers.routeLine.getBounds().isValid()) {
      map.fitBounds(layers.routeLine.getBounds(), { padding: [50, 50], maxZoom: 16 });
    } else if (hasLocation && currentPosition) {
      map.setView([currentPosition.lat, currentPosition.lng], 14);
    } else {
      map.setView(INDIA_CENTER, INDIA_ZOOM);
    }

  }, [origin, destination, currentPosition, hasLocation, waypoints, safetyPoints, riskLevel, isActive]);

  const handleRecenter = (e: React.MouseEvent) => {
    e.preventDefault();
    if (onRecenter) {
      onRecenter();
      return;
    }
    if (mapRef.current) {
      if (hasLocation && currentPosition) {
        mapRef.current.setView([currentPosition.lat, currentPosition.lng], 15);
      } else {
        mapRef.current.setView(INDIA_CENTER, INDIA_ZOOM);
      }
    }
  };

  return (
    <div className={`relative w-full h-full overflow-hidden rounded-3xl border border-pink-200/80 shadow-card bg-white ${className}`}>
      <div ref={containerRef} className="absolute inset-0 z-0" />
      
      {/* Floating Recenter Pill Control */}
      <button 
        onClick={handleRecenter}
        className="absolute bottom-5 right-4 z-[400] bg-white/95 backdrop-blur-md text-slate-700 px-3.5 py-2 rounded-2xl shadow-card-hover border border-pink-200 hover:border-primary-400 hover:text-primary-600 flex items-center gap-2 text-xs font-bold transition-all duration-200 hover:-translate-y-0.5 active:scale-95"
        title={hasLocation && currentPosition ? "Recenter on your location" : "View whole India map"}
      >
        <Locate className="w-4 h-4 text-primary-500" />
        <span>{hasLocation && currentPosition ? 'Recenter' : 'Whole Map'}</span>
      </button>
    </div>
  );
}
