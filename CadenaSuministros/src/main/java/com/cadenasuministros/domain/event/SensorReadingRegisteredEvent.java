package com.cadenasuministros.domain.event;

import java.time.Instant;

import com.cadenasuministros.domain.model.SensorReading;

public class SensorReadingRegisteredEvent {

    private final SensorReading reading;
    private final Instant occurredOn;

    public SensorReadingRegisteredEvent(SensorReading reading) {
        this.reading = reading;
        this.occurredOn = Instant.now();
    }

    public SensorReading getReading() {
        return reading;
    }

    public Instant getOccurredOn() {
        return occurredOn;
    }
}
