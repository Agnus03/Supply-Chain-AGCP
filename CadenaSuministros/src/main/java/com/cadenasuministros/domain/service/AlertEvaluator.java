package com.cadenasuministros.domain.service;

public class AlertEvaluator {

    private final double tempMin;
    private final double tempMax;
    private final double humMin;
    private final double humMax;

    public AlertEvaluator(double tempMin, double tempMax, double humMin, double humMax) {
        this.tempMin = tempMin;
        this.tempMax = tempMax;
        this.humMin = humMin;
        this.humMax = humMax;
    }

    public boolean isTemperatureAlert(Double temperatureC) {
        return temperatureC != null && (temperatureC < tempMin || temperatureC > tempMax);
    }

    public boolean isHumidityAlert(Double humidityPct) {
        return humidityPct != null && (humidityPct < humMin || humidityPct > humMax);
    }

    public boolean isAnyAlert(Double temperatureC, Double humidityPct) {
        return isTemperatureAlert(temperatureC) || isHumidityAlert(humidityPct);
    }

    public double getTempMin() { return tempMin; }
    public double getTempMax() { return tempMax; }
    public double getHumMin() { return humMin; }
    public double getHumMax() { return humMax; }
}
