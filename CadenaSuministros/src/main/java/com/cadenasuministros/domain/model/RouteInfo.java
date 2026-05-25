package com.cadenasuministros.domain.model;

import java.time.Instant;

public record RouteInfo(
    String origin,
    String destination,
    double distanceKm,
    double estimatedHours,
    Instant estimatedArrival
) {}
