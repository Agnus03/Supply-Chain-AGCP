package com.cadenasuministros.adapters.outbound.persistence.jpa;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "shipment_events")
public class ShipmentEventJpaEntity {

    @Id
    public UUID id;

    @Column(name = "shipment_id", nullable = false)
    public UUID shipmentId;

    @Column(name = "from_status")
    public String fromStatus;

    @Column(name = "to_status", nullable = false)
    public String toStatus;

    @Column(name = "from_location")
    public String fromLocation;

    @Column(name = "to_location", nullable = false)
    public String toLocation;

    @Column(nullable = false)
    public Instant timestamp;
}
