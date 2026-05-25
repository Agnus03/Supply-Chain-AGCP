package com.cadenasuministros.adapters.outbound.events;

import com.cadenasuministros.domain.event.AlertTriggeredEvent;
import com.cadenasuministros.domain.event.DeliveryReportGeneratedEvent;
import com.cadenasuministros.domain.event.SensorReadingRegisteredEvent;
import com.cadenasuministros.domain.event.ShipmentLocationChangedEvent;
import com.cadenasuministros.domain.event.ShipmentStatusChangedEvent;

import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;

@Component
public class EventWebSocketBridge {

    private final SimpMessagingTemplate messagingTemplate;

    public EventWebSocketBridge(SimpMessagingTemplate messagingTemplate) {
        this.messagingTemplate = messagingTemplate;
    }

    @EventListener
    public void onSensorReading(SensorReadingRegisteredEvent event) {
        messagingTemplate.convertAndSend("/topic/sensors", event.getReading());
    }

    @EventListener
    public void onAlert(AlertTriggeredEvent event) {
        messagingTemplate.convertAndSend("/topic/alerts", event);
    }

    @EventListener
    public void onShipmentStatus(ShipmentStatusChangedEvent event) {
        messagingTemplate.convertAndSend("/topic/shipments/status", event);
    }

    @EventListener
    public void onShipmentLocation(ShipmentLocationChangedEvent event) {
        messagingTemplate.convertAndSend("/topic/shipments/location", event);
    }

    @EventListener
    public void onDeliveryReport(DeliveryReportGeneratedEvent event) {
        messagingTemplate.convertAndSend("/topic/reports", event);
    }
}
