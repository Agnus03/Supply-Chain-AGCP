package com.cadenasuministros.application.facade;

import java.time.Instant;
import java.time.ZoneId;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

import com.cadenasuministros.domain.model.DeliveryReport;
import com.cadenasuministros.domain.model.Product;
import com.cadenasuministros.domain.model.SensorReading;
import com.cadenasuministros.domain.model.Shipment;
import com.cadenasuministros.domain.port.in.GenerateDeliveryReportUseCase;
import com.cadenasuministros.domain.port.in.RegisterSensorReadingUseCase;
import com.cadenasuministros.domain.port.in.TrackShipmentUseCase;
import com.cadenasuministros.domain.port.out.ProductRepository;
import com.cadenasuministros.domain.port.out.SensorReadingRepository;

public class SupplyChainFacadeImpl implements SupplyChainFacade {

    private final TrackShipmentUseCase trackShipmentUseCase;
    private final RegisterSensorReadingUseCase registerSensorReadingUseCase;
    private final GenerateDeliveryReportUseCase generateDeliveryReportUseCase;
    private final SensorReadingRepository sensorReadingRepository;
    private final ProductRepository productRepository;

    public SupplyChainFacadeImpl(
            TrackShipmentUseCase trackShipmentUseCase,
            RegisterSensorReadingUseCase registerSensorReadingUseCase,
            GenerateDeliveryReportUseCase generateDeliveryReportUseCase,
            SensorReadingRepository sensorReadingRepository,
            ProductRepository productRepository) {
        this.trackShipmentUseCase = trackShipmentUseCase;
        this.registerSensorReadingUseCase = registerSensorReadingUseCase;
        this.generateDeliveryReportUseCase = generateDeliveryReportUseCase;
        this.sensorReadingRepository = sensorReadingRepository;
        this.productRepository = productRepository;
    }

    @Override
    public ShipmentInfo createShipment(UUID productId, String productName, Integer quantity) {
        Shipment shipment = new Shipment(
                UUID.randomUUID(),
                productId,
                "PENDING",
                "WAREHOUSE",
                Instant.now()
        );
        Shipment saved = trackShipmentUseCase.create(shipment);
        return toShipmentInfo(saved, productName, quantity);
    }

    @Override
    public ShipmentInfo getShipmentInfo(UUID shipmentId) {
        Shipment shipment = trackShipmentUseCase.getById(shipmentId);
        String productName = productRepository.findProductById(shipment.productId())
                .map(Product::name)
                .orElse("Producto desconocido");
        return toShipmentInfo(shipment, productName, 1);
    }

    @Override
    public List<ShipmentInfo> listAllShipmentInfos() {
        List<Shipment> shipments = trackShipmentUseCase.listAll();
        Map<UUID, String> productNames = productRepository.listAllProducts().stream()
                .collect(Collectors.toMap(Product::id, Product::name));
        return shipments.stream()
                .map(s -> toShipmentInfo(s,
                        productNames.getOrDefault(s.productId(), "Producto desconocido"),
                        1))
                .collect(Collectors.toList());
    }

    @Override
    public ShipmentStatus trackShipment(UUID shipmentId) {
        Shipment shipment = trackShipmentUseCase.getById(shipmentId);
        return new ShipmentStatus(
                shipment.id(),
                shipment.status(),
                shipment.currentLocation(),
                shipment.updatedAt(),
                estimateDelivery(shipment.status())
        );
    }

    @Override
    public SensorReadingResult registerSensorReading(
            UUID shipmentId,
            Double temperatureC,
            Double humidityPct,
            Double latitude,
            Double longitude) {
        SensorReading reading = new SensorReading(
                UUID.randomUUID(),
                shipmentId,
                Instant.now(),
                temperatureC,
                humidityPct,
                latitude,
                longitude
        );
        SensorReading saved = registerSensorReadingUseCase.register(reading);
        return toSensorReadingResult(saved);
    }

    @Override
    public Dashboard getShipmentDashboard(UUID shipmentId) {
        Shipment shipment = trackShipmentUseCase.getById(shipmentId);
        List<SensorReading> readings = sensorReadingRepository.findByShipmentId(shipmentId);
        String productName = productRepository.findProductById(shipment.productId())
                .map(Product::name)
                .orElse("Producto desconocido");

        Dashboard.ShipmentSummary summary = new Dashboard.ShipmentSummary(
                productName,
                1,
                shipment.status(),
                formatInstant(shipment.updatedAt()),
                formatInstant(shipment.updatedAt())
        );

        Dashboard.SensorStats sensorStats = calculateSensorStats(readings);
        List<SensorReadingResult> recentReadings = readings.stream()
                .map(this::toSensorReadingResult)
                .limit(10)
                .collect(Collectors.toList());

        List<Dashboard.AlertInfo> alerts = generateAlerts(readings);

        return new Dashboard(
                shipmentId,
                shipment.status(),
                shipment.currentLocation(),
                summary,
                sensorStats,
                recentReadings,
                alerts
        );
    }

