import type { SensorReading } from '../types';

interface SensorListProps {
  readings: SensorReading[];
  shipmentId?: string;
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
}

function isTemperatureAlert(temp: number | null | undefined): boolean {
  if (temp === null || temp === undefined) return false;
  return temp > 30 || temp < 2;
}

function TempIndicator({ value }: { value: number | null }) {
  if (value === null || value === undefined) return <span className="text-secondary">-</span>;
  const alert = isTemperatureAlert(value);
  return (
    <span className={alert ? 'temp-danger' : 'temp-normal'}>
      {value.toFixed(1)}
    </span>
  );
}

export function SensorList({ readings, shipmentId, loading, error, onRefresh }: SensorListProps) {
  if (loading) {
    return (
      <div className="card">
        <p>Cargando lecturas...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card">
        <p style={{ color: 'var(--danger)' }}>Error: {error}</p>
        <button className="btn btn-primary" onClick={onRefresh} style={{ marginTop: '1rem' }}>
          Reintentar
        </button>
      </div>
    );
  }

  if (readings.length === 0) {
    return (
      <div className="card">
        <p style={{ color: 'var(--text-secondary)' }}>
          No hay lecturas registradas.
        </p>
      </div>
    );
  }

  const alertCount = readings.filter((r) => isTemperatureAlert(r.temperatureC)).length;

  return (
    <div className="card">
      <div className="card-header">
        <div className="flex items-center gap-3">
          <span className="card-title">
            {shipmentId ? (
              <>Envío <span className="font-mono">{shipmentId.slice(0, 8)}</span></>
            ) : (
              <>Lecturas de Sensores</>
            )}
            <span className="text-secondary font-medium" style={{ marginLeft: '0.5rem' }}>
              ({readings.length})
            </span>
          </span>
          {alertCount > 0 && (
            <span className="alert-badge alert-danger">
              ⚠ {alertCount} alerta{alertCount !== 1 ? 's' : ''}
            </span>
          )}
        </div>
        <button className="btn btn-primary btn-sm" onClick={onRefresh}>
          Actualizar
        </button>
      </div>

      <div className="overflow-auto">
        <table className="table-enhanced">
          <thead>
            <tr>
              {!shipmentId && <th>Shipment</th>}
              <th>Fecha</th>
              <th style={{ textAlign: 'right' }}>Temp (°C)</th>
              <th style={{ textAlign: 'right' }}>Humedad (%)</th>
              <th style={{ textAlign: 'right' }}>Lat</th>
              <th style={{ textAlign: 'right' }}>Lng</th>
            </tr>
          </thead>
          <tbody>
            {readings.map((reading) => (
              <tr key={reading.id}>
                {!shipmentId && (
                  <td className="font-mono text-sm">{reading.shipmentId.slice(0, 8)}</td>
                )}
                <td style={{ whiteSpace: 'nowrap' }}>
                  {new Date(reading.timestamp).toLocaleString('es-CO')}
                </td>
                <td style={{ textAlign: 'right' }}>
                  <TempIndicator value={reading.temperatureC} />
                </td>
                <td style={{ textAlign: 'right' }}>
                  {reading.humidityPct?.toFixed(1) ?? '-'}
                </td>
                <td style={{ textAlign: 'right' }} className="font-mono text-sm">
                  {reading.latitude?.toFixed(4) ?? '-'}
                </td>
                <td style={{ textAlign: 'right' }} className="font-mono text-sm">
                  {reading.longitude?.toFixed(4) ?? '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default SensorList;
