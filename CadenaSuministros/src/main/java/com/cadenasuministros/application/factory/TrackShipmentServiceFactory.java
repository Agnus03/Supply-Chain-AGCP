package com.cadenasuministros.application.factory;

import com.cadenasuministros.application.usecase.TrackShipmentService;
import com.cadenasuministros.domain.port.in.TrackShipmentUseCase;
import com.cadenasuministros.domain.port.out.ShipmentEventRepository;
import com.cadenasuministros.domain.port.out.ShipmentRepository;

public class TrackShipmentServiceFactory extends TrackShipmentUseCaseFactory {

    private final ShipmentRepository shipmentRepository;
    private final ShipmentEventRepository eventRepository;

    public TrackShipmentServiceFactory(ShipmentRepository shipmentRepository, ShipmentEventRepository eventRepository) {
        this.shipmentRepository = shipmentRepository;
        this.eventRepository = eventRepository;
    }

    @Override
    protected TrackShipmentUseCase buildUseCase() {
        return new TrackShipmentService(shipmentRepository, eventRepository);
    }
}
