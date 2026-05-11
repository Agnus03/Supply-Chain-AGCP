import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ReportsPage } from '../ReportsPage'

const mockShipments = [
  { id: 's1', productId: 'p1', status: 'DELIVERED', currentLocation: 'MEDELLIN', updatedAt: '2026-05-10T16:00:00Z' },
  { id: 's2', productId: 'p2', status: 'IN_TRANSIT', currentLocation: 'BOGOTA', updatedAt: '2026-05-10T12:00:00Z' },
]

const mockReport = {
  reportId: 'rep1',
  shipmentId: 's1',
  productId: 'p1',
  origin: 'WAREHOUSE',
  destination: 'MEDELLIN',
  dispatchTime: '2026-05-08T08:00:00Z',
  deliveryTime: '2026-05-10T16:00:00Z',
  averageTemperature: 26.8,
  averageHumidity: 62.3,
  temperatureAlert: false,
  humidityAlert: false,
  deliveryStatus: 'DELIVERED',
  observations: 'Entrega exitosa. Temperatura controlada durante todo el trayecto.',
}

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

describe('ReportsPage - Generación de reportes de entrega', () => {
  it('carga la lista de envíos al montarse', async () => {
    setupFetch(mockShipments)
    render(<ReportsPage />)
    await waitFor(() => {
      expect(screen.getByText(/s1/)).toBeInTheDocument()
      expect(screen.getByText(/s2/)).toBeInTheDocument()
    })
  })

  it('genera un reporte de entrega', async () => {
    const user = userEvent.setup()
    setupFetch(mockShipments, mockReport)
    render(<ReportsPage />)

    await waitFor(() => screen.getByText(/s1/))

    await user.selectOptions(screen.getByLabelText('Seleccionar Envío'), 's1')
    await user.click(screen.getByRole('button', { name: 'Generar Reporte' }))

    await waitFor(() => {
      expect(screen.getByText('26.8°C')).toBeInTheDocument()
      expect(screen.getByText('62.3%')).toBeInTheDocument()
    })
  })

  it('muestra alertas ambientales si están presentes', async () => {
    const user = userEvent.setup()
    setupFetch(mockShipments, { ...mockReport, temperatureAlert: true, humidityAlert: true })
    render(<ReportsPage />)

    await waitFor(() => screen.getByText(/s1/))

    await user.selectOptions(screen.getByLabelText('Seleccionar Envío'), 's1')
    await user.click(screen.getByRole('button', { name: 'Generar Reporte' }))

    await waitFor(() => {
      expect(screen.getByText(/Alerta Temperatura/)).toBeInTheDocument()
      expect(screen.getByText(/Alerta Humedad/)).toBeInTheDocument()
    })
  })

  it('muestra "Temperatura OK" cuando no hay alerta', async () => {
    const user = userEvent.setup()
    setupFetch(mockShipments, mockReport)
    render(<ReportsPage />)

    await waitFor(() => screen.getByText(/s1/))

    await user.selectOptions(screen.getByLabelText('Seleccionar Envío'), 's1')
    await user.click(screen.getByRole('button', { name: 'Generar Reporte' }))

    await waitFor(() => {
      expect(screen.getByText(/Temperatura OK/)).toBeInTheDocument()
    })
  })

  it('muestra error si falla la generación del reporte', async () => {
    const user = userEvent.setup()
    globalThis.fetch = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockShipments) })
      .mockResolvedValueOnce({ ok: false, status: 500, statusText: 'Server Error', text: () => Promise.resolve('Error generando reporte') })
    render(<ReportsPage />)

    await waitFor(() => screen.getByText(/s1/))

    await user.selectOptions(screen.getByLabelText('Seleccionar Envío'), 's1')
    await user.click(screen.getByRole('button', { name: 'Generar Reporte' }))

    expect(await screen.findByText(/Error generando reporte/)).toBeInTheDocument()
  })

  it('deshabilita el botón si no hay envío seleccionado', () => {
    setupFetch(mockShipments)
    render(<ReportsPage />)
    expect(screen.getByRole('button', { name: 'Generar Reporte' })).toBeDisabled()
  })

  it('muestra mensaje inicial cuando no hay reporte', () => {
    setupFetch(mockShipments)
    render(<ReportsPage />)
    expect(screen.getByText(/Selecciona un envío y genera el reporte/)).toBeInTheDocument()
  })

  it('muestra observaciones del reporte', async () => {
    const user = userEvent.setup()
    setupFetch(mockShipments, mockReport)
    render(<ReportsPage />)

    await waitFor(() => screen.getByText(/s1/))

    await user.selectOptions(screen.getByLabelText('Seleccionar Envío'), 's1')
    await user.click(screen.getByRole('button', { name: 'Generar Reporte' }))

    await waitFor(() => {
      expect(screen.getByText('Entrega exitosa. Temperatura controlada durante todo el trayecto.')).toBeInTheDocument()
    })
  })

  it('escenario real: envío de fresas de Bogotá a Medellín con alerta de temperatura', async () => {
    const user = userEvent.setup()
    const mockReportFresas = {
      reportId: 'rep-fresas',
      shipmentId: 's1',
      productId: 'p1',
      origin: 'BOGOTA',
      destination: 'MEDELLIN',
      dispatchTime: '2026-05-09T06:00:00Z',
      deliveryTime: '2026-05-10T14:00:00Z',
      averageTemperature: 34.2,
      averageHumidity: 70.1,
      temperatureAlert: true,
      humidityAlert: false,
      deliveryStatus: 'DELIVERED',
      observations: 'Alerta: temperatura promedio de 34.2°C supera el límite seguro para fresas (30°C). Se recomienda revisar sistema de refrigeración.',
    }
    setupFetch(
      [{ id: 's1', productId: 'p1', status: 'DELIVERED', currentLocation: 'MEDELLIN', updatedAt: '2026-05-10T16:00:00Z' }],
      mockReportFresas,
    )
    render(<ReportsPage />)

    await waitFor(() => screen.getByText(/s1/))

    await user.selectOptions(screen.getByLabelText('Seleccionar Envío'), 's1')
    await user.click(screen.getByRole('button', { name: 'Generar Reporte' }))

    await waitFor(() => {
      expect(screen.getByText('34.2°C')).toBeInTheDocument()
      expect(screen.getByText(/Alerta Temperatura/)).toBeInTheDocument()
    })
    expect(screen.queryByText(/Temperatura OK/)).not.toBeInTheDocument()
  })
})
