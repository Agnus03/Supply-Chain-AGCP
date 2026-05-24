package com.cadenasuministros.adapters.outbound.persistence.jpa;

import org.springframework.stereotype.Component;
import com.cadenasuministros.domain.model.Shipment;
import com.cadenasuministros.domain.model.DeliveryReport;
import com.cadenasuministros.domain.model.SensorReading;
import com.cadenasuministros.domain.model.Product;
import com.cadenasuministros.domain.port.out.DeliveryReportRepository;
import com.cadenasuministros.domain.port.out.SensorReadingRepository;
import com.cadenasuministros.domain.port.out.ShipmentRepository;
import com.cadenasuministros.domain.port.out.ProductRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Component
public class JpaAdapters implements ShipmentRepository, SensorReadingRepository, DeliveryReportRepository, ProductRepository {

    private final SpringDataShipmentRepository shipmentRepo;
    private final SpringDataSensorReadingRepository sensorRepo;
    private final SpringDataDeliveryReportRepository deliveryReportRepo;
    private final SpringDataProductRepository productRepo;
    
    public JpaAdapters(SpringDataShipmentRepository shipmentRepo,
                       SpringDataSensorReadingRepository sensorRepo,
                       SpringDataDeliveryReportRepository deliveryReportRepo,
                       SpringDataProductRepository productRepo) {
        this.shipmentRepo = shipmentRepo;
        this.sensorRepo = sensorRepo;
        this.deliveryReportRepo = deliveryReportRepo;
        this.productRepo = productRepo;
    }
    
    @Override
    public DeliveryReport save(DeliveryReport report) {
        DeliveryReportJpaEntity e = toEntity(report);
        DeliveryReportJpaEntity saved = deliveryReportRepo.save(e);
        return toDomain(saved);
    }

    @Override
    public Optional<Shipment> findShipmentById(UUID id) {
        return shipmentRepo.findById(id).map(this::toDomain);
    }

    @Override
    public Shipment save(Shipment shipment) {
        ShipmentJpaEntity e = toEntity(shipment);
        ShipmentJpaEntity saved = shipmentRepo.save(e);
        return toDomain(saved);
    }

    @Override
    public SensorReading save(SensorReading reading) {
        if (reading.shipmentId() == null) {
            throw new IllegalArgumentException("No se puede guardar lectura sin shipmentId");
        }
        SensorReadingJpaEntity e = toEntity(reading);
        SensorReadingJpaEntity saved = sensorRepo.save(e);
        return toDomain(saved);
    }

    private Shipment toDomain(ShipmentJpaEntity e) {
        return new Shipment(e.id, e.productId, e.status, e.currentLocation, e.updatedAt);
    }

    private ShipmentJpaEntity toEntity(Shipment d) {
        ShipmentJpaEntity e = new ShipmentJpaEntity();
        e.id = d.id();
        e.productId = d.productId();
        e.status = d.status();
        e.currentLocation = d.currentLocation();
        e.updatedAt = d.updatedAt();
        return e;
    }

    private SensorReading toDomain(SensorReadingJpaEntity e) {
        return new SensorReading(e.id, e.shipmentId, e.timestamp, e.temperatureC, e.humidityPct, e.latitude, e.longitude, e.acknowledged != null && e.acknowledged);
    }

    private SensorReadingJpaEntity toEntity(SensorReading d) {
        SensorReadingJpaEntity e = new SensorReadingJpaEntity();
        e.id = d.id();
        e.shipmentId = d.shipmentId();
        e.timestamp = d.timestamp();
        e.temperatureC = d.temperatureC();
        e.humidityPct = d.humidityPct();
        e.latitude = d.latitude();
        e.longitude = d.longitude();
        e.acknowledged = d.acknowledged();
        return e;
    }

    @Override
    public List<SensorReading> listAll() {
        return sensorRepo.findAll().stream()
            .map(this::toDomain)
            .collect(Collectors.toList());
    }
    
    private DeliveryReport toDomain(DeliveryReportJpaEntity e) {
        return new DeliveryReport.Builder()
            .reportId(e.getReportId())
            .shipmentId(e.getShipmentId())
            .productId(e.getProductId())
            .origin(e.getOrigin())
            .destination(e.getDestination())
            .dispatchTime(e.getDispatchTime())
            .deliveryTime(e.getDeliveryTime())
            .averageTemperature(e.getAverageTemperature())
            .averageHumidity(e.getAverageHumidity())
            .temperatureAlert(e.getTemperatureAlert())
            .humidityAlert(e.getHumidityAlert())
            .deliveryStatus(e.getDeliveryStatus())
            .observations(e.getObservations())
            .build();
    }

    private DeliveryReportJpaEntity toEntity(DeliveryReport d) {
        DeliveryReportJpaEntity e = new DeliveryReportJpaEntity();
        e.setReportId(d.getReportId());
        e.setShipmentId(d.getShipmentId());
        e.setProductId(d.getProductId());
        e.setOrigin(d.getOrigin());
        e.setDestination(d.getDestination());
        e.setDispatchTime(d.getDispatchTime());
        e.setDeliveryTime(d.getDeliveryTime());
        e.setAverageTemperature(d.getAverageTemperature());
        e.setAverageHumidity(d.getAverageHumidity());
        e.setTemperatureAlert(d.getTemperatureAlert());
        e.setHumidityAlert(d.getHumidityAlert());
        e.setDeliveryStatus(d.getDeliveryStatus());
        e.setObservations(d.getObservations());
        return e;
    }

    @Override
    public List<SensorReading> findByShipmentId(UUID shipmentId) {
        System.out.println("JpaAdapters.findByShipmentId called with: " + shipmentId);
        List<SensorReading> result = sensorRepo.findByShipmentId(shipmentId).stream()
                .map(this::toDomain)
                .collect(Collectors.toList());
        System.out.println("Found " + result.size() + " readings");
        return result;
    }

    @Override
    public List<Shipment> listAllShipments() {
        return shipmentRepo.findAll().stream()
            .map(this::toDomain)
            .collect(Collectors.toList());
    }

    @Override
    public Optional<Product> findProductById(UUID id) {
        return productRepo.findById(id).map(this::toDomainProduct);
    }

    @Override
    public List<Product> listAllProducts() {
        return productRepo.findAll().stream()
            .map(this::toDomainProduct)
            .collect(Collectors.toList());
    }

    @Override
    public Product save(Product product) {
        ProductJpaEntity e = toEntityProduct(product);
        ProductJpaEntity saved = productRepo.save(e);
        return toDomainProduct(saved);
    }

    private Product toDomainProduct(ProductJpaEntity e) {
        return new Product(e.id, e.sku, e.name);
    }

    private ProductJpaEntity toEntityProduct(Product d) {
        ProductJpaEntity e = new ProductJpaEntity();
        e.id = d.id();
        e.sku = d.sku();
        e.name = d.name();
        return e;
    }
}
