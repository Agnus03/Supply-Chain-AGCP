import api from './client';
import type { Dashboard, ProductDashboard, SensorReadingResult, TrendPoint } from '../types';

export interface GlobalDashboard {
  totalShipments: number;
  pendingShipments: number;
  transitShipments: number;
  deliveredShipments: number;
  delayedShipments: number;
  totalReadings: number;
  activeAlerts: number;
  averageTemperature: number;
  averageHumidity: number;
  recentReadings: SensorReadingResult[];
}

export const dashboardService = {
  async getGlobal(): Promise<GlobalDashboard> {
    return api.get<GlobalDashboard>('/dashboard');
  },

  async getTrends(hours = 24): Promise<TrendPoint[]> {
    return api.get<TrendPoint[]>(`/dashboard/trends?hours=${hours}`);
  },

  async getShipmentDashboard(shipmentId: string): Promise<Dashboard> {
    return api.get<Dashboard>(`/dashboard/${shipmentId}`);
  },

  async getProductDashboard(productId: string): Promise<ProductDashboard> {
    return api.get<ProductDashboard>(`/dashboard/product/${productId}`);
  },
};

export default dashboardService;
