import { memo, useState, useEffect } from 'react';
import type { ShipmentEvent, ShipmentStatus } from '../types';
import { shipmentService } from '../api/shipmentService';
import { SHIPMENT_STATE_CONFIG, STATUS_LABELS } from '../utils/constants';
import { LOCALE } from '../utils/locale';

interface ShipmentHistoryProps {
  shipmentId: string;
  onClose: () => void;
}

export const ShipmentHistory = memo(function ShipmentHistory({ shipmentId, onClose }: ShipmentHistoryProps) {
  const [events, setEvents] = useState<ShipmentEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await shipmentService.getHistory(shipmentId);
        setEvents(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al cargar historial');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [shipmentId]);

  const formatTimestamp = (ts: string) => {
    const d = new Date(ts);
    return d.toLocaleDateString(LOCALE, {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="card" style={{ marginTop: '1rem' }}>
      <div className="card-header">
        <span className="card-title">
          Historial — <span className="font-mono">{shipmentId.slice(0, 8)}</span>
        </span>
        <button className="btn btn-secondary btn-sm" onClick={onClose}>
          Cerrar
        </button>
      </div>

      {loading && (
        <div>
          <div className="skeleton skeleton-text" style={{ width: '80%' }} />
          <div className="skeleton skeleton-text" />
          <div className="skeleton skeleton-text" />
        </div>
      )}

      {error && (
        <p style={{ color: 'var(--danger)' }}>{error}</p>
      )}

      {!loading && !error && events.length === 0 && (
        <div className="empty-state">
          <div className="empty-state-icon">📜</div>
          <p className="empty-state-text">No hay eventos registrados para este envío.</p>
        </div>
      )}

      {!loading && !error && events.length > 0 && (
        <div className="timeline">
          {events.map((event, i) => (
            <div key={event.id} className="timeline-item">
              <div className="timeline-marker">
                {i === 0 ? '●' : '○'}
              </div>
              <div className="timeline-content">
                <div className="timeline-header">
                  <span className="timeline-status">
                    {event.fromStatus ? (
                      <>
                        <span className={`badge badge-status ${statusClass(event.fromStatus)}`}>
                          {STATUS_LABELS[event.fromStatus] || event.fromStatus}
                        </span>
                        <span className="timeline-arrow">→</span>
                      </>
                    ) : null}
                    <span className={`badge badge-status ${statusClass(event.toStatus)}`}>
                      {STATUS_LABELS[event.toStatus] || event.toStatus}
                    </span>
                  </span>
                  <span className="timeline-time">{formatTimestamp(event.timestamp)}</span>
                </div>
                <div className="timeline-location">
                  {event.fromLocation ? (
                    <>{event.fromLocation} → </>
                  ) : null}
                  {event.toLocation}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
});

function statusClass(status: string): string {
  return SHIPMENT_STATE_CONFIG[status as ShipmentStatus]?.badgeClass ?? 'badge-pending';
}

export default ShipmentHistory;
