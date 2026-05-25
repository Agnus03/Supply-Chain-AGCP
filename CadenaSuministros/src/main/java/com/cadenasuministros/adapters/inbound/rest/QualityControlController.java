package com.cadenasuministros.adapters.inbound.rest;

import com.cadenasuministros.domain.model.QualityCheckpoint;
import com.cadenasuministros.domain.port.out.QualityCheckpointRepository;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/quality")
public class QualityControlController {

    private final QualityCheckpointRepository repository;

    public QualityControlController(QualityCheckpointRepository repository) {
        this.repository = repository;
    }

    @GetMapping
    public List<QualityCheckpoint> listAll() {
        return repository.listAll();
    }

    @GetMapping("/shipment/{shipmentId}")
    public List<QualityCheckpoint> byShipment(@PathVariable UUID shipmentId) {
        return repository.findByShipmentId(shipmentId);
    }

    @GetMapping("/failed")
    public List<QualityCheckpoint> failed() {
        return repository.findFailedCheckpoints();
    }

    @PostMapping
    public QualityCheckpoint create(@RequestBody QualityRequest req) {
        QualityCheckpoint cp = new QualityCheckpoint(
                UUID.randomUUID(), UUID.fromString(req.shipmentId()),
                req.location(), req.temperatureC(), req.humidityPct(),
                req.passed(), req.notes(), req.inspector(), Instant.now()
        );
        return repository.save(cp);
    }

    public record QualityRequest(
            String shipmentId, String location,
            Double temperatureC, Double humidityPct,
            boolean passed, String notes, String inspector
    ) {}
}
