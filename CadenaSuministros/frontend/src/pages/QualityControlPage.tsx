import { useState, useEffect, useCallback, useMemo } from 'react';
import { qualityService } from '../api/qualityService';
import { shipmentService } from '../api/shipmentService';
import { PageHeader } from '../components/PageHeader';
import type { QualityCheckpoint, Shipment } from '../types';
import { useSort } from '../hooks/useSort';
import { LOCALE } from '../utils/constants';

export function QualityControlPage() {
  const [checkpoints, setCheckpoints] = useState<QualityCheckpoint[]>([]);
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'passed' | 'failed'>('all');
  const [showCreate, setShowCreate] = useState(false);
  const [selectedShipment, setSelectedShipment] = useState<string>('');

  const { sorted, sortConfig, handleSort } = useSort<QualityCheckpoint>();

  const fetchAll = useCallback(async () => {
    try {
      const [qc, sh] = await Promise.all([qualityService.listAll(), shipmentService.listAll()]);
      setCheckpoints(qc);
      setShipments(sh);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar controles de calidad');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const filtered = useMemo(() => {
    let list = checkpoints;
    if (filter === 'passed') list = list.filter(c => c.passed);
    else if (filter === 'failed') list = list.filter(c => !c.passed);
    if (selectedShipment) list = list.filter(c => c.shipmentId === selectedShipment);
    return sorted(list, sortConfig);
  }, [checkpoints, filter, selectedShipment, sorted, sortConfig]);

  const failedCount = useMemo(() => checkpoints.filter(c => !c.passed).length, [checkpoints]);

  const handleCreate = async (data: {
    shipmentId: string; location: string; temperatureC: number | null;
    humidityPct: number | null; passed: boolean; notes: string; inspector: string;
  }) => {
    await qualityService.create(data);
    setShowCreate(false);
    fetchAll();
  };

  const renderSortIcon = (key: keyof QualityCheckpoint) => {
    if (sortConfig.key !== key) return <span className="sort-icon">↕</span>;
    return <span className="sort-icon active">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>;
  };

  if (loading) {
    return (
      <div>
        <PageHeader title="Control de Calidad" subtitle="Puntos de inspección y checklists de envíos" />
        <div className="card"><div className="skeleton" style={{ height: 400 }} /></div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <PageHeader title="Control de Calidad" subtitle="Puntos de inspección y checklists de envíos" />
        <div className="card"><p style={{ color: 'var(--danger)' }}>Error: {error}</p>
          <button className="btn btn-primary" onClick={fetchAll}>Reintentar</button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Control de Calidad" subtitle="Puntos de inspección y checklists de envíos">
        <button className="btn btn-primary btn-sm" onClick={() => setShowCreate(true)}>+ Nuevo Control</button>
        <button className="btn btn-outline btn-sm" onClick={fetchAll}>Actualizar</button>
      </PageHeader>

      <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))' }}>
        <div className="card"><div className="card-header"><span className="card-title">Total Inspecciones</span></div><p className="text-2xl font-bold">{checkpoints.length}</p></div>
        <div className="card"><div className="card-header"><span className="card-title">Aprobados</span></div><p className="text-2xl font-bold text-success">{checkpoints.filter(c => c.passed).length}</p></div>
        <div className="card"><div className="card-header"><span className="card-title">Rechazados</span></div><p className={`text-2xl font-bold ${failedCount > 0 ? 'text-danger' : ''}`}>{failedCount}</p></div>
        <div className="card"><div className="card-header"><span className="card-title">Tasa de Éxito</span></div><p className="text-2xl font-bold">{checkpoints.length > 0 ? Math.round((checkpoints.filter(c => c.passed).length / checkpoints.length) * 100) : 0}%</p></div>
      </div>

      <div className="card">
        <div className="card-header">
          <span className="card-title">Puntos de Inspección</span>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <select value={selectedShipment} onChange={e => setSelectedShipment(e.target.value)} className="form-input" style={{ width: 200 }}>
              <option value="">Todos los envíos</option>
              {shipments.map(s => <option key={s.id} value={s.id}>{s.id.slice(0, 8)} - {s.currentLocation}</option>)}
            </select>
            <div className="btn-group" style={{ display: 'flex' }}>
              {(['all', 'passed', 'failed'] as const).map(f => (
                <button key={f} className={`btn btn-sm ${filter === f ? 'btn-primary' : 'btn-outline'}`} onClick={() => setFilter(f)}>
                  {f === 'all' ? 'Todos' : f === 'passed' ? 'Aprobados' : 'Rechazados'}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="overflow-auto">
          <table className="table-enhanced">
            <thead>
              <tr>
                <th onClick={() => handleSort('shipmentId')} style={{ cursor: 'pointer' }}>Envío {renderSortIcon('shipmentId')}</th>
                <th onClick={() => handleSort('location')} style={{ cursor: 'pointer' }}>Ubicación {renderSortIcon('location')}</th>
                <th onClick={() => handleSort('temperatureC')} style={{ cursor: 'pointer', textAlign: 'right' }}>Temp {renderSortIcon('temperatureC')}</th>
                <th onClick={() => handleSort('humidityPct')} style={{ cursor: 'pointer', textAlign: 'right' }}>Humedad {renderSortIcon('humidityPct')}</th>
                <th onClick={() => handleSort('passed')} style={{ cursor: 'pointer', textAlign: 'center' }}>Resultado {renderSortIcon('passed')}</th>
                <th>Inspector</th>
                <th>Notas</th>
                <th>Fecha</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={8} className="empty-state-sm">Sin inspecciones</td></tr>
              ) : filtered.map(cp => (
                  <tr key={cp.id} className="row-enter">
                    <td className="font-mono text-sm">{cp.shipmentId.slice(0, 8)}</td>
                    <td>{cp.location}</td>
                    <td style={{ textAlign: 'right' }}>{cp.temperatureC != null ? `${cp.temperatureC}°C` : '-'}</td>
                    <td style={{ textAlign: 'right' }}>{cp.humidityPct != null ? `${cp.humidityPct}%` : '-'}</td>
                    <td style={{ textAlign: 'center' }}>{cp.passed ? <span className="badge badge-delivered">Aprobado</span> : <span className="badge badge-delayed">Rechazado</span>}</td>
                    <td>{cp.inspector ?? '-'}</td>
                    <td className="text-sm">{cp.notes ?? '-'}</td>
                    <td className="text-xs text-secondary">{new Date(cp.timestamp).toLocaleString(LOCALE)}</td>
                  </tr>
                ))
              }
            </tbody>
          </table>
        </div>
      </div>

      {showCreate && (
        <CreateQualityForm shipments={shipments} onSubmit={handleCreate} onClose={() => setShowCreate(false)} />
      )}
    </div>
  );
}

function CreateQualityForm({ shipments, onSubmit, onClose }: {
  shipments: Shipment[];
  onSubmit: (data: {
    shipmentId: string; location: string; temperatureC: number | null;
    humidityPct: number | null; passed: boolean; notes: string; inspector: string;
  }) => Promise<void>;
  onClose: () => void;
}) {
  const [shipmentId, setShipmentId] = useState('');
  const [location, setLocation] = useState('');
  const [temperatureC, setTemperatureC] = useState('');
  const [humidityPct, setHumidityPct] = useState('');
  const [passed, setPassed] = useState(true);
  const [notes, setNotes] = useState('');
  const [inspector, setInspector] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shipmentId || !location) return;
    setSaving(true);
    try {
      await onSubmit({
        shipmentId, location,
        temperatureC: temperatureC ? Number(temperatureC) : null,
        humidityPct: humidityPct ? Number(humidityPct) : null,
        passed, notes, inspector,
      });
    } finally { setSaving(false); }
  };

  return (
    <div className="dialog-overlay" onClick={onClose}>
      <div className="dialog" onClick={e => e.stopPropagation()}>
        <div className="card-header"><span className="card-title">Nuevo Punto de Control</span></div>
        <form onSubmit={handleSubmit} style={{ padding: '1rem' }}>
          <div className="form-group">
            <label htmlFor="qc-shipment">Envío</label>
            <select id="qc-shipment" value={shipmentId} onChange={e => setShipmentId(e.target.value)} required className="form-input">
              <option value="">Seleccionar envío</option>
              {shipments.map(s => <option key={s.id} value={s.id}>{s.id.slice(0, 8)} - {s.currentLocation} ({s.status})</option>)}
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="qc-location">Ubicación</label>
            <input id="qc-location" value={location} onChange={e => setLocation(e.target.value)} required className="form-input" placeholder="Ej: Bogotá, Medellín..." />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div className="form-group">
              <label htmlFor="qc-temp">Temperatura (°C)</label>
              <input id="qc-temp" type="number" step="0.1" value={temperatureC} onChange={e => setTemperatureC(e.target.value)} className="form-input" />
            </div>
            <div className="form-group">
              <label htmlFor="qc-hum">Humedad (%)</label>
              <input id="qc-hum" type="number" step="0.1" value={humidityPct} onChange={e => setHumidityPct(e.target.value)} className="form-input" />
            </div>
          </div>
          <div className="form-group">
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
              <input type="checkbox" checked={passed} onChange={e => setPassed(e.target.checked)} />
              Inspección aprobada
            </label>
          </div>
          <div className="form-group">
            <label htmlFor="qc-inspector">Inspector</label>
            <input id="qc-inspector" value={inspector} onChange={e => setInspector(e.target.value)} className="form-input" placeholder="Nombre del inspector" />
          </div>
          <div className="form-group">
            <label htmlFor="qc-notes">Notas</label>
            <textarea id="qc-notes" value={notes} onChange={e => setNotes(e.target.value)} className="form-input" rows={3} placeholder="Observaciones..." />
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
            <button type="button" className="btn btn-outline" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn btn-primary" disabled={saving || !shipmentId || !location}>{saving ? 'Guardando...' : 'Guardar'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default QualityControlPage;
