package com.cadenasuministros.domain.command;

import com.cadenasuministros.domain.event.ShipmentStatusChangedEvent;
import com.cadenasuministros.domain.model.Shipment;
import com.cadenasuministros.domain.model.ShipmentEvent;
import com.cadenasuministros.domain.port.out.ShipmentEventRepository;
import com.cadenasuministros.domain.port.out.ShipmentRepository;

import org.springframework.context.ApplicationEventPublisher;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

public class UpdateStatusCommand implements ShipmentCommand {

    private final ShipmentRepository shipmentRepository;
    private final ShipmentEventRepository eventRepository;
    private final ApplicationEventPublisher eventPublisher;
    private final UUID shipmentId;
    private final String newStatus;

    private Shipment previousState;

    public UpdateStatusCommand(
            ShipmentRepository shipmentRepository,
            ShipmentEventRepository eventRepository,
            ApplicationEventPublisher eventPublisher,
            UUID shipmentId,
            String newStatus) {
        this.shipmentRepository = shipmentRepository;
        this.eventRepository = eventRepository;
        this.eventPublisher = eventPublisher;
        this.shipmentId = shipmentId;
        this.newStatus = newStatus;
    }

    @Override
    public Shipment execute() {
        Shipment current = shipmentRepository.findShipmentById(shipmentId)
                .orElseThrow(() -> new IllegalArgumentException("Shipment not found: " + shipmentId));
        if (current.status().equals(newStatus)) {
            eventPublisher.publishEvent(new ShipmentStatusChangedEvent(
                    shipmentId, current.status(), newStatus));
            return current;
        }

        this.previousState = current;

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

        eventPublisher.publishEvent(new ShipmentStatusChangedEvent(
                shipmentId, current.status(), newStatus));
        return saved;
    }

    @Override
    public Optional<Shipment> undo() {
        if (previousState == null) return Optional.empty();
        Shipment restored = shipmentRepository.save(previousState);
        eventRepository.save(new ShipmentEvent(
                UUID.randomUUID(),
                shipmentId,
                newStatus,
                previousState.status(),
                previousState.currentLocation(),
                previousState.currentLocation(),
                Instant.now()
        ));
        eventPublisher.publishEvent(new ShipmentStatusChangedEvent(
                shipmentId, newStatus, previousState.status()));
        return Optional.of(restored);
    }

    @Override
    public String getDescription() {
        return "UpdateStatus: " + shipmentId + " \u2192 " + newStatus;
    }

    @Override
    public UUID getShipmentId() {
        return shipmentId;
    }
}
