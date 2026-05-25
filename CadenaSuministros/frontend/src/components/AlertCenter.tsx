import { useState, useEffect, useRef, useCallback } from 'react';
import { sensorService } from '../api/sensorService';
import { AlertPanel } from './AlertPanel';
import { AlertToast, type ToastItem } from './AlertToast';
import { isTempAlert, isHumAlert } from '../utils/alertHelpers';
import { REFRESH_INTERVALS } from '../utils/constants';
import { wsService } from '../services/websocketService';

const MAX_TOASTS = 5;

export function AlertCenter() {
  const [panelOpen, setPanelOpen] = useState(false);
  const [unacknowledgedCount, setUnacknowledgedCount] = useState(0);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const seenIdsRef = useRef<Set<string>>(new Set());

  const addToast = useCallback((toast: ToastItem) => {
    setToasts(prev => {
      const next = [toast, ...prev];
      return next.slice(0, MAX_TOASTS);
    });
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const fetchAlerts = useCallback(async () => {
    try {
      const data = await sensorService.listRecentAlerts(50);
      const unack = data.filter(a => !a.acknowledged);
      setUnacknowledgedCount(unack.length);

      for (const alert of data) {
        const isUnseen = !seenIdsRef.current.has(alert.id);
        const isCritical = isTempAlert(alert.temperatureC);
        const isUnacknowledged = !alert.acknowledged;

        if (isUnseen && isUnacknowledged) {
          seenIdsRef.current.add(alert.id);

          if (isCritical) {
            addToast({
              id: alert.id,
              message: `Alerta: Envío ${alert.shipmentId.slice(0, 8)} — ${alert.temperatureC}°C`,
              severity: isHumAlert(alert.humidityPct) ? 'critical' : 'warning',
            });
          }
        }
      }
    } catch {
      // silent
    }
  }, [addToast]);

  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  useEffect(() => {
    const interval = setInterval(fetchAlerts, REFRESH_INTERVALS.ALERTS);
    return () => clearInterval(interval);
  }, [fetchAlerts]);

  useEffect(() => {
    const unsub = wsService.subscribe('/topic/alerts', (event: any) => {
      const reading = event.reading;
      if (!reading) return;
      if (seenIdsRef.current.has(reading.id)) return;
      seenIdsRef.current.add(reading.id);

      setUnacknowledgedCount((c) => c + 1);

      if (isTempAlert(reading.temperatureC)) {
        addToast({
          id: reading.id,
          message: `Alerta: Envío ${reading.shipmentId.slice(0, 8)} — ${reading.temperatureC}°C`,
          severity: isHumAlert(reading.humidityPct) ? 'critical' : 'warning',
        });
      }
    });
    return unsub;
  }, [addToast]);

  return (
    <>
      <AlertToast alerts={toasts} onDismiss={removeToast} />

      <button className="alert-bell" onClick={() => setPanelOpen(true)} title="Centro de alertas" aria-label="Centro de alertas">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {unacknowledgedCount > 0 && (
          <span className="alert-bell-badge">{unacknowledgedCount > 99 ? '99+' : unacknowledgedCount}</span>
        )}
      </button>

      <AlertPanel open={panelOpen} onClose={() => setPanelOpen(false)} />
    </>
  );
}
