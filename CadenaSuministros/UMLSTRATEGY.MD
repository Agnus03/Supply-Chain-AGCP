# Diagrama UML — Patrón Strategy

## Código PlantUML

```plantuml
@startuml StrategyPattern
skinparam style strictuml
skinparam backgroundColor #FEFEFE
skinparam class {
  BackgroundColor #F8F9FA
  BorderColor #2C3E50
  FontName Arial
  FontSize 12
}

title "Patrón Strategy - Cálculo de Costos de Envío"
header CadenaSuministros
footer "Gang of Four — Behavioral Pattern"

' ─── Interfaces ───

interface "CostCalculationStrategy" as Strategy {
  + {abstract} supports(productName: String): boolean
  + {abstract} calculateBaseRate(): double
  + {abstract} calculateRatePerKm(): double
  + {abstract} calculateExtraChargePerAlert(): double
}

' ─── Contexto ───

class "CostCalculator" as Context {
  - strategies: List<CostCalculationStrategy>
  - routeCalculator: RouteCalculator
  - shippingCostRepository: ShippingCostRepository
  ..
  + {constructor} CostCalculator(strategies, routeCalculator, repo)
  + calculate(shipmentId, origin, destination, alertCount, productName): ShippingCost
  - selectStrategy(productName): CostCalculationStrategy
  - getFallbackStrategy(): CostCalculationStrategy
}

note right of Context
  El contexto selecciona la
  estrategia según el nombre
  del producto y delega el
  cálculo de tarifas.
end note

' ─── Estrategias Concretas ───

class "StandardCostStrategy" as Standard {
  - BASE_RATE: double = 50000
  - RATE_PER_KM: double = 2000
  - EXTRA_CHARGE_PER_ALERT: double = 15000
  ..
  + supports(productName): boolean  {static} true
  + calculateBaseRate(): double
  + calculateRatePerKm(): double
  + calculateExtraChargePerAlert(): double
}

class "RefrigeratedCostStrategy" as Refrigerated {
  - BASE_RATE: double = 80000
  - RATE_PER_KM: double = 2500
  - EXTRA_CHARGE_PER_ALERT: double = 20000
  - REFRIGERATED_KEYWORDS: List<String>
  ..
  + supports(productName): boolean
  + calculateBaseRate(): double
  + calculateRatePerKm(): double
  + calculateExtraChargePerAlert(): double
}

note bottom of Refrigerated
  Keywords perecederos:
  fresa, lechuga, lulo, leche,
  carne, pollo, pescado, mora,
  aguacate, tomate, limón,
  maracuyá, espinaca, brocoli,
  cebolla
end note

class "ExpressCostStrategy" as Express {
  - BASE_RATE: double = 100000
  - RATE_PER_KM: double = 3500
  - EXTRA_CHARGE_PER_ALERT: double = 25000
  ..
  + supports(productName): boolean
  + calculateBaseRate(): double
  + calculateRatePerKm(): double
  + calculateExtraChargePerAlert(): double
}

note bottom of Express
  Se activa si el nombre del
  producto contiene "Express"
  (case-insensitive)
end note

' ─── Relaciones ───

Strategy <|.. Standard : <<implements>>
Strategy <|.. Refrigerated : <<implements>>
Strategy <|.. Express : <<implements>>

Context *--> "0..*" Strategy : <<strategy list>>
Context ..> Standard : <<fallback>>

' ─── Clases relacionadas ───

class "ShippingCost" as Model {
  + id: UUID
  + shipmentId: UUID
  + baseRate: double
  + distanceKm: double
  + distanceCost: double
  + extraCharges: double
  + totalCost: double
  + currency: String
  + calculatedAt: Instant
}

class "ShippingCostController" as Controller {
  + listAll(): List<ShippingCost>
  + getByShipment(shipmentId): ShippingCost
  + calculate(shipmentId, req): ShippingCost
}

class "CostRequest" as Request {
  + origin: String
  + destination: String
  + alertCount: int
  + productName: String
}

class "RouteCalculator" as RouteCalc {
  + calculateDistance(origin, dest): double
}

Controller ..> Context : <<delega>>
Context ..> RouteCalc : <<calcula distancia>>
Context ..> Model : <<crea y persiste>>
Controller ..> Request : <<recibe>>

@enduml
```

## Diagrama renderizado

```mermaid
classDiagram
    class CostCalculationStrategy {
        <<interface>>
        +supports(productName: String) boolean
        +calculateBaseRate() double
        +calculateRatePerKm() double
        +calculateExtraChargePerAlert() double
    }

    class CostCalculator {
        -strategies: List~CostCalculationStrategy~
        -routeCalculator: RouteCalculator
        -shippingCostRepository: ShippingCostRepository
        +CostCalculator(strategies, routeCalculator, repo)
        +calculate(shipmentId, origin, destination, alertCount, productName) ShippingCost
        -selectStrategy(productName) CostCalculationStrategy
        -getFallbackStrategy() CostCalculationStrategy
    }

    class StandardCostStrategy {
        -BASE_RATE: double = 50000
        -RATE_PER_KM: double = 2000
        -EXTRA_CHARGE_PER_ALERT: double = 15000
        +supports(productName) boolean
        +calculateBaseRate() double
        +calculateRatePerKm() double
        +calculateExtraChargePerAlert() double
    }

    class RefrigeratedCostStrategy {
        -BASE_RATE: double = 80000
        -RATE_PER_KM: double = 2500
        -EXTRA_CHARGE_PER_ALERT: double = 20000
        -REFRIGERATED_KEYWORDS: List~String~
        +supports(productName) boolean
        +calculateBaseRate() double
        +calculateRatePerKm() double
        +calculateExtraChargePerAlert() double
    }

    class ExpressCostStrategy {
        -BASE_RATE: double = 100000
        -RATE_PER_KM: double = 3500
        -EXTRA_CHARGE_PER_ALERT: double = 25000
        +supports(productName) boolean
        +calculateBaseRate() double
        +calculateRatePerKm() double
        +calculateExtraChargePerAlert() double
    }

    class ShippingCost {
        +id: UUID
        +shipmentId: UUID
        +baseRate: double
        +distanceKm: double
        +distanceCost: double
        +extraCharges: double
        +totalCost: double
        +currency: String
        +calculatedAt: Instant
    }

    class ShippingCostController {
        +listAll() List~ShippingCost~
        +getByShipment(shipmentId) ShippingCost
        +calculate(shipmentId, req) ShippingCost
    }

    class RouteCalculator {
        +calculateDistance(origin, dest) double
    }

    CostCalculationStrategy <|.. StandardCostStrategy : implements
    CostCalculationStrategy <|.. RefrigeratedCostStrategy : implements
    CostCalculationStrategy <|.. ExpressCostStrategy : implements

    CostCalculator *--> "0..*" CostCalculationStrategy : strategy list
    CostCalculator ..> StandardCostStrategy : fallback

    ShippingCostController ..> CostCalculator : delega
    CostCalculator ..> RouteCalculator : calcula distancia
    CostCalculator ..> ShippingCost : crea y persiste
```

## Leyenda de relaciones

| Símbolo | Significado |
|---------|-------------|
| `▬▬▬▬▬▬▬▶` | Herencia / Implementación |
| `▬▬▬◆────` | Composición (tiene una colección de) |
| `- - - - ▶` | Dependencia / Uso |
