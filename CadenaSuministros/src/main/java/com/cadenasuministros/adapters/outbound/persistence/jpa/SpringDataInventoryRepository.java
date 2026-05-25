package com.cadenasuministros.adapters.outbound.persistence.jpa;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface SpringDataInventoryRepository extends JpaRepository<InventoryItemJpaEntity, UUID> {
    Optional<InventoryItemJpaEntity> findByProductId(UUID productId);
    List<InventoryItemJpaEntity> findByWarehouse(String warehouse);
    List<InventoryItemJpaEntity> findByQuantityLessThan(int minStock);
}
