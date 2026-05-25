package com.cadenasuministros.adapters.inbound.rest;

import com.cadenasuministros.application.facade.Dashboard;
import com.cadenasuministros.application.facade.SensorReadingResult;
import com.cadenasuministros.application.facade.SupplyChainFacade;
import com.cadenasuministros.domain.model.Product;
import com.cadenasuministros.domain.model.SensorReading;
import com.cadenasuministros.domain.model.Shipment;
import com.cadenasuministros.domain.model.ShipmentEvent;
import com.cadenasuministros.domain.port.in.TrackShipmentUseCase;
import com.cadenasuministros.domain.port.out.ProductRepository;
import com.cadenasuministros.domain.port.out.SensorReadingRepository;
import com.cadenasuministros.domain.service.AlertEvaluator;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.time.ZoneId;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/dashboard")
public class DashboardController {

    private final SupplyChainFacade supplyChainFacade;
    private final TrackShipmentUseCase trackShipmentUseCase;
    private final SensorReadingRepository sensorReadingRepository;
    private final ProductRepository productRepository;
    private final AlertEvaluator alertEvaluator;

    public DashboardController(SupplyChainFacade supplyChainFacade,
                               TrackShipmentUseCase trackShipmentUseCase,
                               SensorReadingRepository sensorReadingRepository,
                               ProductRepository productRepository,
                               AlertEvaluator alertEvaluator) {
        this.supplyChainFacade = supplyChainFacade;
        this.trackShipmentUseCase = trackShipmentUseCase;
        this.sensorReadingRepository = sensorReadingRepository;
        this.productRepository = productRepository;
        this.alertEvaluator = alertEvaluator;
    }

    @GetMapping
    public GlobalDashboard getGlobalDashboard() {
        List<Shipment> shipments = trackShipmentUseCase.listAll();
        List<SensorReading> allReadings = sensorReadingRepository.listAll();

        Map<UUID, Shipment> shipmentMap = new HashMap<>();
        for (Shipment s : shipments) {
            shipmentMap.put(s.id(), s);
        }

        long totalShipments = shipments.size();
        long pending = shipments.stream().filter(s -> "PENDING".equals(s.status())).count();
        long transit = shipments.stream().filter(s -> "IN_TRANSIT".equals(s.status())).count();
        long delivered = shipments.stream().filter(s -> "DELIVERED".equals(s.status())).count();
        long delayed = shipments.stream().filter(s -> "DELAYED".equals(s.status())).count();

        long alertCount = allReadings.stream()
                .filter(r -> !r.acknowledged() && alertEvaluator.isAnyAlert(r.temperatureC(), r.humidityPct()))
                .count();

        List<SensorReadingResult> recentReadings = allReadings.stream()
                .collect(Collectors.groupingBy(
                        SensorReading::shipmentId,
                        Collectors.maxBy(Comparator.comparing(SensorReading::timestamp))
                ))
                .values().stream()
                .filter(Optional::isPresent)
                .map(Optional::get)
                .sorted(Comparator.comparing(SensorReading::timestamp).reversed())
                .map(r -> {
                    Shipment shipment = shipmentMap.get(r.shipmentId());
                    String status = shipment != null ? shipment.status() : "PENDING";
                    boolean alert = alertEvaluator.isAnyAlert(r.temperatureC(), r.humidityPct());
                    return new SensorReadingResult(
                            r.id(), r.shipmentId(), r.timestamp(),
                            r.temperatureC(), r.humidityPct(),
                            r.latitude(), r.longitude(),
                            alert, status);
                })
                .collect(Collectors.toList());

        double avgTemp = allReadings.stream()
                .filter(r -> r.temperatureC() != null)
                .mapToDouble(SensorReading::temperatureC)
                .average()
                .orElse(0);

        double avgHum = allReadings.stream()
                .filter(r -> r.humidityPct() != null)
                .mapToDouble(SensorReading::humidityPct)
                .average()
                .orElse(0);

        return new GlobalDashboard(
                totalShipments,
                pending,
                transit,
                delivered,
                delayed,
                allReadings.size(),
                alertCount,
                avgTemp,
                avgHum,
                recentReadings
        );
    }

