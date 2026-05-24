package com.cadenasuministros.adapters.outbound.persistence.jpa;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import java.time.Instant;
import java.util.UUID;

@Entity(name = "sensor_readings")
public class SensorReadingJpaEntity {
    @Id
    public UUID id;
    public UUID shipmentId;
    public Instant timestamp;
    public Double temperatureC;
    public Double humidityPct;
    public Double latitude;
    public Double longitude;
    public Boolean acknowledged;
}
