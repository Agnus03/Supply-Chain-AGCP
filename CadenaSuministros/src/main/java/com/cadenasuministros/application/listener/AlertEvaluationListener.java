package com.cadenasuministros.application.listener;

import com.cadenasuministros.domain.event.AlertTriggeredEvent;
import com.cadenasuministros.domain.event.SensorReadingRegisteredEvent;
import com.cadenasuministros.domain.model.SensorReading;
import com.cadenasuministros.domain.service.AlertEvaluator;

import org.springframework.context.ApplicationEventPublisher;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

@Component
public class AlertEvaluationListener {

    private final AlertEvaluator alertEvaluator;
    private final ApplicationEventPublisher eventPublisher;

    public AlertEvaluationListener(AlertEvaluator alertEvaluator, ApplicationEventPublisher eventPublisher) {
        this.alertEvaluator = alertEvaluator;
        this.eventPublisher = eventPublisher;
    }

    @EventListener
    public void onSensorReadingRegistered(SensorReadingRegisteredEvent event) {
        SensorReading reading = event.getReading();
        boolean tempAlert = alertEvaluator.isTemperatureAlert(reading.temperatureC());
        boolean humAlert = alertEvaluator.isHumidityAlert(reading.humidityPct());

        if (tempAlert || humAlert) {
            String reason;
            if (tempAlert && humAlert) {
                reason = "Temp y Hum fuera de rango";
            } else if (tempAlert) {
                reason = "Temperatura fuera de rango (" +
                    alertEvaluator.getTempMin() + "-" + alertEvaluator.getTempMax() + "°C)";
            } else {
                reason = "Humedad fuera de rango (" +
                    alertEvaluator.getHumMin() + "-" + alertEvaluator.getHumMax() + "%)";
            }

            eventPublisher.publishEvent(new AlertTriggeredEvent(reading, reason));
        }
    }
}
