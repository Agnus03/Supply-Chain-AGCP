# UML del Patrón State - CadenaSuministros

```plantuml
@startuml
skinparam componentStyle uml2

' ============================================
' PATRON STATE - FRONTEND
' ============================================

package "types" {
    interface "ShipmentStateConfig" {
        + status: ShipmentStatus
        + label: string
        + color: string
        + colorVar: string
        + allowedTransitions: ShipmentStatus[]
        + isTerminal: boolean
        + badgeClass: string
        + confirmVariant: 'primary' | 'danger' | null
    }

    enum "ShipmentStatus" {
        + PENDING
        + IN_TRANSIT
        + DELIVERED
        + DELAYED
    }
}

package "utils" {
    class "SHIPMENT_STATE_CONFIG" <<config>> {
        + PENDING: ShipmentStateConfig
        + IN_TRANSIT: ShipmentStateConfig
        + DELIVERED: ShipmentStateConfig
        + DELAYED: ShipmentStateConfig
        + [key: ShipmentStatus]: ShipmentStateConfig
    }
}

package "Concrete States (valores)" {
    object "PENDING" as pendingState {
        status = "PENDING"
        label = "Pendiente"
        color = "#f59e0b"
        colorVar = "var(--warning)"
        allowedTransitions = ["IN_TRANSIT", "DELAYED"]
        isTerminal = false
        badgeClass = "badge-pending"
        confirmVariant = null
    }

    object "IN_TRANSIT" as transitState {
        status = "IN_TRANSIT"
        label = "En tránsito"
        color = "#3b82f6"
        colorVar = "var(--primary)"
        allowedTransitions = ["DELIVERED", "DELAYED"]
        isTerminal = false
        badgeClass = "badge-transit"
        confirmVariant = null
    }

    object "DELIVERED" as deliveredState {
        status = "DELIVERED"
        label = "Entregado"
        color = "#22c55e"
        colorVar = "var(--success)"
        allowedTransitions = []
        isTerminal = true
        badgeClass = "badge-delivered"
        confirmVariant = "primary"
    }

    object "DELAYED" as delayedState {
        status = "DELAYED"
        label = "Retrasado"
        color = "#ef4444"
        colorVar = "var(--danger)"
        allowedTransitions = ["PENDING", "IN_TRANSIT", "DELIVERED"]
        isTerminal = false
        badgeClass = "badge-delayed"
        confirmVariant = "danger"
    }
}

package "Consumidores" {
    class "ShipmentHistory" {
        + statusClass(status): string
    }
    class "ShipmentsPage" {
        + handleUpdateStatus(id, newStatus): void
        + confirmVariant
    }
    class "GeoMap" {
        + color, label, legend
    }
    class "StatusDonut" {
        + COLORS[]
    }
    class "ReportsPage" {
        + badge status
    }
}

' Relaciones
ShipmentStateConfig <|.. pendingState
ShipmentStateConfig <|.. transitState
ShipmentStateConfig <|.. deliveredState
ShipmentStateConfig <|.. delayedState

SHIPMENT_STATE_CONFIG *-- pendingState : PENDING
SHIPMENT_STATE_CONFIG *-- transitState : IN_TRANSIT
SHIPMENT_STATE_CONFIG *-- deliveredState : DELIVERED
SHIPMENT_STATE_CONFIG *-- delayedState : DELAYED

ShipmentHistory ..> SHIPMENT_STATE_CONFIG : lookup badgeClass
ShipmentsPage ..> SHIPMENT_STATE_CONFIG : lookup confirmVariant
GeoMap ..> SHIPMENT_STATE_CONFIG : lookup color, label
StatusDonut ..> SHIPMENT_STATE_CONFIG : lookup colorVar
ReportsPage ..> SHIPMENT_STATE_CONFIG : lookup badgeClass

@enduml
```

---

## Diagrama de Transiciones de Estado

```plantuml
@startuml
skinparam componentStyle uml2

' ============================================
' DIAGRAMA DE TRANSICIONES - SHIPMENT STATUS
' ============================================

state "PENDING" as pending
state "IN_TRANSIT" as transit
state "DELIVERED" as delivered
state "DELAYED" as delayed

[*] --> pending : creación

pending --> transit : allowedTransitions
pending --> delayed : allowedTransitions

transit --> delivered : allowedTransitions
transit --> delayed : allowedTransitions

delayed --> pending : allowedTransitions
delayed --> transit : allowedTransitions
delayed --> delivered : allowedTransitions

delivered --> [*] : terminal

note right of pending
  confirmVariant = null
  (sin confirmación)
end note

note right of transit
  confirmVariant = null
  (sin confirmación)
end note

note right of delivered
  confirmVariant = 'primary'
  isTerminal = true
end note

note right of delayed
  confirmVariant = 'danger'
  isTerminal = false
end note

@enduml
```

---

## Diagrama de Flujo — Cambio de Estado en UI

