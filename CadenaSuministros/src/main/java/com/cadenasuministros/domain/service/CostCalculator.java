package com.cadenasuministros.domain.service;

import com.cadenasuministros.domain.model.ShippingCost;
import com.cadenasuministros.domain.port.out.ShippingCostRepository;
import com.cadenasuministros.domain.strategy.CostCalculationStrategy;
import com.cadenasuministros.domain.strategy.StandardCostStrategy;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class CostCalculator {

    private final List<CostCalculationStrategy> strategies;
    private final RouteCalculator routeCalculator;
    private final ShippingCostRepository shippingCostRepository;

    public CostCalculator(List<CostCalculationStrategy> strategies, RouteCalculator routeCalculator, ShippingCostRepository shippingCostRepository) {
        this.strategies = strategies;
        this.routeCalculator = routeCalculator;
        this.shippingCostRepository = shippingCostRepository;
    }

    public ShippingCost calculate(UUID shipmentId, String origin, String destination, int alertCount, String productName) {
        double distanceKm = routeCalculator.calculateDistance(origin, destination);
        CostCalculationStrategy strategy = selectStrategy(productName);
        ShippingCost cost = buildCost(shipmentId, distanceKm, alertCount, strategy);
        return shippingCostRepository.save(cost);
    }

    public List<ShippingCost> previewAllStrategies(UUID shipmentId, String origin, String destination, int alertCount) {
        double distanceKm = routeCalculator.calculateDistance(origin, destination);
        return strategies.stream()
                .map(strategy -> buildCost(shipmentId, distanceKm, alertCount, strategy))
                .collect(Collectors.toList());
    }

    private ShippingCost buildCost(UUID shipmentId, double distanceKm, int alertCount, CostCalculationStrategy strategy) {
        double baseRate = strategy.calculateBaseRate();
        double distanceCost = Math.round(distanceKm * strategy.calculateRatePerKm() * 100.0) / 100.0;
        double extraCharges = alertCount * strategy.calculateExtraChargePerAlert();
        double totalCost = baseRate + distanceCost + extraCharges;
        return new ShippingCost(
                UUID.randomUUID(), shipmentId,
                baseRate, Math.round(distanceKm * 100.0) / 100.0, distanceCost, extraCharges, totalCost, "COP", Instant.now(),
                strategy.getName()
        );
    }

    private CostCalculationStrategy selectStrategy(String productName) {
        return strategies.stream()
                .filter(s -> s.supports(productName))
                .findFirst()
                .orElse(getFallbackStrategy());
    }

    private CostCalculationStrategy getFallbackStrategy() {
        return strategies.stream()
                .filter(s -> s instanceof StandardCostStrategy)
                .findFirst()
                .orElseThrow(() -> new IllegalStateException("No default CostCalculationStrategy available"));
    }
}
