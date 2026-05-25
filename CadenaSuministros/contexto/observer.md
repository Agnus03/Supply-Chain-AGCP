# Patrón Observer - Implementación en CadenaSuministros

## 1. Introducción al Patrón Observer

El **Patrón Observer** es un patrón de comportamiento que define una dependencia de uno a muchos entre objetos, de modo que cuando un objeto cambia su estado, todos sus dependientes son notificados y actualizados automáticamente.

### Propósito
- Desacoplar el emisor de un evento (Subject) de los receptores (Observers)
- Permitir que múltiples objetos reaccionen a cambios sin que el emisor los conozca
- Soportar comunicación broadcast sin acoplamiento directo
- Facilitar la extensibilidad: nuevos observers se registran sin modificar el subject

---

## 2. Por qué se implementó en este proyecto

### Problema Identificado

En la aplicación CadenaSuministros, múltiples operaciones de dominio deben producir **reacciones en cadena** sin que el código que ejecuta la operación conozca a los interesados:

| Operación | ¿Quién necesita saberlo? |
|-----------|--------------------------|
| Se registra una lectura de sensor | AlertEvaluator (evaluar umbrales), Frontend (actualizar dashboard) |
| Cambia el estado de un envío | Frontend (refrescar tracking), Historial (persistir evento) |
| Cambia la ubicación de un envío | Frontend (actualizar mapa) |
| Se genera un reporte de entrega | Frontend (mostrar resultado) |
| Se dispara una alerta | Frontend (notificación en tiempo real) |

**Sin Observer**, cada servicio tendría que llamar explícitamente a todos los interesados:

```java
// Sin Observer - Acoplamiento directo
public Shipment updateStatus(UUID id, String newStatus) {
    Shipment saved = repository.save(updated);
    eventRepository.save(new ShipmentEvent(...));
    
    // Llamadas explícitas a cada interesado
    alertEvaluator.evaluate(saved);           // ← acoplado a AlertEvaluator
    webSocketBridge.broadcast(saved);          // ← acoplado a WebSocket
    emailService.notify(saved);               // ← acoplado a Email
    // ...
    return saved;
}
```

Esto genera:
- **Alto acoplamiento**: El servicio de tracking conoce a todos los interesados
- **Dificultad de extensión**: Agregar un nuevo interesado requiere modificar el servicio
- **Mezcla de responsabilidades**: La lógica de negocio mezclada con efectos secundarios
- **Imposibilidad de suscripción selectiva**: Todos los interesados reciben todo

### Solución

Implementar el patrón Observer usando el mecanismo de **ApplicationEventPublisher** de Spring, donde:

1. Los **servicios de dominio** publican eventos sin conocer a los suscriptores
2. Los **listeners** se suscriben a eventos específicos vía `@EventListener`
3. El **EventWebSocketBridge** actúa como puente hacia el frontend vía STOMP WebSocket
4. Los **listeners pueden encadenarse**: un listener puede publicar nuevos eventos

```java
// Con Observer - Sin acoplamiento
public Shipment updateStatus(UUID id, String newStatus) {
    Shipment saved = repository.save(updated);
    eventRepository.save(new ShipmentEvent(...));
    
    // Solo publica el evento - no conoce a los interesados
    eventPublisher.publishEvent(new ShipmentStatusChangedEvent(...));
    return saved;
}
```

---

## 3. Estructura Implementada

### Ubicación

| Capa | Paquete | Responsabilidad |
|------|---------|-----------------|
| **Eventos** | `domain.event/` | Clases que transportan datos del cambio ocurrido |
| **Publishers** | `application.usecase/` | Servicios que emiten eventos |
| **Listeners** | `application.listener/` | Observers que reaccionan a eventos |
| **WebSocket** | `adapters.outbound.events/` | Puente a frontend vía STOMP |

### Eventos (Subjects)

