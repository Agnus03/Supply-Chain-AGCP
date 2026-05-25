import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ProductCreate from '../ProductCreate'

const onSuccess = vi.fn()

beforeEach(() => {
  vi.restoreAllMocks()
})

function renderComponent() {
  return render(<ProductCreate onSuccess={onSuccess} />)
}

describe('ProductCreate - Creación de producto en cadena de suministro', () => {
  it('renderiza el formulario de creación', () => {
    renderComponent()
    expect(screen.getByText('Nuevo Producto')).toBeInTheDocument()
    expect(screen.getByLabelText('SKU')).toBeInTheDocument()
    expect(screen.getByLabelText('Nombre')).toBeInTheDocument()
  })

  it('permite escribir SKU y nombre del producto', async () => {
    const user = userEvent.setup()
    renderComponent()

    await user.type(screen.getByLabelText('SKU'), 'SENSOR-T-001')
    await user.type(screen.getByLabelText('Nombre'), 'Sensor Térmico Industrial')

    expect(screen.getByLabelText<HTMLInputElement>('SKU').value).toBe('SENSOR-T-001')
    expect(screen.getByLabelText<HTMLInputElement>('Nombre').value).toBe('Sensor Térmico Industrial')
  })

  it('envía POST /api/products al crear un producto', async () => {
    const user = userEvent.setup()
    fetchMock({ id: 'p1', sku: 'FRESA-001', name: 'Fresa Orgánica' })
    renderComponent()

    await user.type(screen.getByLabelText('SKU'), 'FRESA-001')
    await user.type(screen.getByLabelText('Nombre'), 'Fresa Orgánica')
    await user.click(screen.getByRole('button', { name: 'Crear Producto' }))

    expect(fetch).toHaveBeenCalledWith(
      '/api/products',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ sku: 'FRESA-001', name: 'Fresa Orgánica' }),
      })
    )
  })

  it('llama onSuccess después de crear exitosamente', async () => {
    const user = userEvent.setup()
    fetchMock({ id: 'p2', sku: 'LECHE-001', name: 'Leche Entera' })
    renderComponent()

    await user.type(screen.getByLabelText('SKU'), 'LECHE-001')
    await user.type(screen.getByLabelText('Nombre'), 'Leche Entera')
    await user.click(screen.getByRole('button', { name: 'Crear Producto' }))

    expect(onSuccess).toHaveBeenCalledOnce()
  })

  it('resetea el formulario después de crear', async () => {
    const user = userEvent.setup()
    fetchMock({ id: 'p3', sku: 'MANZ-001', name: 'Manzana Roja' })
    renderComponent()

    await user.type(screen.getByLabelText('SKU'), 'MANZ-001')
    await user.type(screen.getByLabelText('Nombre'), 'Manzana Roja')
    await user.click(screen.getByRole('button', { name: 'Crear Producto' }))

    expect(screen.getByLabelText<HTMLInputElement>('SKU').value).toBe('')
    expect(screen.getByLabelText<HTMLInputElement>('Nombre').value).toBe('')
  })

  it('muestra error si el servidor rechaza la creación', async () => {
    const user = userEvent.setup()
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 409,
      statusText: 'Conflict',
      text: () => Promise.resolve('SKU duplicado'),
    })
    renderComponent()

    await user.type(screen.getByLabelText('SKU'), 'DUP-001')
    await user.type(screen.getByLabelText('Nombre'), 'Duplicado')
    await user.click(screen.getByRole('button', { name: 'Crear Producto' }))

    expect(await screen.findByText(/SKU duplicado/)).toBeInTheDocument()
  })

  it('deshabilita el botón mientras se crea', async () => {
    const user = userEvent.setup()
    globalThis.fetch = vi.fn().mockReturnValue(new Promise(() => {}))
    renderComponent()

    await user.type(screen.getByLabelText('SKU'), 'TEST-001')
    await user.type(screen.getByLabelText('Nombre'), 'Test')
    await user.click(screen.getByRole('button', { name: 'Crear Producto' }))

    expect(screen.getByRole('button', { name: 'Creando...' })).toBeDisabled()
  })
})

function fetchMock(response: unknown) {
  globalThis.fetch = vi.fn().mockResolvedValue({
    ok: true,
    json: () => Promise.resolve(response),
  })
}
