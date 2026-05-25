# Patrón Strategy — Cálculo de Costos de Envío

## ¿Por qué se usó el patrón Strategy en este proyecto?

### Problema original

La clase `CostCalculator` calculaba el costo de envío con una fórmula fija y constantes hardcodeadas:

```
Costo = BASE_RATE(50000) + distancia(km) × RATE_PER_KM(2000) + alertas × EXTRA_CHARGE(15000)
```

Esto significaba que **todos los envíos se calculaban igual**, sin importar el tipo de producto. No había forma de aplicar recargos por refrigeración para productos perecederos, tarifas express para envíos urgentes, seguros para electrónica, etc.

Cada vez que se necesitara una nueva variante de cálculo, había que modificar `CostCalculator`, violando el **Principio Abierto/Cerrado (OCP)**.

### Solución con Strategy

El patrón **Strategy** permite definir una familia de algoritmos (estrategias de costo), encapsular cada uno en su propia clase, y hacerlos intercambiables sin modificar el código cliente.

### Estructura implementada

```
┌─────────────────────────────────────────────────────────────────┐
│                      CostCalculator                             │
│  (Contexto - selecciona la estrategia y delega el cálculo)      │
└──────────────────┬──────────────────────────────────────────────┘
                   │  <<usa>>
                   ▼
┌─────────────────────────────────────────────────────────────────┐
│              «interface» CostCalculationStrategy                 │
│  + supports(productName): boolean                               │
│  + calculateBaseRate(): double                                  │
│  + calculateRatePerKm(): double                                 │
│  + calculateExtraChargePerAlert(): double                       │
└─────────────────────────────────────────────────────────────────┘
                   ▲
      ┌────────────┼────────────────┐
      │            │                │
┌─────────────┐ ┌───────────────┐ ┌──────────────────┐
│ StandardCost │ │ Refrigerated  │ │   ExpressCost    │
│  Strategy    │ │ CostStrategy  │ │    Strategy      │
├─────────────┤ ├───────────────┤ ├──────────────────┤
│ BASE=50000  │ │ BASE=80000    │ │ BASE=100000      │
│ KM=2000     │ │ KM=2500       │ │ KM=3500          │
│ ALERT=15000 │ │ ALERT=20000   │ │ ALERT=25000      │
└─────────────┘ └───────────────┘ └──────────────────┘
```

### Criterio de selección de estrategias

| Estrategia | ¿Cuándo se aplica? | Tarifas |
|-----------|-------------------|---------|
| `StandardCostStrategy` | Cualquier producto (fallback por defecto) | Base: $50,000 · Km: $2,000 · Alerta: $15,000 |
| `RefrigeratedCostStrategy` | Productos perecederos (fresa, lechuga, carne, leche, etc.) | Base: $80,000 · Km: $2,500 · Alerta: $20,000 |
| `ExpressCostStrategy` | Productos con "Express" en el nombre | Base: $100,000 · Km: $3,500 · Alerta: $25,000 |

### Beneficios obtenidos

1. **OCP (Open/Closed Principle)** — se pueden agregar nuevas estrategias sin modificar `CostCalculator`. Solo crear una nueva clase que implemente `CostCalculationStrategy` y anotarla con `@Component`.

2. **Separación de responsabilidades** — cada estrategia encapsula su propia lógica de precios. `CostCalculator` solo se encarga de seleccionar y orquestar.

3. **Testeabilidad** — cada `*CostStrategy` se puede testear de forma aislada sin depender de repositorios o controladores.

4. **Inversión de dependencias** — `CostCalculator` depende de la abstracción `CostCalculationStrategy`, no de implementaciones concretas.

5. **Spring-friendly** — las estrategias se registran como `@Component` y se inyectan automáticamente como `List<CostCalculationStrategy>` mediante DI.

### Cómo agregar una nueva estrategia

1. Crear una clase que implemente `CostCalculationStrategy`
2. Anotarla con `@Component`
3. Implementar `supports(productName)` para definir cuándo aplica
4. Definir las tarifas en `calculateBaseRate()`, `calculateRatePerKm()`, `calculateExtraChargePerAlert()`
5. Spring la inyectará automáticamente en `CostCalculator`

### Archivos modificados/creados

| Archivo | Acción |
|---------|--------|
| `domain/strategy/CostCalculationStrategy.java` | ✨ Creado |
| `domain/strategy/StandardCostStrategy.java` | ✨ Creado |
| `domain/strategy/RefrigeratedCostStrategy.java` | ✨ Creado |
| `domain/strategy/ExpressCostStrategy.java` | ✨ Creado |
| `domain/service/CostCalculator.java` | 🔧 Modificado: inyecta `List<CostCalculationStrategy>`, delega cálculo |
| `adapters/inbound/rest/ShippingCostController.java` | 🔧 Modificado: `CostRequest` incluye `productName` |

### Diferencia entre Strategy y State

| Aspecto | Strategy | State |
|---------|----------|-------|
| Quién elige | El cliente (contexto) elige la estrategia | El estado transiciona automáticamente |
| Dependencia | Estrategias son independientes entre sí | Estados pueden referenciarse entre sí |
| Propósito | Variar el algoritmo | Variar el comportamiento según el estado interno |
