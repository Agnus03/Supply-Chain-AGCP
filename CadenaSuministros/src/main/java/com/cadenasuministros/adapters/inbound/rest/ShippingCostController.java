package com.cadenasuministros.adapters.inbound.rest;

import com.cadenasuministros.domain.model.ShippingCost;
import com.cadenasuministros.domain.port.out.ShippingCostRepository;
import com.cadenasuministros.domain.service.CostCalculator;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/costs")
public class ShippingCostController {

    private final CostCalculator costCalculator;
    private final ShippingCostRepository shippingCostRepository;

    public ShippingCostController(CostCalculator costCalculator, ShippingCostRepository shippingCostRepository) {
        this.costCalculator = costCalculator;
        this.shippingCostRepository = shippingCostRepository;
    }

    @GetMapping
    public List<ShippingCost> listAll() {
        return shippingCostRepository.listAll();
    }

    @GetMapping("/{shipmentId}")
    public ShippingCost getByShipment(@PathVariable UUID shipmentId) {
        return shippingCostRepository.findByShipmentId(shipmentId)
                .orElseThrow(() -> new IllegalArgumentException("Cost not found for shipment: " + shipmentId));
    }

    @PostMapping("/calculate/{shipmentId}")
    public ShippingCost calculate(@PathVariable UUID shipmentId, @RequestBody CostRequest req) {
        return costCalculator.calculate(shipmentId, req.origin(), req.destination(), req.alertCount(), req.productName());
    }

    @PostMapping("/compare/{shipmentId}")
    public List<ShippingCost> compare(@PathVariable UUID shipmentId, @RequestBody CostRequest req) {
        return costCalculator.previewAllStrategies(shipmentId, req.origin(), req.destination(), req.alertCount());
    }

    public record CostRequest(String origin, String destination, int alertCount, String productName) {}
}
