import { useState } from 'react';
import productService from '../api/productService';

interface ProductCreateProps {
  onSuccess: () => void;
}

export function ProductCreate({ onSuccess }: ProductCreateProps) {
  const [formData, setFormData] = useState({
    sku: '',
    name: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await productService.create(formData.sku, formData.name);

      setFormData({
        sku: '',
        name: '',
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
        Crear Nuevo Producto
      </h3>

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="sku">SKU</label>
          <input
            id="sku"
            type="text"
            value={formData.sku}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, sku: e.target.value }))
            }
            placeholder="SKU-001"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="name">Nombre</label>
          <input
            id="name"
            type="text"
            value={formData.name}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, name: e.target.value }))
            }
            placeholder="Nombre del producto"
            required
          />
        </div>

        {error && (
          <div style={{ color: 'var(--danger)', marginBottom: '1rem' }}>
            {error}
          </div>
        )}

        <button
          type="submit"
          className="btn btn-primary"
          disabled={loading}
          style={{ width: '100%' }}
        >
          {loading ? 'Creando...' : 'Crear Producto'}
        </button>
      </form>
    </div>
  );
}

export default ProductCreate;