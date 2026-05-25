package com.cadenasuministros.config;

import com.cadenasuministros.domain.model.SensorReading;
import com.cadenasuministros.domain.model.Shipment;
import com.cadenasuministros.domain.port.out.SensorReadingRepository;
import com.cadenasuministros.domain.port.out.ShipmentRepository;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.List;
import java.util.Random;
import java.util.UUID;

@Component
public class SensorSimulator {

    private static final double[] BOGOTA_COORDS = { 4.7110, -74.0721 };
    private static final double[] MEDELLIN_COORDS = { 6.2500, -75.5800 };
    private static final double[] CALI_COORDS = { 3.4516, -76.5320 };
    private static final double[] BARRANQUILLA_COORDS = { 10.9600, -74.7800 };
    private static final double[][] COORDS = {
        BOGOTA_COORDS, MEDELLIN_COORDS, CALI_COORDS, BARRANQUILLA_COORDS
    };

    private static final String[] LOCATIONS = {
        "BOGOTA", "MEDELLIN", "CALI", "BARRANQUILLA"
    };

    private final Random random = new Random();
    private final SensorReadingRepository sensorReadingRepository;
    private final ShipmentRepository shipmentRepository;

    public SensorSimulator(
            SensorReadingRepository sensorReadingRepository,
            ShipmentRepository shipmentRepository) {
        this.sensorReadingRepository = sensorReadingRepository;
        this.shipmentRepository = shipmentRepository;
    }

    @Scheduled(fixedRate = 3600000)
    public void generateReading() {
        List<Shipment> shipments = shipmentRepository.listAllShipments();

        if (shipments.isEmpty()) return;

        Shipment shipment = shipments.get(random.nextInt(shipments.size()));
        int idx = random.nextInt(COORDS.length);

        double temp = 18.0 + random.nextDouble() * 20.0;
        double hum = 40.0 + random.nextDouble() * 45.0;

        SensorReading reading = new SensorReading(
                UUID.randomUUID(),
                shipment.id(),
                Instant.now(),
                Math.round(temp * 10.0) / 10.0,
                Math.round(hum * 10.0) / 10.0,
                COORDS[idx][0],
                COORDS[idx][1]
        );

        sensorReadingRepository.save(reading);
    }
}
