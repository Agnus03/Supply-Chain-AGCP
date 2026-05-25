package com.cadenasuministros.domain.strategy;

import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class RefrigeratedCostStrategy implements CostCalculationStrategy {

    private static final double BASE_RATE = 80000.0;
    private static final double RATE_PER_KM = 2500.0;
    private static final double EXTRA_CHARGE_PER_ALERT = 20000.0;

    private static final List<String> REFRIGERATED_KEYWORDS = List.of(
        "fresa", "lechuga", "lulo", "leche", "carne",
        "pollo", "pescado", "mora", "aguacate", "tomate",
        "limón", "maracuyá", "espinaca", "brocoli", "cebolla"
    );

    @Override
    public boolean supports(String productName) {
        if (productName == null) return false;
        String lower = productName.toLowerCase();
        return REFRIGERATED_KEYWORDS.stream().anyMatch(lower::contains);
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
        return "Refrigerado";
    }
}
