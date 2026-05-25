import { useState, useEffect, useMemo, useCallback } from 'react';
import { PageHeader } from '../components/PageHeader';
import type { SensorReading } from '../types';
import { sensorService } from '../api/sensorService';
import { SensorRegister } from '../components/SensorRegister';
import { SensorList } from '../components/SensorList';
import { isTempAlert, isHumAlert, severityClass } from '../utils/alertHelpers';

export function SensorsPage() {
  const [readings, setReadings] = useState<SensorReading[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [alerts, setAlerts] = useState<SensorReading[]>([]);
  const [alertsLoading, setAlertsLoading] = useState(true);

  const fetchReadings = useCallback(async () => {
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
  }, []);

  const fetchAlerts = useCallback(async () => {
    setAlertsLoading(true);
    try {
      const data = await sensorService.listActiveAlerts();
      setAlerts(data);
    } catch {
      /* ignore alert fetch errors */
    } finally {
      setAlertsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReadings();
    fetchAlerts();
  }, [fetchReadings, fetchAlerts]);

  const metrics = useMemo(() => {
    const shipmentSet = new Set<string>();
    let tempAlerts = 0;
    let humAlerts = 0;
    let tempSum = 0;
    let tempCount = 0;
    let humSum = 0;
    let humCount = 0;
    for (const r of readings) {
      shipmentSet.add(r.shipmentId);
      if (isTempAlert(r.temperatureC)) tempAlerts++;
      if (isHumAlert(r.humidityPct)) humAlerts++;
      if (r.temperatureC != null) { tempSum += r.temperatureC; tempCount++; }
      if (r.humidityPct != null) { humSum += r.humidityPct; humCount++; }
    }
    return {
      totalReadings: readings.length,
      totalShipments: shipmentSet.size,
      tempAlerts,
      humAlerts,
      totalAlerts: tempAlerts + humAlerts,
      avgTemp: tempCount > 0 ? (tempSum / tempCount) : null,
      avgHum: humCount > 0 ? (humSum / humCount) : null,
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

  const handleAcknowledge = useCallback(async (id: string) => {
    try {
      await sensorService.acknowledgeAlert(id);
      setAlerts((prev) => prev.filter((a) => a.id !== id));
    } catch {
      /* ignore */
    }
  }, []);

  return (
    <div className="page-enter">
      <PageHeader
        title="Sensores IoT"
        subtitle="Monitoreo en tiempo real de temperatura, humedad y ubicación GPS"
      />

      {/* KPI Strip */}
      <div className="sen-kpi-strip">
        <div className="sen-kpi primary">
          <div className="sen-kpi-icon primary">📡</div>
          <div className="sen-kpi-body">
            <div className="sen-kpi-value">{metrics.totalReadings}</div>
            <div className="sen-kpi-label">Lecturas</div>
            <div className="sen-kpi-sub">totales registradas</div>
          </div>
        </div>
        <div className="sen-kpi primary">
          <div className="sen-kpi-icon primary">🚚</div>
          <div className="sen-kpi-body">
            <div className="sen-kpi-value">{metrics.totalShipments}</div>
            <div className="sen-kpi-label">Envíos</div>
            <div className="sen-kpi-sub">monitoreados</div>
          </div>
        </div>
        <div className="sen-kpi" style={{ borderColor: metrics.totalAlerts > 0 ? 'rgba(239,68,68,0.3)' : undefined }}>
          <div className="sen-kpi-icon danger">⚠️</div>
          <div className="sen-kpi-body">
            <div className="sen-kpi-value" style={{ color: metrics.totalAlerts > 0 ? 'var(--danger)' : 'var(--success)' }}>
              {metrics.totalAlerts}
            </div>
            <div className="sen-kpi-label">Alertas</div>
            <div className="sen-kpi-sub">{metrics.tempAlerts} temp · {metrics.humAlerts} hum</div>
          </div>
        </div>
        <div className="sen-kpi">
          <div className="sen-kpi-icon" style={{ background: 'rgba(34,197,94,0.1)' }}>🌡️</div>
          <div className="sen-kpi-body">
            <div className="sen-kpi-value">
              {metrics.avgTemp != null ? `${metrics.avgTemp.toFixed(1)}°` : '—'}
            </div>
            <div className="sen-kpi-label">Temp Promedio</div>
            <div className="sen-kpi-sub">rango seguro 2–30 °C</div>
          </div>
        </div>
        <div className="sen-kpi">
          <div className="sen-kpi-icon" style={{ background: 'rgba(6,182,212,0.1)' }}>💧</div>
          <div className="sen-kpi-body">
            <div className="sen-kpi-value">
              {metrics.avgHum != null ? `${metrics.avgHum.toFixed(0)}%` : '—'}
            </div>
            <div className="sen-kpi-label">Humedad Promedio</div>
            <div className="sen-kpi-sub">rango seguro 30–80%</div>
          </div>
        </div>
      </div>

      {/* Two-column: Register + Alerts */}
      <div className="sen-grid">
        <div>
          <SensorRegister onSuccess={() => { fetchReadings(); fetchAlerts(); }} />
        </div>
        <div className="sen-alerts">
          <div className="sen-alerts-head">
            <span className="sen-alerts-title">
              🚨 Alertas Activas
              {alerts.length > 0 && (
                <span className="sen-alerts-count">{alerts.length}</span>
              )}
            </span>
            <button className="sen-alerts-refresh" onClick={fetchAlerts}>
              ↻ Recargar
            </button>
          </div>
          <div className="sen-alerts-body">
            {alertsLoading ? (
              <div className="sen-alerts-empty">Cargando alertas...</div>
            ) : alerts.length === 0 ? (
              <div className="sen-alerts-empty">
                <div style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>✅</div>
                No hay alertas activas
              </div>
            ) : (
              alerts.map((a) => {
                const sev = severityClass(a.temperatureC, a.humidityPct);
                return (
                  <div key={a.id} className={`sen-alert-item ${sev}`}>
                    <span className={`sen-alert-badge ${sev}`} />
                    <div className="sen-alert-body">
                      <div className="sen-alert-msg">
                        {a.temperatureC != null && isTempAlert(a.temperatureC)
                          ? `🔴 Temp: ${a.temperatureC.toFixed(1)}°C`
                          : a.humidityPct != null && isHumAlert(a.humidityPct)
                          ? `🟡 Hum: ${a.humidityPct.toFixed(1)}%`
                          : 'Lectura fuera de rango'}
                      </div>
                      <div className="sen-alert-meta">
                        <span className="font-mono">{a.shipmentId.slice(0, 8)}</span>
                        <span>·</span>
                        <span>{new Date(a.timestamp).toLocaleString('es-CO')}</span>
                      </div>
                    </div>
                    <button
                      className={`sen-alert-ack ${a.acknowledged ? 'acknowledged' : ''}`}
                      onClick={() => !a.acknowledged && handleAcknowledge(a.id)}
                      disabled={a.acknowledged}
                    >
                      {a.acknowledged ? '✓ Hecho' : '✓ Ack'}
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Grouped readings */}
      <div className="sen-section-head">
        <div className="sen-section-title">
          📋 Lecturas por Envío
          {!loading && (
            <span className="sen-kpi-sub" style={{ fontSize: '0.75rem' }}>
              {grouped.length} envíos · {readings.length} lecturas
            </span>
          )}
        </div>
        <div className="sen-section-actions">
          <button className="btn btn-primary btn-sm" onClick={fetchReadings} disabled={loading}>
            {loading ? 'Cargando...' : '↻ Actualizar'}
          </button>
        </div>
      </div>

      {loading ? (
        Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="sen-shimmer" />
        ))
      ) : error ? (
        <div className="card">
          <p style={{ color: 'var(--danger)', marginBottom: '0.75rem' }}>Error: {error}</p>
          <button className="btn btn-primary" onClick={fetchReadings}>Reintentar</button>
        </div>
      ) : grouped.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon">📡</div>
            <p className="empty-state-text">No hay lecturas registradas.</p>
          </div>
        </div>
      ) : (
        grouped.map(([shipmentId, groupReadings]) => (
          <SensorList
            key={shipmentId}
            readings={groupReadings}
            shipmentId={shipmentId}
            loading={false}
            error={null}
            onRefresh={() => fetchReadings()}
          />
        ))
      )}
    </div>
  );
}

export default SensorsPage;
