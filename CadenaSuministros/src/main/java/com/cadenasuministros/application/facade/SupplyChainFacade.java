package com.cadenasuministros.application.facade;

import java.util.List;
import java.util.UUID;

public interface SupplyChainFacade {

    ShipmentInfo createShipment(UUID productId, String productName, Integer quantity);

    ShipmentInfo getShipmentInfo(UUID shipmentId);

    List<ShipmentInfo> listAllShipmentInfos();

    ShipmentStatus trackShipment(UUID shipmentId);

    SensorReadingResult registerSensorReading(
            UUID shipmentId,
            Double temperatureC,
            Double humidityPct,
            Double latitude,
            Double longitude
    );

    Dashboard getShipmentDashboard(UUID shipmentId);

    DeliveryReportInfo generateDeliveryReport(UUID shipmentId);
}