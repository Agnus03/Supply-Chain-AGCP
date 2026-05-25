package com.cadenasuministros.domain.service;

import com.cadenasuministros.domain.event.DeliveryReportGeneratedEvent;
import com.cadenasuministros.domain.model.DeliveryReport;
import com.cadenasuministros.domain.model.SensorReading;
import com.cadenasuministros.domain.model.Shipment;
import com.cadenasuministros.domain.port.in.GenerateDeliveryReportUseCase;
import com.cadenasuministros.domain.port.out.DeliveryReportRepository;
import com.cadenasuministros.domain.port.out.SensorReadingRepository;
import com.cadenasuministros.domain.port.out.ShipmentRepository;

import org.springframework.context.ApplicationEventPublisher;

import java.time.Instant;
import java.util.DoubleSummaryStatistics;
import java.util.List;
import java.util.UUID;

public class GenerateDeliveryReportService implements GenerateDeliveryReportUseCase {

    private final ShipmentRepository shipmentRepository;
    private final SensorReadingRepository sensorReadingRepository;
    private final DeliveryReportRepository deliveryReportRepository;
    private final AlertEvaluator alertEvaluator;
    private final ApplicationEventPublisher eventPublisher;

    public GenerateDeliveryReportService(ShipmentRepository shipmentRepository,
                                         SensorReadingRepository sensorReadingRepository,
                                         DeliveryReportRepository deliveryReportRepository,
                                         AlertEvaluator alertEvaluator,
                                         ApplicationEventPublisher eventPublisher) {
        this.shipmentRepository = shipmentRepository;
        this.sensorReadingRepository = sensorReadingRepository;
        this.deliveryReportRepository = deliveryReportRepository;
        this.alertEvaluator = alertEvaluator;
        this.eventPublisher = eventPublisher;
    }

    @Override
    public DeliveryReport generate(UUID shipmentId) {
        Shipment shipment = shipmentRepository.findShipmentById(shipmentId)
                .orElseThrow(() -> new IllegalArgumentException("Shipment no encontrado: " + shipmentId));

        List<SensorReading> readings = sensorReadingRepository.findByShipmentId(shipmentId);
        
        if (readings == null || readings.isEmpty()) {
            System.out.println("No se encontraron lecturas para shipment: " + shipmentId);
        }

        DoubleSummaryStatistics tempStats = readings.stream()
                .filter(r -> r.temperatureC() != null)
                .mapToDouble(SensorReading::temperatureC)
                .summaryStatistics();

        DoubleSummaryStatistics humStats = readings.stream()
                .filter(r -> r.humidityPct() != null)
                .mapToDouble(SensorReading::humidityPct)
                .summaryStatistics();

        Double avgTemp = tempStats.getCount() > 0 ? tempStats.getAverage() : null;
        Double avgHum  = humStats.getCount()  > 0 ? humStats.getAverage()  : null;

        boolean tempAlert = avgTemp != null && alertEvaluator.isTemperatureAlert(avgTemp);
        boolean humAlert  = avgHum  != null && alertEvaluator.isHumidityAlert(avgHum);

        DeliveryReport report = new DeliveryReport.Builder()
                .reportId(UUID.randomUUID())
                .shipmentId(shipment.id())
                .productId(shipment.productId())
                .origin("Bodega origen")
                .destination(shipment.currentLocation())
                .dispatchTime(shipment.updatedAt())
                .deliveryTime(Instant.now())
                .averageTemperature(avgTemp)
                .averageHumidity(avgHum)
                .temperatureAlert(tempAlert)
                .humidityAlert(humAlert)
                .deliveryStatus(shipment.status())
                .observations(buildObservations(tempAlert, humAlert, readings.isEmpty()))
                .build();

        DeliveryReport saved = deliveryReportRepository.save(report);
        eventPublisher.publishEvent(new DeliveryReportGeneratedEvent(saved));
        return saved;
    }

    private String buildObservations(boolean tempAlert, boolean humAlert, boolean noReadings) {
        if (noReadings) return "No hay lecturas de sensores registradas";
        if (tempAlert && humAlert) return "Alerta de temperatura y humedad";
        if (tempAlert) return "Alerta de temperatura";
        if (humAlert) return "Alerta de humedad";
        return "Entrega dentro de parámetros";
    }

	@Override
	public List<SensorReading> listAll() {
		return sensorReadingRepository.listAll();
	}
}
