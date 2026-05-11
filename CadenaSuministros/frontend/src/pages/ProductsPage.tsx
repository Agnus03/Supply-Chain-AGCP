import { useState, useEffect } from 'react';
import ProductCreate from '../components/ProductCreate';
import productService from '../api/productService';
import type { Product } from '../types';

export function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadProducts();
  }, [refreshKey]);

  const loadProducts = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await productService.listAll();
      setProducts(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar');
    } finally {
      setLoading(false);
    }
  };

  const handleSuccess = () => {
    setRefreshKey((k) => k + 1);
  };

  const filtered = products.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div>
        <div className="section-header">
          <h1 className="section-title">Productos</h1>
          <p className="section-subtitle">Catálogo de productos registrados</p>
        </div>
        <div className="product-grid">
          {[1, 2, 3, 4].map((i) => (
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
          <h1 className="section-title">Productos</h1>
          <p className="section-subtitle">Catálogo de productos registrados</p>
        </div>
        <div className="card">
          <p style={{ color: 'var(--danger)' }}>Error: {error}</p>
          <button className="btn btn-primary" onClick={loadProducts} style={{ marginTop: '1rem' }}>
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="section-header">
        <h1 className="section-title">Productos</h1>
        <p className="section-subtitle">Catálogo de productos registrados</p>
      </div>

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
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
              </div>
              <button className="btn btn-primary btn-sm" onClick={loadProducts}>
                Actualizar
              </button>
            </div>

            {filtered.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">📦</div>
                <p className="empty-state-text">
                  {search
                    ? 'No se encontraron productos con ese criterio.'
                    : 'No hay productos registrados. Crea uno para comenzar.'}
                </p>
              </div>
            ) : (
              <div className="product-grid">
                {filtered.map((product) => (
                  <div key={product.id} className="product-card">
                    <div className="product-card-icon">📦</div>
                    <div className="product-card-name">{product.name}</div>
                    <span className="badge-sku">{product.sku}</span>
                    <div className="product-card-id">ID: {product.id.slice(0, 8)}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProductsPage;
