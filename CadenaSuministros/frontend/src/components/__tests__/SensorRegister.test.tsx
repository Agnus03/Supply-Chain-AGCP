import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SensorRegister } from '../SensorRegister'

const mockShipments = [
  { id: 's1', productId: 'p1', status: 'IN_TRANSIT', currentLocation: 'BOGOTA', updatedAt: '2026-05-10T12:00:00Z' },
  { id: 's2', productId: 'p2', status: 'PENDING', currentLocation: 'WAREHOUSE', updatedAt: '2026-05-10T10:00:00Z' },
]

const onSuccess = vi.fn()

beforeEach(() => {
  vi.restoreAllMocks()
})

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

describe('SensorRegister - Registro de lectura IoT', () => {
  it('carga los envíos disponibles', async () => {
    setupFetch(mockShipments)
    render(<SensorRegister onSuccess={onSuccess} />)
    await waitFor(() => {
      expect(screen.getByText(/s1/)).toBeInTheDocument()
    })
  })

  it('registra lectura de temperatura y humedad correctamente', async () => {
    const user = userEvent.setup()
    const mockReading = {
      id: 'r1', shipmentId: 's1', timestamp: new Date().toISOString(),
      temperatureC: 28.5, humidityPct: 65.0, latitude: 4.7110, longitude: -74.0721,
    }
    setupFetch(mockShipments, mockReading)

    render(<SensorRegister onSuccess={onSuccess} />)

    await waitFor(() => screen.getByText(/s1/))

    await user.selectOptions(screen.getByLabelText('Seleccionar Envío'), 's1')
    await user.type(screen.getByLabelText('Temperatura (°C)'), '28.5')
    await user.type(screen.getByLabelText('Humedad (%)'), '65')
    await user.type(screen.getByLabelText('Latitud'), '4.7110')
    await user.type(screen.getByLabelText('Longitud'), '-74.0721')

    await user.click(screen.getByRole('button', { name: 'Registrar Lectura' }))

    expect(fetch).toHaveBeenCalledWith(
      '/api/sensors/readings',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          shipmentId: 's1',
          temperatureC: 28.5,
          humidityPct: 65,
          latitude: 4.711,
          longitude: -74.0721,
        }),
      })
    )
    expect(onSuccess).toHaveBeenCalledOnce()
  })

  it('registra lectura con solo coordenadas GPS (sin sensores ambientales)', async () => {
    const user = userEvent.setup()
    const mockReading = {
      id: 'r2', shipmentId: 's2', timestamp: new Date().toISOString(),
      temperatureC: null, humidityPct: null, latitude: 6.2442, longitude: -75.5812,
    }
    setupFetch(mockShipments, mockReading)

    render(<SensorRegister onSuccess={onSuccess} />)

    await waitFor(() => screen.getByText(/s1/))

    await user.selectOptions(screen.getByLabelText('Seleccionar Envío'), 's2')
    await user.type(screen.getByLabelText('Latitud'), '6.2442')
    await user.type(screen.getByLabelText('Longitud'), '-75.5812')
    await user.click(screen.getByRole('button', { name: 'Registrar Lectura' }))

    expect(fetch).toHaveBeenCalledWith(
      '/api/sensors/readings',
      expect.objectContaining({
        method: 'POST',
        body: expect.stringContaining('"latitude":6.2442'),
      })
    )
    expect(onSuccess).toHaveBeenCalledOnce()
  })

  it('muestra advertencia si no hay envíos disponibles', async () => {
    setupFetch([])
    render(<SensorRegister onSuccess={onSuccess} />)
    expect(await screen.findByText('No hay envíos disponibles. Crea un envío primero.')).toBeInTheDocument()
  })

  it('deshabilita el botón cuando no hay envíos', async () => {
    setupFetch([])
    render(<SensorRegister onSuccess={onSuccess} />)
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Registrar Lectura' })).toBeDisabled()
    })
  })

  it('muestra error si falla el registro', async () => {
    const user = userEvent.setup()
    globalThis.fetch = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockShipments) })
      .mockResolvedValueOnce({ ok: false, status: 500, statusText: 'Server Error', text: () => Promise.resolve('Sensor fuera de línea') })

    render(<SensorRegister onSuccess={onSuccess} />)
    await waitFor(() => screen.getByText(/s1/))

    await user.selectOptions(screen.getByLabelText('Seleccionar Envío'), 's1')
    await user.type(screen.getByLabelText('Temperatura (°C)'), '30')
    await user.click(screen.getByRole('button', { name: 'Registrar Lectura' }))

    expect(await screen.findByText(/Sensor fuera de línea/)).toBeInTheDocument()
  })
})
