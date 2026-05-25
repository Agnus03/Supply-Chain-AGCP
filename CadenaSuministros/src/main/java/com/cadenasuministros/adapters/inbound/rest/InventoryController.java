package com.cadenasuministros.adapters.inbound.rest;

import com.cadenasuministros.domain.model.InventoryItem;
import com.cadenasuministros.domain.model.StockMovement;
import com.cadenasuministros.domain.port.out.InventoryRepository;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/inventory")
public class InventoryController {

    private final InventoryRepository inventoryRepository;

    public InventoryController(InventoryRepository inventoryRepository) {
        this.inventoryRepository = inventoryRepository;
    }

    @GetMapping
    public List<InventoryItem> listAll() {
        return inventoryRepository.listAll();
    }

    @GetMapping("/{productId}")
    public InventoryItem getByProduct(@PathVariable UUID productId) {
        return inventoryRepository.findByProductId(productId)
                .orElseThrow(() -> new IllegalArgumentException("Inventory not found for product: " + productId));
    }

    @GetMapping("/low-stock")
    public List<InventoryItem> lowStock() {
        return inventoryRepository.findLowStock();
    }

    @GetMapping("/warehouse/{warehouse}")
    public List<InventoryItem> byWarehouse(@PathVariable String warehouse) {
        return inventoryRepository.findByWarehouse(warehouse);
    }

    @PostMapping
    public InventoryItem create(@RequestBody InventoryRequest req) {
        try {
            UUID.fromString(req.productId());
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("UUID de producto inválido: " + req.productId());
        }
        InventoryItem item = new InventoryItem(
                UUID.randomUUID(), UUID.fromString(req.productId()),
                req.quantity(), req.minStock(), req.warehouse(), Instant.now()
        );
        return inventoryRepository.save(item);
    }

    @PatchMapping("/{id}/quantity")
    public InventoryItem updateQuantity(@PathVariable UUID id, @RequestBody QuantityRequest req) {
        InventoryItem item = inventoryRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Inventory item not found: " + id));
        int newQty = Math.max(0, item.quantity() + req.delta());
        InventoryItem updated = item.withQuantity(newQty);
        inventoryRepository.saveMovement(new StockMovement(
                UUID.randomUUID(), item.productId(), req.type() != null ? req.type() : "ADJUSTMENT",
                req.delta(), req.reference(), req.notes(), Instant.now()
        ));
        return inventoryRepository.save(updated);
    }

    @PatchMapping("/{id}/min-stock")
    public InventoryItem updateMinStock(@PathVariable UUID id, @RequestBody MinStockRequest req) {
        InventoryItem item = inventoryRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Inventory item not found: " + id));
        return inventoryRepository.save(item.withMinStock(req.minStock()));
    }

    @GetMapping("/{productId}/movements")
    public List<StockMovement> movements(@PathVariable UUID productId) {
        return inventoryRepository.listMovements(productId);
    }

    public record InventoryRequest(String productId, int quantity, int minStock, String warehouse) {}
    public record QuantityRequest(int delta, String type, String reference, String notes) {}
    public record MinStockRequest(int minStock) {}
}
