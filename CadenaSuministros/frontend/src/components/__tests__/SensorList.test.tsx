import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { SensorList } from '../SensorList'
import type { SensorReading } from '../../types'

const baseReading: SensorReading = {
  id: 'r1',
  shipmentId: 's1',
  timestamp: '2026-05-10T14:30:00Z',
  temperatureC: null,
  humidityPct: null,
  latitude: null,
  longitude: null,
}

const onRefresh = vi.fn()

describe('SensorList - Visualización de lecturas IoT', () => {
  it('muestra loading mientras carga', () => {
    render(<SensorList readings={[]} loading={true} error={null} onRefresh={onRefresh} />)
    expect(screen.getByText('Cargando lecturas...')).toBeInTheDocument()
  })

  it('muestra error con botón reintentar', () => {
    render(<SensorList readings={[]} loading={false} error={'Error de conexión'} onRefresh={onRefresh} />)
    expect(screen.getByText(/Error de conexión/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Reintentar' })).toBeInTheDocument()
  })

  it('muestra mensaje vacío si no hay lecturas', () => {
    render(<SensorList readings={[]} loading={false} error={null} onRefresh={onRefresh} />)
    expect(screen.getByText('No hay lecturas registradas.')).toBeInTheDocument()
  })

  it('muestra tabla con lecturas de sensores', () => {
    const readings: SensorReading[] = [
      { ...baseReading, temperatureC: 24.5, humidityPct: 55.0, latitude: 4.7110, longitude: -74.0721 },
    ]
    render(<SensorList readings={readings} loading={false} error={null} onRefresh={onRefresh} />)
    expect(screen.getByText('24.5')).toBeInTheDocument()
    expect(screen.getByText('55.0')).toBeInTheDocument()
    expect(screen.getByText('4.7110')).toBeInTheDocument()
    expect(screen.getByText('-74.0721')).toBeInTheDocument()
  })

  describe('Alertas de temperatura en productos perecederos', () => {

    it('marca en ROJO temperatura > 30°C (riesgo de descomposición)', () => {
      const readings: SensorReading[] = [
        { ...baseReading, temperatureC: 35.0 },
      ]
      render(<SensorList readings={readings} loading={false} error={null} onRefresh={onRefresh} />)
      const cell = screen.getByText('35.0')
      expect(cell).toHaveClass('temp-danger')
      expect(cell).toHaveClass('temp-danger')
    })

    it('marca en ROJO temperatura < 2°C (riesgo de congelación)', () => {
      const readings: SensorReading[] = [
        { ...baseReading, temperatureC: -1.0 },
      ]
      render(<SensorList readings={readings} loading={false} error={null} onRefresh={onRefresh} />)
      const cell = screen.getByText('-1.0')
      expect(cell).toHaveClass('temp-danger')
    })

    it('NO marca temperatura en rango seguro 2-30°C', () => {
      const readings: SensorReading[] = [
        { ...baseReading, temperatureC: 20.0 },
      ]
      render(<SensorList readings={readings} loading={false} error={null} onRefresh={onRefresh} />)
      const cell = screen.getByText('20.0')
      expect(cell).not.toHaveClass('temp-danger')
    })

    it('muestra guión cuando temperatura es null', () => {
      const readings: SensorReading[] = [
        { ...baseReading, temperatureC: null },
      ]
      render(<SensorList readings={readings} loading={false} error={null} onRefresh={onRefresh} />)
      expect(screen.getAllByText('-').length).toBeGreaterThanOrEqual(1)
    })

    it('maneja múltiples lecturas con diferentes estados de alerta', () => {
      const readings: SensorReading[] = [
        { ...baseReading, id: 'r1', temperatureC: 35.0 },
        { ...baseReading, id: 'r2', temperatureC: 20.0 },
        { ...baseReading, id: 'r3', temperatureC: -1.0 },
      ]
      render(<SensorList readings={readings} loading={false} error={null} onRefresh={onRefresh} />)
      const cells = screen.getAllByText('35.0')
      expect(cells[0]).toHaveClass('temp-danger')
      expect(screen.getByText('20.0')).not.toHaveClass('temp-danger')
      expect(screen.getByText('-1.0')).toHaveClass('temp-danger')
    })
  })
})
