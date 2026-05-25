package com.cadenasuministros.domain.model;

import java.time.Instant;
import java.util.UUID;

public record StockMovement(
    UUID id,
    UUID productId,
    String type,
    int quantity,
    String reference,
    String notes,
    Instant timestamp
) {}
