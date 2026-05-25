package com.cadenasuministros.domain.command;

import com.cadenasuministros.domain.event.ShipmentLocationChangedEvent;
import com.cadenasuministros.domain.model.Shipment;
import com.cadenasuministros.domain.model.ShipmentEvent;
import com.cadenasuministros.domain.port.out.ShipmentEventRepository;
import com.cadenasuministros.domain.port.out.ShipmentRepository;

import org.springframework.context.ApplicationEventPublisher;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

public class UpdateLocationCommand implements ShipmentCommand {

    private final ShipmentRepository shipmentRepository;
    private final ShipmentEventRepository eventRepository;
    private final ApplicationEventPublisher eventPublisher;
    private final UUID shipmentId;
    private final String newLocation;

    private Shipment previousState;

    public UpdateLocationCommand(
            ShipmentRepository shipmentRepository,
            ShipmentEventRepository eventRepository,
            ApplicationEventPublisher eventPublisher,
            UUID shipmentId,
            String newLocation) {
        this.shipmentRepository = shipmentRepository;
        this.eventRepository = eventRepository;
        this.eventPublisher = eventPublisher;
        this.shipmentId = shipmentId;
        this.newLocation = newLocation;
    }

    @Override
    public Shipment execute() {
        Shipment current = shipmentRepository.findShipmentById(shipmentId)
                .orElseThrow(() -> new IllegalArgumentException("Shipment not found: " + shipmentId));
        if (current.currentLocation().equals(newLocation)) return current;

        this.previousState = current;

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

        eventPublisher.publishEvent(new ShipmentLocationChangedEvent(
                shipmentId, current.currentLocation(), newLocation));
        return saved;
    }

    @Override
    public Optional<Shipment> undo() {
        if (previousState == null) return Optional.empty();
        Shipment restored = shipmentRepository.save(previousState);
        eventRepository.save(new ShipmentEvent(
                UUID.randomUUID(),
                shipmentId,
                previousState.status(),
                previousState.status(),
                newLocation,
                previousState.currentLocation(),
                Instant.now()
        ));
        eventPublisher.publishEvent(new ShipmentLocationChangedEvent(
                shipmentId, newLocation, previousState.currentLocation()));
        return Optional.of(restored);
    }

    @Override
    public String getDescription() {
        return "UpdateLocation: " + shipmentId + " \u2192 " + newLocation;
    }

    @Override
    public UUID getShipmentId() {
        return shipmentId;
    }
}
