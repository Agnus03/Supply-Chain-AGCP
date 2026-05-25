package com.cadenasuministros.domain.event;

import java.time.Instant;
import java.util.UUID;

public class ShipmentLocationChangedEvent {

    private final UUID shipmentId;
    private final String fromLocation;
    private final String toLocation;
    private final Instant occurredOn;

    public ShipmentLocationChangedEvent(UUID shipmentId, String fromLocation, String toLocation) {
        this.shipmentId = shipmentId;
        this.fromLocation = fromLocation;
        this.toLocation = toLocation;
        this.occurredOn = Instant.now();
    }

    public UUID getShipmentId() {
        return shipmentId;
    }

    public String getFromLocation() {
        return fromLocation;
    }

    public String getToLocation() {
        return toLocation;
    }

    public Instant getOccurredOn() {
        return occurredOn;
    }
}
