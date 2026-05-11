import { useState, useEffect } from 'react';
import productService from '../api/productService';
import { shipmentService } from '../api/shipmentService';
import type { Product } from '../types';

interface ShipmentCreateProps {
  onSuccess: () => void;
}

export function ShipmentCreate({ onSuccess }: ShipmentCreateProps) {
  const [formData, setFormData] = useState({
    productId: '',
    status: 'PENDING',
    currentLocation: 'WAREHOUSE',
  });
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    productService.listAll().then(setProducts).catch(console.error);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await shipmentService.create(formData);

      setFormData({
        productId: '',
        status: 'PENDING',
        currentLocation: 'WAREHOUSE',
      });
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <h3 style={{ marginBottom: '1rem', fontSize: '1.125rem' }}>
        Crear Nuevo Envío
      </h3>

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="productId">Producto</label>
          <select
            id="productId"
            value={formData.productId}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, productId: e.target.value }))
            }
            required
          >
            <option value="">Selecciona un producto</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.sku} - {p.name}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="status">Estado Inicial</label>
          <select
            id="status"
            value={formData.status}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, status: e.target.value }))
            }
          >
            <option value="PENDING">Pendiente</option>
            <option value="IN_TRANSIT">En tránsito</option>
            <option value="DELIVERED">Entregado</option>
            <option value="DELAYED">Retrasado</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="currentLocation">Ubicación</label>
          <select
            id="currentLocation"
            value={formData.currentLocation}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, currentLocation: e.target.value }))
            }
          >
            <option value="WAREHOUSE">Warehousing principal</option>
            <option value="BOGOTA">Bogotá</option>
            <option value="MEDELLIN">Medellín</option>
            <option value="CALI">Cali</option>
            <option value="BARRANQUILLA">Barranquilla</option>
            <option value="TRANSITO">En tránsito</option>
          </select>
        </div>

        {error && (
          <div style={{ color: 'var(--danger)', marginBottom: '1rem' }}>
            {error}
          </div>
        )}

        <button
          type="submit"
          className="btn btn-success"
          disabled={loading}
          style={{ width: '100%' }}
        >
          {loading ? 'Creando...' : 'Crear Envío'}
        </button>
      </form>
    </div>
  );
}

export default ShipmentCreate;