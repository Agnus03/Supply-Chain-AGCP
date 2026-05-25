import api from './client';
import type { ShippingCost } from '../types';

export const shippingCostService = {
  async listAll(): Promise<ShippingCost[]> {
    return api.get<ShippingCost[]>('/costs');
  },
  async getByShipment(shipmentId: string): Promise<ShippingCost> {
    return api.get<ShippingCost>(`/costs/${shipmentId}`);
  },
  async calculate(shipmentId: string, origin: string, destination: string, alertCount = 0, productName = ''): Promise<ShippingCost> {
    return api.post<ShippingCost>(`/costs/calculate/${shipmentId}`, { origin, destination, alertCount, productName });
  },
  async compare(shipmentId: string, origin: string, destination: string, alertCount = 0): Promise<ShippingCost[]> {
    return api.post<ShippingCost[]>(`/costs/compare/${shipmentId}`, { origin, destination, alertCount, productName: '' });
  },
};

export default shippingCostService;