    @GetMapping("/trends")
    public List<TrendPoint> getTrends(@RequestParam(defaultValue = "24") int hours) {
        List<SensorReading> allReadings = sensorReadingRepository.listAll();
        Instant cutoff = Instant.now().minus(hours, ChronoUnit.HOURS);

        Map<Integer, List<SensorReading>> bucketed = allReadings.stream()
                .filter(r -> !r.timestamp().isBefore(cutoff))
                .collect(Collectors.groupingBy(r -> Math.toIntExact(r.timestamp().getEpochSecond() / 3600)));

        return bucketed.entrySet().stream()
                .map(entry -> {
                    int bucket = entry.getKey();
                    List<SensorReading> bucketReadings = entry.getValue();
                    double avgTemp = bucketReadings.stream()
                            .filter(r -> r.temperatureC() != null)
                            .mapToDouble(SensorReading::temperatureC)
                            .average().orElse(0);
                    double avgHum = bucketReadings.stream()
                            .filter(r -> r.humidityPct() != null)
                            .mapToDouble(SensorReading::humidityPct)
                            .average().orElse(0);
                    Instant ts = Instant.ofEpochSecond(bucket * 3600L);
                    return new TrendPoint(ts.toString(), Math.round(avgTemp * 10.0) / 10.0, Math.round(avgHum * 10.0) / 10.0);
                })
                .sorted(Comparator.comparing(TrendPoint::timestamp))
                .collect(Collectors.toList());
    }

    @GetMapping("/{shipmentId}")
    public Dashboard getShipmentDashboard(@PathVariable UUID shipmentId) {
        return supplyChainFacade.getShipmentDashboard(shipmentId);
    }

    @GetMapping("/{shipmentId}/history")
    public List<ShipmentEvent> getShipmentHistory(@PathVariable UUID shipmentId) {
        return trackShipmentUseCase.getHistory(shipmentId);
    }

    @GetMapping("/product/{productId}")
    public ProductDashboard getProductDashboard(@PathVariable UUID productId) {
        Product product = productRepository.findProductById(productId)
                .orElseThrow(() -> new IllegalArgumentException("Product not found: " + productId));
        List<Shipment> all = trackShipmentUseCase.listAll();
        List<Shipment> productShipments = all.stream()
                .filter(s -> s.productId().equals(productId))
                .collect(Collectors.toList());
        Set<UUID> productShipmentIds = productShipments.stream()
                .map(Shipment::id)
                .collect(Collectors.toSet());
        List<SensorReading> readings = sensorReadingRepository.listAll().stream()
                .filter(r -> productShipmentIds.contains(r.shipmentId()))
                .collect(Collectors.toList());
        long totalShipments = productShipments.size();
        long delivered = productShipments.stream().filter(s -> "DELIVERED".equals(s.status())).count();
        long transit = productShipments.stream().filter(s -> "IN_TRANSIT".equals(s.status())).count();
        long pending = productShipments.stream().filter(s -> "PENDING".equals(s.status())).count();
        long delayed = productShipments.stream().filter(s -> "DELAYED".equals(s.status())).count();
        long totalReadings = readings.size();
        double avgTemp = readings.stream().filter(r -> r.temperatureC() != null)
                .mapToDouble(SensorReading::temperatureC).average().orElse(0);
        double avgHum = readings.stream().filter(r -> r.humidityPct() != null)
                .mapToDouble(SensorReading::humidityPct).average().orElse(0);
        return new ProductDashboard(product.name(), totalShipments, pending, transit, delivered, delayed,
                totalReadings, Math.round(avgTemp * 10.0) / 10.0, Math.round(avgHum * 10.0) / 10.0);
    }

    public record GlobalDashboard(
            long totalShipments,
            long pendingShipments,
            long transitShipments,
            long deliveredShipments,
            long delayedShipments,
            long totalReadings,
            long activeAlerts,
            double averageTemperature,
            double averageHumidity,
            List<SensorReadingResult> recentReadings
    ) {}

    public record TrendPoint(
            String timestamp,
            double avgTemperature,
            double avgHumidity
    ) {}

    public record ProductDashboard(
            String productName,
            long totalShipments,
            long pendingShipments,
            long transitShipments,
            long deliveredShipments,
            long delayedShipments,
            long totalReadings,
            double averageTemperature,
            double averageHumidity
    ) {}
}
