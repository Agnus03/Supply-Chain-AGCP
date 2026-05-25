package com.cadenasuministros.adapters.outbound.persistence.jpa;

import com.cadenasuministros.domain.model.QualityCheckpoint;
import com.cadenasuministros.domain.port.out.QualityCheckpointRepository;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Component
public class QualityCheckpointJpaAdapter implements QualityCheckpointRepository {

    private final SpringDataQualityCheckpointRepository repo;

    public QualityCheckpointJpaAdapter(SpringDataQualityCheckpointRepository repo) {
        this.repo = repo;
    }

    @Override
    public QualityCheckpoint save(QualityCheckpoint checkpoint) {
        return toDomain(repo.save(toEntity(checkpoint)));
    }

    @Override
    public Optional<QualityCheckpoint> findById(UUID id) {
        return repo.findById(id).map(this::toDomain);
    }

    @Override
    public List<QualityCheckpoint> findByShipmentId(UUID shipmentId) {
        return repo.findByShipmentIdOrderByTimestampDesc(shipmentId).stream()
                .map(this::toDomain).collect(Collectors.toList());
    }

    @Override
    public List<QualityCheckpoint> listAll() {
        return repo.findAll().stream().map(this::toDomain).collect(Collectors.toList());
    }

    @Override
    public List<QualityCheckpoint> findFailedCheckpoints() {
        return repo.findByPassedFalse().stream().map(this::toDomain).collect(Collectors.toList());
    }

    private QualityCheckpoint toDomain(QualityCheckpointJpaEntity e) {
        return new QualityCheckpoint(e.getId(), e.getShipmentId(), e.getLocation(),
                e.getTemperatureC(), e.getHumidityPct(), e.isPassed(),
                e.getNotes(), e.getInspector(), e.getTimestamp());
    }

    private QualityCheckpointJpaEntity toEntity(QualityCheckpoint d) {
        return new QualityCheckpointJpaEntity(d.id(), d.shipmentId(), d.location(),
                d.temperatureC(), d.humidityPct(), d.passed(),
                d.notes(), d.inspector(), d.timestamp());
    }
}
