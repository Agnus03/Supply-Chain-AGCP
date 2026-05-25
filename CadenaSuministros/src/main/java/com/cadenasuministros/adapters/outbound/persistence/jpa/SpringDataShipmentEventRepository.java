package com.cadenasuministros.adapters.outbound.persistence.jpa;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.UUID;

public interface SpringDataShipmentEventRepository extends JpaRepository<ShipmentEventJpaEntity, UUID> {
    List<ShipmentEventJpaEntity> findByShipmentIdOrderByTimestampDesc(UUID shipmentId);
}
