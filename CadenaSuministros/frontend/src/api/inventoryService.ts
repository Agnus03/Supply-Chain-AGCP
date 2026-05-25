import api from './client';
import type { InventoryItem, StockMovement } from '../types';

export const inventoryService = {
  async listAll(): Promise<InventoryItem[]> {
    return api.get<InventoryItem[]>('/inventory');
  },
  async getByProduct(productId: string): Promise<InventoryItem> {
    return api.get<InventoryItem>(`/inventory/${productId}`);
  },
  async lowStock(): Promise<InventoryItem[]> {
    return api.get<InventoryItem[]>('/inventory/low-stock');
  },
  async byWarehouse(warehouse: string): Promise<InventoryItem[]> {
    return api.get<InventoryItem[]>(`/inventory/warehouse/${warehouse}`);
  },
  async create(data: { productId: string; quantity: number; minStock: number; warehouse: string }): Promise<InventoryItem> {
    return api.post<InventoryItem>('/inventory', data);
  },
  async adjustQuantity(id: string, delta: number, type?: string, reference?: string, notes?: string): Promise<InventoryItem> {
    return api.patch<InventoryItem>(`/inventory/${id}/quantity`, { delta, type, reference, notes });
  },
  async updateMinStock(productId: string, minStock: number): Promise<InventoryItem> {
    return api.patch<InventoryItem>(`/inventory/${productId}/min-stock`, { minStock });
  },
  async movements(productId: string): Promise<StockMovement[]> {
    return api.get<StockMovement[]>(`/inventory/${productId}/movements`);
  },
};

export default inventoryService;