    @Override
    public DeliveryReportInfo generateDeliveryReport(UUID shipmentId) {
        DeliveryReport report = generateDeliveryReportUseCase.generate(shipmentId);
        return toDeliveryReportInfo(report);
    }

    private ShipmentInfo toShipmentInfo(Shipment shipment, String productName, Integer quantity) {
        return new ShipmentInfo(
                shipment.id(),
                shipment.productId(),
                productName,
                shipment.status(),
                shipment.currentLocation(),
                quantity,
                shipment.updatedAt(),
                shipment.updatedAt()
        );
    }

    private SensorReadingResult toSensorReadingResult(SensorReading reading) {
        boolean alert = isAlertCondition(reading.temperatureC(), reading.humidityPct());
        return new SensorReadingResult(
                reading.id(),
                reading.shipmentId(),
                reading.timestamp(),
                reading.temperatureC(),
                reading.humidityPct(),
                reading.latitude(),
                reading.longitude(),
                alert
        );
    }

    private Dashboard.SensorStats calculateSensorStats(List<SensorReading> readings) {
        if (readings.isEmpty()) {
            return new Dashboard.SensorStats(0, 0, 0, null, null, true);
        }

        double avgTemp = readings.stream()
                .mapToDouble(SensorReading::temperatureC)
                .average()
                .orElse(0);

        double avgHumidity = readings.stream()
                .mapToDouble(SensorReading::humidityPct)
                .average()
                .orElse(0);

        SensorReading last = readings.get(readings.size() - 1);
        boolean withinRange = !isAlertCondition(last.temperatureC(), last.humidityPct());

        return new Dashboard.SensorStats(
                readings.size(),
                avgTemp,
                avgHumidity,
                last.latitude(),
                last.longitude(),
                withinRange
        );
    }

    private List<Dashboard.AlertInfo> generateAlerts(List<SensorReading> readings) {
        return readings.stream()
                .filter(r -> isAlertCondition(r.temperatureC(), r.humidityPct()))
                .map(r -> new Dashboard.AlertInfo(
                        "TEMPERATURE",
                        "Lectura fuera de rango: Temp=" + r.temperatureC() + ", Hum=" + r.humidityPct(),
                        formatInstant(r.timestamp()),
                        false
                ))
                .collect(Collectors.toList());
    }

    private DeliveryReportInfo toDeliveryReportInfo(DeliveryReport report) {
        return new DeliveryReportInfo(
                report.getReportId(),
                report.getShipmentId(),
                formatInstant(report.getDispatchTime()),
                report.getDeliveryStatus(),
                new DeliveryReportInfo.EnvironmentalStats(
                        report.getAverageTemperature() != null ? report.getAverageTemperature() : 0,
                        report.getAverageTemperature() != null ? report.getAverageTemperature() - 5 : 0,
                        report.getAverageTemperature() != null ? report.getAverageTemperature() + 5 : 0,
                        report.getAverageHumidity() != null ? report.getAverageHumidity() : 0,
                        report.getAverageHumidity() != null ? report.getAverageHumidity() - 10 : 0,
                        report.getAverageHumidity() != null ? report.getAverageHumidity() + 10 : 0,
                        0
                ),
                List.of(report.getObservations() != null ? report.getObservations() : ""),
                buildAlertsFromReport(report)
        );
    }

    private List<String> buildAlertsFromReport(DeliveryReport report) {
        List<String> alerts = new java.util.ArrayList<>();
        if (Boolean.TRUE.equals(report.getTemperatureAlert())) {
            alerts.add("Alerta de temperatura");
        }
        if (Boolean.TRUE.equals(report.getHumidityAlert())) {
            alerts.add("Alerta de humedad");
        }
        return alerts;
    }

    private boolean isAlertCondition(Double temp, Double humidity) {
        return temp != null && (temp > 30 || temp < 2);
    }

    private String estimateDelivery(String status) {
        return switch (status) {
            case "DELIVERED" -> "Entregado";
            case "IN_TRANSIT" -> "2-3 días";
            default -> "Por confirmar";
        };
    }

    private String formatInstant(Instant instant) {
        return instant.atZone(ZoneId.systemDefault()).toString();
    }
}
