package com.cadenasuministros.adapters.inbound.rest;

import jakarta.validation.Valid;
import java.util.List;
import java.util.stream.Collectors;
import org.springframework.web.bind.annotation.*;
import com.cadenasuministros.domain.model.SensorReading;
import com.cadenasuministros.domain.port.in.RegisterSensorReadingUseCase;
import com.cadenasuministros.domain.service.AlertEvaluator;

import java.time.Instant;
import java.util.Comparator;
import java.util.UUID;

@RestController
@RequestMapping("/api/sensors")
public class SensorController {

    private final RegisterSensorReadingUseCase registerSensorReadingUseCase;
    private final AlertEvaluator alertEvaluator;

    public SensorController(RegisterSensorReadingUseCase registerSensorReadingUseCase,
                            AlertEvaluator alertEvaluator) {
        this.registerSensorReadingUseCase = registerSensorReadingUseCase;
        this.alertEvaluator = alertEvaluator;
    }

    public record SensorReadingRequest(
            UUID shipmentId,
            Double temperatureC,
            Double humidityPct,
            Double latitude,
            Double longitude
    ) {}

    @PostMapping("/readings")
    public SensorReading create(@RequestBody @Valid SensorReadingRequest req) {
        if (req.shipmentId() == null || req.shipmentId().toString().isEmpty()) {
            throw new IllegalArgumentException("El shipmentId es requerido");
        }
        
        SensorReading reading = new SensorReading(
                UUID.randomUUID(),
                req.shipmentId(),
                Instant.now(),
                req.temperatureC(),
                req.humidityPct(),
                req.latitude(),
                req.longitude()
        );
        return registerSensorReadingUseCase.register(reading);
    }
    
    @GetMapping
    public List<SensorReading> list() {
        return registerSensorReadingUseCase.listAll();
    }

    @GetMapping("/alerts/active")
    public List<SensorReading> listActiveAlerts() {
        List<SensorReading> all = registerSensorReadingUseCase.listAll();
        return all.stream()
                .filter(r -> alertEvaluator.isAnyAlert(r.temperatureC(), r.humidityPct()))
                .collect(Collectors.toList());
    }

    @GetMapping("/alerts/recent")
    public List<SensorReading> listRecentAlerts(@RequestParam(defaultValue = "50") int limit) {
        List<SensorReading> all = registerSensorReadingUseCase.listAll();
        return all.stream()
                .filter(r -> alertEvaluator.isAnyAlert(r.temperatureC(), r.humidityPct()))
                .sorted(Comparator.comparing(SensorReading::timestamp).reversed())
                .limit(limit)
                .collect(Collectors.toList());
    }

    @PostMapping("/alerts/{id}/acknowledge")
    public SensorReading acknowledgeAlert(@PathVariable UUID id) {
        List<SensorReading> all = registerSensorReadingUseCase.listAll();
        SensorReading reading = all.stream()
                .filter(r -> r.id().equals(id))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("Lectura no encontrada: " + id));
        SensorReading acknowledged = reading.withAcknowledged(true);
        return registerSensorReadingUseCase.register(acknowledged);
    }
}
