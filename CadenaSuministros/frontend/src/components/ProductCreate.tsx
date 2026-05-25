import { useState, useId } from 'react';
import productService from '../api/productService';

interface ProductCreateProps {
  onSuccess: () => void;
}

export function ProductCreate({ onSuccess }: ProductCreateProps) {
  const [sku, setSku] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const skuId = useId();
  const nameId = useId();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sku.trim() || !name.trim()) return;
    setError(null);
    setLoading(true);
    try {
      await productService.create(sku.trim(), name.trim());
      setSku('');
      setName('');
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear producto');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="create-product-form">
      <div className="create-product-header">
        <span className="create-product-icon">+</span>
        <div>
          <div className="create-product-title">Nuevo Producto</div>
          <div className="create-product-subtitle">Agrega un item al catálogo</div>
        </div>
      </div>

      <div className="create-product-body">
        <div className="cp-field">
          <label htmlFor={skuId} className="cp-label">SKU</label>
          <input
            id={skuId}
            type="text"
            value={sku}
            onChange={e => setSku(e.target.value)}
            placeholder="Ej: FRESA-001"
            required
            className="cp-input"
            autoComplete="off"
          />
        </div>

        <div className="cp-field">
          <label htmlFor={nameId} className="cp-label">Nombre</label>
          <input
            id={nameId}
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Ej: Fresa Orgánica"
            required
            className="cp-input"
            autoComplete="off"
          />
        </div>

        {error && <div className="cp-error">{error}</div>}

        <button type="submit" className="cp-submit" disabled={loading || !sku.trim() || !name.trim()}>
          {loading ? (
            <span className="cp-submit-loading">
              <span className="cp-spinner" />
              Creando...
            </span>
          ) : (
            'Crear Producto'
          )}
        </button>
      </div>
    </form>
  );
}

export default ProductCreate;
