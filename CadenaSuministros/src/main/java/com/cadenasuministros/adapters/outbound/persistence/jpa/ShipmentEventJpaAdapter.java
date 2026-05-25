package com.cadenasuministros.adapters.outbound.persistence.jpa;

import com.cadenasuministros.domain.model.ShipmentEvent;
import com.cadenasuministros.domain.port.out.ShipmentEventRepository;
import org.springframework.stereotype.Component;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Component
public class ShipmentEventJpaAdapter implements ShipmentEventRepository {

    private final SpringDataShipmentEventRepository repo;

    public ShipmentEventJpaAdapter(SpringDataShipmentEventRepository repo) {
        this.repo = repo;
    }

    @Override
    public ShipmentEvent save(ShipmentEvent event) {
        ShipmentEventJpaEntity e = toEntity(event);
        return toDomain(repo.save(e));
    }

    @Override
    public List<ShipmentEvent> findByShipmentIdOrderByTimestampDesc(UUID shipmentId) {
        return repo.findByShipmentIdOrderByTimestampDesc(shipmentId).stream()
                .map(this::toDomain)
                .collect(Collectors.toList());
    }

    private ShipmentEvent toDomain(ShipmentEventJpaEntity e) {
        return new ShipmentEvent(
                e.id, e.shipmentId,
                e.fromStatus, e.toStatus,
                e.fromLocation, e.toLocation,
                e.timestamp
        );
    }

    private ShipmentEventJpaEntity toEntity(ShipmentEvent d) {
        ShipmentEventJpaEntity e = new ShipmentEventJpaEntity();
        e.id = d.id();
        e.shipmentId = d.shipmentId();
        e.fromStatus = d.fromStatus();
        e.toStatus = d.toStatus();
        e.fromLocation = d.fromLocation();
        e.toLocation = d.toLocation();
        e.timestamp = d.timestamp();
        return e;
    }
}
