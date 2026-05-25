# Patrón Command - Implementación en CadenaSuministros

## 1. Introducción al Patrón Command

El **Patrón Command** es un patrón de comportamiento que encapsula una solicitud como un objeto, permitiendo parametrizar clientes con diferentes solicitudes, encolar operaciones, y soportar operaciones reversibles (undo/redo).

### Propósito
- Encapsular operaciones como objetos independientes
- Separar el emisor de la solicitud (Invoker) del receptor que la ejecuta
- Soportar operaciones reversibles (undo/redo)
- Componer operaciones complejas a partir de comandos simples (Composite Command)
- Mantener un historial de operaciones ejecutadas

---

## 2. Por qué se implementó en este proyecto

### Problema Identificado

En la aplicación CadenaSuministros, las operaciones sobre envíos (`Shipment`) se ejecutaban directamente en los servicios de aplicación:

```java
// Sin Command - Lógica mezclada con efectos secundarios
public Shipment updateStatus(UUID shipmentId, String newStatus) {
    Shipment current = repository.findById(shipmentId);
    Shipment updated = current.withStatus(newStatus);
    Shipment saved = repository.save(updated);
    eventRepository.save(new ShipmentEvent(...));
    eventPublisher.publishEvent(new ShipmentStatusChangedEvent(...));
    return saved;
}
```

Esto generaba:
- **Sin historial**: No hay registro de qué operaciones se ejecutaron
- **Sin deshacer**: No es posible revertir una operación
- **Lógica acoplada**: Validación, persistencia y publicación de eventos en el mismo método
- **Sin composición**: No es posible ejecutar múltiples operaciones como una sola unidad
- **Frontend reactivo limitado**: Sin capacidad de "deshacer" desde la UI

### Solución

Implementar el patrón Command en dos capas:

**Backend (`domain/command/`)**: Comandos que encapsulan la lógica de negocio (validar, persistir, publicar eventos) y soportan `undo()` restaurando el estado previo desde la base de datos.

**Frontend (`commands/`)**: Comandos que encapsulan llamadas a la API y capturan el estado anterior para permitir undo desde la UI sin recargar.

---

## 3. Estructura Implementada

### Backend — `domain/command/`

| Archivo | Tipo | Descripción |
|---------|------|-------------|
| `ShipmentCommand.java` | Interface | Contrato: `execute()`, `undo()`, `getDescription()`, `getShipmentId()` |
| `UpdateStatusCommand.java` | Class | Cambia estado de un envío; undo restaura el estado anterior |
| `UpdateLocationCommand.java` | Class | Cambia ubicación; undo restaura la ubicación anterior |
| `CreateShipmentCommand.java` | Class | Crea un envío; undo lo marca como CANCELLED |
| `ShipmentCommandInvoker.java` | Class | Invoker con historial (50 comandos), undo/redo, undo por shipment |
| `CompositeShipmentCommand.java` | Class | Macro comando que ejecuta/deshace una lista de comandos en orden |

### Interfaz del Comando

```java
public interface ShipmentCommand {
    Shipment execute();
    Optional<Shipment> undo();
    String getDescription();
    UUID getShipmentId();
}
```

### Invoker

```java
public class ShipmentCommandInvoker {
    private final Deque<ShipmentCommand> history = new ArrayDeque<>();
    private final Deque<ShipmentCommand> redoStack = new ArrayDeque<>();
    private static final int MAX_HISTORY = 50;

    public Shipment execute(ShipmentCommand command) { ... }
    public Optional<Shipment> undoLast() { ... }
    public Optional<Shipment> undoForShipment(UUID shipmentId) { ... }
    public Optional<Shipment> redo() { ... }
    public List<String> getHistory() { ... }
}
```

### Frontend — `commands/`

| Archivo | Tipo | Descripción |
|---------|------|-------------|
| `Command.ts` | Interface + Class | `Command<T>` interface + `CommandHistory` singleton con undo/redo stacks (20 comandos) |
| `UpdateStatusCommand.ts` | Class | Captura status anterior vía GET, ejecuta PATCH, undo restaura status anterior |

