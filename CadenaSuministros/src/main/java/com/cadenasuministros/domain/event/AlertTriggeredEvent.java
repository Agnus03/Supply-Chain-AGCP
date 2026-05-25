package com.cadenasuministros.domain.event;

import java.time.Instant;

import com.cadenasuministros.domain.model.SensorReading;

public class AlertTriggeredEvent {

    private final SensorReading reading;
    private final String reason;
    private final Instant occurredOn;

    public AlertTriggeredEvent(SensorReading reading, String reason) {
        this.reading = reading;
        this.reason = reason;
        this.occurredOn = Instant.now();
    }

    public SensorReading getReading() {
        return reading;
    }

    public String getReason() {
        return reason;
    }

    public Instant getOccurredOn() {
        return occurredOn;
    }
}
