import api from '../api/client';
import type { SensorReading, SensorReadingRequest } from '../types';

export const sensorService = {
  async listAll(): Promise<SensorReading[]> {
    return api.get<SensorReading[]>('/sensors');
  },

  async create(request: SensorReadingRequest): Promise<SensorReading> {
    return api.post<SensorReading>('/sensors/readings', request);
  },

  async listActiveAlerts(): Promise<SensorReading[]> {
    return api.get<SensorReading[]>('/sensors/alerts/active');
  },

  async listRecentAlerts(limit = 50): Promise<SensorReading[]> {
    return api.get<SensorReading[]>(`/sensors/alerts/recent?limit=${limit}`);
  },

  async acknowledgeAlert(id: string): Promise<SensorReading> {
    return api.post<SensorReading>(`/sensors/alerts/${id}/acknowledge`);
  },
};

export default sensorService;
