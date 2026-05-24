package com.cadenasuministros.application.usecase;

import com.cadenasuministros.domain.model.Shipment;
import com.cadenasuministros.domain.model.ShipmentEvent;
import com.cadenasuministros.domain.port.in.TrackShipmentUseCase;
import com.cadenasuministros.domain.port.out.ShipmentEventRepository;
import com.cadenasuministros.domain.port.out.ShipmentRepository;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public class TrackShipmentService implements TrackShipmentUseCase {

    private final ShipmentRepository shipmentRepository;
    private final ShipmentEventRepository eventRepository;

    public TrackShipmentService(ShipmentRepository shipmentRepository, ShipmentEventRepository eventRepository) {
        this.shipmentRepository = shipmentRepository;
        this.eventRepository = eventRepository;
    }

    @Override
    public Shipment getById(UUID shipmentId) {
        return shipmentRepository.findShipmentById(shipmentId)
                .orElseThrow(() -> new IllegalArgumentException("Shipment not found: " + shipmentId));
    }

    @Override
    public List<Shipment> listAll() {
        return shipmentRepository.listAllShipments();
    }

    @Override
    public Shipment create(Shipment shipment) {
        Shipment saved = shipmentRepository.save(shipment);
        eventRepository.save(new ShipmentEvent(
                UUID.randomUUID(),
                saved.id(),
                null,
                saved.status(),
                null,
                saved.currentLocation(),
                Instant.now()
        ));
        return saved;
    }

    @Override
    public Shipment updateStatus(UUID shipmentId, String newStatus) {
        Shipment current = getById(shipmentId);
        if (current.status().equals(newStatus)) return current;

        Shipment updated = current.withStatus(newStatus);
        Shipment saved = shipmentRepository.save(updated);

        eventRepository.save(new ShipmentEvent(
                UUID.randomUUID(),
                shipmentId,
                current.status(),
                newStatus,
                current.currentLocation(),
                saved.currentLocation(),
                Instant.now()
        ));
        return saved;
    }

    @Override
    public Shipment updateLocation(UUID shipmentId, String newLocation) {
        Shipment current = getById(shipmentId);
        if (current.currentLocation().equals(newLocation)) return current;

        Shipment updated = current.withLocation(newLocation);
        Shipment saved = shipmentRepository.save(updated);

        eventRepository.save(new ShipmentEvent(
                UUID.randomUUID(),
                shipmentId,
                current.status(),
                saved.status(),
                current.currentLocation(),
                newLocation,
                Instant.now()
        ));
        return saved;
    }

    @Override
    public List<ShipmentEvent> getHistory(UUID shipmentId) {
        return eventRepository.findByShipmentIdOrderByTimestampDesc(shipmentId);
    }
}
