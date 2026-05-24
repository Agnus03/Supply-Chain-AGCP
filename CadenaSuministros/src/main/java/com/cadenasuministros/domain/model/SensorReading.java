package com.cadenasuministros.domain.model;

import java.time.Instant;
import java.util.UUID;

public record SensorReading(
        UUID id,
        UUID shipmentId,
        Instant timestamp,
        Double temperatureC,
        Double humidityPct,
        Double latitude,
        Double longitude,
        boolean acknowledged
) {

	public SensorReading(
            UUID id, UUID shipmentId, Instant timestamp,
            Double temperatureC, Double humidityPct,
            Double latitude, Double longitude) {
        this(id, shipmentId, timestamp, temperatureC, humidityPct, latitude, longitude, false);
    }

	public UUID id() {
		return id;
	}

	public UUID shipmentId() {
		return shipmentId;
	}

	public Instant timestamp() {
		return timestamp;
	}

	public Double temperatureC() {
		return temperatureC;
	}

	public Double humidityPct() {
		return humidityPct;
	}

	public Double latitude() {
		return latitude;
	}

	public Double longitude() {
		return longitude;
	}

	public boolean acknowledged() {
        return acknowledged;
    }

    public SensorReading withAcknowledged(boolean ack) {
        return new SensorReading(id, shipmentId, timestamp, temperatureC, humidityPct, latitude, longitude, ack);
    }
}