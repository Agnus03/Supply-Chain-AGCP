import api from '../api/client';
import type { Shipment, ShipmentInfo, ShipmentEvent } from '../types';

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

  async getHistory(shipmentId: string): Promise<ShipmentEvent[]> {
    return api.get<ShipmentEvent[]>(`/shipments/${shipmentId}/history`);
  },

  async updateStatus(shipmentId: string, status: string): Promise<Shipment> {
    return api.patch<Shipment>(`/shipments/${shipmentId}/status`, { status });
  },

  async updateLocation(shipmentId: string, currentLocation: string): Promise<Shipment> {
    return api.patch<Shipment>(`/shipments/${shipmentId}/location`, { currentLocation });
  },
};

export default shipmentService;
