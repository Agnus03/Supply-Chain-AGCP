import { useState, useEffect, useCallback, useMemo, Fragment } from 'react';
import { PageHeader } from '../components/PageHeader';
import type { ShipmentInfo, ShipmentStatus } from '../types';
import { shipmentService } from '../api/shipmentService';
import { ShipmentHistory } from '../components/ShipmentHistory';
import { ShipmentDrawer } from '../components/ShipmentDrawer';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { SHIPMENT_STATE_CONFIG, STATUS_LABELS, STATUS_ORDER, STATUS_OPTIONS, LOCATION_OPTIONS } from '../utils/constants';
import { wsService } from '../services/websocketService';
import { UpdateStatusCommand } from '../commands/UpdateStatusCommand';
import { useCommand } from '../hooks/useCommand';

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
        if (step === 'DELAYED') return null;
        const stepClasses = ['tracking-step'];
        if (currentStep > i) stepClasses.push('completed');
        else if (currentStep === i) stepClasses.push('active');
        if (isDelayed) stepClasses.push('delayed');

        return (
          <Fragment key={step}>
            {i > 0 && <div className="tracking-line" />}
            <div className={stepClasses.join(' ')}>
              <span className="tracking-dot">
                {currentStep > i ? '✓' : currentStep === i ? (isDelayed ? '!' : '●') : ''}
              </span>
              <span className="tracking-label">{STATUS_LABELS[step]}</span>
            </div>
          </Fragment>
        );
      })}
    </div>
  );
}

interface ConfirmAction {
  shipmentId: string;
  newStatus: string;
}

