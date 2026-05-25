# UML del Patrón Observer - CadenaSuministros

```plantuml
@startuml
skinparam componentStyle uml2

' ============================================
' PATRON OBSERVER - CADENA SUMINISTROS
' ============================================

package "domain.event (Eventos)" {
    class "ShipmentStatusChangedEvent" as statusEvent {
        - shipmentId: UUID
        - fromStatus: String
        - toStatus: String
        - occurredOn: Instant
        + ShipmentStatusChangedEvent(...)
        + getShipmentId(): UUID
        + getFromStatus(): String
        + getToStatus(): String
        + getOccurredOn(): Instant
    }

    class "SensorReadingRegisteredEvent" as sensorEvent {
        - reading: SensorReading
        + SensorReadingRegisteredEvent(reading)
        + getReading(): SensorReading
    }

    class "ShipmentLocationChangedEvent" as locationEvent {
        - shipmentId: UUID
        - fromLocation: String
        - toLocation: String
        - occurredOn: Instant
        + ShipmentLocationChangedEvent(...)
        + getShipmentId(): UUID
        + getFromLocation(): String
        + getToLocation(): String
    }

    class "AlertTriggeredEvent" as alertEvent {
        - reading: SensorReading
        - reason: String
        - timestamp: Instant
        + AlertTriggeredEvent(...)
        + getReading(): SensorReading
        + getReason(): String
        + getTimestamp(): Instant
    }

    class "DeliveryReportGeneratedEvent" as reportEvent {
        - report: DeliveryReport
        + DeliveryReportGeneratedEvent(report)
        + getReport(): DeliveryReport
    }
}

package "application.usecase (Publishers)" {
    class "TrackShipmentService" {
        - eventPublisher: ApplicationEventPublisher
        + updateStatus(...): Shipment
        + updateLocation(...): Shipment
    }

    class "RegisterSensorReadingService" {
        - eventPublisher: ApplicationEventPublisher
        + registerReading(...): SensorReading
    }

    class "GenerateDeliveryReportService" {
        - eventPublisher: ApplicationEventPublisher
        + generateDeliveryReport(...): DeliveryReport
    }
}

package "application.listener (Observers)" {
    class "AlertEvaluationListener" {
        - alertEvaluator: AlertEvaluator
        - eventPublisher: ApplicationEventPublisher
        + onSensorReadingRegistered(event): void
        + onAlertTriggered(event): void
    }
}

package "adapters.outbound.events (WebSocket Bridge)" {
    class "EventWebSocketBridge" {
        - messagingTemplate: SimpMessagingTemplate
        + onSensorReading(event): void
        + onAlert(event): void
        + onShipmentStatus(event): void
        + onShipmentLocation(event): void
        + onDeliveryReport(event): void
    }

    class "WebSocketConfig" {
        + configureMessageBroker(registry): void
        + registerStompEndpoints(registry): void
    }
}

' Relaciones - Publishers emiten eventos
TrackShipmentService ..> statusEvent : publishEvent()
TrackShipmentService ..> locationEvent : publishEvent()
RegisterSensorReadingService ..> sensorEvent : publishEvent()
GenerateDeliveryReportService ..> reportEvent : publishEvent()

' Relaciones - Observers escuchan eventos
statusEvent <.. EventWebSocketBridge : @EventListener
locationEvent <.. EventWebSocketBridge : @EventListener
sensorEvent <.. EventWebSocketBridge : @EventListener
reportEvent <.. EventWebSocketBridge : @EventListener
alertEvent <.. EventWebSocketBridge : @EventListener

' Relaciones - Chained observer
sensorEvent <.. AlertEvaluationListener : @EventListener
AlertEvaluationListener ..> alertEvent : publishEvent() (chain)

' WebSocket
EventWebSocketBridge ..> WebSocketConfig : uses

@enduml
```

---

## Diagrama de Secuencia — Flujo Completo de Eventos

