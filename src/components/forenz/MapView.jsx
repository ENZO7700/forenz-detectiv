import React, { useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { resolveLocationCoords } from '../../../base44/shared/geospatialEngine.ts';
import { MapPin, AlertTriangle } from 'lucide-react';

const createCustomIcon = (color, label) => {
  return L.divIcon({
    className: 'custom-map-marker',
    html: `
      <div style="
        background: ${color};
        width: 30px;
        height: 30px;
        border-radius: 50%;
        border: 2px solid #0f172a;
        box-shadow: 0 4px 12px rgba(0,0,0,0.5);
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
    iconSize: [30, 30],
    iconAnchor: [15, 15],
    popupAnchor: [0, -16]
  });
};

export default function MapView({
  locations = [],
  claims = [],
  contradictions = [],
  className = ''
}) {
  const mapPoints = useMemo(() => {
    const points = [];
    const seen = new Set();

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

  const impossibleRoutes = useMemo(() => {
    const routes = [];
    contradictions
      .filter((c) => c.type === 'geospatial_impossible_travel' || c.type === 'geografická_nesúlad')
      .forEach((c) => {
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

  const defaultCenter = [48.7363, 19.1462];

  return (
    <div className={`w-full h-full relative rounded-2xl overflow-hidden bg-slate-900 border border-slate-800 shadow-xl flex flex-col ${className}`}>
      {/* Horná info lišta mapy */}
      <div className="px-4 py-3 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 flex items-center justify-between z-10 shrink-0">
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-blue-400" />
          <h3 className="text-xs font-semibold text-slate-100">Geografická mapa vyšetrovania</h3>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <span className="flex items-center gap-1.5 text-blue-400 font-medium bg-slate-800 px-2 py-0.5 rounded-lg border border-slate-700">
            <span className="w-2 h-2 rounded-full bg-blue-500" /> {mapPoints.length} lokalít
          </span>
          {impossibleRoutes.length > 0 && (
            <span className="flex items-center gap-1.5 text-red-400 font-semibold bg-red-950/60 px-2 py-0.5 rounded-lg border border-red-800">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" /> {impossibleRoutes.length} nemožných presunov
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
          style={{ width: '100%', height: '100%', minHeight: '360px', background: '#090d16' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {mapPoints.map((pt) => (
            <Marker
              key={pt.id}
              position={[pt.lat, pt.lng]}
              icon={createCustomIcon(pt.color, pt.name.slice(0, 2).toUpperCase())}
            >
              <Popup>
                <div className="p-1 min-w-[140px] text-slate-900">
                  <h4 className="font-bold text-sm">{pt.name}</h4>
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

          {impossibleRoutes.map((route) => (
            <Polyline
              key={route.id}
              positions={route.positions}
              pathOptions={{
                color: '#ef4444',
                weight: 4,
                dashArray: '6, 8',
                opacity: 0.9
              }}
            >
              <Popup>
                <div className="p-2 max-w-xs text-slate-900">
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
