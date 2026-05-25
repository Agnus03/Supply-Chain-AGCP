package com.cadenasuministros.adapters.outbound.persistence.jpa;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "inventory_items")
public class InventoryItemJpaEntity {

    @Id
    private UUID id;

    @Column(name = "product_id", nullable = false)
    private UUID productId;

    @Column(nullable = false)
    private int quantity;

    @Column(name = "min_stock", nullable = false)
    private int minStock;

    @Column(nullable = false)
    private String warehouse;

    @Column(name = "last_updated", nullable = false)
    private Instant lastUpdated;

    public InventoryItemJpaEntity() {}

    public InventoryItemJpaEntity(UUID id, UUID productId, int quantity, int minStock, String warehouse, Instant lastUpdated) {
        this.id = id;
        this.productId = productId;
        this.quantity = quantity;
        this.minStock = minStock;
        this.warehouse = warehouse;
        this.lastUpdated = lastUpdated;
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public UUID getProductId() { return productId; }
    public void setProductId(UUID productId) { this.productId = productId; }
    public int getQuantity() { return quantity; }
    public void setQuantity(int quantity) { this.quantity = quantity; }
    public int getMinStock() { return minStock; }
    public void setMinStock(int minStock) { this.minStock = minStock; }
    public String getWarehouse() { return warehouse; }
    public void setWarehouse(String warehouse) { this.warehouse = warehouse; }
    public Instant getLastUpdated() { return lastUpdated; }
    public void setLastUpdated(Instant lastUpdated) { this.lastUpdated = lastUpdated; }
}