```plantuml
@startuml
skinparam componentStyle uml2

' ============================================
' SECUENCIA - REGISTRO DE LECTURA + ALERTAS
' ============================================

actor "Cliente REST" as client
participant "RegisterSensorReadingService" as sensorService
participant "ApplicationEventPublisher" as publisher
participant "AlertEvaluationListener" as alertListener
participant "AlertEvaluator" as evaluator
participant "EventWebSocketBridge" as wsBridge
actor "Frontend WebSocket" as frontend

== 1. Registrar Lectura de Sensor ==

client -> sensorService: registerReading(shipmentId, temp, hum)
activate sensorService
    sensorService -> sensorService: guardar lectura en DB
    sensorService -> publisher: publishEvent(SensorReadingRegisteredEvent)
    deactivate sensorService

publisher -> alertListener: @EventListener
activate alertListener
    alertListener -> evaluator: isTemperatureAlert(temp)
    activate evaluator
    evaluator --> alertListener: boolean
    deactivate evaluator

    alertListener -> evaluator: isHumidityAlert(hum)
    activate evaluator
    evaluator --> alertListener: boolean
    deactivate evaluator

    alt temperatura o humedad fuera de rango
        alertListener -> publisher: publishEvent(AlertTriggeredEvent)
        publisher -> wsBridge: @EventListener
        activate wsBridge
            wsBridge -> wsBridge: messagingTemplate.convertAndSend(/topic/alerts)
            wsBridge --> frontend: WebSocket push
        deactivate wsBridge
    end
    deactivate alertListener

publisher -> wsBridge: @EventListener (SensorReadingRegisteredEvent)
activate wsBridge
    wsBridge -> wsBridge: messagingTemplate.convertAndSend(/topic/sensors)
    wsBridge --> frontend: WebSocket push
deactivate wsBridge

@enduml
```

---

## Diagrama de Secuencia — Cambio de Estado + WebSocket

```plantuml
@startuml
skinparam componentStyle uml2

' ============================================
' SECUENCIA - CAMBIO DE ESTADO
' ============================================

actor "Cliente REST" as client
participant "TrackShipmentService" as trackService
participant "ApplicationEventPublisher" as publisher
participant "EventWebSocketBridge" as wsBridge
actor "Frontend WebSocket" as frontend

== 2. Cambiar Estado de Envío ==

client -> trackService: updateStatus(shipmentId, newStatus)
activate trackService

    trackService -> trackService: validar transición (State pattern)
    trackService -> trackService: guardar ShipmentEvent en DB
    trackService -> trackService: actualizar Shipment en DB
    trackService -> publisher: publishEvent(ShipmentStatusChangedEvent)
    trackService --> client: Shipment actualizado
deactivate trackService

publisher -> wsBridge: @EventListener
activate wsBridge
    wsBridge -> wsBridge: messagingTemplate.convertAndSend(/topic/shipments/status)
    note right: fromStatus → toStatus
    wsBridge --> frontend: WebSocket push
deactivate wsBridge

@enduml
```

---

## Diagrama de Arquitectura — Pub/Sub Completo

```plantuml
@startuml
skinparam componentStyle uml2

' ============================================
' ARQUITECTURA OBSERVER - PUBLICACIÓN/SUSCRIPCIÓN
' ============================================

package "Publishers (Subjects)" {
    component "TrackShipmentService" as pub1
    component "RegisterSensorReadingService" as pub2
    component "GenerateDeliveryReportService" as pub3
}

package "Event Bus (Spring ApplicationEventPublisher)" {
    database "ApplicationEventPublisher" as eventBus {
    }
}

package "Observers (Listeners)" {
    component "AlertEvaluationListener" as obs1
    component "EventWebSocketBridge" as obs2
}

package "WebSocket (STOMP)" {
    component "WebSocketConfig\n/ws endpoint" as wsConfig
    component "/topic/sensors" as topic1
    component "/topic/alerts" as topic2
    component "/topic/shipments/status" as topic3
    component "/topic/shipments/location" as topic4
    component "/topic/reports" as topic5
}

actor "Frontend WebSocket Clients" as frontend

' Flujo de publicación
pub1 --> eventBus : ShipmentStatusChangedEvent
pub1 --> eventBus : ShipmentLocationChangedEvent
pub2 --> eventBus : SensorReadingRegisteredEvent
pub3 --> eventBus : DeliveryReportGeneratedEvent

' Flujo de observación
eventBus --> obs1 : SensorReadingRegisteredEvent
eventBus --> obs2 : todos los eventos

' Chained observer
obs1 --> eventBus : AlertTriggeredEvent (chain)
eventBus --> obs2 : AlertTriggeredEvent

' WebSocket push
obs2 --> wsConfig : convertAndSend()
wsConfig --> topic1
wsConfig --> topic2
wsConfig --> topic3
wsConfig --> topic4
wsConfig --> topic5

topic1 --> frontend
topic2 --> frontend
topic3 --> frontend
topic4 --> frontend
topic5 --> frontend

note right of eventBus
  Spring ApplicationEventPublisher
  es el Event Bus que conecta
  Publishers con Observers
end note

note right of obs1
  Chained Observer:
  Escucha SensorReadingRegisteredEvent
  y publica AlertTriggeredEvent
  si hay alerta de temperatura/humedad
end note

@enduml
```

---

## Diagrama de Componentes — Canales WebSocket

