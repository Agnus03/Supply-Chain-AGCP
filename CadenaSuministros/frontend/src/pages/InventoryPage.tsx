import { useState, useEffect, useCallback, useMemo } from 'react';
import { inventoryService } from '../api/inventoryService';
import { productService } from '../api/productService';
import { PageHeader } from '../components/PageHeader';
import type { InventoryItem, StockMovement, Product } from '../types';
import { useSort } from '../hooks/useSort';
import { LOCALE } from '../utils/constants';

export function InventoryPage() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [warehouseFilter, setWarehouseFilter] = useState('');
  const [showLowStock, setShowLowStock] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [showMovements, setShowMovements] = useState(false);

  const { sorted, sortConfig, handleSort } = useSort<InventoryItem>();

  const fetchAll = useCallback(async () => {
    try {
      const [inv, prods] = await Promise.all([inventoryService.listAll(), productService.listAll()]);
      setItems(inv);
      setProducts(prods);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar inventario');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const productMap = useMemo(() => {
    const m = new Map<string, Product>();
    products.forEach(p => m.set(p.id, p));
    return m;
  }, [products]);

  const filtered = useMemo(() => {
    let list = items;
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(item => {
        const prod = productMap.get(item.productId);
        return prod?.name.toLowerCase().includes(q) || prod?.sku.toLowerCase().includes(q) || item.warehouse.toLowerCase().includes(q);
      });
    }
    if (warehouseFilter) list = list.filter(i => i.warehouse === warehouseFilter);
    if (showLowStock) list = list.filter(i => i.quantity < i.minStock);
    return sorted(list, sortConfig);
  }, [items, search, warehouseFilter, showLowStock, productMap, sorted, sortConfig]);

  const warehouses = useMemo(() => [...new Set(items.map(i => i.warehouse))], [items]);
  const lowStockCount = useMemo(() => items.filter(i => i.quantity < i.minStock).length, [items]);

  const handleCreate = async (data: { productId: string; quantity: number; minStock: number; warehouse: string }) => {
    await inventoryService.create(data);
    setShowCreate(false);
    fetchAll();
  };

  const handleQuantityChange = async (id: string, delta: number, type: string, reference?: string, notes?: string) => {
    await inventoryService.adjustQuantity(id, delta, type, reference, notes);
    fetchAll();
  };

  const viewMovements = async (item: InventoryItem) => {
    setSelectedItem(item);
    setShowMovements(true);
    try {
      const ms = await inventoryService.movements(item.productId);
      setMovements(ms);
    } catch (err) {
      console.error('Error al cargar movimientos:', err);
      setMovements([]);
    }
  };

  const renderSortIcon = (key: keyof InventoryItem) => {
    if (sortConfig.key !== key) return <span className="sort-icon">↕</span>;
    return <span className="sort-icon active">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>;
  };

  if (loading) {
    return (
      <div>
        <PageHeader title="Inventario" subtitle="Gestión de stock y movimientos de productos" />
        <div className="card"><div className="skeleton" style={{ height: 400 }} /></div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <PageHeader title="Inventario" subtitle="Gestión de stock y movimientos de productos" />
        <div className="card"><p style={{ color: 'var(--danger)' }}>Error: {error}</p>
          <button className="btn btn-primary" onClick={fetchAll}>Reintentar</button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Inventario" subtitle="Gestión de stock y movimientos de productos">
        <button className="btn btn-primary btn-sm" onClick={() => setShowCreate(true)}>+ Nuevo Item</button>
        <button className="btn btn-outline btn-sm" onClick={fetchAll}>Actualizar</button>
      </PageHeader>

      <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))' }}>
        <div className="card"><div className="card-header"><span className="card-title">Total Items</span></div><p className="text-2xl font-bold">{items.length}</p></div>
        <div className="card"><div className="card-header"><span className="card-title">Stock Bajo</span></div><p className={`text-2xl font-bold ${lowStockCount > 0 ? 'text-danger' : ''}`}>{lowStockCount}</p></div>
        <div className="card"><div className="card-header"><span className="card-title">Bodegas</span></div><p className="text-2xl font-bold">{warehouses.length}</p></div>
        <div className="card"><div className="card-header"><span className="card-title">Productos</span></div><p className="text-2xl font-bold">{items.length}</p></div>
      </div>

      <div className="card">
        <div className="card-header">
          <span className="card-title">Inventario</span>
          <div className="search-bar" style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <input type="text" placeholder="Buscar producto o bodega..." value={search} onChange={e => setSearch(e.target.value)} className="form-input" style={{ width: 200 }} />
            <select value={warehouseFilter} onChange={e => setWarehouseFilter(e.target.value)} className="form-input" style={{ width: 150 }}>
              <option value="">Todas las bodegas</option>
              {warehouses.map(w => <option key={w} value={w}>{w}</option>)}
            </select>
            <label className="checkbox-label" style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', cursor: 'pointer' }}>
              <input type="checkbox" checked={showLowStock} onChange={e => setShowLowStock(e.target.checked)} />
              Solo stock bajo
            </label>
          </div>
        </div>
        <div className="overflow-auto">
          <table className="table-enhanced">
            <thead>
              <tr>
                <th onClick={() => handleSort('productId')} style={{ cursor: 'pointer' }}>Producto {renderSortIcon('productId')}</th>
                <th onClick={() => handleSort('warehouse')} style={{ cursor: 'pointer' }}>Bodega {renderSortIcon('warehouse')}</th>
                <th onClick={() => handleSort('quantity')} style={{ cursor: 'pointer', textAlign: 'right' }}>Cantidad {renderSortIcon('quantity')}</th>
                <th onClick={() => handleSort('minStock')} style={{ cursor: 'pointer', textAlign: 'right' }}>Stock Mín. {renderSortIcon('minStock')}</th>
                <th style={{ textAlign: 'center' }}>Estado</th>
                <th>Actualizado</th>
                <th style={{ textAlign: 'center' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={7} className="empty-state-sm">Sin resultados</td></tr>
              ) : filtered.map(item => {
                const prod = productMap.get(item.productId);
                const isLow = item.quantity < item.minStock;
                return (
                  <tr key={item.id} className="row-enter">
                    <td><span className="font-medium">{prod?.name ?? item.productId.slice(0, 8)}</span><br /><span className="text-xs text-secondary">{prod?.sku ?? ''}</span></td>
                    <td>{item.warehouse}</td>
                    <td style={{ textAlign: 'right' }}><span className={isLow ? 'text-danger font-bold' : ''}>{item.quantity}</span></td>
                    <td style={{ textAlign: 'right' }}>{item.minStock}</td>
                    <td style={{ textAlign: 'center' }}>{isLow ? <span className="badge badge-delayed">Bajo</span> : <span className="badge badge-delivered">OK</span>}</td>
                    <td className="text-xs text-secondary">{new Date(item.lastUpdated).toLocaleString(LOCALE)}</td>
                    <td style={{ textAlign: 'center' }}>
                      <div className="btn-group" style={{ display: 'flex', gap: '0.25rem', justifyContent: 'center' }}>
                        <button className="btn btn-sm btn-outline" onClick={() => handleQuantityChange(item.id, 1, 'INBOUND', 'manual', 'Ajuste manual')} title="Incrementar">+1</button>
                        <button className="btn btn-sm btn-outline" disabled={item.quantity <= 0} onClick={() => handleQuantityChange(item.id, -1, 'OUTBOUND', 'manual', 'Ajuste manual')} title="Decrementar">-1</button>
                        <button className="btn btn-sm btn-outline" onClick={() => viewMovements(item)} title="Ver movimientos">📋</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {showCreate && (
        <CreateInventoryForm products={products} onSubmit={handleCreate} onClose={() => setShowCreate(false)} />
      )}

      {showMovements && selectedItem && (
        <MovementsModal item={selectedItem} productMap={productMap} movements={movements} onClose={() => { setShowMovements(false); setSelectedItem(null); setMovements([]); }} />
      )}
    </div>
  );
}

function CreateInventoryForm({ products, onSubmit, onClose }: {
  products: Product[];
  onSubmit: (data: { productId: string; quantity: number; minStock: number; warehouse: string }) => Promise<void>;
  onClose: () => void;
}) {
  const [productId, setProductId] = useState('');
  const [quantity, setQuantity] = useState(0);
  const [minStock, setMinStock] = useState(10);
  const [warehouse, setWarehouse] = useState('Bogotá');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productId) return;
    setSaving(true);
    try { await onSubmit({ productId, quantity, minStock, warehouse }); } finally { setSaving(false); }
  };

  return (
    <div className="dialog-overlay" onClick={onClose}>
      <div className="dialog" onClick={e => e.stopPropagation()}>
        <div className="card-header"><span className="card-title">Nuevo Item de Inventario</span></div>
        <form onSubmit={handleSubmit} style={{ padding: '1rem' }}>
          <div className="form-group">
            <label htmlFor="inv-product">Producto</label>
            <select id="inv-product" value={productId} onChange={e => setProductId(e.target.value)} required className="form-input">
              <option value="">Seleccionar producto</option>
              {products.map(p => <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>)}
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="inv-qty">Cantidad inicial</label>
            <input id="inv-qty" type="number" min={0} value={quantity} onChange={e => setQuantity(Number(e.target.value))} required className="form-input" />
          </div>
          <div className="form-group">
            <label htmlFor="inv-min">Stock mínimo</label>
            <input id="inv-min" type="number" min={0} value={minStock} onChange={e => setMinStock(Number(e.target.value))} required className="form-input" />
          </div>
          <div className="form-group">
            <label htmlFor="inv-wh">Bodega</label>
            <select id="inv-wh" value={warehouse} onChange={e => setWarehouse(e.target.value)} className="form-input">
              <option value="Bogotá">Bogotá</option>
              <option value="Medellín">Medellín</option>
              <option value="Cali">Cali</option>
              <option value="Barranquilla">Barranquilla</option>
            </select>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
            <button type="button" className="btn btn-outline" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn btn-primary" disabled={saving || !productId}>{saving ? 'Creando...' : 'Crear'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function MovementsModal({ item, productMap, movements, onClose }: {
  item: InventoryItem;
  productMap: Map<string, Product>;
  movements: StockMovement[];
  onClose: () => void;
}) {
  const prod = productMap.get(item.productId);
  return (
    <div className="dialog-overlay" onClick={onClose}>
      <div className="dialog" onClick={e => e.stopPropagation()} style={{ maxWidth: 600 }}>
        <div className="card-header">
          <span className="card-title">Movimientos: {prod?.name ?? item.productId.slice(0, 8)}</span>
          <button className="btn btn-sm btn-outline" onClick={onClose}>✕</button>
        </div>
        <div style={{ padding: '1rem' }}>
          <p className="text-sm text-secondary">Stock actual: <strong>{item.quantity}</strong> | Mínimo: {item.minStock} | Bodega: {item.warehouse}</p>
          {movements.length === 0 ? (
            <p className="empty-state-sm">Sin movimientos registrados</p>
          ) : (
            <div style={{ marginTop: '0.75rem' }}>
              {movements.map(m => (
                <div key={m.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid var(--border)' }}>
                  <div>
                    <span className={`badge ${m.type === 'INBOUND' ? 'badge-delivered' : m.type === 'OUTBOUND' ? 'badge-delayed' : 'badge-pending'}`}>{m.type}</span>
                    <span className="text-sm" style={{ marginLeft: '0.5rem' }}>{m.quantity} unidades</span>
                    {m.notes && <p className="text-xs text-secondary">{m.notes}</p>}
                  </div>
                  <span className="text-xs text-secondary">{new Date(m.timestamp).toLocaleString(LOCALE)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default InventoryPage;
