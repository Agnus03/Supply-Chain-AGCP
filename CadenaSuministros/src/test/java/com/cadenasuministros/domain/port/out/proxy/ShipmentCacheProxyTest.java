package com.cadenasuministros.domain.port.out.proxy;

import com.cadenasuministros.domain.model.Shipment;
import com.cadenasuministros.domain.port.out.ShipmentRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ShipmentCacheProxyTest {

    @Mock
    private ShipmentRepository realRepository;

    private ShipmentCacheProxy proxy;

    @BeforeEach
    void setUp() {
        proxy = new ShipmentCacheProxy(realRepository, 5000L);
    }

    @Test
    void test_findShipmentById_firstCall_delegatesToRealRepository() {
        UUID shipmentId = UUID.randomUUID();
        Shipment expected = createShipment(shipmentId);
        when(realRepository.findShipmentById(shipmentId)).thenReturn(Optional.of(expected));

        Optional<Shipment> result = proxy.findShipmentById(shipmentId);

        assertTrue(result.isPresent());
        assertEquals(expected, result.get());
        verify(realRepository).findShipmentById(shipmentId);
    }

    @Test
    void test_findShipmentById_secondCall_returnsFromCache() {
        UUID shipmentId = UUID.randomUUID();
        Shipment expected = createShipment(shipmentId);
        when(realRepository.findShipmentById(shipmentId)).thenReturn(Optional.of(expected));

        Optional<Shipment> result1 = proxy.findShipmentById(shipmentId);
        Optional<Shipment> result2 = proxy.findShipmentById(shipmentId);

        assertTrue(result1.isPresent());
        assertTrue(result2.isPresent());
        assertEquals(expected, result1.get());
        assertEquals(expected, result2.get());
        verify(realRepository, times(1)).findShipmentById(shipmentId);
    }

    @Test
    void test_findShipmentById_notFound_delegatesToRealRepository() {
        UUID shipmentId = UUID.randomUUID();
        when(realRepository.findShipmentById(shipmentId)).thenReturn(Optional.empty());

        Optional<Shipment> result = proxy.findShipmentById(shipmentId);

        assertFalse(result.isPresent());
        verify(realRepository).findShipmentById(shipmentId);
    }

    @Test
    void test_findShipmentById_differentIds_delegateSeparately() {
        UUID shipmentId1 = UUID.randomUUID();
        UUID shipmentId2 = UUID.randomUUID();
        Shipment expected1 = createShipment(shipmentId1);
        Shipment expected2 = createShipment(shipmentId2);

        when(realRepository.findShipmentById(shipmentId1)).thenReturn(Optional.of(expected1));
        when(realRepository.findShipmentById(shipmentId2)).thenReturn(Optional.of(expected2));

        Optional<Shipment> result1 = proxy.findShipmentById(shipmentId1);
        Optional<Shipment> result2 = proxy.findShipmentById(shipmentId2);

        assertEquals(expected1, result1.get());
        assertEquals(expected2, result2.get());
        verify(realRepository, times(1)).findShipmentById(shipmentId1);
        verify(realRepository, times(1)).findShipmentById(shipmentId2);
    }

    @Test
    void test_save_invalidatesCache() {
        Shipment shipment = createShipment(UUID.randomUUID());
        when(realRepository.save(any())).thenReturn(shipment);

        proxy.save(shipment);

        verify(realRepository).save(shipment);
    }

    @Test
    void test_listAllShipments_firstCall_delegatesToRealRepository() {
        List<Shipment> expected = List.of(
            createShipment(UUID.randomUUID()),
            createShipment(UUID.randomUUID())
        );
        when(realRepository.listAllShipments()).thenReturn(expected);

        List<Shipment> result = proxy.listAllShipments();

        assertEquals(expected, result);
        verify(realRepository).listAllShipments();
    }

    @Test
    void test_listAllShipments_secondCall_returnsFromCache() {
        List<Shipment> expected = List.of(createShipment(UUID.randomUUID()));
        when(realRepository.listAllShipments()).thenReturn(expected);

        List<Shipment> result1 = proxy.listAllShipments();
        List<Shipment> result2 = proxy.listAllShipments();

        assertEquals(expected, result1);
        assertEquals(expected, result2);
        verify(realRepository, times(1)).listAllShipments();
    }

    @Test
    void test_clearCache_removesAllCacheEntries() {
        UUID shipmentId = UUID.randomUUID();
        Shipment shipment = createShipment(shipmentId);
        List<Shipment> shipments = List.of(createShipment(shipmentId));

        when(realRepository.findShipmentById(shipmentId)).thenReturn(Optional.of(shipment));
        when(realRepository.listAllShipments()).thenReturn(shipments);

        proxy.findShipmentById(shipmentId);
        proxy.listAllShipments();
        proxy.clearCache();

        proxy.findShipmentById(shipmentId);
        proxy.listAllShipments();

        verify(realRepository, times(2)).findShipmentById(shipmentId);
        verify(realRepository, times(2)).listAllShipments();
    }

    @Test
    void test_getCacheSize_returnsCorrectSize() {
        UUID shipmentId1 = UUID.randomUUID();
        UUID shipmentId2 = UUID.randomUUID();
        Shipment shipment1 = createShipment(shipmentId1);
        Shipment shipment2 = createShipment(shipmentId2);

        when(realRepository.findShipmentById(shipmentId1)).thenReturn(Optional.of(shipment1));
        when(realRepository.findShipmentById(shipmentId2)).thenReturn(Optional.of(shipment2));
        when(realRepository.listAllShipments()).thenReturn(List.of());

        proxy.findShipmentById(shipmentId1);
        proxy.findShipmentById(shipmentId2);
        proxy.listAllShipments();

        int cacheSize = proxy.getCacheSize();

        assertEquals(3, cacheSize);
    }

    @Test
    void test_save_invalidatesAllCaches() {
        Shipment shipment = createShipment(UUID.randomUUID());
        List<Shipment> shipments = List.of(createShipment(shipment.id()));

        when(realRepository.findShipmentById(any())).thenReturn(Optional.of(shipment));
        when(realRepository.listAllShipments()).thenReturn(shipments);
        when(realRepository.save(any())).thenReturn(shipment);

        proxy.findShipmentById(shipment.id());
        proxy.listAllShipments();

        proxy.save(shipment);

        verify(realRepository).save(shipment);
    }

    @Test
    void test_constructor_withDefaultTTL() {
        ShipmentCacheProxy proxyWithDefault = new ShipmentCacheProxy(realRepository);

        UUID shipmentId = UUID.randomUUID();
        Shipment expected = createShipment(shipmentId);
        when(realRepository.findShipmentById(shipmentId)).thenReturn(Optional.of(expected));

        Optional<Shipment> result = proxyWithDefault.findShipmentById(shipmentId);

        assertTrue(result.isPresent());
        assertEquals(expected, result.get());
    }

    @Test
    void test_constructor_withCustomTTL() {
        long customTtl = 10000L;
        ShipmentCacheProxy proxyWithCustom = new ShipmentCacheProxy(realRepository, customTtl);

        UUID shipmentId = UUID.randomUUID();
        Shipment expected = createShipment(shipmentId);
        when(realRepository.findShipmentById(shipmentId)).thenReturn(Optional.of(expected));

        Optional<Shipment> result = proxyWithCustom.findShipmentById(shipmentId);

        assertTrue(result.isPresent());
        assertEquals(expected, result.get());
    }

    @Test
    void test_listAllShipments_withEmptyResult() {
        when(realRepository.listAllShipments()).thenReturn(List.of());

        List<Shipment> result = proxy.listAllShipments();

        assertTrue(result.isEmpty());
    }

    private Shipment createShipment(UUID shipmentId) {
        return new Shipment(
            shipmentId,
            UUID.randomUUID(),
            "IN_TRANSIT",
            "BOGOTA",
            Instant.now()
        );
    }
}