```plantuml
@startuml
skinparam componentStyle uml2

' ============================================
' CANALES WEBSOCKET - TOPICS STOMP
' ============================================

package "EventWebSocketBridge" as bridge {
    component "onSensorReading" as h1
    component "onAlert" as h2
    component "onShipmentStatus" as h3
    component "onShipmentLocation" as h4
    component "onDeliveryReport" as h5
}

package "STOMP Topics" {
    collections "/topic/sensors" as t1 {
        [SensorReading JSON]
    }
    collections "/topic/alerts" as t2 {
        [Alert JSON]
    }
    collections "/topic/shipments/status" as t3 {
        [{from, to, shipmentId}]
    }
    collections "/topic/shipments/location" as t4 {
        [{from, to, shipmentId}]
    }
    collections "/topic/reports" as t5 {
        [DeliveryReport JSON]
    }
}

actor "Frontend" as frontend

h1 --> t1 : convertAndSend()
h2 --> t2 : convertAndSend()
h3 --> t3 : convertAndSend()
h4 --> t4 : convertAndSend()
h5 --> t5 : convertAndSend()

frontend --> t1 : subscribe()
frontend --> t2 : subscribe()
frontend --> t3 : subscribe()
frontend --> t4 : subscribe()
frontend --> t5 : subscribe()

note right of frontend
  Frontend se suscribe
  a los topics que necesita
  vía STOMP sobre WebSocket
end note

@enduml
```

---

## Descripción de los Diagramas

### 1. Diagrama de Clases
Muestra la arquitectura completa del patrón Observer:
- **Eventos (domain.event)**: 5 clases que representan cambios de estado en el dominio
- **Publishers (application.usecase)**: 3 servicios que emiten eventos vía `ApplicationEventPublisher`
- **Observers**: `AlertEvaluationListener` evalúa umbrales y encadena eventos; `EventWebSocketBridge` reenvía a WebSocket
- **WebSocketConfig**: Configuración STOMP para push en tiempo real

### 2. Diagrama de Secuencia — Sensor + Alertas
Flujo completo desde que se registra una lectura de sensor hasta que:
1. Se persiste la lectura
2. Se publica `SensorReadingRegisteredEvent`
3. `AlertEvaluationListener` evalúa umbrales de temperatura/humedad
4. Si hay alerta, se publica `AlertTriggeredEvent` (Observer encadenado)
5. `EventWebSocketBridge` reenvía ambos eventos a los topics STOMP
6. Frontend recibe push vía WebSocket

### 3. Diagrama de Secuencia — Cambio de Estado
Flujo cuando se actualiza el estado de un envío:
1. `TrackShipmentService` actualiza y persiste
2. Publica `ShipmentStatusChangedEvent`
3. `EventWebSocketBridge` reenvía a `/topic/shipments/status`

### 4. Diagrama de Arquitectura Pub/Sub
Vista general del sistema publicador/suscriptor con todos los eventos y canales.

### 5. Diagrama de Canales WebSocket
Muestra los 5 topics STOMP y qué handler de `EventWebSocketBridge` escribe en cada uno.

---

## Elementos UML Principales

| Elemento | Tipo | Descripción |
|----------|------|-------------|
| **ShipmentStatusChangedEvent** | Event | Cambio de estado de envío |
| **SensorReadingRegisteredEvent** | Event | Nueva lectura de sensor |
| **ShipmentLocationChangedEvent** | Event | Cambio de ubicación |
| **AlertTriggeredEvent** | Event | Alerta de temperatura/humedad |
| **DeliveryReportGeneratedEvent** | Event | Reporte de entrega generado |
| **TrackShipmentService** | Publisher | Publica eventos de envío |
| **RegisterSensorReadingService** | Publisher | Publica eventos de sensor |
| **GenerateDeliveryReportService** | Publisher | Publica eventos de reporte |
| **AlertEvaluationListener** | Observer | Evalúa umbrales, encadena alertas |
| **EventWebSocketBridge** | Observer | Puente a WebSocket en tiempo real |
| **WebSocketConfig** | Configuration | Configura STOMP en `/ws` |

### Flujo de Eventos

```
Publisher → ApplicationEventPublisher → @EventListener → Observer
                                                  ↓
                                         (acción: DB, WebSocket, etc.)
```

### Observer Encadenado

```
SensorReadingRegisteredEvent → AlertEvaluationListener
                                   ↓ (si temp/hum fuera de rango)
                              AlertTriggeredEvent → EventWebSocketBridge
                                                       ↓
                                                  /topic/alerts
```

---

## Ejecutar los Diagramas

Para visualizar los diagramas:
1. Copia el código entre los bloques \`\`\`plantuml
2. Pégalo en [PlantUML Online Editor](https://www.planttext.com)
3. O usa la extensión **PlantUML** en VS Code
