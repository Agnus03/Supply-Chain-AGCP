package com.cadenasuministros.application.factory;

import com.cadenasuministros.application.usecase.TrackShipmentService;
import com.cadenasuministros.domain.port.in.TrackShipmentUseCase;
import com.cadenasuministros.domain.port.out.ShipmentEventRepository;
import com.cadenasuministros.domain.port.out.ShipmentRepository;

import org.springframework.context.ApplicationEventPublisher;

public class TrackShipmentServiceFactory extends TrackShipmentUseCaseFactory {

    private final ShipmentRepository shipmentRepository;
    private final ShipmentEventRepository eventRepository;
    private final ApplicationEventPublisher eventPublisher;

    public TrackShipmentServiceFactory(
            ShipmentRepository shipmentRepository,
            ShipmentEventRepository eventRepository,
            ApplicationEventPublisher eventPublisher) {
        this.shipmentRepository = shipmentRepository;
        this.eventRepository = eventRepository;
        this.eventPublisher = eventPublisher;
    }

    @Override
    protected TrackShipmentUseCase buildUseCase() {
        return new TrackShipmentService(shipmentRepository, eventRepository, eventPublisher);
    }
}
