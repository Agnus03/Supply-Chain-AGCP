export interface Shipment {
  id: string;
  productId: string;
  status: ShipmentStatus;
  currentLocation: string;
  updatedAt: string;
}

export type ShipmentStatus = 'PENDING' | 'IN_TRANSIT' | 'DELIVERED' | 'DELAYED';

export interface Product {
  id: string;
  sku: string;
  name: string;
}

export interface SensorReading {
  id: string;
  shipmentId: string;
  timestamp: string;
  temperatureC: number | null;
  humidityPct: number | null;
  latitude: number | null;
  longitude: number | null;
  acknowledged: boolean;
}

export interface SensorReadingRequest {
  shipmentId: string;
  temperatureC: number | null;
  humidityPct: number | null;
  latitude: number | null;
  longitude: number | null;
}

export interface DeliveryReport {
  reportId: string;
  shipmentId: string;
  productId: string;
  origin: string;
  destination: string;
  dispatchTime: string | null;
  deliveryTime: string | null;
  averageTemperature: number | null;
  averageHumidity: number | null;
  temperatureAlert: boolean | null;
  humidityAlert: boolean | null;
  deliveryStatus: string;
  observations: string | null;
}

export interface ShipmentInfo {
  id: string;
  productId: string;
  productName: string;
  status: string;
  currentLocation: string;
  quantity: number;
  createdAt: string;
  updatedAt: string;
}

export interface ShipmentStatusData {
  shipmentId: string;
  status: string;
  currentLocation: string;
  lastUpdate: string;
  estimatedDelivery: string;
}

export interface SensorReadingResult {
  id: string;
  shipmentId: string;
  timestamp: string;
  temperatureC: number | null;
  humidityPct: number | null;
  latitude: number | null;
  longitude: number | null;
  alert: boolean;
}

export interface Dashboard {
  shipmentId: string;
  shipmentStatus: string;
  currentLocation: string;
  summary: DashboardSummary;
  sensorStats: SensorStats;
  recentReadings: SensorReadingResult[];
  activeAlerts: AlertInfo[];
}

export interface DashboardSummary {
  productName: string;
  quantity: number;
  status: string;
  createdAt: string;
  lastUpdate: string;
}

export interface SensorStats {
  totalReadings: number;
  avgTemperature: number;
  avgHumidity: number;
  lastLatitude: number | null;
  lastLongitude: number | null;
  isWithinRange: boolean;
}

export interface AlertInfo {
  type: string;
  message: string;
  timestamp: string;
  acknowledged: boolean;
}

export interface DeliveryReportInfo {
  id: string;
  shipmentId: string;
  generatedAt: string;
  status: string;
  environmentalStats: EnvironmentalStats;
  observations: string[];
  alerts: string[];
}

export interface EnvironmentalStats {
  avgTemperature: number;
  minTemperature: number;
  maxTemperature: number;
  avgHumidity: number;
  minHumidity: number;
  maxHumidity: number;
  totalReadings: number;
}

export interface ShipmentEvent {
  id: string;
  shipmentId: string;
  fromStatus: string | null;
  toStatus: string;
  fromLocation: string | null;
  toLocation: string;
  timestamp: string;
}

export interface TrendPoint {
  timestamp: string;
  avgTemperature: number;
  avgHumidity: number;
}

export interface DashboardAlert {
  id: string;
  shipmentId: string;
  type: string;
  message: string;
  timestamp: string;
  acknowledged: boolean;
  temperatureC: number | null;
  humidityPct: number | null;
}