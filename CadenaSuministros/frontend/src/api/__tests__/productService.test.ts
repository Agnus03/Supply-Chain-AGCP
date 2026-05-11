import { describe, it, expect, vi, beforeEach } from 'vitest'
import productService from '../productService'

const mockProduct = { id: 'p1', sku: 'LAP-001', name: 'Laptop Gamer' }

beforeEach(() => {
  vi.restoreAllMocks()
})

describe('productService', () => {
  it('listAll() hace GET /api/products', async () => {
    fetchMock(mockProduct)
    const result = await productService.listAll()
    expect(fetch).toHaveBeenCalledWith('/api/products', expect.objectContaining({ method: 'GET' }))
    expect(result).toEqual(mockProduct)
  })

  it('getById() hace GET /api/products/:id', async () => {
    fetchMock(mockProduct)
    const result = await productService.getById('p1')
    expect(fetch).toHaveBeenCalledWith('/api/products/p1', expect.objectContaining({ method: 'GET' }))
    expect(result).toEqual(mockProduct)
  })

  it('create() hace POST /api/products con sku y name', async () => {
    fetchMock(mockProduct)
    const result = await productService.create('LAP-001', 'Laptop Gamer')
    expect(fetch).toHaveBeenCalledWith(
      '/api/products',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ sku: 'LAP-001', name: 'Laptop Gamer' }),
      })
    )
    expect(result).toEqual(mockProduct)
  })

  it('create() lanza error si el servidor responde con error', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      text: () => Promise.resolve('SKU duplicado'),
    })
    await expect(productService.create('DUP', 'Duplicado')).rejects.toThrow('SKU duplicado')
  })
})

function fetchMock(response: unknown) {
  globalThis.fetch = vi.fn().mockResolvedValue({
    ok: true,
    json: () => Promise.resolve(response),
  })
}
