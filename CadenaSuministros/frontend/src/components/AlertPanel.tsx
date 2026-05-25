import { useState, useEffect, useRef, useCallback } from 'react';
import type { SensorReading } from '../types';
import { sensorService } from '../api/sensorService';
import { isTempAlert, isHumAlert, severityClass, severityLabel } from '../utils/alertHelpers';
import { REFRESH_INTERVALS } from '../utils/constants';
import { LOCALE } from '../utils/locale';

interface AlertPanelProps {
  open: boolean;
  onClose: () => void;
}

export function AlertPanel({ open, onClose }: AlertPanelProps) {
  const [alerts, setAlerts] = useState<SensorReading[]>([]);
  const [filter, setFilter] = useState<'all' | 'unacknowledged' | 'critical'>('unacknowledged');
  const [loading, setLoading] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchAlerts = useCallback(async () => {
    setLoading(true);
    try {
      const data = await sensorService.listRecentAlerts(50);
      setAlerts(data);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) fetchAlerts();
  }, [open, fetchAlerts]);

  useEffect(() => {
    if (!open) return;
    intervalRef.current = setInterval(fetchAlerts, REFRESH_INTERVALS.ALERT_PANEL);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [open, fetchAlerts]);

  const handleAcknowledge = async (id: string) => {
    try {
      await sensorService.acknowledgeAlert(id);
      setAlerts(prev => prev.filter(a => a.id !== id));
    } catch {
      // silent
    }
  };

  const filtered = alerts.filter(a => {
    const isCritical = isTempAlert(a.temperatureC);
    if (filter === 'critical') return isCritical;
    if (filter === 'unacknowledged') return !a.acknowledged;
    return true;
  });

  const getSeverityClass = (r: SensorReading) => `alert-severity-${severityClass(r.temperatureC, r.humidityPct)}`;
  const getSeverityLabel = (r: SensorReading) => severityLabel(r.temperatureC, r.humidityPct);

  return (
    <>
      {open && <div className="alert-overlay" onClick={onClose} />}
      <div className={`alert-panel ${open ? 'alert-panel-open' : ''}`}>
        <div className="alert-panel-header">
          <span className="alert-panel-title">Centro de Alertas</span>
          <button className="alert-panel-close" onClick={onClose}>✕</button>
        </div>

        <div className="alert-panel-filters">
          {(['all', 'unacknowledged', 'critical'] as const).map(f => (
            <button
              key={f}
              className={`alert-filter-btn ${filter === f ? 'active' : ''}`}
              onClick={() => setFilter(f)}
            >
              {f === 'all' ? 'Todas' : f === 'unacknowledged' ? 'No revisadas' : 'Críticas'}
            </button>
          ))}
        </div>

        <div className="alert-panel-list">
          {loading && alerts.length === 0 && (
            <div className="alert-panel-loading">
              <div className="skeleton skeleton-text" />
              <div className="skeleton skeleton-text" />
              <div className="skeleton skeleton-text" />
            </div>
          )}

          {!loading && filtered.length === 0 && (
            <div className="empty-state-sm" style={{ padding: '3rem 1rem' }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>✅</div>
              Sin alertas {filter !== 'all' ? 'con este filtro' : ''}
            </div>
          )}

          {filtered.map(r => (
            <div key={r.id} className={`alert-panel-item ${getSeverityClass(r)}`}>
              <div className="alert-item-header">
                <span className="alert-item-severity">{getSeverityLabel(r)}</span>
                <span className="alert-item-time">
                  {new Date(r.timestamp).toLocaleString(LOCALE)}
                </span>
              </div>
              <div className="alert-item-message">
                Envío <span className="font-mono">{r.shipmentId.slice(0, 8)}</span>
                {isTempAlert(r.temperatureC) && ` — ${r.temperatureC}°C`}
                {isHumAlert(r.humidityPct) && ` — ${r.humidityPct}%`}
              </div>
              <div className="alert-item-actions">
                <button
                  className="btn btn-sm btn-outline"
                  onClick={() => handleAcknowledge(r.id)}
                >
                  Revisado
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