| Clase | Atributos | Publicado por |
|-------|-----------|---------------|
| `ShipmentStatusChangedEvent` | `shipmentId`, `fromStatus`, `toStatus`, `occurredOn` | `TrackShipmentService.updateStatus()` |
| `ShipmentLocationChangedEvent` | `shipmentId`, `fromLocation`, `toLocation`, `occurredOn` | `TrackShipmentService.updateLocation()` |
| `SensorReadingRegisteredEvent` | `reading` (SensorReading), `occurredOn` | `RegisterSensorReadingService.register()` |
| `AlertTriggeredEvent` | `reading` (SensorReading), `reason`, `occurredOn` | `AlertEvaluationListener` (encadenado) |
| `DeliveryReportGeneratedEvent` | `report` (DeliveryReport), `occurredOn` | `GenerateDeliveryReportService.generate()` |

### Publishers (Subjects)

```java
// TrackShipmentService.java (líneas 76-77)
eventPublisher.publishEvent(new ShipmentStatusChangedEvent(
    shipmentId, current.status(), newStatus));

// RegisterSensorReadingService.java (línea 27)
eventPublisher.publishEvent(new SensorReadingRegisteredEvent(saved));

// GenerateDeliveryReportService.java (línea 83)
eventPublisher.publishEvent(new DeliveryReportGeneratedEvent(saved));
```

### Observers (Listeners)

```java
// AlertEvaluationListener.java - Evalúa umbrales y encadena alertas
@Component
public class AlertEvaluationListener {
    @EventListener
    public void onSensorReadingRegistered(SensorReadingRegisteredEvent event) {
        // Evalúa temperatura y humedad contra umbrales
        if (tempAlert || humAlert) {
            // Publica nuevo evento (observer encadenado)
            eventPublisher.publishEvent(new AlertTriggeredEvent(reading, reason));
        }
    }
}
```

```java
// EventWebSocketBridge.java - Puente a WebSocket (5 handlers)
@Component
public class EventWebSocketBridge {
    @EventListener
    public void onShipmentStatus(ShipmentStatusChangedEvent event) {
        messagingTemplate.convertAndSend("/topic/shipments/status", event);
    }
    // ... onSensorReading, onAlert, onShipmentLocation, onDeliveryReport
}
```

### Canal de Entrega (WebSocket STOMP)

```java
// WebSocketConfig.java
@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {
    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        registry.enableSimpleBroker("/topic");          // Broker para suscripciones
        registry.setApplicationDestinationPrefixes("/app");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint("/ws")
                .setAllowedOriginPatterns("*");
    }
}
```

### Diagrama de Arquitectura

```
                    ┌─────────────────────────────────────┐
                    │          Publishers                  │
                    │  ┌───────────────────────────────┐   │
                    │  │ TrackShipmentService           │───┼──→ ShipmentStatusChangedEvent
                    │  │ RegisterSensorReadingService   │───┼──→ SensorReadingRegisteredEvent
                    │  │ GenerateDeliveryReportService  │───┼──→ DeliveryReportGeneratedEvent
                    │  └───────────────────────────────┘   │
                    └──────────────┬──────────────────────┘
                                   │ publishEvent()
                                   ▼
                    ┌──────────────────────────────────────┐
                    │   ApplicationEventPublisher          │
                    │   (Spring Event Bus)                 │
                    └──────────────────┬───────────────────┘
                                       │
                       ┌───────────────┼───────────────┐
                       ▼               ▼               ▼
               ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
               │AlertEvaluation│ │EventWebSocket│ │ (Futuros     │
               │Listener       │ │Bridge        │ │  listeners)  │
               └──────┬───────┘ └──────┬───────┘ └──────────────┘
                      │                │
                      │ (chain)        │ convertAndSend()
                      ▼                ▼
               AlertTriggeredEvent   ┌─────────────────────┐
                                     │  STOMP Topics       │
                                     │  /topic/sensors     │
                                     │  /topic/alerts      │
                                     │  /topic/shipments/  │
                                     │    status           │
                                     │    location         │
                                     │  /topic/reports     │
                                     └─────────┬───────────┘
                                               │ WebSocket /ws
                                               ▼
                                        ┌──────────────┐
                                        │   Frontend   │
                                        │  (React)     │
                                        └──────────────┘
```

---

## 4. Cómo funciona

### Ejemplo 1: Registro de lectura de sensor con alerta encadenada

