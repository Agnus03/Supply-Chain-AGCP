package com.cadenasuministros.adapters.outbound.persistence.jpa;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "quality_checkpoints")
public class QualityCheckpointJpaEntity {

    @Id
    private UUID id;

    @Column(name = "shipment_id", nullable = false)
    private UUID shipmentId;

    @Column(nullable = false)
    private String location;

    @Column(name = "temperature_c")
    private Double temperatureC;

    @Column(name = "humidity_pct")
    private Double humidityPct;

    @Column(nullable = false)
    private boolean passed;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @Column
    private String inspector;

    @Column(nullable = false)
    private Instant timestamp;

    public QualityCheckpointJpaEntity() {}

    public QualityCheckpointJpaEntity(UUID id, UUID shipmentId, String location, Double temperatureC, Double humidityPct, boolean passed, String notes, String inspector, Instant timestamp) {
        this.id = id;
        this.shipmentId = shipmentId;
        this.location = location;
        this.temperatureC = temperatureC;
        this.humidityPct = humidityPct;
        this.passed = passed;
        this.notes = notes;
        this.inspector = inspector;
        this.timestamp = timestamp;
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public UUID getShipmentId() { return shipmentId; }
    public void setShipmentId(UUID shipmentId) { this.shipmentId = shipmentId; }
    public String getLocation() { return location; }
    public void setLocation(String location) { this.location = location; }
    public Double getTemperatureC() { return temperatureC; }
    public void setTemperatureC(Double temperatureC) { this.temperatureC = temperatureC; }
    public Double getHumidityPct() { return humidityPct; }
    public void setHumidityPct(Double humidityPct) { this.humidityPct = humidityPct; }
    public boolean isPassed() { return passed; }
    public void setPassed(boolean passed) { this.passed = passed; }
    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
    public String getInspector() { return inspector; }
    public void setInspector(String inspector) { this.inspector = inspector; }
    public Instant getTimestamp() { return timestamp; }
    public void setTimestamp(Instant timestamp) { this.timestamp = timestamp; }
}
