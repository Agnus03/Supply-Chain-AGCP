package com.cadenasuministros.domain.model;

import java.time.Instant;
import java.util.UUID;

public record ShippingCost(
    UUID id,
    UUID shipmentId,
    double baseRate,
    double distanceKm,
    double distanceCost,
    double extraCharges,
    double totalCost,
    String currency,
    Instant calculatedAt,
    String strategyName
) {}
