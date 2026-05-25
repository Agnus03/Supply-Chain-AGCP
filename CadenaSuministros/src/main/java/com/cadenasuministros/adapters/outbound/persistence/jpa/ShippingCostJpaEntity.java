package com.cadenasuministros.adapters.outbound.persistence.jpa;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "shipping_costs")
public class ShippingCostJpaEntity {

    @Id
    private UUID id;

    @Column(name = "shipment_id", nullable = false)
    private UUID shipmentId;

    @Column(name = "base_rate", nullable = false)
    private double baseRate;

    @Column(name = "distance_km", nullable = false)
    private double distanceKm;

    @Column(name = "distance_cost", nullable = false)
    private double distanceCost;

    @Column(name = "extra_charges", nullable = false)
    private double extraCharges;

    @Column(name = "total_cost", nullable = false)
    private double totalCost;

    @Column(nullable = false)
    private String currency;

    @Column(name = "calculated_at", nullable = false)
    private Instant calculatedAt;

    @Column(name = "strategy_name")
    private String strategyName;

    public ShippingCostJpaEntity() {}

    public ShippingCostJpaEntity(UUID id, UUID shipmentId, double baseRate, double distanceKm, double distanceCost, double extraCharges, double totalCost, String currency, Instant calculatedAt, String strategyName) {
        this.id = id;
        this.shipmentId = shipmentId;
        this.baseRate = baseRate;
        this.distanceKm = distanceKm;
        this.distanceCost = distanceCost;
        this.extraCharges = extraCharges;
        this.totalCost = totalCost;
        this.currency = currency;
        this.calculatedAt = calculatedAt;
        this.strategyName = strategyName;
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public UUID getShipmentId() { return shipmentId; }
    public void setShipmentId(UUID shipmentId) { this.shipmentId = shipmentId; }
    public double getBaseRate() { return baseRate; }
    public void setBaseRate(double baseRate) { this.baseRate = baseRate; }
    public double getDistanceKm() { return distanceKm; }
    public void setDistanceKm(double distanceKm) { this.distanceKm = distanceKm; }
    public double getDistanceCost() { return distanceCost; }
    public void setDistanceCost(double distanceCost) { this.distanceCost = distanceCost; }
    public double getExtraCharges() { return extraCharges; }
    public void setExtraCharges(double extraCharges) { this.extraCharges = extraCharges; }
    public double getTotalCost() { return totalCost; }
    public void setTotalCost(double totalCost) { this.totalCost = totalCost; }
    public String getCurrency() { return currency; }
    public void setCurrency(String currency) { this.currency = currency; }
    public Instant getCalculatedAt() { return calculatedAt; }
    public void setCalculatedAt(Instant calculatedAt) { this.calculatedAt = calculatedAt; }
    public String getStrategyName() { return strategyName; }
    public void setStrategyName(String strategyName) { this.strategyName = strategyName; }
}
