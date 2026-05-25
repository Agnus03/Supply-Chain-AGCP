package com.cadenasuministros.domain.port.out;

import com.cadenasuministros.domain.model.ShipmentEvent;
import java.util.List;
import java.util.UUID;

public interface ShipmentEventRepository {
    ShipmentEvent save(ShipmentEvent event);
    List<ShipmentEvent> findByShipmentIdOrderByTimestampDesc(UUID shipmentId);
}
