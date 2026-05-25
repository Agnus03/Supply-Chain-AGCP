import { useEffect, useState, useRef, useMemo } from 'react';
import type { SensorReadingResult, ShipmentStatus } from '../../types';
import { SHIPMENT_STATE_CONFIG, STATUS_ORDER } from '../../utils/constants';
import L from 'leaflet';

interface GeoMapProps {
  readings: SensorReadingResult[];
}

interface Coord {
  lat: number;
  lng: number;
  shipmentId: string;
  status: string;
  temp: number | null;
  hum: number | null;
}

function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function createColoredIcon(color: string) {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="36" viewBox="0 0 24 36">
      <path d="M12 0C5.4 0 0 5.4 0 12c0 9 12 24 12 24s12-15 12-24C24 5.4 18.6 0 12 0z" fill="${color}" stroke="#fff" stroke-width="2"/>
      <circle cx="12" cy="12" r="5" fill="#fff"/>
    </svg>
  `;
  return L.divIcon({
    html: svg,
    className: '',
    iconSize: [24, 36],
    iconAnchor: [12, 36],
    popupAnchor: [0, -36],
  });
}

export function GeoMap({ readings }: GeoMapProps) {
  const [coords, setCoords] = useState<Coord[]>([]);
  const [selectedStatuses, setSelectedStatuses] = useState<Set<string>>(
    () => new Set(STATUS_ORDER)
  );
  const containerRef = useRef<HTMLDivElement>(null);

  function toggleStatus(status: string) {
    setSelectedStatuses(prev => {
      if (prev.size === 1 && prev.has(status)) return prev;
      const next = new Set(prev);
      if (next.has(status)) next.delete(status);
      else next.add(status);
      return next;
    });
  }

  useEffect(() => {
    const seen = new Set<string>();
    const valid: Coord[] = [];
    const sorted = [...readings].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    for (const r of sorted) {
      const lat = r.latitude;
      const lng = r.longitude;
      if (lat == null || lng == null || lat === 0 || lng === 0) continue;
      if (seen.has(r.shipmentId)) continue;
      seen.add(r.shipmentId);
      valid.push({ lat, lng, shipmentId: r.shipmentId, status: r.status, temp: r.temperatureC, hum: r.humidityPct });
    }
    setCoords(valid);
  }, [readings]);

  const visibleCoords = useMemo(
    () => coords.filter(c => selectedStatuses.has(c.status)),
    [coords, selectedStatuses]
  );

  const mapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const tileLayerRef = useRef<any>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    if (!mapRef.current) {
      containerRef.current.innerHTML = '';
      const mapInstance = L.map(containerRef.current, { zoomControl: false }).setView([4.711, -74.072], 6);
      tileLayerRef.current = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 18,
        attribution: '© OpenStreetMap',
      }).addTo(mapInstance);
      mapRef.current = mapInstance;
    }

    const mapInstance = mapRef.current;

    markersRef.current.forEach((m: any) => m.remove());
    markersRef.current = [];

    if (visibleCoords.length === 0) return;

    const newMarkers = visibleCoords.map(c => {
      const config = SHIPMENT_STATE_CONFIG[c.status as ShipmentStatus];
      const color = config?.color ?? '#94a3b8';
      const label = config?.label ?? c.status;
      const icon = createColoredIcon(color);
      const popupContent = document.createElement('div');
      const title = document.createElement('b');
      title.textContent = c.shipmentId.slice(0, 8);
      popupContent.appendChild(title);
      popupContent.appendChild(document.createElement('br'));
      const statusLine = document.createElement('span');
      statusLine.innerHTML = `Estado: <b>${escapeHtml(label)}</b>`;
      popupContent.appendChild(statusLine);
      popupContent.appendChild(document.createElement('br'));
      popupContent.appendChild(document.createTextNode(`Temp: ${c.temp != null ? c.temp + '°C' : '-'}`));
      popupContent.appendChild(document.createElement('br'));
      popupContent.appendChild(document.createTextNode(`Hum: ${c.hum != null ? c.hum + '%' : '-'}`));
      const marker = L.marker([c.lat, c.lng], { icon }).addTo(mapInstance);
      marker.bindPopup(popupContent);
      return marker;
    });
    markersRef.current = newMarkers;

    if (newMarkers.length > 1) {
      const group = L.featureGroup(newMarkers);
      mapInstance.flyToBounds(group.getBounds().pad(0.1), { duration: 0.6 });
    }
  }, [visibleCoords]);

  useEffect(() => {
    return () => {
      markersRef.current.forEach((m: any) => m.remove());
      markersRef.current = [];
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  const allHidden = coords.length > 0 && visibleCoords.length === 0;

  return (
    <div className="card">
      <div className="card-header">
        <span className="card-title">Mapa de Envíos</span>
        <span className="text-xs text-secondary">{visibleCoords.length} de {coords.length} envíos</span>
      </div>
      <div className="geo-map-legend">
        {STATUS_ORDER.map((status) => {
          const config = SHIPMENT_STATE_CONFIG[status as ShipmentStatus];
          const active = selectedStatuses.has(status);
          return (
            <button
              key={status}
              className={`geo-legend-item${active ? '' : ' muted'}`}
              onClick={() => toggleStatus(status)}
              title={active ? `Ocultar ${config?.label ?? status}` : `Mostrar ${config?.label ?? status}`}
            >
              <span className="geo-legend-dot" style={{ background: config?.color, opacity: active ? 1 : 0.3 }} />
              {config?.label ?? status}
            </button>
          );
        })}
      </div>
      {coords.length === 0 ? (
        <div className="empty-state-sm">Sin coordenadas GPS disponibles</div>
      ) : allHidden ? (
        <div className="empty-state-sm">Selecciona al menos un estado para ver envíos</div>
      ) : (
        <div ref={containerRef} className="geo-map" />
      )}
    </div>
  );
}
