package com.cadenasuministros.adapters.outbound.persistence.jpa;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "stock_movements")
public class StockMovementJpaEntity {

    @Id
    private UUID id;

    @Column(name = "product_id", nullable = false)
    private UUID productId;

    @Column(nullable = false)
    private String type;

    @Column(nullable = false)
    private int quantity;

    @Column
    private String reference;

    @Column
    private String notes;

    @Column(nullable = false)
    private Instant timestamp;

    public StockMovementJpaEntity() {}

    public StockMovementJpaEntity(UUID id, UUID productId, String type, int quantity, String reference, String notes, Instant timestamp) {
        this.id = id;
        this.productId = productId;
        this.type = type;
        this.quantity = quantity;
        this.reference = reference;
        this.notes = notes;
        this.timestamp = timestamp;
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public UUID getProductId() { return productId; }
    public void setProductId(UUID productId) { this.productId = productId; }
    public String getType() { return type; }
    public void setType(String type) { this.type = type; }
    public int getQuantity() { return quantity; }
    public void setQuantity(int quantity) { this.quantity = quantity; }
    public String getReference() { return reference; }
    public void setReference(String reference) { this.reference = reference; }
    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
    public Instant getTimestamp() { return timestamp; }
    public void setTimestamp(Instant timestamp) { this.timestamp = timestamp; }
}
