package com.cadenasuministros.adapters.outbound.persistence.jpa;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.UUID;

public interface SpringDataStockMovementRepository extends JpaRepository<StockMovementJpaEntity, UUID> {
    List<StockMovementJpaEntity> findByProductIdOrderByTimestampDesc(UUID productId);
}
