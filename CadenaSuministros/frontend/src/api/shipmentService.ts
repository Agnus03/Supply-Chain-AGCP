import api from '../api/client';
import type { Shipment, ShipmentInfo } from '../types';

export const shipmentService = {
  async getById(id: string): Promise<Shipment> {
    return api.get<Shipment>(`/shipments/${id}`);
  },

  async listAll(): Promise<Shipment[]> {
    return api.get<Shipment[]>('/shipments');
  },

  async listAllInfo(): Promise<ShipmentInfo[]> {
    return api.get<ShipmentInfo[]>('/shipments/info');
  },

  async create(data: { productId: string; status: string; currentLocation: string }): Promise<Shipment> {
    return api.post<Shipment>('/shipments', data);
  },
};

export default shipmentService;
