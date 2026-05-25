package com.cadenasuministros.domain.model;

import java.time.Instant;
import java.util.UUID;

public record InventoryItem(
    UUID id,
    UUID productId,
    int quantity,
    int minStock,
    String warehouse,
    Instant lastUpdated
) {
    public boolean isLowStock() {
        return quantity < minStock;
    }

    public InventoryItem withQuantity(int newQuantity) {
        return new InventoryItem(id, productId, newQuantity, minStock, warehouse, Instant.now());
    }

    public InventoryItem withMinStock(int newMinStock) {
        return new InventoryItem(id, productId, quantity, newMinStock, warehouse, lastUpdated);
    }
}
