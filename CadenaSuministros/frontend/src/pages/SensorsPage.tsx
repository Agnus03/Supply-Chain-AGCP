import { useState, useEffect, useMemo } from 'react';
import type { SensorReading } from '../types';
import { sensorService } from '../api/sensorService';
import { SensorList } from '../components/SensorList';
import { SensorRegister } from '../components/SensorRegister';

function isTemperatureAlert(temp: number | null | undefined): boolean {
  if (temp === null || temp === undefined) return false;
  return temp > 30 || temp < 2;
}

export function SensorsPage() {
  const [readings, setReadings] = useState<SensorReading[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReadings = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await sensorService.listAll();
      setReadings(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar lecturas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReadings();
  }, []);

  const { totalReadings, totalShipments, alerts } = useMemo(() => {
    const shipmentSet = new Set<string>();
    let alertCount = 0;
    for (const r of readings) {
      shipmentSet.add(r.shipmentId);
      if (isTemperatureAlert(r.temperatureC)) alertCount++;
    }
    return {
      totalReadings: readings.length,
      totalShipments: shipmentSet.size,
      alerts: alertCount,
    };
  }, [readings]);

  const grouped = useMemo(() => {
    const map = new Map<string, SensorReading[]>();
    for (const r of readings) {
      const list = map.get(r.shipmentId);
      if (list) list.push(r);
      else map.set(r.shipmentId, [r]);
    }
    return Array.from(map.entries()).sort((a, b) => b[1].length - a[1].length);
  }, [readings]);

  return (
    <div>
      <div className="section-header">
        <h1 className="section-title">Sensores IoT</h1>
        <p className="section-subtitle">
          Registro y monitoreo de sensores de temperatura, humedad y ubicación GPS
        </p>
      </div>

      <div className="stat-cards">
        <div className="stat-card">
          <div className="stat-card-value">{totalReadings}</div>
          <div className="stat-card-label">Lecturas Totales</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-value">{totalShipments}</div>
          <div className="stat-card-label">Envíos Monitoreados</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-value" style={{ color: alerts > 0 ? 'var(--danger)' : 'var(--success)' }}>
            {alerts}
          </div>
          <div className="stat-card-label">Alertas de Temperatura</div>
        </div>
      </div>

      <div className="grid-3">
        <div>
          <SensorRegister onSuccess={fetchReadings} />
        </div>

        <div>
          {loading ? (
            <div className="card">
              <div className="skeleton skeleton-text" style={{ width: '60%' }} />
              <div className="skeleton skeleton-text" />
              <div className="skeleton skeleton-text" />
            </div>
          ) : error ? (
            <div className="card">
              <p style={{ color: 'var(--danger)' }}>Error: {error}</p>
              <button className="btn btn-primary" onClick={fetchReadings} style={{ marginTop: '1rem' }}>
                Reintentar
              </button>
            </div>
          ) : readings.length === 0 ? (
            <div className="card">
              <div className="empty-state">
                <div className="empty-state-icon">📡</div>
                <p className="empty-state-text">No hay lecturas registradas.</p>
              </div>
            </div>
          ) : (
            <div>
              {grouped.map(([shipmentId, groupReadings]) => (
                <div key={shipmentId} style={{ marginBottom: '1.5rem' }}>
                  <SensorList
                    readings={groupReadings}
                    shipmentId={shipmentId}
                    loading={false}
                    error={null}
                    onRefresh={fetchReadings}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default SensorsPage;
