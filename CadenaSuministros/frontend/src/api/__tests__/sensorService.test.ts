import { describe, it, expect, vi, beforeEach } from 'vitest'
import { sensorService } from '../sensorService'

const mockReading = {
  id: 'r1',
  shipmentId: 's1',
  timestamp: '2026-05-10T14:30:00Z',
  temperatureC: 25.5,
  humidityPct: 60.0,
  latitude: 4.7110,
  longitude: -74.0721,
}

beforeEach(() => {
  vi.restoreAllMocks()
})

describe('sensorService', () => {
  it('listAll() hace GET /api/sensors', async () => {
    fetchMock([mockReading])
    const result = await sensorService.listAll()
    expect(fetch).toHaveBeenCalledWith('/api/sensors', expect.objectContaining({ method: 'GET' }))
    expect(result).toEqual([mockReading])
  })

  it('create() hace POST /api/sensors/readings con datos ambientales', async () => {
    fetchMock(mockReading)
    const request = {
      shipmentId: 's1',
      temperatureC: 28.5,
      humidityPct: 65.0,
      latitude: 4.7110,
      longitude: -74.0721,
    }
    const result = await sensorService.create(request)
    expect(fetch).toHaveBeenCalledWith(
      '/api/sensors/readings',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify(request),
      })
    )
    expect(result).toEqual(mockReading)
  })

  it('create() lanza error si el sensor reading falla', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      text: () => Promise.resolve('Error interno del servidor'),
    })
    await expect(
      sensorService.create({
        shipmentId: 's1',
        temperatureC: null,
        humidityPct: null,
        latitude: null,
        longitude: null,
      })
    ).rejects.toThrow('Error interno del servidor')
  })
})

function fetchMock(response: unknown) {
  globalThis.fetch = vi.fn().mockResolvedValue({
    ok: true,
    json: () => Promise.resolve(response),
  })
}