### Hook React

| Archivo | Descripción |
|---------|-------------|
| `hooks/useCommand.ts` | Hook que expone `execute`, `undo`, `redo`, `canUndo`, `canRedo` usando `useSyncExternalStore` |

### Diagrama de Arquitectura

```
                    ┌──────────────────────────────────┐
                    │       Frontend (React)            │
                    │  ┌────────────────────────────┐   │
                    │  │ useCommand() hook           │   │
                    │  │   ├─ execute(cmd)          │   │
                    │  │   ├─ undo()                │   │
                    │  │   ├─ redo()                │   │
                    │  │   └─ canUndo/canRedo       │   │
                    │  └───────────┬────────────────┘   │
                    │              │                     │
                    │  ┌───────────▼────────────────┐   │
                    │  │ CommandHistory (singleton)  │   │
                    │  │   undoStack[0..20]         │   │
                    │  │   redoStack[0..20]         │   │
                    │  └───────────┬────────────────┘   │
                    │              │                     │
                    │  ┌───────────▼────────────────┐   │
                    │  │ UpdateStatusCommand        │   │
                    │  │   execute() → PATCH API    │   │
                    │  │   undo()   → PATCH reverse │   │
                    │  └───────────┬────────────────┘   │
                    └──────────────┼────────────────────┘
                                   │ HTTP REST
                    ┌──────────────▼────────────────────┐
                    │       Backend (Spring Boot)        │
                    │                                    │
                    │  ┌──────────────────────────────┐  │
                    │  │ ShipmentController           │  │
                    │  │   PATCH /{id}/status         │  │
                    │  │   POST /{id}/undo            │  │
                    │  │   GET  /commands             │  │
                    │  └───────────┬──────────────────┘  │
                    │              │                     │
                    │  ┌───────────▼──────────────────┐  │
                    │  │ TrackShipmentService         │  │
                    │  │   updateStatus()             │  │
                    │  │   undoForShipment()          │  │
                    │  └───────────┬──────────────────┘  │
                    │              │                     │
                    │  ┌───────────▼──────────────────┐  │
                    │  │ ShipmentCommandInvoker       │  │
                    │  │   history[0..50]             │  │
                    │  │   ┌───────────────────────┐  │  │
                    │  │   │ UpdateStatusCommand   │  │  │
                    │  │   │ UpdateLocationCommand │  │  │
                    │  │   │ CreateShipmentCommand │  │  │
                    │  │   │ CompositeShipmentCmd  │  │  │
                    │  │   └───────────────────────┘  │  │
                    │  └───────────┬──────────────────┘  │
                    │              │                     │
                    │              ▼                     │
                    │  ┌──────────────────────────────┐  │
                    │  │ ShipmentRepository (JPA)     │  │
                    │  │ EventRepository (JPA)        │  │
                    │  │ ApplicationEventPublisher    │  │
                    │  └──────────────────────────────┘  │
                    └────────────────────────────────────┘
```

---

## 4. Cómo funciona

### Ejemplo 1: Actualizar estado (Backend)

```java
// TrackShipmentService delega al Invoker
public Shipment updateStatus(UUID shipmentId, String newStatus) {
    return invoker.execute(new UpdateStatusCommand(
        shipmentRepository, eventRepository, eventPublisher,
        shipmentId, newStatus));
}
```

Dentro de `UpdateStatusCommand.execute()`:
1. Busca el shipment actual y guarda su estado como `previousState`
2. Crea un nuevo Shipment con el nuevo status
3. Persiste en DB
4. Guarda un ShipmentEvent en el historial
5. Publica `ShipmentStatusChangedEvent` (Observer pattern)
6. Retorna el shipment actualizado

### Ejemplo 2: Deshacer (Backend)

