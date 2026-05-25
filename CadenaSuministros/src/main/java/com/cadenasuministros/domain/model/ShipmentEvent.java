package com.cadenasuministros.domain.model;

import java.time.Instant;
import java.util.UUID;

public record ShipmentEvent(
    UUID id,
    UUID shipmentId,
    String fromStatus,
    String toStatus,
    String fromLocation,
    String toLocation,
    Instant timestamp
) {}
