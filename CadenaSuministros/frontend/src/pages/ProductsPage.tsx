import { useState, useEffect, useCallback, useMemo } from 'react';
import { PageHeader } from '../components/PageHeader';
import ProductCreate from '../components/ProductCreate';
import productService from '../api/productService';
import dashboardService from '../api/dashboardService';
import type { Product, ProductDashboard } from '../types';

const STATUS_COLORS: Record<string, string> = {
  pending: '#f59e0b',
  transit: '#06b6d4',
  delayed: '#ef4444',
  delivered: '#22c55e',
};

export function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [dashboards, setDashboards] = useState<Map<string, ProductDashboard>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [search, setSearch] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const loadAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const prods = await productService.listAll();
      setProducts(prods);
      const dashMap = new Map<string, ProductDashboard>();
      await Promise.all(prods.map(async p => {
        try {
          const d = await dashboardService.getProductDashboard(p.id);
          dashMap.set(p.id, d);
        } catch (err) {
          if (err instanceof Response && err.status === 404) return;
          console.warn('Error cargando dashboard para', p.name, err);
        }
      }));
      setDashboards(dashMap);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar productos');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadAll(); }, [loadAll, refreshKey]);

  const handleSuccess = () => setRefreshKey(k => k + 1);

  const filtered = useMemo(() => {
    if (!search) return products;
    const q = search.toLowerCase();
    return products.filter(p => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q));
  }, [products, search]);

  const selectedDashboard = selectedProduct ? dashboards.get(selectedProduct.id) : null;

  if (loading) {
    return (
      <div>
        <PageHeader title="Productos" subtitle="Catálogo y métricas por producto" />
        <div className="grid-3">
          <div className="skeleton" style={{ height: 220, borderRadius: 'var(--radius)' }} />
          <div>
            <div className="card-header" style={{ marginBottom: '1rem' }}>
              <div className="skeleton" style={{ height: 32, width: 200 }} />
            </div>
            <div className="product-grid">
              {[1, 2, 3, 4].map(i => <div key={i} className="skeleton skeleton-card" />)}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <PageHeader title="Productos" subtitle="Catálogo y métricas por producto" />
        <div className="card">
          <p style={{ color: 'var(--danger)' }}>Error: {error}</p>
          <button className="btn btn-primary" onClick={loadAll} style={{ marginTop: '1rem' }}>Reintentar</button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Productos" subtitle="Catálogo y métricas por producto" />

      <div className="grid-3">
        <div>
          <ProductCreate onSuccess={handleSuccess} />
        </div>

        <div>
          <div className="card">
            <div className="card-header">
              <div className="flex items-center gap-3">
                <span className="card-title">Productos ({products.length})</span>
                <div className="search-wrapper">
                  <input
                    className="search-bar"
                    placeholder="Buscar por SKU o nombre..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                  />
                </div>
              </div>
              <button className="btn btn-primary btn-sm" onClick={loadAll}>
                Actualizar
              </button>
            </div>

            {filtered.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">📦</div>
                <p className="empty-state-text">
                  {search ? 'No se encontraron productos con ese criterio.' : 'No hay productos registrados.'}
                </p>
              </div>
            ) : (
              <div className="product-grid">
                {filtered.map(p => {
                  const d = dashboards.get(p.id);
                  return <ProductCard key={p.id} product={p} dashboard={d} onClick={setSelectedProduct} />;
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Detail Drawer */}
      {selectedProduct && (
        <>
          <div className={`drawer-overlay${selectedProduct ? ' visible' : ''}`} onClick={() => setSelectedProduct(null)} />
          <div className={`drawer${selectedProduct ? ' open' : ''}`}>
            <div className="drawer-header">
              <div className="pd-drawer-header">
                <div className="pd-drawer-avatar">📦</div>
                <div>
                  <div className="pd-drawer-name">{selectedProduct.name}</div>
                  <div className="pd-drawer-sku">{selectedProduct.sku}</div>
                </div>
              </div>
              <button className="btn btn-sm btn-outline" onClick={() => setSelectedProduct(null)}>✕</button>
            </div>
            <div className="drawer-body">
              {!selectedDashboard ? (
                <p className="empty-state-sm">Sin datos de envíos asociados</p>
              ) : (
                <>
                  <div className="pd-kpi-grid">
                    <div className="pd-kpi">
                      <div className="pd-kpi-label">Total Envíos</div>
                      <div className="pd-kpi-value">{selectedDashboard.totalShipments}</div>
                    </div>
                    <div className="pd-kpi">
                      <div className="pd-kpi-label">Entregados</div>
                      <div className="pd-kpi-value" style={{ color: 'var(--success)' }}>
                        {selectedDashboard.deliveredShipments}
                      </div>
                      <div className="pd-kpi-sub">
                        {selectedDashboard.totalShipments > 0
                          ? Math.round(selectedDashboard.deliveredShipments / selectedDashboard.totalShipments * 100) + '%'
                          : '-'}
                      </div>
                    </div>
                    <div className="pd-kpi">
                      <div className="pd-kpi-label">En Tránsito</div>
                      <div className="pd-kpi-value" style={{ color: 'var(--primary)' }}>
                        {selectedDashboard.transitShipments}
                      </div>
                    </div>
                    <div className="pd-kpi">
                      <div className="pd-kpi-label">Pendientes</div>
                      <div className="pd-kpi-value" style={{ color: 'var(--warning)' }}>
                        {selectedDashboard.pendingShipments}
                      </div>
                    </div>
                  </div>

                  {selectedDashboard.totalShipments > 0 && (
                    <div style={{ marginBottom: '1.25rem' }}>
                      <div className="pd-section-title">Distribución de Envíos</div>
                      <div className="status-bar">
                        {selectedDashboard.pendingShipments > 0 && (
                          <div className="status-bar-segment" style={{ flex: selectedDashboard.pendingShipments, background: 'var(--warning)' }} title={`Pendientes: ${selectedDashboard.pendingShipments}`} />
                        )}
                        {selectedDashboard.transitShipments > 0 && (
                          <div className="status-bar-segment" style={{ flex: selectedDashboard.transitShipments, background: 'var(--primary)' }} title={`En tránsito: ${selectedDashboard.transitShipments}`} />
                        )}
                        {selectedDashboard.deliveredShipments > 0 && (
                          <div className="status-bar-segment" style={{ flex: selectedDashboard.deliveredShipments, background: 'var(--success)' }} title={`Entregados: ${selectedDashboard.deliveredShipments}`} />
                        )}
                        {selectedDashboard.delayedShipments > 0 && (
                          <div className="status-bar-segment" style={{ flex: selectedDashboard.delayedShipments, background: 'var(--danger)' }} title={`Retrasados: ${selectedDashboard.delayedShipments}`} />
                        )}
                      </div>
                    </div>
                  )}

                  <div>
                    <div className="pd-section-title">Condiciones Ambientales</div>
                    <div className="pd-env-grid">
                      <div className="pd-env-item">
                        <span className="pd-env-icon">🌡️</span>
                        <div>
                          <div className="pd-env-info-label">Temperatura Prom.</div>
                          <div className="pd-env-info-value">{selectedDashboard.averageTemperature}°C</div>
                        </div>
                      </div>
                      <div className="pd-env-item">
                        <span className="pd-env-icon">💧</span>
                        <div>
                          <div className="pd-env-info-label">Humedad Prom.</div>
                          <div className="pd-env-info-value">{selectedDashboard.averageHumidity}%</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div style={{ marginTop: '1rem' }}>
                    <div className="pd-section-title">Lecturas</div>
                    <div className="pd-kpi" style={{ textAlign: 'center' }}>
                      <div className="pd-kpi-label">Total de lecturas</div>
                      <div className="pd-kpi-value">{selectedDashboard.totalReadings}</div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function ProductCard({ product, dashboard, onClick }: {
  product: Product;
  dashboard?: ProductDashboard;
  onClick: (p: Product) => void;
}) {
  return (
    <div className="product-dash-card" onClick={() => onClick(product)}>
      <div className="product-dash-top">
        <div className="product-dash-icon">📦</div>
        <div className="product-dash-info">
          <div className="product-dash-name">{product.name}</div>
          <div className="product-dash-sku">{product.sku}</div>
        </div>
        <span className="product-dash-badge">{product.id.slice(0, 6)}</span>
      </div>

      {!dashboard ? (
        <div className="product-dash-empty">Sin envíos asociados</div>
      ) : (
        <>
          {dashboard.totalShipments > 0 && (
            <div className="product-dash-bar">
              {dashboard.pendingShipments > 0 && (
                <div className="product-dash-bar-seg" style={{ flex: dashboard.pendingShipments, background: STATUS_COLORS.pending }} />
              )}
              {dashboard.transitShipments > 0 && (
                <div className="product-dash-bar-seg" style={{ flex: dashboard.transitShipments, background: STATUS_COLORS.transit }} />
              )}
              {dashboard.deliveredShipments > 0 && (
                <div className="product-dash-bar-seg" style={{ flex: dashboard.deliveredShipments, background: STATUS_COLORS.delivered }} />
              )}
              {dashboard.delayedShipments > 0 && (
                <div className="product-dash-bar-seg" style={{ flex: dashboard.delayedShipments, background: STATUS_COLORS.delayed }} />
              )}
            </div>
          )}
          <div className="product-dash-stats">
            <span className="product-dash-stat">
              Envíos: <span className="product-dash-stat-value">{dashboard.totalShipments}</span>
            </span>
            {dashboard.totalReadings > 0 && (
              <>
                <span className="product-dash-stat">
                  🌡️ <span className="product-dash-stat-value">{dashboard.averageTemperature}°C</span>
                </span>
                <span className="product-dash-stat">
                  💧 <span className="product-dash-stat-value">{dashboard.averageHumidity}%</span>
                </span>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default ProductsPage;
