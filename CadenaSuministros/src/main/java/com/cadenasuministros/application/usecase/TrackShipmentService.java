package com.cadenasuministros.application.usecase;

import com.cadenasuministros.domain.command.CreateShipmentCommand;
import com.cadenasuministros.domain.command.ShipmentCommandInvoker;
import com.cadenasuministros.domain.command.UpdateLocationCommand;
import com.cadenasuministros.domain.command.UpdateStatusCommand;
import com.cadenasuministros.domain.model.Shipment;
import com.cadenasuministros.domain.model.ShipmentEvent;
import com.cadenasuministros.domain.port.in.TrackShipmentUseCase;
import com.cadenasuministros.domain.port.out.ShipmentEventRepository;
import com.cadenasuministros.domain.port.out.ShipmentRepository;

import org.springframework.context.ApplicationEventPublisher;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public class TrackShipmentService implements TrackShipmentUseCase {

    private final ShipmentRepository shipmentRepository;
    private final ShipmentEventRepository eventRepository;
    private final ApplicationEventPublisher eventPublisher;
    private final ShipmentCommandInvoker invoker;

    public TrackShipmentService(
            ShipmentRepository shipmentRepository,
            ShipmentEventRepository eventRepository,
            ApplicationEventPublisher eventPublisher) {
        this.shipmentRepository = shipmentRepository;
        this.eventRepository = eventRepository;
        this.eventPublisher = eventPublisher;
        this.invoker = new ShipmentCommandInvoker();
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
    @Transactional
    public Shipment create(Shipment shipment) {
        return invoker.execute(new CreateShipmentCommand(
                shipmentRepository,
                eventRepository,
                shipment.productId(),
                shipment.status(),
                shipment.currentLocation()
        ));
    }

    @Override
    @Transactional
    public Shipment updateStatus(UUID shipmentId, String newStatus) {
        return invoker.execute(new UpdateStatusCommand(
                shipmentRepository, eventRepository, eventPublisher,
                shipmentId, newStatus));
    }

    @Override
    @Transactional
    public Shipment updateLocation(UUID shipmentId, String newLocation) {
        return invoker.execute(new UpdateLocationCommand(
                shipmentRepository, eventRepository, eventPublisher,
                shipmentId, newLocation));
    }

    @Override
    @Transactional
    public Optional<Shipment> undoLast() {
        return invoker.undoLast();
    }

    @Override
    @Transactional
    public Optional<Shipment> undoForShipment(UUID shipmentId) {
        return invoker.undoForShipment(shipmentId);
    }

    @Override
    public List<String> getCommandHistory() {
        return invoker.getHistory();
    }

    @Override
    public List<ShipmentEvent> getHistory(UUID shipmentId) {
        return eventRepository.findByShipmentIdOrderByTimestampDesc(shipmentId);
    }
}
