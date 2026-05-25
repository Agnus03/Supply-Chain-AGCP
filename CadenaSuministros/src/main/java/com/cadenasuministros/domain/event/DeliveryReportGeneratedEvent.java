package com.cadenasuministros.domain.event;

import java.time.Instant;

import com.cadenasuministros.domain.model.DeliveryReport;

public class DeliveryReportGeneratedEvent {

    private final DeliveryReport report;
    private final Instant occurredOn;

    public DeliveryReportGeneratedEvent(DeliveryReport report) {
        this.report = report;
        this.occurredOn = Instant.now();
    }

    public DeliveryReport getReport() {
        return report;
    }

    public Instant getOccurredOn() {
        return occurredOn;
    }
}
