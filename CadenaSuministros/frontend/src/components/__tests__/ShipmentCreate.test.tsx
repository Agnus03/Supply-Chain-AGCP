import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ShipmentCreate from '../ShipmentCreate'

const mockProducts = [
  { id: 'p1', sku: 'FRESA-001', name: 'Fresa Orgánica' },
  { id: 'p2', sku: 'LECHE-001', name: 'Leche Entera' },
]

const mockShipment = (id: string, productId: string, status: string, location: string) => ({
  id, productId, status, currentLocation: location, updatedAt: new Date().toISOString(),
})

const onSuccess = vi.fn()

beforeEach(() => {
  vi.restoreAllMocks()
})

function renderComponent() {
  setupFetch(mockProducts)
  return render(<ShipmentCreate onSuccess={onSuccess} />)
}

function setupFetch(...responses: unknown[]) {
  const mock = vi.fn()
  responses.forEach(r => {
    mock.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(r),
    })
  })
  globalThis.fetch = mock
}

describe('ShipmentCreate - Creación de envío en cadena de suministro', () => {
  it('carga la lista de productos al montarse', async () => {
    renderComponent()
    await waitFor(() => {
      expect(screen.getByText('FRESA-001 - Fresa Orgánica')).toBeInTheDocument()
    })
  })

  it('renderiza el formulario con campos de envío', async () => {
    renderComponent()
    expect(screen.getByText('Crear Nuevo Envío')).toBeInTheDocument()
    expect(screen.getByLabelText('Producto')).toBeInTheDocument()
    expect(screen.getByLabelText('Estado Inicial')).toBeInTheDocument()
    expect(screen.getByLabelText('Ubicación')).toBeInTheDocument()
  })

  it('envía POST /api/shipments al crear un envío', async () => {
    const user = userEvent.setup()
    const shipment = mockShipment('s1', 'p1', 'IN_TRANSIT', 'BOGOTA')
    setupFetch(mockProducts, shipment)
    render(<ShipmentCreate onSuccess={onSuccess} />)

    await waitFor(() => screen.getByText('FRESA-001 - Fresa Orgánica'))

    await user.selectOptions(screen.getByLabelText('Producto'), 'p1')
    await user.selectOptions(screen.getByLabelText('Estado Inicial'), 'IN_TRANSIT')
    await user.selectOptions(screen.getByLabelText('Ubicación'), 'BOGOTA')
    await user.click(screen.getByRole('button', { name: 'Crear Envío' }))

    expect(fetch).toHaveBeenCalledWith(
      '/api/shipments',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ productId: 'p1', status: 'IN_TRANSIT', currentLocation: 'BOGOTA' }),
      })
    )
  })

  it('llama onSuccess después de crear el envío', async () => {
    const user = userEvent.setup()
    const shipment = mockShipment('s2', 'p2', 'PENDING', 'MEDELLIN')
    setupFetch(mockProducts, shipment)
    render(<ShipmentCreate onSuccess={onSuccess} />)

    await waitFor(() => screen.getByText('FRESA-001 - Fresa Orgánica'))

    await user.selectOptions(screen.getByLabelText('Producto'), 'p2')
    await user.selectOptions(screen.getByLabelText('Ubicación'), 'MEDELLIN')
    await user.click(screen.getByRole('button', { name: 'Crear Envío' }))

    expect(onSuccess).toHaveBeenCalledOnce()
  })

  it('muestra error si falla la creación del envío', async () => {
    const user = userEvent.setup()
    globalThis.fetch = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockProducts) })
      .mockResolvedValueOnce({ ok: false, status: 400, statusText: 'Bad Request', text: () => Promise.resolve('Producto inválido') })
    render(<ShipmentCreate onSuccess={onSuccess} />)

    await waitFor(() => screen.getByText('FRESA-001 - Fresa Orgánica'))

    await user.selectOptions(screen.getByLabelText('Producto'), 'p1')
    await user.click(screen.getByRole('button', { name: 'Crear Envío' }))

    expect(await screen.findByText(/Producto inválido/)).toBeInTheDocument()
  })
})