```java
// POST /api/shipments/{id}/undo
@PostMapping("/{id}/undo")
public Shipment undo(@PathVariable UUID id) {
    return trackShipmentUseCase.undoForShipment(id)
            .orElseThrow(() -> new IllegalStateException(
                "No hay operaciones para deshacer para el envío: " + id));
}
```

Dentro de `ShipmentCommandInvoker.undoForShipment()`:
1. Busca el comando más reciente para ese shipmentId en el historial
2. Lo remueve del historial
3. Ejecuta `command.undo()` que restaura el estado previo en DB
4. Registra un ShipmentEvent de la reversión
5. Publica un nuevo evento para notificar vía WebSocket

### Ejemplo 3: Comando compuesto

```java
// Ejecutar múltiples operaciones como una sola unidad
CompositeShipmentCommand macro = new CompositeShipmentCommand()
    .add(new UpdateStatusCommand(..., "IN_TRANSIT"))
    .add(new UpdateLocationCommand(..., "RUTA-25"));

Shipment result = invoker.execute(macro);
// undo() revierte en orden inverso: primero ubicación, luego estado
macro.undo();
```

### Ejemplo 4: Frontend con undo

```typescript
// En ShipmentsPage.tsx
const { execute: executeCmd, undo, canUndo } = useCommand();

const handleUpdateStatus = async (id: string, newStatus: string) => {
    await executeCmd(new UpdateStatusCommand(id, newStatus));
    await fetchShipments();
};

// Botón "↩ Deshacer" en el header
{canUndo && (
    <button onClick={undo} className="btn-undo">
        ↩ Deshacer
    </button>
)}
```

### Historial de comandos

```
GET /api/shipments/commands
```

Respuesta:
```json
[
    "UpdateStatus: 550e8400-e29b-41d4-a716-446655440000 → IN_TRANSIT",
    "UpdateLocation: 550e8400-e29b-41d4-a716-446655440000 → RUTA-25",
    "UpdateStatus: 550e8400-e29b-41d4-a716-446655440000 → DELIVERED"
]
```

---

## 5. Beneficios

### Beneficios del Patrón

| Beneficio | Descripción |
|-----------|-------------|
| **Operaciones reversibles** | Cada comando guarda el estado anterior y puede restaurarlo vía `undo()` |
| **Historial de operaciones** | El Invoker mantiene un historial de los últimos 50 comandos ejecutados |
| **Separación de responsabilidades** | Validación, persistencia y publicación de eventos encapsulados en cada comando |
| **Composición de comandos** | `CompositeShipmentCommand` ejecuta/deshace múltiples operaciones como una unidad |
| **Undo por shipment** | `undoForShipment(UUID)` encuentra el último comando para un envío específico |
| **Frontend reactivo** | El hook `useCommand` expone `canUndo`/`canRedo` para UI reactiva |
| **Auditabilidad** | Cada ejecución y undo queda registrado como `ShipmentEvent` en la base de datos |

### Archivos del Patrón (Backend)

| Archivo | Rol |
|---------|-----|
| `domain/command/ShipmentCommand.java` | Interfaz del comando |
| `domain/command/UpdateStatusCommand.java` | Comando concreto: cambio de estado |
| `domain/command/UpdateLocationCommand.java` | Comando concreto: cambio de ubicación |
| `domain/command/CreateShipmentCommand.java` | Comando concreto: creación de envío |
| `domain/command/ShipmentCommandInvoker.java` | Invoker con historial y undo/redo |
| `domain/command/CompositeShipmentCommand.java` | Macro comando (Composite pattern) |
| `application/usecase/TrackShipmentService.java` | Servicio que delega en el Invoker |
| `adapters/inbound/rest/ShipmentController.java` | Endpoints REST (`/undo`, `/commands`) |

### Archivos del Patrón (Frontend)

| Archivo | Rol |
|---------|-----|
| `commands/Command.ts` | Interfaz + `CommandHistory` singleton |
| `commands/UpdateStatusCommand.ts` | Comando concreto para cambio de estado |
| `hooks/useCommand.ts` | Hook React para acceder al CommandHistory |
| `pages/ShipmentsPage.tsx` | Consumidor: botón undo + ejecución de comandos |

