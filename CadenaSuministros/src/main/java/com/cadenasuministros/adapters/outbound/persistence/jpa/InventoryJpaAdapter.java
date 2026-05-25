package com.cadenasuministros.adapters.outbound.persistence.jpa;

import com.cadenasuministros.domain.model.InventoryItem;
import com.cadenasuministros.domain.model.StockMovement;
import com.cadenasuministros.domain.port.out.InventoryRepository;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Component
public class InventoryJpaAdapter implements InventoryRepository {

    private final SpringDataInventoryRepository inventoryRepo;
    private final SpringDataStockMovementRepository movementRepo;

    public InventoryJpaAdapter(SpringDataInventoryRepository inventoryRepo,
                               SpringDataStockMovementRepository movementRepo) {
        this.inventoryRepo = inventoryRepo;
        this.movementRepo = movementRepo;
    }

    @Override
    public InventoryItem save(InventoryItem item) {
        return toDomain(inventoryRepo.save(toEntity(item)));
    }

    @Override
    public Optional<InventoryItem> findById(UUID id) {
        return inventoryRepo.findById(id).map(this::toDomain);
    }

    @Override
    public Optional<InventoryItem> findByProductId(UUID productId) {
        return inventoryRepo.findByProductId(productId).map(this::toDomain);
    }

    @Override
    public List<InventoryItem> listAll() {
        return inventoryRepo.findAll().stream().map(this::toDomain).collect(Collectors.toList());
    }

    @Override
    public List<InventoryItem> findByWarehouse(String warehouse) {
        return inventoryRepo.findByWarehouse(warehouse).stream().map(this::toDomain).collect(Collectors.toList());
    }

    @Override
    public List<InventoryItem> findLowStock() {
        return inventoryRepo.findAll().stream()
                .filter(e -> e.getQuantity() < e.getMinStock())
                .map(this::toDomain)
                .collect(Collectors.toList());
    }

    @Override
    public StockMovement saveMovement(StockMovement movement) {
        return toDomainMovement(movementRepo.save(toEntityMovement(movement)));
    }

    @Override
    public List<StockMovement> listMovements(UUID productId) {
        return movementRepo.findByProductIdOrderByTimestampDesc(productId).stream()
                .map(this::toDomainMovement)
                .collect(Collectors.toList());
    }

    private InventoryItem toDomain(InventoryItemJpaEntity e) {
        return new InventoryItem(e.getId(), e.getProductId(), e.getQuantity(), e.getMinStock(), e.getWarehouse(), e.getLastUpdated());
    }

    private InventoryItemJpaEntity toEntity(InventoryItem d) {
        return new InventoryItemJpaEntity(d.id(), d.productId(), d.quantity(), d.minStock(), d.warehouse(), d.lastUpdated());
    }

    private StockMovement toDomainMovement(StockMovementJpaEntity e) {
        return new StockMovement(e.getId(), e.getProductId(), e.getType(), e.getQuantity(), e.getReference(), e.getNotes(), e.getTimestamp());
    }

    private StockMovementJpaEntity toEntityMovement(StockMovement d) {
        return new StockMovementJpaEntity(d.id(), d.productId(), d.type(), d.quantity(), d.reference(), d.notes(), d.timestamp());
    }
}
