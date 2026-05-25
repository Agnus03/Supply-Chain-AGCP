import { useState, useEffect, useRef, useCallback } from 'react';
import { dashboardService, type GlobalDashboard } from '../api/dashboardService';
import { KpiCard } from '../components/dashboard/KpiCard';
import { StatusDonut } from '../components/dashboard/StatusDonut';
import { TrendsChart } from '../components/dashboard/TrendsChart';
import { GeoMap } from '../components/dashboard/GeoMap';
import { PageHeader } from '../components/PageHeader';
import type { TrendPoint } from '../types';
import { isTempAlert, isHumAlert } from '../utils/alertHelpers';
import { LOCALE, REFRESH_INTERVALS } from '../utils/constants';
import { wsService } from '../services/websocketService';

function formatNumber(n: number): string {
  return n.toLocaleString(LOCALE);
}

export function DashboardPage() {
  const [data, setData] = useState<GlobalDashboard | null>(null);
  const [trends, setTrends] = useState<TrendPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchAll = useCallback(async () => {
    try {
      const [d, t] = await Promise.all([
        dashboardService.getGlobal(),
        dashboardService.getTrends(24),
      ]);
      setData(d);
      setTrends(t);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar dashboard');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  useEffect(() => {
    intervalRef.current = setInterval(fetchAll, REFRESH_INTERVALS.DASHBOARD);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [fetchAll]);

  useEffect(() => {
    const unsubStatus = wsService.subscribe('/topic/shipments/status', () => fetchAll());
    const unsubSensors = wsService.subscribe('/topic/sensors', () => fetchAll());
    const unsubAlerts = wsService.subscribe('/topic/alerts', () => fetchAll());
    return () => {
      unsubStatus();
      unsubSensors();
      unsubAlerts();
    };
  }, [fetchAll]);

  if (loading && !data) {
    return (
      <div>
        <PageHeader title="Dashboard" subtitle="Panel de control unificado de la cadena de suministro" />
        <div className="dashboard-grid">
          <div className="kpi-grid">
            {[1, 2, 3, 4, 5].map(i => <div key={i} className="skeleton" style={{ height: 100, borderRadius: 'var(--radius)' }} />)}
          </div>
          <div className="skeleton" style={{ height: 220, borderRadius: 'var(--radius)' }} />
          <div className="skeleton" style={{ height: 220, borderRadius: 'var(--radius)' }} />
          <div className="skeleton" style={{ height: 300, borderRadius: 'var(--radius)' }} />
        </div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div>
        <PageHeader title="Dashboard" subtitle="Panel de control unificado de la cadena de suministro" />
        <div className="card">
          <p style={{ color: 'var(--danger)' }}>Error: {error}</p>
          <button className="btn btn-primary" onClick={fetchAll} style={{ marginTop: '1rem' }}>Reintentar</button>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const deliveryRate = data.totalShipments > 0
    ? ((data.deliveredShipments / data.totalShipments) * 100).toFixed(0)
    : '0';

  const sparklineTemp = trends.map(t => ({ v: t.avgTemperature }));
  const sparklineHum = trends.map(t => ({ v: t.avgHumidity }));

  return (
    <div>
      <PageHeader title="Dashboard" subtitle="Panel de control unificado de la cadena de suministro">
        <span className="text-xs text-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
          <span className="live-dot" /> Actualizando cada 30s
        </span>
        <button className="btn btn-primary btn-sm" onClick={fetchAll}>Actualizar</button>
      </PageHeader>

      <div className="kpi-grid">
        <KpiCard
          title="Total Envíos"
          value={formatNumber(data.totalShipments)}
          subtitle="En la cadena"
          icon="📦"
          color="var(--primary)"
        />
        <KpiCard
          title="En Tránsito"
          value={formatNumber(data.transitShipments)}
          subtitle={data.transitShipments > 0 ? `${((data.transitShipments / data.totalShipments) * 100).toFixed(0)}% del total` : 'Sin actividad'}
          icon="🚚"
          color="var(--primary)"
        />
        <KpiCard
          title="Alertas Activas"
          value={formatNumber(data.activeAlerts)}
          subtitle={data.activeAlerts > 0 ? 'Requieren atención' : 'Todo en orden'}
          icon={data.activeAlerts > 0 ? '🔴' : '🟢'}
          color={data.activeAlerts > 0 ? 'var(--danger)' : 'var(--success)'}
          pulse={data.activeAlerts > 0}
        />
        <KpiCard
          title="Temp. Promedio"
          value={`${data.averageTemperature.toFixed(1)}°C`}
          subtitle="General"
          icon="🌡️"
          color={data.averageTemperature > 25 ? 'var(--warning)' : 'var(--success)'}
          sparklineData={sparklineTemp}
        />
        <KpiCard
          title="Tasa Entrega"
          value={`${deliveryRate}%`}
          subtitle={`${data.deliveredShipments} de ${data.totalShipments} envíos`}
          icon="✅"
          color={Number(deliveryRate) >= 80 ? 'var(--success)' : 'var(--warning)'}
          sparklineData={sparklineHum.slice(0, 10)}
        />
      </div>

      <div className="dashboard-grid">
        <div className="dashboard-grid-left">
          <StatusDonut
            pending={data.pendingShipments}
            transit={data.transitShipments}
            delivered={data.deliveredShipments}
            delayed={data.delayedShipments}
          />
        </div>
        <div className="dashboard-grid-right">
          <TrendsChart data={trends} onRetry={fetchAll} />
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="dashboard-grid-full">
          <GeoMap readings={data.recentReadings} />
        </div>
      </div>

      <div className="card" style={{ marginTop: '1.5rem' }}>
        <div className="card-header">
          <span className="card-title">Últimas Lecturas de Sensores</span>
          <button className="btn btn-primary btn-sm" onClick={fetchAll}>Actualizar</button>
        </div>
        <div className="overflow-auto">
          <table className="table-enhanced">
            <thead>
              <tr>
                <th>Envío</th>
                <th style={{ textAlign: 'right' }}>Temp (°C)</th>
                <th style={{ textAlign: 'right' }}>Humedad (%)</th>
                <th style={{ textAlign: 'right' }}>Lat</th>
                <th style={{ textAlign: 'right' }}>Lng</th>
                <th>Fecha</th>
              </tr>
            </thead>
            <tbody>
              {data.recentReadings.length === 0 ? (
                <tr>
                  <td colSpan={6} className="empty-state-sm">Sin lecturas</td>
                </tr>
              ) : (
                data.recentReadings.map(r => (
                  <tr key={r.id}>
                    <td className="font-mono text-sm">{r.shipmentId.slice(0, 8)}</td>
                    <td style={{ textAlign: 'right' }} className={isTempAlert(r.temperatureC) ? 'temp-danger' : ''}>
                      {r.temperatureC?.toFixed(1) ?? '-'}
                    </td>
                    <td style={{ textAlign: 'right' }} className={isHumAlert(r.humidityPct) ? 'temp-danger' : ''}>
                      {r.humidityPct?.toFixed(1) ?? '-'}
                    </td>
                    <td className="font-mono text-xs text-secondary" style={{ textAlign: 'right' }}>
                      {r.latitude?.toFixed(4) ?? '-'}
                    </td>
                    <td className="font-mono text-xs text-secondary" style={{ textAlign: 'right' }}>
                      {r.longitude?.toFixed(4) ?? '-'}
                    </td>
                    <td className="text-xs text-secondary">
                      {new Date(r.timestamp).toLocaleString(LOCALE)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default DashboardPage;
