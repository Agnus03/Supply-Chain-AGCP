package com.cadenasuministros.domain.strategy;

import org.springframework.stereotype.Component;

@Component
public class ExpressCostStrategy implements CostCalculationStrategy {

    private static final double BASE_RATE = 100000.0;
    private static final double RATE_PER_KM = 3500.0;
    private static final double EXTRA_CHARGE_PER_ALERT = 25000.0;

    @Override
    public boolean supports(String productName) {
        if (productName == null) return false;
        return productName.toLowerCase().contains("express");
    }

    @Override
    public double calculateBaseRate() {
        return BASE_RATE;
    }

    @Override
    public double calculateRatePerKm() {
        return RATE_PER_KM;
    }

    @Override
    public double calculateExtraChargePerAlert() {
        return EXTRA_CHARGE_PER_ALERT;
    }

    @Override
    public String getName() {
        return "Express";
    }
}
