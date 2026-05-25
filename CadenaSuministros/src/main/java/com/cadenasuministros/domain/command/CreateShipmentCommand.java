package com.cadenasuministros.domain.command;

import com.cadenasuministros.domain.model.Shipment;
import com.cadenasuministros.domain.model.ShipmentEvent;
import com.cadenasuministros.domain.port.out.ShipmentEventRepository;
import com.cadenasuministros.domain.port.out.ShipmentRepository;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

public class CreateShipmentCommand implements ShipmentCommand {

    private final ShipmentRepository shipmentRepository;
    private final ShipmentEventRepository eventRepository;
    private final UUID shipmentId;
    private final UUID productId;
    private final String status;
    private final String currentLocation;

    private Shipment createdShipment;

    public CreateShipmentCommand(
            ShipmentRepository shipmentRepository,
            ShipmentEventRepository eventRepository,
            UUID productId,
            String status,
            String currentLocation) {
        this.shipmentRepository = shipmentRepository;
        this.eventRepository = eventRepository;
        this.shipmentId = UUID.randomUUID();
        this.productId = productId;
        this.status = status;
        this.currentLocation = currentLocation;
    }

    @Override
    public Shipment execute() {
        Shipment shipment = new Shipment(
                shipmentId,
                productId,
                status != null ? status : "PENDING",
                currentLocation != null ? currentLocation : "WAREHOUSE",
                Instant.now()
        );
        Shipment saved = shipmentRepository.save(shipment);
        this.createdShipment = saved;

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
    public Optional<Shipment> undo() {
        if (createdShipment == null) return Optional.empty();
        Shipment cancelled = createdShipment.withStatus("CANCELLED");
        Shipment saved = shipmentRepository.save(cancelled);
        eventRepository.save(new ShipmentEvent(
                UUID.randomUUID(),
                saved.id(),
                createdShipment.status(),
                "CANCELLED",
                createdShipment.currentLocation(),
                saved.currentLocation(),
                Instant.now()
        ));
        return Optional.of(saved);
    }

    @Override
    public String getDescription() {
        return "CreateShipment: product=" + productId + " status=" + status;
    }

    @Override
    public UUID getShipmentId() {
        return shipmentId;
    }
}
