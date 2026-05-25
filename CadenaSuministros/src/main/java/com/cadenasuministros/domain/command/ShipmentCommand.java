package com.cadenasuministros.domain.command;

import com.cadenasuministros.domain.model.Shipment;
import java.util.Optional;
import java.util.UUID;

public interface ShipmentCommand {
    Shipment execute();
    Optional<Shipment> undo();
    String getDescription();
    UUID getShipmentId();
}
