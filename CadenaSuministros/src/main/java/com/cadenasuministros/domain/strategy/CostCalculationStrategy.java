package com.cadenasuministros.domain.strategy;

public interface CostCalculationStrategy {
    boolean supports(String productName);
    double calculateBaseRate();
    double calculateRatePerKm();
    double calculateExtraChargePerAlert();
    String getName();
}
