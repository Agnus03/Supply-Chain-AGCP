import { useState, useEffect } from 'react';
import type { ShipmentInfo } from '../types';
import { shipmentService } from '../api/shipmentService';
import { ShipmentCreate } from '../components/ShipmentCreate';

const STATUS_ORDER = ['PENDING', 'IN_TRANSIT', 'DELIVERED'] as const;
const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Pendiente',
  IN_TRANSIT: 'En tránsito',
  DELIVERED: 'Entregado',
  DELAYED: 'Retrasado',
};

function getStepIndex(status: string): number {
  if (status === 'DELAYED') return -1;
  return STATUS_ORDER.indexOf(status as typeof STATUS_ORDER[number]);
}

function TrackingProgress({ status }: { status: string }) {
  const currentStep = getStepIndex(status);
  const isDelayed = status === 'DELAYED';

  return (
    <div className="tracking-progress">
      {STATUS_ORDER.map((step, i) => {
        const stepClasses = ['tracking-step'];
        if (currentStep > i) stepClasses.push('completed');
        else if (currentStep === i) stepClasses.push('active');
        if (isDelayed) stepClasses.push('delayed');

        return (
          <>
            {i > 0 && <div className="tracking-line" />}
            <div key={step} className={stepClasses.join(' ')}>
              <span className="tracking-dot">
                {currentStep > i ? '✓' : currentStep === i ? (isDelayed ? '!' : '●') : ''}
              </span>
              <span className="tracking-label">{STATUS_LABELS[step]}</span>
            </div>
          </>
        );
      })}
    </div>
  );
}

export function ShipmentsPage() {
  const [shipments, setShipments] = useState<ShipmentInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchShipments = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await shipmentService.listAllInfo();
      setShipments(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShipments();
  }, []);

  const stats = {
    total: shipments.length,
    pending: shipments.filter((s) => s.status === 'PENDING').length,
    transit: shipments.filter((s) => s.status === 'IN_TRANSIT').length,
    delivered: shipments.filter((s) => s.status === 'DELIVERED').length,
    delayed: shipments.filter((s) => s.status === 'DELAYED').length,
  };

  if (loading) {
    return (
      <div>
        <div className="section-header">
          <h1 className="section-title">Envíos</h1>
          <p className="section-subtitle">Gestión de envíos en la cadena de suministro</p>
        </div>
        <div className="stat-cards">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="skeleton skeleton-card" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <div className="section-header">
          <h1 className="section-title">Envíos</h1>
          <p className="section-subtitle">Gestión de envíos en la cadena de suministro</p>
        </div>
        <div className="card">
          <p style={{ color: 'var(--danger)' }}>Error: {error}</p>
          <button className="btn btn-primary" onClick={fetchShipments} style={{ marginTop: '1rem' }}>
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="section-header">
        <h1 className="section-title">Envíos</h1>
        <p className="section-subtitle">Gestión de envíos en la cadena de suministro</p>
      </div>

      <div className="stat-cards">
        <div className="stat-card">
          <div className="stat-card-value">{stats.total}</div>
          <div className="stat-card-label">Total</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-value" style={{ color: 'var(--warning)' }}>{stats.pending}</div>
          <div className="stat-card-label">Pendientes</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-value" style={{ color: 'var(--primary)' }}>{stats.transit}</div>
          <div className="stat-card-label">En tránsito</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-value" style={{ color: 'var(--success)' }}>{stats.delivered}</div>
          <div className="stat-card-label">Entregados</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-value" style={{ color: 'var(--danger)' }}>{stats.delayed}</div>
          <div className="stat-card-label">Retrasados</div>
        </div>
      </div>

      <div className="grid-3">
        <div>
          <ShipmentCreate onSuccess={fetchShipments} />
        </div>

        <div className="card">
          <div className="card-header">
            <span className="card-title">Lista de Envíos ({shipments.length})</span>
            <button className="btn btn-primary btn-sm" onClick={fetchShipments}>
              Actualizar
            </button>
          </div>

          {shipments.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">🚚</div>
              <p className="empty-state-text">
                No hay envíos. Crea uno para comenzar.
              </p>
            </div>
          ) : (
            <div className="overflow-auto">
              <table className="table-enhanced">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Producto</th>
                    <th>Recorrido</th>
                    <th>Ubicación</th>
                    <th>Actualizado</th>
                  </tr>
                </thead>
                <tbody>
                  {shipments.map((shipment) => (
                    <tr key={shipment.id}>
                      <td className="font-mono text-sm">{shipment.id.slice(0, 8)}</td>
                      <td>
                        <div className="font-medium text-sm">{shipment.productName}</div>
                      </td>
                      <td>
                        <TrackingProgress status={shipment.status} />
                      </td>
                      <td>{shipment.currentLocation}</td>
                      <td className="text-sm text-secondary">
                        {new Date(shipment.updatedAt).toLocaleDateString('es-CO')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ShipmentsPage;
