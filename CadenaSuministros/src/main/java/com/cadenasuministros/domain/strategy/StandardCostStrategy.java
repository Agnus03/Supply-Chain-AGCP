package com.cadenasuministros.domain.strategy;

import org.springframework.stereotype.Component;

@Component
public class StandardCostStrategy implements CostCalculationStrategy {

    private static final double BASE_RATE = 50000.0;
    private static final double RATE_PER_KM = 2000.0;
    private static final double EXTRA_CHARGE_PER_ALERT = 15000.0;

    @Override
    public boolean supports(String productName) {
        return false;
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
        return "Standard";
    }
}
