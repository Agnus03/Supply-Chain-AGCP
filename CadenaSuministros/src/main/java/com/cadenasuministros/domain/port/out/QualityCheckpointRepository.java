package com.cadenasuministros.domain.port.out;

import com.cadenasuministros.domain.model.QualityCheckpoint;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface QualityCheckpointRepository {
    QualityCheckpoint save(QualityCheckpoint checkpoint);
    Optional<QualityCheckpoint> findById(UUID id);
    List<QualityCheckpoint> findByShipmentId(UUID shipmentId);
    List<QualityCheckpoint> listAll();
    List<QualityCheckpoint> findFailedCheckpoints();
}
