package com.cadenasuministros.config;

import com.cadenasuministros.domain.model.Product;
import com.cadenasuministros.domain.model.SensorReading;
import com.cadenasuministros.domain.model.Shipment;
import com.cadenasuministros.domain.model.ShipmentEvent;
import com.cadenasuministros.domain.port.out.ProductRepository;
import com.cadenasuministros.domain.port.out.SensorReadingRepository;
import com.cadenasuministros.domain.port.out.ShipmentEventRepository;
import com.cadenasuministros.domain.port.out.ShipmentRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.UUID;

@Component
public class DataInitializer implements CommandLineRunner {

    private final ProductRepository productRepository;
    private final ShipmentRepository shipmentRepository;
    private final SensorReadingRepository sensorReadingRepository;
    private final ShipmentEventRepository eventRepository;

    public DataInitializer(
            ProductRepository productRepository,
            ShipmentRepository shipmentRepository,
            SensorReadingRepository sensorReadingRepository,
            ShipmentEventRepository eventRepository) {
        this.productRepository = productRepository;
        this.shipmentRepository = shipmentRepository;
        this.sensorReadingRepository = sensorReadingRepository;
        this.eventRepository = eventRepository;
    }

    @Override
    public void run(String... args) {
        if (!productRepository.listAllProducts().isEmpty()) return;

        var fresa = productRepository.save(
                new Product(UUID.randomUUID(), "FRESA-001", "Fresa Orgánica"));
        var leche = productRepository.save(
                new Product(UUID.randomUUID(), "LECHE-001", "Leche Entera Pasteurizada"));
        var sensorIndustrial = productRepository.save(
                new Product(UUID.randomUUID(), "SENSOR-T-001", "Sensor Térmico Industrial"));

        var now = Instant.now();
        var envioFresa = shipmentRepository.save(
                new Shipment(UUID.randomUUID(), fresa.id(), "IN_TRANSIT", "BOGOTA", now));
        var envioLeche = shipmentRepository.save(
                new Shipment(UUID.randomUUID(), leche.id(), "PENDING", "WAREHOUSE", now));
        var envioSensor = shipmentRepository.save(
                new Shipment(UUID.randomUUID(), sensorIndustrial.id(), "DELIVERED", "BARRANQUILLA",
                        now.minus(1, ChronoUnit.DAYS)));

        recordEvent(envioFresa.id(), null, "IN_TRANSIT", null, "BOGOTA", now);
        recordEvent(envioLeche.id(), null, "PENDING", null, "WAREHOUSE", now);
        recordEvent(envioSensor.id(), null, "DELIVERED", null, "BARRANQUILLA",
                now.minus(1, ChronoUnit.DAYS));

        sensorReadingRepository.save(new SensorReading(
                UUID.randomUUID(), envioFresa.id(), now.minus(2, ChronoUnit.HOURS),
                22.5, 60.0, 4.7110, -74.0721));
        sensorReadingRepository.save(new SensorReading(
                UUID.randomUUID(), envioFresa.id(), now.minus(1, ChronoUnit.HOURS),
                25.0, 58.0, 4.6500, -74.0800));
        sensorReadingRepository.save(new SensorReading(
                UUID.randomUUID(), envioFresa.id(), now,
                35.0, 55.0, 4.6000, -74.0900));

        var horaSalida = now.minus(1, ChronoUnit.DAYS);
        sensorReadingRepository.save(new SensorReading(
                UUID.randomUUID(), envioSensor.id(), horaSalida,
                28.0, 70.0, 4.7110, -74.0721));
        sensorReadingRepository.save(new SensorReading(
                UUID.randomUUID(), envioSensor.id(), horaSalida.plus(6, ChronoUnit.HOURS),
                30.0, 68.0, 6.2500, -75.5800));
        sensorReadingRepository.save(new SensorReading(
                UUID.randomUUID(), envioSensor.id(), horaSalida.plus(12, ChronoUnit.HOURS),
                32.0, 65.0, 10.9600, -74.7800));
    }

    private void recordEvent(UUID shipmentId, String fromStatus, String toStatus,
                              String fromLocation, String toLocation, Instant timestamp) {
        eventRepository.save(new ShipmentEvent(
                UUID.randomUUID(), shipmentId,
                fromStatus, toStatus,
                fromLocation, toLocation,
                timestamp));
    }
}