```java
// 1. Servicio registra la lectura y publica evento
SensorReading saved = sensorReadingRepository.save(reading);
eventPublisher.publishEvent(new SensorReadingRegisteredEvent(saved));

// 2. AlertEvaluationListener recibe el evento automáticamente
@EventListener
public void onSensorReadingRegistered(SensorReadingRegisteredEvent event) {
    SensorReading reading = event.getReading();
    boolean tempAlert = alertEvaluator.isTemperatureAlert(reading.temperatureC());
    boolean humAlert = alertEvaluator.isHumidityAlert(reading.humidityPct());

    if (tempAlert || humAlert) {        // ¿Fuera de rango?
        String reason = ...;
        eventPublisher.publishEvent(new AlertTriggeredEvent(reading, reason));
    }
}

// 3. EventWebSocketBridge reenvía ambos eventos al frontend
@EventListener
public void onSensorReading(SensorReadingRegisteredEvent event) {
    messagingTemplate.convertAndSend("/topic/sensors", event.getReading());
}

@EventListener
public void onAlert(AlertTriggeredEvent event) {
    messagingTemplate.convertAndSend("/topic/alerts", event);
}
```

### Ejemplo 2: Cambio de estado de envío con WebSocket

```java
// 1. TrackShipmentService actualiza y publica
public Shipment updateStatus(UUID shipmentId, String newStatus) {
    Shipment current = getById(shipmentId);
    Shipment updated = current.withStatus(newStatus);
    Shipment saved = shipmentRepository.save(updated);
    eventRepository.save(new ShipmentEvent(...));

    eventPublisher.publishEvent(new ShipmentStatusChangedEvent(
        shipmentId, current.status(), newStatus));
    return saved;
}

// 2. EventWebSocketBridge reenvía a WebSocket
@EventListener
public void onShipmentStatus(ShipmentStatusChangedEvent event) {
    messagingTemplate.convertAndSend("/topic/shipments/status", event);
}
// → Frontend recibe push en tiempo real: { shipmentId, fromStatus, toStatus }
```

### Flujo Completo de Eventos

```
Registro Sensor → SensorReadingRegisteredEvent
    ├──→ AlertEvaluationListener → (si alerta) → AlertTriggeredEvent
    │       └──→ EventWebSocketBridge → /topic/alerts
    └──→ EventWebSocketBridge → /topic/sensors

Cambio Estado → ShipmentStatusChangedEvent
    └──→ EventWebSocketBridge → /topic/shipments/status

Cambio Ubicación → ShipmentLocationChangedEvent
    └──→ EventWebSocketBridge → /topic/shipments/location

Generar Reporte → DeliveryReportGeneratedEvent
    └──→ EventWebSocketBridge → /topic/reports
```

### Topics STOMP

| Topic | Payload | Propósito |
|-------|---------|-----------|
| `/topic/sensors` | `SensorReading` JSON | Actualizar dashboard de sensores |
| `/topic/alerts` | `AlertTriggeredEvent` JSON | Notificar alertas en tiempo real |
| `/topic/shipments/status` | `ShipmentStatusChangedEvent` JSON | Actualizar tracking de envíos |
| `/topic/shipments/location` | `ShipmentLocationChangedEvent` JSON | Actualizar mapa de ubicaciones |
| `/topic/reports` | `DeliveryReport` JSON | Notificar reporte generado |

---

## 5. Beneficios

### Beneficios del Patrón

| Beneficio | Descripción |
|-----------|-------------|
| **Bajo acoplamiento** | Los publishers no conocen a los observers |
| **Extensibilidad** | Agregar un nuevo observer no requiere modificar el publisher |
| **Responsabilidad única** | Cada clase hace una cosa: publicar, evaluar, o reenviar |
| **Observer encadenado** | `AlertEvaluationListener` publica nuevos eventos sin modificar el flujo original |
| **Entrega en tiempo real** | `EventWebSocketBridge` empuja eventos al frontend sin polling |
| **Suscripción selectiva** | Cada `@EventListener` escucha solo el evento que le interesa |
| **Integración Spring** | Sin infraestructura adicional: `ApplicationEventPublisher` + `@EventListener` |

### Archivos del Patrón

