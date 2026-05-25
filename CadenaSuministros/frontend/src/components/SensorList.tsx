import { memo, useState } from 'react';
import type { SensorReading } from '../types';
import { isTempAlert, isHumAlert } from '../utils/alertHelpers';

interface SensorListProps {
  readings: SensorReading[];
  shipmentId?: string;
  loading: boolean;
  error: string | null;
  onRefresh?: () => void;
}

const TempBadge = memo(function TempBadge({ value }: { value: number | null }) {
  if (value == null) return <span className="text-secondary">—</span>;
  return (
    <span className={`sen-temp ${isTempAlert(value) ? 'alert' : 'ok'}`}>
      {value.toFixed(1)}°C
    </span>
  );
});

const HumBadge = memo(function HumBadge({ value }: { value: number | null }) {
  if (value == null) return <span className="text-secondary">—</span>;
  return (
    <span className={`sen-hum ${isHumAlert(value) ? 'alert' : 'ok'}`}>
      {value.toFixed(1)}%
    </span>
  );
});

export const SensorList = memo(function SensorList({
  readings, shipmentId, loading, error,
}: SensorListProps) {
  const [open, setOpen] = useState(true);

  if (loading) {
    return (
      <div className="sen-group">
        <div className="sen-group-head">
          <span className="sen-group-id">Cargando...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="sen-group">
        <div className="sen-group-head">
          <span style={{ color: 'var(--danger)' }}>Error: {error}</span>
        </div>
      </div>
    );
  }

  if (readings.length === 0) {
    return (
      <div className="sen-group">
        <div className="sen-group-head">
          <span className="text-secondary">Sin lecturas</span>
        </div>
      </div>
    );
  }

  const alertCount = readings.filter((r) => isTempAlert(r.temperatureC) || isHumAlert(r.humidityPct)).length;

  return (
    <div className="sen-group">
      <div className="sen-group-head" onClick={() => setOpen((o) => !o)}>
        <div className="sen-group-left">
          <span className="sen-group-dot delivered" />
          <span className="sen-group-id">
            {shipmentId ? shipmentId.slice(0, 8) : 'Lecturas'}
          </span>
          <span className="sen-group-meta">
            {readings.length} lectura{readings.length !== 1 ? 's' : ''}
            {alertCount > 0 && ` · ${alertCount} alerta${alertCount !== 1 ? 's' : ''}`}
          </span>
        </div>
        <div className="sen-group-right">
          {alertCount > 0 && (
            <span className="alert-badge alert-danger" style={{ padding: '0.125rem 0.5rem', fontSize: '0.625rem' }}>
              ⚠ {alertCount}
            </span>
          )}
          <span className={`sen-group-arrow ${open ? 'open' : ''}`}>▾</span>
        </div>
      </div>

      <div
        className="sen-group-body"
        style={{ maxHeight: open ? `${readings.length * 42 + 42}px` : '0' }}
      >
        <table className="sen-group-table">
          <thead>
            <tr>
              <th>Fecha</th>
              <th style={{ textAlign: 'right' }}>Temp</th>
              <th style={{ textAlign: 'right' }}>Humedad</th>
              <th style={{ textAlign: 'right' }}>Lat</th>
              <th style={{ textAlign: 'right' }}>Lng</th>
            </tr>
          </thead>
          <tbody>
            {readings.map((r) => (
              <tr key={r.id}>
                <td style={{ whiteSpace: 'nowrap' }}>
                  {new Date(r.timestamp).toLocaleString('es-CO', {
                    day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
                  })}
                </td>
                <td style={{ textAlign: 'right' }}>
                  <TempBadge value={r.temperatureC} />
                </td>
                <td style={{ textAlign: 'right' }}>
                  <HumBadge value={r.humidityPct} />
                </td>
                <td style={{ textAlign: 'right' }} className="font-mono">
                  {r.latitude?.toFixed(4) ?? '—'}
                </td>
                <td style={{ textAlign: 'right' }} className="font-mono">
                  {r.longitude?.toFixed(4) ?? '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
});

export default SensorList;
