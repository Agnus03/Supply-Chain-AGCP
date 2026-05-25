package com.cadenasuministros.domain.port.out;

import com.cadenasuministros.domain.model.InventoryItem;
import com.cadenasuministros.domain.model.StockMovement;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface InventoryRepository {
    InventoryItem save(InventoryItem item);
    Optional<InventoryItem> findById(UUID id);
    Optional<InventoryItem> findByProductId(UUID productId);
    List<InventoryItem> listAll();
    List<InventoryItem> findByWarehouse(String warehouse);
    List<InventoryItem> findLowStock();
    StockMovement saveMovement(StockMovement movement);
    List<StockMovement> listMovements(UUID productId);
}
