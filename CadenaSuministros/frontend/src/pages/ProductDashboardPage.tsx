import { useState, useEffect, useCallback, useMemo } from 'react';
import { productService } from '../api/productService';
import { dashboardService } from '../api/dashboardService';
import { PageHeader } from '../components/PageHeader';
import type { Product, ProductDashboard } from '../types';
import { useNavigate } from 'react-router-dom';

export function ProductDashboardPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [dashboards, setDashboards] = useState<Map<string, ProductDashboard>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const fetchAll = useCallback(async () => {
    try {
      const prods = await productService.listAll();
      setProducts(prods);
      const dashMap = new Map<string, ProductDashboard>();
      for (const p of prods) {
        try {
          const d = await dashboardService.getProductDashboard(p.id);
          dashMap.set(p.id, d);
        } catch (err) {
          if (err instanceof Response && err.status === 404) continue;
          console.warn('Error cargando dashboard para producto', p.id, p.name, err);
        }
      }
      setDashboards(dashMap);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar dashboard de productos');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const avgDeliveryRate = useMemo(() => {
    if (dashboards.size === 0) return 0;
    let total = 0, count = 0;
    dashboards.forEach(d => { if (d.totalShipments > 0) { total += d.deliveredShipments / d.totalShipments; count++; } });
    return count > 0 ? Math.round((total / count) * 100) : 0;
  }, [dashboards]);

  if (loading) {
    return (
      <div>
        <PageHeader title="Dashboard por Producto" subtitle="Métricas agregadas de envíos por producto" />
        <div className="card"><div className="skeleton" style={{ height: 400 }} /></div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <PageHeader title="Dashboard por Producto" subtitle="Métricas agregadas de envíos por producto" />
        <div className="card"><p style={{ color: 'var(--danger)' }}>Error: {error}</p>
          <button className="btn btn-primary" onClick={fetchAll}>Reintentar</button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Dashboard por Producto" subtitle="Métricas agregadas de envíos por producto">
        <button className="btn btn-outline btn-sm" onClick={fetchAll}>Actualizar</button>
      </PageHeader>

      <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))' }}>
        <div className="card"><div className="card-header"><span className="card-title">Productos</span></div><p className="text-2xl font-bold">{products.length}</p></div>
        <div className="card"><div className="card-header"><span className="card-title">Con Envíos</span></div><p className="text-2xl font-bold">{dashboards.size}</p></div>
        <div className="card"><div className="card-header"><span className="card-title">Tasa Entrega Prom.</span></div><p className="text-2xl font-bold">{avgDeliveryRate}%</p></div>
      </div>

      {products.length === 0 ? (
        <div className="card"><p className="empty-state-sm">No hay productos registrados. Crea productos desde la sección de Productos.</p>
          <button className="btn btn-primary" onClick={() => navigate('/productos')}>Ir a Productos</button>
        </div>
      ) : (
        <div className="product-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
          {products.map(p => {
            const d = dashboards.get(p.id);
            return (
              <div key={p.id} className="card">
                <div className="card-header">
                  <span className="card-title">{p.name}</span>
                  <span className="text-xs text-secondary">{p.sku}</span>
                </div>
                {!d ? (
                  <p className="empty-state-sm" style={{ padding: '1rem' }}>Sin envíos asociados</p>
                ) : (
                  <div style={{ padding: '1rem' }}>
                    <div className="kpi-grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                      <div><span className="text-xs text-secondary">Total</span><p className="text-lg font-bold">{d.totalShipments}</p></div>
                      <div><span className="text-xs text-secondary">Entregados</span><p className="text-lg font-bold text-success">{d.deliveredShipments}</p></div>
                      <div><span className="text-xs text-secondary">En tránsito</span><p className="text-lg font-bold">{d.transitShipments}</p></div>
                      <div><span className="text-xs text-secondary">Pendientes</span><p className="text-lg font-bold">{d.pendingShipments}</p></div>
                    </div>
                    {d.totalShipments > 0 && (
                      <div style={{ marginTop: '0.75rem' }}>
                        <div className="status-bar" style={{ display: 'flex', height: 8, borderRadius: 4, overflow: 'hidden' }}>
                          {d.pendingShipments > 0 && <div style={{ flex: d.pendingShipments, background: 'var(--warning)' }} title={`Pendientes: ${d.pendingShipments}`} />}
                          {d.transitShipments > 0 && <div style={{ flex: d.transitShipments, background: 'var(--primary)' }} title={`En tránsito: ${d.transitShipments}`} />}
                          {d.deliveredShipments > 0 && <div style={{ flex: d.deliveredShipments, background: 'var(--success)' }} title={`Entregados: ${d.deliveredShipments}`} />}
                          {d.delayedShipments > 0 && <div style={{ flex: d.delayedShipments, background: 'var(--danger)' }} title={`Retrasados: ${d.delayedShipments}`} />}
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem', fontSize: '0.75rem', color: 'var(--secondary)' }}>
                          <span>🌡️ {d.averageTemperature}°C</span>
                          <span>💧 {d.averageHumidity}%</span>
                          <span>📊 {d.totalReadings} lecturas</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default ProductDashboardPage;
