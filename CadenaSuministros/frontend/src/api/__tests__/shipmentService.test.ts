import { describe, it, expect, vi, beforeEach } from 'vitest'
import { shipmentService } from '../shipmentService'

const mockShipment = {
  id: 's1',
  productId: 'p1',
  status: 'PENDING',
  currentLocation: 'WAREHOUSE',
  updatedAt: '2026-05-10T12:00:00Z',
}

beforeEach(() => {
  vi.restoreAllMocks()
})

describe('shipmentService', () => {
  it('listAll() hace GET /api/shipments', async () => {
    fetchMock([mockShipment])
    const result = await shipmentService.listAll()
    expect(fetch).toHaveBeenCalledWith('/api/shipments', expect.objectContaining({ method: 'GET' }))
    expect(result).toEqual([mockShipment])
  })

  it('create() hace POST /api/shipments con los datos del envío', async () => {
    fetchMock(mockShipment)
    const data = { productId: 'p1', status: 'IN_TRANSIT', currentLocation: 'BOGOTA' }
    const result = await shipmentService.create(data)
    expect(fetch).toHaveBeenCalledWith(
      '/api/shipments',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify(data),
      })
    )
    expect(result).toEqual(mockShipment)
  })

  it('create() lanza error si falla la creación del envío', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      text: () => Promise.resolve('Producto no encontrado'),
    })
    await expect(
      shipmentService.create({ productId: 'invalido', status: 'PENDING', currentLocation: 'WAREHOUSE' })
    ).rejects.toThrow('Producto no encontrado')
  })
})

function fetchMock(response: unknown) {
  globalThis.fetch = vi.fn().mockResolvedValue({
    ok: true,
    json: () => Promise.resolve(response),
  })
}