export function ShipmentsPage() {
  const [shipments, setShipments] = useState<ShipmentInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(null);
  const { execute: executeCmd, undo: undoLast, canUndo } = useCommand();

  const fetchShipments = useCallback(async () => {
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
  }, []);

  useEffect(() => {
    const abortController = new AbortController();
    fetchShipments();
    return () => abortController.abort();
  }, [fetchShipments]);

  useEffect(() => {
    const unsubStatus = wsService.subscribe('/topic/shipments/status', () => {
      fetchShipments();
    });
    const unsubLocation = wsService.subscribe('/topic/shipments/location', () => {
      fetchShipments();
    });
    return () => {
      unsubStatus();
      unsubLocation();
    };
  }, [fetchShipments]);

  const handleUpdateStatus = useCallback(async (id: string, newStatus: string) => {
    const targetConfig = SHIPMENT_STATE_CONFIG[newStatus as ShipmentStatus];
    if (targetConfig?.confirmVariant) {
      setConfirmAction({ shipmentId: id, newStatus });
      return;
    }
    setUpdatingId(id);
    try {
      await executeCmd(new UpdateStatusCommand(id, newStatus));
      await fetchShipments();
    } catch {
      setError('Error al actualizar estado');
    } finally {
      setUpdatingId(null);
    }
  }, [executeCmd, fetchShipments]);

  const handleConfirmStatus = useCallback(async () => {
    if (!confirmAction) return;
    const { shipmentId, newStatus } = confirmAction;
    setUpdatingId(shipmentId);
    setConfirmAction(null);
    try {
      await executeCmd(new UpdateStatusCommand(shipmentId, newStatus));
      await fetchShipments();
    } catch {
      setError('Error al actualizar estado');
    } finally {
      setUpdatingId(null);
    }
  }, [confirmAction, executeCmd, fetchShipments]);

  const handleUpdateLocation = useCallback(async (id: string, newLocation: string) => {
    setUpdatingId(id);
    try {
      await shipmentService.updateLocation(id, newLocation);
      await fetchShipments();
    } catch {
      setError('Error al actualizar ubicación');
    } finally {
      setUpdatingId(null);
    }
  }, [fetchShipments]);

  const confirmMessage = confirmAction
    ? `¿Estás seguro de marcar este envío como "${STATUS_LABELS[confirmAction.newStatus]}"?`
    : '';

  const filtered = shipments.filter((s) => {
    const matchSearch = s.productName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchStatus = statusFilter === 'ALL' || s.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const stats = useMemo(() => ({
    total: shipments.length,
    pending: shipments.filter((s) => s.status === 'PENDING').length,
    transit: shipments.filter((s) => s.status === 'IN_TRANSIT').length,
    delivered: shipments.filter((s) => s.status === 'DELIVERED').length,
    delayed: shipments.filter((s) => s.status === 'DELAYED').length,
  }), [shipments]);

  if (loading) {
    return (
      <div>
        <PageHeader title="Envíos" subtitle="Gestión de envíos en la cadena de suministro" />
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
        <PageHeader title="Envíos" subtitle="Gestión de envíos en la cadena de suministro" />
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
      <PageHeader title="Envíos" subtitle="Gestión de envíos en la cadena de suministro" />

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

      <div className="card">
        <div className="card-header">
          <span className="card-title">Lista de Envíos ({filtered.length})</span>
          <div className="flex gap-1" style={{ alignItems: 'center' }}>
            <input
              className="search-input"
              type="text"
              placeholder="Buscar por producto..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <select
              className="table-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="ALL">Todos</option>
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>{STATUS_LABELS[opt]}</option>
              ))}
            </select>
            {canUndo && (
              <button className="btn btn-outline btn-sm" onClick={undoLast} title="Deshacer última operación">
                ↩ Deshacer
              </button>
            )}
            <button className="btn btn-primary btn-sm" onClick={() => setDrawerOpen(true)}>
              + Nuevo
            </button>
            <button className="btn btn-outline btn-sm" onClick={fetchShipments}>
              Actualizar
            </button>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🚚</div>
            <p className="empty-state-text">
              {shipments.length === 0
                ? 'No hay envíos. Crea uno para comenzar.'
                : 'No hay envíos que coincidan con los filtros.'}
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
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((shipment, i) => (
                  <Fragment key={shipment.id}>
                    <tr className="row-enter" style={{ animationDelay: `${i * 50}ms` }}>
                      <td className="font-mono text-sm">{shipment.id.slice(0, 8)}</td>
                      <td>
                        <div className="font-medium text-sm">{shipment.productName}</div>
                      </td>
                      <td>
                        <TrackingProgress status={shipment.status} />
                        <div className="flex gap-1" style={{ marginTop: '0.25rem' }}>
                          <select
                            className="table-select"
                            value={shipment.status}
                            onChange={(e) => handleUpdateStatus(shipment.id, e.target.value)}
                            disabled={updatingId === shipment.id}
                          >
                            {STATUS_OPTIONS.map((opt) => (
                              <option key={opt} value={opt}>
                                {STATUS_LABELS[opt]}
                              </option>
                            ))}
                          </select>
                        </div>
                      </td>
                      <td>
                        <div>{shipment.currentLocation}</div>
                        <select
                          className="table-select"
                          value={shipment.currentLocation}
                          onChange={(e) => handleUpdateLocation(shipment.id, e.target.value)}
                          disabled={updatingId === shipment.id}
                          style={{ marginTop: '0.25rem' }}
                        >
                          {LOCATION_OPTIONS.map((loc) => (
                            <option key={loc} value={loc}>{loc}</option>
                          ))}
                        </select>
                      </td>
                      <td>
                        <button
                          className="btn btn-outline btn-sm"
                          onClick={() => setExpandedId(
                            expandedId === shipment.id ? null : shipment.id
                          )}
                        >
                          {expandedId === shipment.id ? 'Ocultar' : 'Historial'}
                        </button>
                      </td>
                    </tr>
                    {expandedId === shipment.id && (
                      <tr className="row-expanded">
                        <td colSpan={5} style={{ padding: 0 }}>
                          <div style={{ padding: '1rem 1.5rem' }}>
                            <ShipmentHistory
                              shipmentId={shipment.id}
                              onClose={() => setExpandedId(null)}
                            />
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ShipmentDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onSuccess={() => {
          setDrawerOpen(false);
          fetchShipments();
        }}
      />

      <ConfirmDialog
        open={confirmAction !== null}
        title="Confirmar cambio de estado"
        message={confirmMessage}
        confirmLabel={confirmAction ? STATUS_LABELS[confirmAction.newStatus] : ''}
        variant={confirmAction ? (SHIPMENT_STATE_CONFIG[confirmAction.newStatus as ShipmentStatus]?.confirmVariant ?? 'primary') : 'primary'}
        loading={updatingId !== null}
        onConfirm={handleConfirmStatus}
        onCancel={() => setConfirmAction(null)}
      />
    </div>
  );
}

export default ShipmentsPage;
