package com.cadenasuministros.adapters.outbound.persistence.jpa;

import com.cadenasuministros.domain.model.ShippingCost;
import com.cadenasuministros.domain.port.out.ShippingCostRepository;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Component
public class ShippingCostJpaAdapter implements ShippingCostRepository {

    private final SpringDataShippingCostRepository repo;

    public ShippingCostJpaAdapter(SpringDataShippingCostRepository repo) {
        this.repo = repo;
    }

    @Override
    public ShippingCost save(ShippingCost cost) {
        return toDomain(repo.save(toEntity(cost)));
    }

    @Override
    public Optional<ShippingCost> findByShipmentId(UUID shipmentId) {
        return repo.findByShipmentId(shipmentId).map(this::toDomain);
    }

    @Override
    public List<ShippingCost> listAll() {
        return repo.findAll().stream().map(this::toDomain).collect(Collectors.toList());
    }

    private ShippingCost toDomain(ShippingCostJpaEntity e) {
        String sn = e.getStrategyName();
        if (sn == null || sn.isBlank()) sn = "Standard";
        return new ShippingCost(e.getId(), e.getShipmentId(), e.getBaseRate(),
                e.getDistanceKm(), e.getDistanceCost(), e.getExtraCharges(),
                e.getTotalCost(), e.getCurrency(), e.getCalculatedAt(),
                sn);
    }

    private ShippingCostJpaEntity toEntity(ShippingCost d) {
        return new ShippingCostJpaEntity(d.id(), d.shipmentId(), d.baseRate(),
                d.distanceKm(), d.distanceCost(), d.extraCharges(),
                d.totalCost(), d.currency(), d.calculatedAt(), d.strategyName());
    }
}
