import { memo, useState, useEffect, useRef } from 'react';
import { sensorService } from '../api/sensorService';
import type { SensorReading } from '../types';
import { isTempAlert, isHumAlert } from '../utils/alertHelpers';
import { REFRESH_INTERVALS } from '../utils/constants';

export const AlertBanner = memo(function AlertBanner() {
  const [alerts, setAlerts] = useState<SensorReading[]>([]);
  const [visible, setVisible] = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const data = await sensorService.listActiveAlerts();
        setAlerts(data);
        if (data.length > 0) setVisible(true);
      } catch {
        // silencioso
      }
    };

    fetchAlerts();
    intervalRef.current = setInterval(fetchAlerts, REFRESH_INTERVALS.ALERTS);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  if (!visible || alerts.length === 0) return null;

  return (
    <div className="alert-banner">
      <div className="alert-banner-inner">
        <div className="alert-banner-icon">⚠️</div>
        <div className="alert-banner-text">
          <strong>{alerts.length}</strong> alerta{alerts.length !== 1 ? 's' : ''} activa{alerts.length !== 1 ? 's' : ''}
        </div>
        <div className="alert-banner-list">
          {alerts.slice(0, 5).map((a) => (
            <span key={a.id} className="alert-banner-item">
              Envío <span className="font-mono">{a.shipmentId.slice(0, 6)}</span>:
              {isTempAlert(a.temperatureC) && ` ${a.temperatureC}°C`}
              {isHumAlert(a.humidityPct) && ` ${a.humidityPct}%`}
            </span>
          ))}
          {alerts.length > 5 && <span className="alert-banner-item">+{alerts.length - 5} más</span>}
        </div>
        <button className="alert-banner-close" onClick={() => setVisible(false)}>
          ✕
        </button>
      </div>
    </div>
  );
});

export default AlertBanner;
