package com.cadenasuministros.application.facade;

import java.time.Instant;
import java.util.UUID;

public record SensorReadingResult(
        UUID id,
        UUID shipmentId,
        Instant timestamp,
        Double temperatureC,
        Double humidityPct,
        Double latitude,
        Double longitude,
        boolean alert,
        String status
) {}