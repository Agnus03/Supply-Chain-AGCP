import { useState, useEffect, useCallback } from 'react';
import { shippingCostService } from '../api/shippingCostService';
import { shipmentService } from '../api/shipmentService';
import { PageHeader } from '../components/PageHeader';
import type { ShippingCost, ShipmentInfo } from '../types';
import { useSort } from '../hooks/useSort';
import { LOCALE } from '../utils/constants';
import { ExportButton } from '../components/ExportButton';

const STRATEGY_STYLES: Record<string, { label: string; className: string }> = {
  Standard: { label: 'Standard', className: 'badge badge-info' },
  Refrigerado: { label: 'Refrigerado', className: 'badge badge-primary' },
  Express: { label: 'Express', className: 'badge badge-warning' },
};

function formatCurrency(n: number): string {
  return '$' + n.toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

function formatKm(n: number): string {
  return n.toLocaleString('es-CO', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + ' km';
}

function CostBreakdownBar({ cost, maxTotal }: { cost: ShippingCost; maxTotal: number }) {
  if (maxTotal <= 0) return null;
  const wBase = (cost.baseRate / maxTotal) * 100;
  const wDist = (cost.distanceCost / maxTotal) * 100;
  const wExtra = (cost.extraCharges / maxTotal) * 100;
  return (
    <div style={{ display: 'flex', height: 20, borderRadius: 6, overflow: 'hidden', fontSize: 11, fontWeight: 600, marginTop: 4 }}>
      {wBase > 1 && <div style={{ width: `${wBase}%`, background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>Base</div>}
      {wDist > 1 && <div style={{ width: `${wDist}%`, background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>Dist</div>}
      {wExtra > 1 && <div style={{ width: `${wExtra}%`, background: 'var(--danger)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>Ext</div>}
    </div>
  );
}

function getStrategyStyle(strategyName: string) {
  return STRATEGY_STYLES[strategyName] ?? { label: strategyName, className: 'badge' };
}

export function ShippingCostPage() {
  const [costs, setCosts] = useState<ShippingCost[]>([]);
  const [shipments, setShipments] = useState<ShipmentInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedShipment, setSelectedShipment] = useState('');
  const [calculating, setCalculating] = useState(false);
  const [compareResults, setCompareResults] = useState<ShippingCost[] | null>(null);
  const [comparing, setComparing] = useState(false);

  const { sorted, sortConfig, handleSort } = useSort<ShippingCost>();

  const fetchAll = useCallback(async () => {
    try {
      const [c, s] = await Promise.all([shippingCostService.listAll(), shipmentService.listAllInfo()]);
      setCosts(c);
      setShipments(s);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar costos');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const getSelectedProductName = useCallback(() => {
    if (!selectedShipment) return '';
    const ship = shipments.find(s => s.id === selectedShipment);
    if (!ship) return '';
    return ship.productName;
  }, [selectedShipment, shipments]);

  const handleCalculate = async () => {
    if (!selectedShipment) return;
    setCalculating(true);
    try {
      const ship = shipments.find(s => s.id === selectedShipment);
      if (!ship) return;
      await shippingCostService.calculate(selectedShipment, 'WAREHOUSE', ship.currentLocation, 0, getSelectedProductName());
      await fetchAll();
    } catch (err) {
      console.error('Error calculating cost:', err);
    } finally {
      setCalculating(false);
    }
  };

  const handleCompare = async () => {
    if (!selectedShipment) return;
    setComparing(true);
    setCompareResults(null);
    try {
      const ship = shipments.find(s => s.id === selectedShipment);
      if (!ship) return;
      const results = await shippingCostService.compare(selectedShipment, 'WAREHOUSE', ship.currentLocation, 0);
      setCompareResults(results);
    } catch (err) {
      console.error('Error comparing strategies:', err);
    } finally {
      setComparing(false);
    }
  };

  const totalCosts = costs.reduce((s, c) => s + c.totalCost, 0);
  const maxTotalCompare = compareResults ? Math.max(...compareResults.map(c => c.totalCost), 1) : 0;

  const csvData = costs.map(c => ({
    'Estrategia': c.strategyName,
    'Envío': c.shipmentId.slice(0, 8),
    'Tarifa Base': c.baseRate,
    'Distancia (km)': c.distanceKm,
    'Costo Distancia': c.distanceCost,
    'Cargos Extra': c.extraCharges,
    'Total': c.totalCost,
    'Moneda': c.currency,
    'Fecha': new Date(c.calculatedAt).toLocaleString(LOCALE),
  }));

  const renderSortIcon = (key: keyof ShippingCost) => {
    if (sortConfig.key !== key) return <span className="sort-icon">↕</span>;
    return <span className="sort-icon active">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>;
  };

  if (loading) {
    return (
      <div>
        <PageHeader title="Costos de Envío" subtitle="Cálculo y visualización de costos logísticos" />
        <div className="card"><div className="skeleton" style={{ height: 400 }} /></div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <PageHeader title="Costos de Envío" subtitle="Cálculo y visualización de costos logísticos" />
        <div className="card"><p style={{ color: 'var(--danger)' }}>Error: {error}</p>
          <button className="btn btn-primary" onClick={fetchAll}>Reintentar</button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Costos de Envío" subtitle="Cálculo y visualización de costos logísticos">
        <ExportButton data={csvData} filename="costos-envio" />
        <button className="btn btn-outline btn-sm" onClick={fetchAll}>Actualizar</button>
      </PageHeader>

      {/* KPI */}
      <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))' }}>
        <div className="card"><div className="card-header"><span className="card-title">Total Costos</span></div><p className="text-2xl font-bold">{formatCurrency(totalCosts)}</p></div>
        <div className="card"><div className="card-header"><span className="card-title">Envíos Calculados</span></div><p className="text-2xl font-bold">{costs.length}</p></div>
        <div className="card"><div className="card-header"><span className="card-title">Promedio</span></div><p className="text-2xl font-bold">{costs.length > 0 ? formatCurrency(Math.round(totalCosts / costs.length)) : '-'}</p></div>
        <div className="card"><div className="card-header"><span className="card-title">Dist. Total</span></div><p className="text-2xl font-bold">{costs.reduce((s, c) => s + c.distanceKm, 0).toFixed(0)} km</p></div>
      </div>

      {/* Calcular */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">Calcular Costo</span>
        </div>
        <div style={{ padding: '1rem', display: 'flex', gap: '0.5rem', alignItems: 'flex-end' }}>
          <div className="form-group" style={{ flex: 1 }}>
            <label htmlFor="cost-shipment">Seleccionar Envío</label>
            <select id="cost-shipment" value={selectedShipment} onChange={e => { setSelectedShipment(e.target.value); setCompareResults(null); }} className="form-input">
              <option value="">Seleccionar...</option>
              {shipments.filter(s => !costs.find(c => c.shipmentId === s.id)).map(s => (
                <option key={s.id} value={s.id}>{s.id.slice(0, 8)} - {s.currentLocation} ({s.status})</option>
              ))}
            </select>
          </div>
          <button className="btn btn-primary" onClick={handleCalculate} disabled={!selectedShipment || calculating}>
            {calculating ? 'Calculando...' : 'Calcular Costo'}
          </button>
          <button className="btn btn-outline btn-primary" onClick={handleCompare} disabled={!selectedShipment || comparing}>
            {comparing ? 'Comparando...' : 'Comparar Estrategias'}
          </button>
        </div>
      </div>

      {/* Comparación de estrategias */}
      {compareResults && compareResults.length > 0 && (
        <div className="card">
          <div className="card-header">
            <span className="card-title">Comparación de Estrategias de Costo</span>
          </div>
          <div style={{ padding: '1rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
              {compareResults.map(c => {
                const style = getStrategyStyle(c.strategyName);
                return (
                  <div key={c.strategyName} className="card" style={{ border: '1px solid var(--border)', textAlign: 'center' }}>
                    <span className={style.className} style={{ fontSize: 13, marginBottom: 8 }}>{style.label}</span>
                    <p className="text-2xl font-bold" style={{ margin: '8px 0' }}>{formatCurrency(c.totalCost)}</p>
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <span>Base: {formatCurrency(c.baseRate)}</span>
                      <span>Distancia: {formatCurrency(c.distanceCost)} ({formatKm(c.distanceKm)})</span>
                      <span>Extra: {c.extraCharges > 0 ? formatCurrency(c.extraCharges) : '—'}</span>
                    </div>
                    <CostBreakdownBar cost={c} maxTotal={maxTotalCompare} />
                    {c.totalCost === maxTotalCompare && (
                      <div style={{ marginTop: 8, fontSize: 11, fontWeight: 700, color: 'var(--warning)' }}>⚠ Mayor costo</div>
                    )}
                    {c.totalCost === Math.min(...compareResults.map(x => x.totalCost)) && (
                      <div style={{ marginTop: 8, fontSize: 11, fontWeight: 700, color: 'var(--success)' }}>✓ Menor costo</div>
                    )}
                  </div>
                );
              })}
            </div>
            {/* tabla comparativa */}
            <table className="table-enhanced" style={{ marginTop: '1rem' }}>
              <thead>
                <tr>
                  <th>Estrategia</th>
                  <th style={{ textAlign: 'right' }}>Tarifa Base</th>
                  <th style={{ textAlign: 'right' }}>Distancia</th>
                  <th style={{ textAlign: 'right' }}>Costo Dist.</th>
                  <th style={{ textAlign: 'right' }}>Cargos Extra</th>
                  <th style={{ textAlign: 'right' }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {compareResults.map(c => (
                  <tr key={c.strategyName}>
                    <td><span className={getStrategyStyle(c.strategyName).className}>{c.strategyName}</span></td>
                    <td style={{ textAlign: 'right' }}>{formatCurrency(c.baseRate)}</td>
                    <td style={{ textAlign: 'right' }}>{formatKm(c.distanceKm)}</td>
                    <td style={{ textAlign: 'right' }}>{formatCurrency(c.distanceCost)}</td>
                    <td style={{ textAlign: 'right' }}>{c.extraCharges > 0 ? formatCurrency(c.extraCharges) : '—'}</td>
                    <td style={{ textAlign: 'right' }}><strong>{formatCurrency(c.totalCost)}</strong></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Historial */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">Historial de Costos</span>
        </div>
        <div className="overflow-auto">
          <table className="table-enhanced">
            <thead>
              <tr>
                <th onClick={() => handleSort('strategyName')} style={{ cursor: 'pointer' }}>Estrategia {renderSortIcon('strategyName')}</th>
                <th onClick={() => handleSort('shipmentId')} style={{ cursor: 'pointer' }}>Envío {renderSortIcon('shipmentId')}</th>
                <th onClick={() => handleSort('baseRate')} style={{ cursor: 'pointer', textAlign: 'right' }}>Tarifa Base {renderSortIcon('baseRate')}</th>
                <th onClick={() => handleSort('distanceKm')} style={{ cursor: 'pointer', textAlign: 'right' }}>Distancia {renderSortIcon('distanceKm')}</th>
                <th onClick={() => handleSort('distanceCost')} style={{ cursor: 'pointer', textAlign: 'right' }}>Costo Dist. {renderSortIcon('distanceCost')}</th>
                <th onClick={() => handleSort('extraCharges')} style={{ cursor: 'pointer', textAlign: 'right' }}>Extra {renderSortIcon('extraCharges')}</th>
                <th onClick={() => handleSort('totalCost')} style={{ cursor: 'pointer', textAlign: 'right' }}>Total {renderSortIcon('totalCost')}</th>
                <th>Moneda</th>
                <th>Calculado</th>
              </tr>
            </thead>
            <tbody>
              {sorted(costs, sortConfig).length === 0 ? (
                <tr><td colSpan={9} className="empty-state-sm">Sin costos calculados</td></tr>
              ) : sorted(costs, sortConfig).map(c => {
                const style = getStrategyStyle(c.strategyName);
                return (
                  <tr key={c.id} className="row-enter">
                    <td><span className={style.className}>{style.label}</span></td>
                    <td className="font-mono text-sm">{c.shipmentId.slice(0, 8)}</td>
                    <td style={{ textAlign: 'right' }}>{formatCurrency(c.baseRate)}</td>
                    <td style={{ textAlign: 'right' }}>{formatKm(c.distanceKm)}</td>
                    <td style={{ textAlign: 'right' }}>{formatCurrency(c.distanceCost)}</td>
                    <td style={{ textAlign: 'right' }}>{c.extraCharges > 0 ? formatCurrency(c.extraCharges) : '—'}</td>
                    <td style={{ textAlign: 'right' }}><strong>{formatCurrency(c.totalCost)}</strong></td>
                    <td>{c.currency}</td>
                    <td className="text-xs text-secondary">{new Date(c.calculatedAt).toLocaleString(LOCALE)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default ShippingCostPage;
