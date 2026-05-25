package com.cadenasuministros.adapters.outbound.persistence.jpa;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.UUID;

public interface SpringDataQualityCheckpointRepository extends JpaRepository<QualityCheckpointJpaEntity, UUID> {
    List<QualityCheckpointJpaEntity> findByShipmentIdOrderByTimestampDesc(UUID shipmentId);
    List<QualityCheckpointJpaEntity> findByPassedFalse();
}
