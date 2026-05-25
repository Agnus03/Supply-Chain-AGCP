package com.cadenasuministros.adapters.outbound.persistence.jpa;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
import java.util.UUID;

public interface SpringDataShippingCostRepository extends JpaRepository<ShippingCostJpaEntity, UUID> {
    Optional<ShippingCostJpaEntity> findByShipmentId(UUID shipmentId);
}
