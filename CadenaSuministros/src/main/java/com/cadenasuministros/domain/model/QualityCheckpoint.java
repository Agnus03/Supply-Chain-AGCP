package com.cadenasuministros.domain.model;

import java.time.Instant;
import java.util.UUID;

public record QualityCheckpoint(
    UUID id,
    UUID shipmentId,
    String location,
    Double temperatureC,
    Double humidityPct,
    boolean passed,
    String notes,
    String inspector,
    Instant timestamp
) {}
