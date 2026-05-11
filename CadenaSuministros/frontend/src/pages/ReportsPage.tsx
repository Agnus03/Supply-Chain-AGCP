import { useState, useEffect } from 'react';
import type { Shipment, DeliveryReport } from '../types';
import { shipmentService } from '../api/shipmentService';
import { reportService } from '../api/reportService';

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Pendiente',
  IN_TRANSIT: 'En tránsito',
  DELIVERED: 'Entregado',
  DELAYED: 'Retrasado',
};

function ReportMetric({
  label,
  value,
  variant,
}: {
  label: string;
  value: string;
  variant?: 'ok' | 'warn' | 'danger';
}) {
  return (
    <div className="metric-card">
      <div className="metric-label">{label}</div>
      <div className={`metric-value ${variant ? `temp-${variant}` : ''}`}>
        {value}
      </div>
    </div>
  );
}

function ReportSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: '1.5rem' }}>
      <h4
        style={{
          fontSize: '0.75rem',
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          color: 'var(--text-secondary)',
          marginBottom: '0.75rem',
          paddingBottom: '0.5rem',
          borderBottom: '1px solid var(--border)',
        }}
      >
        {title}
      </h4>
      {children}
    </div>
  );
}

export function ReportsPage() {
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [loadingShipments, setLoadingShipments] = useState(true);

  const [selectedShipmentId, setSelectedShipmentId] = useState<string>('');
  const [loadingReport, setLoadingReport] = useState(false);
  const [report, setReport] = useState<DeliveryReport | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadShipments = async () => {
      try {
        const data = await shipmentService.listAll();
        setShipments(data);
      } catch (err) {
        console.error('Error loading shipments:', err);
      } finally {
        setLoadingShipments(false);
      }
    };
    loadShipments();
  }, []);

  const generateReport = async () => {
    if (!selectedShipmentId) return;

    setLoadingReport(true);
    setError(null);
    setReport(null);

    try {
      const data = await reportService.generateDeliveryReport(selectedShipmentId);
      setReport(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al generar reporte');
    } finally {
      setLoadingReport(false);
    }
  };

  return (
    <div>
      <div className="section-header">
        <h1 className="section-title">Reportes de Entrega</h1>
        <p className="section-subtitle">
          Genera reportes con estadísticas ambientales de tus envíos
        </p>
      </div>

      <div className="grid-3">
        <div className="card">
          <h3 className="card-title mb-4">Generar Reporte</h3>

          <div className="form-group">
            <label htmlFor="shipmentSelect">Seleccionar Envío</label>
            <select
              id="shipmentSelect"
              value={selectedShipmentId}
              onChange={(e) => {
                setSelectedShipmentId(e.target.value);
                setReport(null);
                setError(null);
              }}
              disabled={loadingShipments}
            >
              <option value="">
                {loadingShipments ? 'Cargando...' : '-- Seleccionar --'}
              </option>
              {shipments.map((shipment) => (
                <option key={shipment.id} value={shipment.id}>
                  {shipment.id.slice(0, 8)} -{' '}
                  {STATUS_LABELS[shipment.status] || shipment.status} (
                  {shipment.currentLocation})
                </option>
              ))}
            </select>
          </div>

          <button
            className="btn btn-primary w-full"
            onClick={generateReport}
            disabled={!selectedShipmentId || loadingReport}
          >
            {loadingReport ? 'Generando...' : 'Generar Reporte'}
          </button>

          {error && (
            <p className="text-sm mt-3" style={{ color: 'var(--danger)' }}>
              {error}
            </p>
          )}
        </div>

        <div className="card">
          {!report && !error && (
            <div className="empty-state">
              <div className="empty-state-icon">📋</div>
              <p className="empty-state-text">
                Selecciona un envío y genera el reporte para ver los resultados.
              </p>
            </div>
          )}

          {report && (
            <div>
              <ReportSection title="Información General">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div>
                    <div className="text-xs text-secondary font-medium">ID Reporte</div>
                    <div className="font-mono text-sm">{report.reportId?.slice(0, 8) || 'N/A'}</div>
                  </div>
                  <div>
                    <div className="text-xs text-secondary font-medium">ID Envío</div>
                    <div className="font-mono text-sm">{report.shipmentId?.slice(0, 8) || 'N/A'}</div>
                  </div>
                  <div>
                    <div className="text-xs text-secondary font-medium">Origen</div>
                    <div className="text-sm">{report.origin || 'N/A'}</div>
                  </div>
                  <div>
                    <div className="text-xs text-secondary font-medium">Destino</div>
                    <div className="text-sm">{report.destination || 'N/A'}</div>
                  </div>
                  <div>
                    <div className="text-xs text-secondary font-medium">Estado</div>
                    <span
                      className={`badge badge-status ${
                        report.deliveryStatus === 'DELIVERED'
                          ? 'badge-delivered'
                          : report.deliveryStatus === 'DELAYED'
                          ? 'badge-delayed'
                          : report.deliveryStatus === 'IN_TRANSIT'
                          ? 'badge-transit'
                          : 'badge-pending'
                      }`}
                    >
                      {STATUS_LABELS[report.deliveryStatus] || report.deliveryStatus}
                    </span>
                  </div>
                </div>
              </ReportSection>

              <ReportSection title="Estadísticas Ambientales">
                <div className="stat-cards" style={{ marginBottom: 0 }}>
                  <ReportMetric
                    label="Temp. Promedio"
                    value={`${report.averageTemperature?.toFixed(1) ?? '-'}°C`}
                    variant={
                      report.temperatureAlert
                        ? 'danger'
                        : report.averageTemperature !== null
                        ? 'ok'
                        : undefined
                    }
                  />
                  <ReportMetric
                    label="Humedad Promedio"
                    value={`${report.averageHumidity?.toFixed(1) ?? '-'}%`}
                    variant={
                      report.humidityAlert
                        ? 'danger'
                        : report.averageHumidity !== null
                        ? 'ok'
                        : undefined
                    }
                  />
                </div>
              </ReportSection>

              <ReportSection title="Alertas">
                <div className="flex gap-3">
                  <div
                    className={`alert-badge ${report.temperatureAlert ? 'alert-danger' : 'alert-success'}`}
                  >
                    {report.temperatureAlert ? '⚠️ Alerta Temperatura' : '✓ Temperatura OK'}
                  </div>
                  <div
                    className={`alert-badge ${report.humidityAlert ? 'alert-danger' : 'alert-success'}`}
                  >
                    {report.humidityAlert ? '⚠️ Alerta Humedad' : '✓ Humedad OK'}
                  </div>
                </div>
              </ReportSection>

              {report.observations && (
                <ReportSection title="Observaciones">
                  <p className="text-sm text-secondary" style={{ lineHeight: 1.6 }}>
                    {report.observations}
                  </p>
                </ReportSection>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ReportsPage;
