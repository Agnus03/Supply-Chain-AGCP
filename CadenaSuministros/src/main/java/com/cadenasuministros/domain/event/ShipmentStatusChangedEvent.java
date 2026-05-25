package com.cadenasuministros.domain.event;

import java.time.Instant;
import java.util.UUID;

public class ShipmentStatusChangedEvent {

    private final UUID shipmentId;
    private final String fromStatus;
    private final String toStatus;
    private final Instant occurredOn;

    public ShipmentStatusChangedEvent(UUID shipmentId, String fromStatus, String toStatus) {
        this.shipmentId = shipmentId;
        this.fromStatus = fromStatus;
        this.toStatus = toStatus;
        this.occurredOn = Instant.now();
    }

    public UUID getShipmentId() {
        return shipmentId;
    }

    public String getFromStatus() {
        return fromStatus;
    }

    public String getToStatus() {
        return toStatus;
    }

    public Instant getOccurredOn() {
        return occurredOn;
    }
}