```plantuml
@startuml
skinparam componentStyle uml2

' ============================================
' FLUJO - CAMBIO DE ESTADO EN UI
' ============================================

actor "Usuario" as user
participant "ShipmentsPage" as page
participant "SHIPMENT_STATE_CONFIG" as config
participant "shipmentService" as api
database "Backend" as backend

== Usuario cambia estado en dropdown ==

user -> page: selecciona nuevo estado
page -> config: get(newStatus as ShipmentStatus)

alt confirmVariant != null (DELIVERED | DELAYED)
    page -> page: mostrar ConfirmDialog
    user -> page: confirma
    page -> api: updateStatus(id, newStatus)
    api -> backend: PATCH /{id}/status
    backend --> api: Shipment actualizado
    api --> page: Shipment
    page -> page: fetchShipments() (refrescar)
else confirmVariant == null (PENDING | IN_TRANSIT)
    page -> api: updateStatus(id, newStatus)
    api -> backend: PATCH /{id}/status
    backend --> api: Shipment actualizado
    api --> page: Shipment
    page -> page: fetchShipments() (refrescar)
end

@enduml
```

---

## Diagrama de Componentes — Cómo se consume el config

```plantuml
@startuml
skinparam componentStyle uml2

' ============================================
' CONSUMIDORES DE SHIPMENT_STATE_CONFIG
' ============================================

package "utils/constants.ts" {
    database "SHIPMENT_STATE_CONFIG" as config {
        [PENDING]
        [IN_TRANSIT]
        [DELIVERED]
        [DELAYED]
    }
}

package "Consumidores" {
    component "statusClass()\nShipmentHistory" as hist {
        note
            badgeClass lookup
        end note
    }
    component "confirmVariant\nShipmentsPage" as page {
        note
            ¿Mostrar diálogo?
            ¿Variante danger/primary?
        end note
    }
    component "color + label\nGeoMap" as geo {
        note
            Marcadores Leaflet
            Leyenda interactiva
        end note
    }
    component "colorVar\nStatusDonut" as donut {
        note
            Colores del gráfico
            circular
        end note
    }
    component "badgeClass\nReportsPage" as rpt {
        note
            Badge de estado
            en reportes
        end note
    }
}

' Flujo
config --> hist : badgeClass
config --> page : confirmVariant
config --> geo : color, label
config --> donut : colorVar
config --> rpt : badgeClass

@enduml
```

---

## Descripción de los Diagramas

### 1. Diagrama de Clases
Muestra la estructura del patrón State en el frontend. La interfaz `ShipmentStateConfig` define el contrato para cada estado. `SHIPMENT_STATE_CONFIG` es el mapa que contiene las 4 configuraciones concretas. Los componentes consumidores (`ShipmentHistory`, `ShipmentsPage`, `GeoMap`, `StatusDonut`, `ReportsPage`) consultan el config en lugar de usar condicionales.

### 2. Diagrama de Transiciones
Muestra el ciclo de vida completo de un envío:
- `PENDING` puede ir a `IN_TRANSIT` o `DELAYED`
- `IN_TRANSIT` puede ir a `DELIVERED` o `DELAYED`
- `DELAYED` puede recuperarse a `PENDING`, `IN_TRANSIT` o `DELIVERED`
- `DELIVERED` es estado terminal

### 3. Diagrama de Flujo
Ilustra el proceso cuando un usuario cambia el estado desde la UI. El config determina si se requiere confirmación (`confirmVariant`) y qué variante visual usar.

### 4. Diagrama de Componentes
Muestra cómo cada componente consumidor extrae exactamente la propiedad que necesita del config central, eliminando toda la duplicación anterior.

---

## Elementos UML Principales

| Elemento | Descripción |
|----------|-------------|
| **ShipmentStateConfig** | Interfaz que define la estructura de cada estado |
| **ShipmentStatus** | Enum de los 4 estados posibles |
| **SHIPMENT_STATE_CONFIG** | Mapa con las configuraciones concretas (Context) |
| **PENDING / IN_TRANSIT / DELIVERED / DELAYED** | Objetos con valores concretos (ConcreteState) |
| **ShipmentHistory** | Consumidor: lookup de badgeClass |
| **ShipmentsPage** | Consumidor: lookup de confirmVariant |
| **GeoMap** | Consumidor: lookup de color y label |
| **StatusDonut** | Consumidor: lookup de colorVar |
| **ReportsPage** | Consumidor: lookup de badgeClass |

### Relaciones UML

- `<|..` : Implementación de interfaz
- `*--` : Composición (el config contiene los estados)
- `..>` : Dependencia / lookup

---

## Ejecutar los Diagramas

Para visualizar los diagramas:
1. Copia el código entre los bloques \`\`\`plantuml
2. Pégalo en [PlantUML Online Editor](https://www.planttext.com)
3. O usa la extensión **PlantUML** en VS Code
