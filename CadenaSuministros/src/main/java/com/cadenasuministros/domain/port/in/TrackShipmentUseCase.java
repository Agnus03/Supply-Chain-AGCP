package com.cadenasuministros.domain.port.in;

import com.cadenasuministros.domain.model.Shipment;
import com.cadenasuministros.domain.model.ShipmentEvent;

import java.util.List;
import java.util.UUID;

public interface TrackShipmentUseCase {
    Shipment getById(UUID shipmentId);
    Shipment create(Shipment shipment);
    Shipment updateStatus(UUID shipmentId, String newStatus);
    Shipment updateLocation(UUID shipmentId, String newLocation);
    List<Shipment> listAll();
    List<ShipmentEvent> getHistory(UUID shipmentId);
}