### Comparación: Sin vs Con Command

| Aspecto | Sin Command | Con Command |
|---------|-------------|-------------|
| **Deshacer operaciones** | No soportado | `undo()` restaura estado anterior en DB |
| **Historial** | Solo ShipmentEvent (lecturas) | ShipmentEvent + historial de comandos ejecutados |
| **Composición** | Llamadas secuenciales manuales | `CompositeShipmentCommand` como macro |
| **Frontend undo** | No disponible | Botón "↩ Deshacer" vía `useCommand()` |
| **Auditabilidad** | Solo cambios de estado | Cada comando y su reversión queda registrado |

---

## 6. Consideraciones Técnicas

### Implementación en dos capas

El patrón Command se implementó en **backend y frontend** con responsabilidades distintas:

| Capa | Responsabilidad del Comando |
|------|----------------------------|
| **Backend** | Lógica de negocio (validar, persistir, publicar eventos, undo desde DB) |
| **Frontend** | Orquestación de API (capturar estado previo, ejecutar HTTP, exponer undo en UI) |

### Undo desde el Frontend

El flujo completo de undo desde la UI:

1. Usuario hace clic en "↩ Deshacer"
2. `useCommand().undo()` → `CommandHistory.undo()` → `UpdateStatusCommand.undo()`
3. Frontend ejecuta `PATCH /api/shipments/{id}/status` con el estado anterior
4. Backend crea un nuevo `UpdateStatusCommand` (no deshace el comando original, sino que ejecuta una operación inversa)
5. El backend registra el cambio como un nuevo comando en el historial

### Historial limitado

- **Backend**: `ShipmentCommandInvoker` mantiene hasta 50 comandos en memoria (stack). Si se excede, se descartan los más antiguos.
- **Frontend**: `CommandHistory` mantiene hasta 20 comandos. Los comandos antiguos se descartan del inicio del array.

### Composite Command

`CompositeShipmentCommand` implementa `ShipmentCommand` y contiene una lista de subcomandos:

- `execute()`: Ejecuta cada subcomando en orden
- `undo()`: Deshace cada subcomando en orden inverso
- `getDescription()`: Retorna descripción compuesta de todos los subcomandos

### Integración con Observer

Cada comando que modifica datos publica eventos de dominio (`ShipmentStatusChangedEvent`, `ShipmentLocationChangedEvent`) al finalizar `execute()` y también al ejecutar `undo()`, garantizando que:

1. El WebSocket Bridge reenvíe el cambio al frontend
2. El AlertEvaluationListener pueda reaccionar si es necesario
3. Cada reversión sea completamente auditable

### Para agregar un nuevo comando

1. Crear clase que implemente `ShipmentCommand` en `domain/command/`
2. Implementar `execute()` con la lógica de negocio
3. Implementar `undo()` restaurando el estado previo
4. Agregar método delegado en `TrackShipmentService`
5. Agregar endpoint REST en `ShipmentController` (opcional)

---

## 7. Conclusión

El patrón Command proporciona una solución elegante para encapsular operaciones sobre envíos como objetos independientes, permitiendo:

- **Deshacer operaciones** tanto desde la API REST como desde la UI del frontend
- **Mantener un historial** de los últimos 50 comandos ejecutados
- **Componer operaciones** complejas como macros (`CompositeShipmentCommand`)
- **Auditar** cada operación y su reversión mediante eventos de dominio

La implementación en dos capas (backend con lógica de negocio, frontend con orquestación HTTP) mantiene la separación de responsabilidades y permite que cada capa opere dentro de su dominio natural.

### Estado de los tests

```
Frontend:  9 suites, 49 tests passed
Backend:  90 tests run, 0 failures, 11 pre-existing errors (alertEvaluator null)
```

Los 11 errores del backend son pre-existentes y corresponden a `SupplyChainFacadeImplTest` (mock de `AlertEvaluator` no configurado), no relacionados con el patrón Command.
