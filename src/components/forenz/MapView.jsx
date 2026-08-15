import React, { useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { resolveLocationCoords } from '../../../base44/shared/geospatialEngine.ts';
import { MapPin, AlertTriangle, Clock, Navigation } from 'lucide-react';

// Vytvorenie custom farebných markerov pre mapu
const createCustomIcon = (color, label) => {
  return L.divIcon({
    className: 'custom-map-marker',
    html: `
      <div style="
        background: ${color};
        width: 32px;
        height: 32px;
        border-radius: 50%;
        border: 2.5px solid white;
        box-shadow: 0 4px 14px rgba(0,0,0,0.35);
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-weight: bold;
        font-size: 11px;
      ">
        ${label || '•'}
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -18]
  });
};

export default function MapView({
  locations = [],
  claims = [],
  contradictions = [],
  className = ''
}) {
  // 1. Získanie GPS bodov zo všetkých známych lokalít v spise
  const mapPoints = useMemo(() => {
    const points = [];
    const seen = new Set();

    // Body z tabuľky Locations
    locations.forEach((loc) => {
      const coords = resolveLocationCoords(loc.name || loc.address);
      if (coords && !seen.has(loc.name)) {
        seen.add(loc.name);
        points.push({
          id: loc.id || loc.name,
          name: loc.name,
          address: loc.address,
          lat: coords.lat,
          lng: coords.lng,
          type: 'location',
          color: '#3b82f6'
        });
      }
    });

    // Body z tvrdení (claims)
    claims.forEach((c) => {
      if (c.location && !seen.has(c.location)) {
        const coords = resolveLocationCoords(c.location);
        if (coords) {
          seen.add(c.location);
          points.push({
            id: c.id,
            name: c.location,
            subject: c.subject,
            time: c.event_time,
            lat: coords.lat,
            lng: coords.lng,
            type: 'claim',
            color: '#10b981'
          });
        }
      }
    });

    return points;
  }, [locations, claims]);

  // 2. Červené spojnice pre geospatiálne nemožné presuny
  const impossibleRoutes = useMemo(() => {
    const routes = [];
    contradictions
      .filter((c) => c.type === 'geospatial_impossible_travel' || c.type === 'geografická_nesúlad')
      .forEach((c) => {
        // Skúsime nájsť body z claims
        const claimA = claims.find((cl) => cl.id === c.claim_a_id);
        const claimB = claims.find((cl) => cl.id === c.claim_b_id);
        if (claimA?.location && claimB?.location) {
          const coordsA = resolveLocationCoords(claimA.location);
          const coordsB = resolveLocationCoords(claimB.location);
          if (coordsA && coordsB) {
            routes.push({
              id: c.id,
              positions: [
                [coordsA.lat, coordsA.lng],
                [coordsB.lat, coordsB.lng]
              ],
              explanation: c.explanation,
              subject: claimA.subject
            });
          }
        }
      });
    return routes;
  }, [contradictions, claims]);

  // Stred mapy: Slovensko (Banská Bystrica)
  const defaultCenter = [48.7363, 19.1462];

  return (
    <div className={`w-full h-full relative rounded-3xl overflow-hidden liquid-glass-panel shadow-glass flex flex-col ${className}`}>
      {/* Horná info lišta mapy */}
      <div className="px-4 py-3 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border-b border-white/40 dark:border-white/10 flex items-center justify-between z-10">
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">Geografická mapa vyšetrovania</h3>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <span className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400 font-medium">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500" /> {mapPoints.length} lokalít
          </span>
          {impossibleRoutes.length > 0 && (
            <span className="flex items-center gap-1.5 text-red-600 dark:text-red-400 font-bold">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" /> {impossibleRoutes.length} nemožných presunov
            </span>
          )}
        </div>
      </div>

      {/* Map Container */}
      <div className="flex-1 w-full h-full min-h-[360px] relative z-0">
        <MapContainer
          center={defaultCenter}
          zoom={7}
          scrollWheelZoom={true}
          style={{ width: '100%', height: '100%', minHeight: '360px' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {/* Zobrazenie bodov na mape */}
          {mapPoints.map((pt) => (
            <Marker
              key={pt.id}
              position={[pt.lat, pt.lng]}
              icon={createCustomIcon(pt.color, pt.name.slice(0, 2).toUpperCase())}
            >
              <Popup>
                <div className="p-1 min-w-[140px]">
                  <h4 className="font-bold text-slate-900 text-sm">{pt.name}</h4>
                  {pt.address && <p className="text-xs text-slate-600 mt-0.5">{pt.address}</p>}
                  {pt.subject && (
                    <p className="text-xs text-blue-700 font-medium mt-1">
                      Osoba: {pt.subject} {pt.time ? `(${pt.time})` : ''}
                    </p>
                  )}
                </div>
              </Popup>
            </Marker>
          ))}

          {/* Zobrazenie červených trás pre nemožné alibi */}
          {impossibleRoutes.map((route) => (
            <Polyline
              key={route.id}
              positions={route.positions}
              pathOptions={{
                color: '#ef4444',
                weight: 4,
                dashArray: '6, 8',
                opacity: 0.85
              }}
            >
              <Popup>
                <div className="p-2 max-w-xs">
                  <div className="flex items-center gap-1.5 text-red-600 font-bold text-xs mb-1">
                    <AlertTriangle className="w-4 h-4" /> Nemožné alibi: {route.subject}
                  </div>
                  <p className="text-xs text-slate-700">{route.explanation}</p>
                </div>
              </Popup>
            </Polyline>
          ))}
        </MapContainer>
      </div>
    </div>
  );
}
