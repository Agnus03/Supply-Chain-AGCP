package com.cadenasuministros.application.facade;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.cadenasuministros.domain.model.DeliveryReport;
import com.cadenasuministros.domain.model.Product;
import com.cadenasuministros.domain.model.SensorReading;
import com.cadenasuministros.domain.model.Shipment;
import com.cadenasuministros.domain.port.in.GenerateDeliveryReportUseCase;
import com.cadenasuministros.domain.port.in.RegisterSensorReadingUseCase;
import com.cadenasuministros.domain.port.in.TrackShipmentUseCase;
import com.cadenasuministros.domain.port.out.ProductRepository;
import com.cadenasuministros.domain.port.out.SensorReadingRepository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class SupplyChainFacadeImplTest {

    @Mock
    private TrackShipmentUseCase trackShipmentUseCase;

    @Mock
    private RegisterSensorReadingUseCase registerSensorReadingUseCase;

    @Mock
    private GenerateDeliveryReportUseCase generateDeliveryReportUseCase;

    @Mock
    private SensorReadingRepository sensorReadingRepository;

    @Mock
    private ProductRepository productRepository;

    @InjectMocks
    private SupplyChainFacadeImpl facade;

    @BeforeEach
    void setUp() {
        lenient().when(productRepository.findProductById(any()))
                .thenReturn(Optional.of(new Product(UUID.randomUUID(), "SKU", "Producto Test")));
    }

    @Test
    void test_createShipment_returnsShipmentInfo() {
        UUID productId = UUID.randomUUID();
        UUID shipmentId = UUID.randomUUID();
        Instant now = Instant.now();

        Shipment mockShipment = new Shipment(
                shipmentId,
                productId,
                "PENDING",
                "WAREHOUSE",
                now
        );
        when(trackShipmentUseCase.create(any(Shipment.class))).thenReturn(mockShipment);

        ShipmentInfo result = facade.createShipment(productId, "SensorTemp-DHT22", 10);

        assertNotNull(result);
        assertEquals(shipmentId, result.id());
        assertEquals("PENDING", result.status());
        assertEquals("WAREHOUSE", result.currentLocation());
        assertEquals("SensorTemp-DHT22", result.productName());
        assertEquals(10, result.quantity());
    }

    @Test
    void test_createShipment_callsUseCase() {
        UUID productId = UUID.randomUUID();
        UUID shipmentId = UUID.randomUUID();
        Shipment mockShipment = new Shipment(
                shipmentId,
                productId,
                "PENDING",
                "WAREHOUSE",
                Instant.now()
        );
        when(trackShipmentUseCase.create(any(Shipment.class))).thenReturn(mockShipment);

        facade.createShipment(productId, "Sensor", 5);

        verify(trackShipmentUseCase).create(any(Shipment.class));
    }

    @Test
    void test_getShipmentInfo_returnsInfo() {
        UUID shipmentId = UUID.randomUUID();
        Instant now = Instant.now();

        Shipment mockShipment = new Shipment(
                shipmentId,
                UUID.randomUUID(),
                "IN_TRANSIT",
                "BOGOTA",
                now
        );
        when(trackShipmentUseCase.getById(shipmentId)).thenReturn(mockShipment);
        when(productRepository.findProductById(any())).thenReturn(Optional.of(new Product(UUID.randomUUID(), "SKU", "Test")));

        ShipmentInfo result = facade.getShipmentInfo(shipmentId);

        assertNotNull(result);
        assertEquals(shipmentId, result.id());
        assertEquals("IN_TRANSIT", result.status());
        assertEquals("BOGOTA", result.currentLocation());
        assertEquals("Test", result.productName());
    }

    @Test
    void test_trackShipment_returnsStatus() {
        UUID shipmentId = UUID.randomUUID();
        Instant now = Instant.now();

        Shipment mockShipment = new Shipment(
                shipmentId,
                UUID.randomUUID(),
                "IN_TRANSIT",
                "BOGOTA",
                now
        );
        when(trackShipmentUseCase.getById(shipmentId)).thenReturn(mockShipment);

        ShipmentStatus result = facade.trackShipment(shipmentId);

        assertNotNull(result);
        assertEquals("IN_TRANSIT", result.status());
        assertEquals("BOGOTA", result.currentLocation());
        assertEquals(shipmentId, result.shipmentId());
    }

    @Test
    void test_trackShipment_estimatesDeliveryForInTransit() {
        UUID shipmentId = UUID.randomUUID();
        when(trackShipmentUseCase.getById(any())).thenReturn(
                new Shipment(shipmentId, UUID.randomUUID(), "IN_TRANSIT", "LOC", Instant.now())
        );

        ShipmentStatus result = facade.trackShipment(shipmentId);

        assertEquals("2-3 días", result.estimatedDelivery());
    }

    @Test
    void test_trackShipment_estimatesDeliveryForDelivered() {
        UUID shipmentId = UUID.randomUUID();
        when(trackShipmentUseCase.getById(any())).thenReturn(
                new Shipment(shipmentId, UUID.randomUUID(), "DELIVERED", "LOC", Instant.now())
        );

        ShipmentStatus result = facade.trackShipment(shipmentId);

        assertEquals("Entregado", result.estimatedDelivery());
    }

    @Test
    void test_trackShipment_estimatesDeliveryForPending() {
        UUID shipmentId = UUID.randomUUID();
        when(trackShipmentUseCase.getById(any())).thenReturn(
                new Shipment(shipmentId, UUID.randomUUID(), "PENDING", "LOC", Instant.now())
        );

        ShipmentStatus result = facade.trackShipment(shipmentId);

        assertEquals("Por confirmar", result.estimatedDelivery());
    }

    @Test
    void test_registerSensorReading_returnsResult() {
        UUID shipmentId = UUID.randomUUID();
        Instant now = Instant.now();
        SensorReading mockReading = new SensorReading(
                UUID.randomUUID(),
                shipmentId,
                now,
                25.0,
                60.0,
                40.4,
                -3.7
        );
        when(registerSensorReadingUseCase.register(any())).thenReturn(mockReading);

        SensorReadingResult result = facade.registerSensorReading(
                shipmentId, 25.0, 60.0, 40.4, -3.7
        );

        assertNotNull(result);
        assertEquals(shipmentId, result.shipmentId());
        assertEquals(25.0, result.temperatureC());
        assertEquals(60.0, result.humidityPct());
        assertEquals(40.4, result.latitude());
        assertEquals(-3.7, result.longitude());
    }

    @Test
    void test_registerSensorReading_detectsAlertForHighTemperature() {
        UUID shipmentId = UUID.randomUUID();
        when(registerSensorReadingUseCase.register(any())).thenReturn(
                new SensorReading(UUID.randomUUID(), shipmentId, Instant.now(), 35.0, 60.0, 0.0, 0.0)
        );

        SensorReadingResult result = facade.registerSensorReading(shipmentId, 35.0, 60.0, 0.0, 0.0);

        assertTrue(result.alert());
    }

    @Test
    void test_registerSensorReading_detectsAlertForLowTemperature() {
        UUID shipmentId = UUID.randomUUID();
        when(registerSensorReadingUseCase.register(any())).thenReturn(
                new SensorReading(UUID.randomUUID(), shipmentId, Instant.now(), 1.0, 60.0, 0.0, 0.0)
        );

        SensorReadingResult result = facade.registerSensorReading(shipmentId, 1.0, 60.0, 0.0, 0.0);

        assertTrue(result.alert());
    }

    @Test
    void test_registerSensorReading_noAlertForNormalTemperature() {
        UUID shipmentId = UUID.randomUUID();
        when(registerSensorReadingUseCase.register(any())).thenReturn(
                new SensorReading(UUID.randomUUID(), shipmentId, Instant.now(), 22.0, 55.0, 0.0, 0.0)
        );

        SensorReadingResult result = facade.registerSensorReading(shipmentId, 22.0, 55.0, 0.0, 0.0);

        assertFalse(result.alert());
    }

    @Test
    void test_registerSensorReading_noAlertForNullTemperature() {
        UUID shipmentId = UUID.randomUUID();
        when(registerSensorReadingUseCase.register(any())).thenReturn(
                new SensorReading(UUID.randomUUID(), shipmentId, Instant.now(), null, 55.0, 0.0, 0.0)
        );

        SensorReadingResult result = facade.registerSensorReading(shipmentId, null, 55.0, 0.0, 0.0);

        assertFalse(result.alert());
    }

    @Test
    void test_getShipmentDashboard_returnsCompleteDashboard() {
        UUID shipmentId = UUID.randomUUID();
        Shipment mockShipment = new Shipment(
                shipmentId,
                UUID.randomUUID(),
                "IN_TRANSIT",
                "BOGOTA",
                Instant.now()
        );
        when(trackShipmentUseCase.getById(shipmentId)).thenReturn(mockShipment);
        when(sensorReadingRepository.findByShipmentId(shipmentId)).thenReturn(List.of());

        Dashboard result = facade.getShipmentDashboard(shipmentId);

        assertNotNull(result);
        assertEquals(shipmentId, result.shipmentId());
        assertEquals("IN_TRANSIT", result.shipmentStatus());
        assertEquals("BOGOTA", result.currentLocation());
    }

    @Test
    void test_getShipmentDashboard_includesSensorStats() {
        UUID shipmentId = UUID.randomUUID();
        Shipment mockShipment = new Shipment(
                shipmentId,
                UUID.randomUUID(),
                "IN_TRANSIT",
                "BOGOTA",
                Instant.now()
        );
        when(trackShipmentUseCase.getById(shipmentId)).thenReturn(mockShipment);

        List<SensorReading> readings = List.of(
                new SensorReading(UUID.randomUUID(), shipmentId, Instant.now(), 25.0, 60.0, 40.4, -3.7),
                new SensorReading(UUID.randomUUID(), shipmentId, Instant.now(), 26.0, 61.0, 40.4, -3.7)
        );
        when(sensorReadingRepository.findByShipmentId(shipmentId)).thenReturn(readings);

        Dashboard result = facade.getShipmentDashboard(shipmentId);

        assertNotNull(result.sensorStats());
        assertEquals(2, result.sensorStats().totalReadings());
        assertEquals(25.5, result.sensorStats().avgTemperature(), 0.1);
        assertEquals(60.5, result.sensorStats().avgHumidity(), 0.1);
    }

    @Test
    void test_getShipmentDashboard_generatesAlerts() {
        UUID shipmentId = UUID.randomUUID();
        Shipment mockShipment = new Shipment(
                shipmentId,
                UUID.randomUUID(),
                "IN_TRANSIT",
                "BOGOTA",
                Instant.now()
        );
        when(trackShipmentUseCase.getById(shipmentId)).thenReturn(mockShipment);

        List<SensorReading> readings = List.of(
                new SensorReading(UUID.randomUUID(), shipmentId, Instant.now(), 35.0, 60.0, 0.0, 0.0)
        );
        when(sensorReadingRepository.findByShipmentId(shipmentId)).thenReturn(readings);

        Dashboard result = facade.getShipmentDashboard(shipmentId);

        assertFalse(result.activeAlerts().isEmpty());
    }

    @Test
    void test_getShipmentDashboard_emptyReadings() {
        UUID shipmentId = UUID.randomUUID();
        Shipment mockShipment = new Shipment(
                shipmentId,
                UUID.randomUUID(),
                "PENDING",
                "WAREHOUSE",
                Instant.now()
        );
        when(trackShipmentUseCase.getById(shipmentId)).thenReturn(mockShipment);
        when(sensorReadingRepository.findByShipmentId(shipmentId)).thenReturn(List.of());

        Dashboard result = facade.getShipmentDashboard(shipmentId);

        assertNotNull(result.sensorStats());
        assertEquals(0, result.sensorStats().totalReadings());
        assertTrue(result.activeAlerts().isEmpty());
    }

    @Test
    void test_generateDeliveryReport_returnsReport() {
        UUID shipmentId = UUID.randomUUID();
        DeliveryReport mockReport = new DeliveryReport.Builder()
                .reportId(UUID.randomUUID())
                .shipmentId(shipmentId)
                .origin("WAREHOUSE")
                .destination("BOGOTA")
                .deliveryStatus("COMPLETED")
                .averageTemperature(24.0)
                .averageHumidity(55.0)
                .dispatchTime(Instant.now())
                .observations("Entregado en buen estado")
                .temperatureAlert(false)
                .humidityAlert(false)
                .build();
        when(generateDeliveryReportUseCase.generate(shipmentId)).thenReturn(mockReport);

        DeliveryReportInfo result = facade.generateDeliveryReport(shipmentId);

        assertNotNull(result);
        assertEquals(shipmentId, result.shipmentId());
        assertEquals("COMPLETED", result.status());
    }

    @Test
    void test_generateDeliveryReport_includesAlerts() {
        UUID shipmentId = UUID.randomUUID();
        DeliveryReport mockReport = new DeliveryReport.Builder()
                .reportId(UUID.randomUUID())
                .shipmentId(shipmentId)
                .deliveryStatus("COMPLETED")
                .temperatureAlert(true)
                .humidityAlert(false)
                .dispatchTime(Instant.now())
                .build();
        when(generateDeliveryReportUseCase.generate(shipmentId)).thenReturn(mockReport);

        DeliveryReportInfo result = facade.generateDeliveryReport(shipmentId);

        assertTrue(result.alerts().stream().anyMatch(a -> a.contains("temperatura")));
    }

    @Test
    void test_getShipmentDashboard_limitsRecentReadings() {
        UUID shipmentId = UUID.randomUUID();
        Shipment mockShipment = new Shipment(
                shipmentId,
                UUID.randomUUID(),
                "IN_TRANSIT",
                "LOC",
                Instant.now()
        );
        when(trackShipmentUseCase.getById(shipmentId)).thenReturn(mockShipment);

        List<SensorReading> readings = List.of(
                new SensorReading(UUID.randomUUID(), shipmentId, Instant.now(), 20.0, 50.0, 0.0, 0.0),
                new SensorReading(UUID.randomUUID(), shipmentId, Instant.now(), 21.0, 51.0, 0.0, 0.0),
                new SensorReading(UUID.randomUUID(), shipmentId, Instant.now(), 22.0, 52.0, 0.0, 0.0),
                new SensorReading(UUID.randomUUID(), shipmentId, Instant.now(), 23.0, 53.0, 0.0, 0.0),
                new SensorReading(UUID.randomUUID(), shipmentId, Instant.now(), 24.0, 54.0, 0.0, 0.0),
                new SensorReading(UUID.randomUUID(), shipmentId, Instant.now(), 25.0, 55.0, 0.0, 0.0),
                new SensorReading(UUID.randomUUID(), shipmentId, Instant.now(), 26.0, 56.0, 0.0, 0.0),
                new SensorReading(UUID.randomUUID(), shipmentId, Instant.now(), 27.0, 57.0, 0.0, 0.0),
                new SensorReading(UUID.randomUUID(), shipmentId, Instant.now(), 28.0, 58.0, 0.0, 0.0),
                new SensorReading(UUID.randomUUID(), shipmentId, Instant.now(), 29.0, 59.0, 0.0, 0.0),
                new SensorReading(UUID.randomUUID(), shipmentId, Instant.now(), 30.0, 60.0, 0.0, 0.0),
                new SensorReading(UUID.randomUUID(), shipmentId, Instant.now(), 31.0, 61.0, 0.0, 0.0),
                new SensorReading(UUID.randomUUID(), shipmentId, Instant.now(), 32.0, 62.0, 0.0, 0.0)
        );
        when(sensorReadingRepository.findByShipmentId(shipmentId)).thenReturn(readings);

        Dashboard result = facade.getShipmentDashboard(shipmentId);

        assertTrue(result.recentReadings().size() <= 10);
    }

    @Test
    void test_getShipmentDashboard_lastLocationFromReadings() {
        UUID shipmentId = UUID.randomUUID();
        Shipment mockShipment = new Shipment(
                shipmentId,
                UUID.randomUUID(),
                "IN_TRANSIT",
                "LOC",
                Instant.now()
        );
        when(trackShipmentUseCase.getById(shipmentId)).thenReturn(mockShipment);

        List<SensorReading> readings = List.of(
                new SensorReading(UUID.randomUUID(), shipmentId, Instant.now(), 25.0, 60.0, 40.412, -74.071)
        );
        when(sensorReadingRepository.findByShipmentId(shipmentId)).thenReturn(readings);

        Dashboard result = facade.getShipmentDashboard(shipmentId);

        assertEquals(40.412, result.sensorStats().lastLatitude());
        assertEquals(-74.071, result.sensorStats().lastLongitude());
    }

    @Test
    void test_getShipmentDashboard_alertWhenOutOfRange() {
        UUID shipmentId = UUID.randomUUID();
        Shipment mockShipment = new Shipment(
                shipmentId,
                UUID.randomUUID(),
                "IN_TRANSIT",
                "LOC",
                Instant.now()
        );
        when(trackShipmentUseCase.getById(shipmentId)).thenReturn(mockShipment);

        List<SensorReading> readings = List.of(
                new SensorReading(UUID.randomUUID(), shipmentId, Instant.now(), 35.0, 60.0, 0.0, 0.0)
        );
        when(sensorReadingRepository.findByShipmentId(shipmentId)).thenReturn(readings);

        Dashboard result = facade.getShipmentDashboard(shipmentId);

        assertFalse(result.sensorStats().isWithinRange());
    }

    @Test
    void test_getShipmentDashboard_normalRange() {
        UUID shipmentId = UUID.randomUUID();
        Shipment mockShipment = new Shipment(
                shipmentId,
                UUID.randomUUID(),
                "IN_TRANSIT",
                "LOC",
                Instant.now()
        );
        when(trackShipmentUseCase.getById(shipmentId)).thenReturn(mockShipment);

        List<SensorReading> readings = List.of(
                new SensorReading(UUID.randomUUID(), shipmentId, Instant.now(), 22.0, 55.0, 0.0, 0.0)
        );
        when(sensorReadingRepository.findByShipmentId(shipmentId)).thenReturn(readings);

        Dashboard result = facade.getShipmentDashboard(shipmentId);

        assertTrue(result.sensorStats().isWithinRange());
    }

    @Test
    void test_trackShipment_returnsLastUpdateTimestamp() {
        UUID shipmentId = UUID.randomUUID();
        Instant now = Instant.now();
        Shipment mockShipment = new Shipment(
                shipmentId,
                UUID.randomUUID(),
                "IN_TRANSIT",
                "LOC",
                now
        );
        when(trackShipmentUseCase.getById(shipmentId)).thenReturn(mockShipment);

        ShipmentStatus result = facade.trackShipment(shipmentId);

        assertNotNull(result.lastUpdate());
    }
}