import api from './client';
import type { QualityCheckpoint } from '../types';

export const qualityService = {
  async listAll(): Promise<QualityCheckpoint[]> {
    return api.get<QualityCheckpoint[]>('/quality');
  },
  async byShipment(shipmentId: string): Promise<QualityCheckpoint[]> {
    return api.get<QualityCheckpoint[]>(`/quality/shipment/${shipmentId}`);
  },
  async failed(): Promise<QualityCheckpoint[]> {
    return api.get<QualityCheckpoint[]>('/quality/failed');
  },
  async create(data: {
    shipmentId: string;
    location: string;
    temperatureC: number | null;
    humidityPct: number | null;
    passed: boolean;
    notes: string;
    inspector: string;
  }): Promise<QualityCheckpoint> {
    return api.post<QualityCheckpoint>('/quality', data);
  },
};

export default qualityService;