| Archivo | Rol | Tipo |
|---------|-----|------|
| `domain/event/ShipmentStatusChangedEvent.java` | Evento | Subject |
| `domain/event/ShipmentLocationChangedEvent.java` | Evento | Subject |
| `domain/event/SensorReadingRegisteredEvent.java` | Evento | Subject |
| `domain/event/AlertTriggeredEvent.java` | Evento | Subject (encadenado) |
| `domain/event/DeliveryReportGeneratedEvent.java` | Evento | Subject |
| `application/usecase/TrackShipmentService.java` | Publisher | Observable |
| `application/usecase/RegisterSensorReadingService.java` | Publisher | Observable |
| `domain/service/GenerateDeliveryReportService.java` | Publisher | Observable |
| `application/listener/AlertEvaluationListener.java` | Observer + Publisher | Chained Observer |
| `adapters/outbound/events/EventWebSocketBridge.java` | Observer | WebSocket Bridge |
| `adapters/outbound/events/WebSocketConfig.java` | Configuración | STOMP Broker |

### Comparación: Sin vs Con Observer

| Aspecto | Sin Observer | Con Observer |
|---------|-------------|--------------|
| **Acoplamiento** | Publisher conoce a todos los interesados | Publisher solo conoce el EventBus |
| **Nuevo interesado** | Modificar el publisher + todos los tests | Crear nueva clase `@EventListener` |
| **Flujo de alertas** | Lógica de alertas dentro del servicio de sensores | `AlertEvaluationListener` separado y encadenable |
| **Entrega a frontend** | Polling HTTP (cada N segundos) | Push WebSocket (inmediato) |
| **Testing** | Mockear múltiples dependencias en el publisher | Testear cada listener de forma aislada |

---

## 6. Consideraciones Técnicas

### Implementación con Spring

El patrón Observer se implementó usando el mecanismo nativo de Spring:

- **`ApplicationEventPublisher`**: Inyectado en los servicios para publicar eventos
- **`@EventListener`**: Anotación en métodos de beans Spring para suscribirse a eventos
- **`@Component`**: Los listeners son beans gestionados por Spring
- **`SimpMessagingTemplate`**: Para enviar mensajes STOMP a clientes WebSocket

### Observer Encadenado (Chained Observer)

`AlertEvaluationListener` es un **observer encadenado**: recibe `SensorReadingRegisteredEvent`, evalúa umbrales, y si hay alerta, publica `AlertTriggeredEvent`. Esto permite:

1. Separar la lógica de detección de alertas del registro de sensores
2. Reutilizar el evaluador de umbrales (`AlertEvaluator`) en otros contextos
3. Publicar alertas sin modificar `RegisterSensorReadingService`

### WebSocket como Canal de Entrega

La entrega de eventos al frontend se realiza mediante **STOMP sobre WebSocket**:

- Endpoint: `/ws` (conexión WebSocket)
- Broker: `/topic` (suscrpciones pub/sub)
- Sin polling: El frontend recibe eventos inmediatamente después de ocurrir

### Arquitectura Hexagonal

El patrón Observer respeta los principios de la arquitectura hexagonal:

- **Eventos (`domain.event/`)**: En la capa de dominio, sin dependencias externas
- **Publishers (`application.usecase/`)**: En la capa de aplicación
- **Listener (`application.listener/`)**: En la capa de aplicación (lógica de negocio)
- **WebSocket (`adapters.outbound.events/`)**: En la capa de adaptadores (infraestructura)

### Para agregar un nuevo evento

1. Crear clase en `domain/event/` con los datos del cambio
2. Publicar el evento vía `eventPublisher.publishEvent()` desde el servicio correspondiente
3. Crear un `@EventListener` en el componente que debe reaccionar

---

## 7. Conclusión

El patrón Observer proporciona una solución elegante para desacoplar la generación de eventos de dominio de las reacciones a esos eventos. En CadenaSuministros permite:

- **Desacoplar** los servicios de dominio de los efectos secundarios (alertas, WebSocket)
- **Extender** el sistema sin modificar código existente (nuevo listener = nueva clase)
- **Encadenar** reacciones (lectura → evaluación → alerta → WebSocket)
- **Entregar en tiempo real** al frontend vía WebSocket sin polling

La implementación con `ApplicationEventPublisher` + `@EventListener` aprovecha la infraestructura existente de Spring sin agregar dependencias externas, manteniendo el código limpio y alineado con la arquitectura hexagonal del proyecto.
