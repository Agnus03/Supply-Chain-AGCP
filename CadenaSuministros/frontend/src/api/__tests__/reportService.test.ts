import { describe, it, expect, vi, beforeEach } from 'vitest'
import { reportService } from '../reportService'

const mockReport = {
  reportId: 'rep1',
  shipmentId: 's1',
  productId: 'p1',
  origin: 'WAREHOUSE',
  destination: 'MEDELLIN',
  dispatchTime: '2026-05-08T08:00:00Z',
  deliveryTime: '2026-05-10T16:00:00Z',
  averageTemperature: 24.3,
  averageHumidity: 58.7,
  temperatureAlert: false,
  humidityAlert: true,
  deliveryStatus: 'DELIVERED',
  observations: 'Humedad elevada durante el trayecto',
}

beforeEach(() => {
  vi.restoreAllMocks()
})

describe('reportService', () => {
  it('generateDeliveryReport() hace POST /api/reports/delivery/:id', async () => {
    fetchMock(mockReport)
    const result = await reportService.generateDeliveryReport('s1')
    expect(fetch).toHaveBeenCalledWith(
      '/api/reports/delivery/s1',
      expect.objectContaining({ method: 'POST' })
    )
    expect(result).toEqual(mockReport)
  })

  it('generateDeliveryReport() retorna datos completos del reporte', async () => {
    fetchMock(mockReport)
    const report = await reportService.generateDeliveryReport('s1')
    expect(report.averageTemperature).toBe(24.3)
    expect(report.averageHumidity).toBe(58.7)
    expect(report.temperatureAlert).toBe(false)
    expect(report.humidityAlert).toBe(true)
    expect(report.deliveryStatus).toBe('DELIVERED')
  })

  it('generateDeliveryReport() lanza error si el shipment no existe', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
      text: () => Promise.resolve('Envío no encontrado'),
    })
    await expect(reportService.generateDeliveryReport('inexistente')).rejects.toThrow('Envío no encontrado')
  })
})

function fetchMock(response: unknown) {
  globalThis.fetch = vi.fn().mockResolvedValue({
    ok: true,
    json: () => Promise.resolve(response),
  })
}
