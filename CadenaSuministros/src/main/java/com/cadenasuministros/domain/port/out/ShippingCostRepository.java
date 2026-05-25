package com.cadenasuministros.domain.port.out;

import com.cadenasuministros.domain.model.ShippingCost;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ShippingCostRepository {
    ShippingCost save(ShippingCost cost);
    Optional<ShippingCost> findByShipmentId(UUID shipmentId);
    List<ShippingCost> listAll();
}
