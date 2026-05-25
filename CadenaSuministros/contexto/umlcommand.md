# UML del Patrón Command - CadenaSuministros

```plantuml
@startuml
skinparam componentStyle uml2

' ============================================
' PATRON COMMAND - CADENA SUMINISTROS
' ============================================

package "domain.command (Backend)" {
    interface "ShipmentCommand" as cmdInterface {
        + execute(): Shipment
        + undo(): Optional<Shipment>
        + getDescription(): String
        + getShipmentId(): UUID
    }

    class "UpdateStatusCommand" as updateStatus {
        - previousState: Shipment
        + execute(): Shipment
        + undo(): Optional<Shipment>
    }

    class "UpdateLocationCommand" as updateLocation {
        - previousState: Shipment
        + execute(): Shipment
        + undo(): Optional<Shipment>
    }

    class "CreateShipmentCommand" as createShipment {
        - createdShipment: Shipment
        + execute(): Shipment
        + undo(): Optional<Shipment>
    }

    class "CompositeShipmentCommand" as composite {
        - commands: List<ShipmentCommand>
        + add(cmd): CompositeShipmentCommand
        + execute(): Shipment
        + undo(): Optional<Shipment>
    }

    class "ShipmentCommandInvoker" as invoker {
        - history: Deque<ShipmentCommand>
        - redoStack: Deque<ShipmentCommand>
        + execute(command): Shipment
        + undoLast(): Optional<Shipment>
        + undoForShipment(id): Optional<Shipment>
        + redo(): Optional<Shipment>
        + getHistory(): List<String>
    }
}

package "application.usecase" {
    class "TrackShipmentService" as service {
        - invoker: ShipmentCommandInvoker
        + updateStatus(id, status): Shipment
        + updateLocation(id, location): Shipment
        + create(shipment): Shipment
        + undoForShipment(id): Optional<Shipment>
        + getCommandHistory(): List<String>
    }
}

package "adapters.inbound.rest" {
    class "ShipmentController" as controller {
        + PATCH /{id}/status
        + POST /{id}/undo
        + GET /commands
    }
}

' Relaciones
cmdInterface <|.. updateStatus
cmdInterface <|.. updateLocation
cmdInterface <|.. createShipment
cmdInterface <|.. composite

composite o--> cmdInterface : commands

invoker --> cmdInterface : executes
invoker o--> cmdInterface : history

service --> invoker : delegates
controller ..> service : calls

@enduml
```

---

## Diagrama de Clases — Frontend Command

```plantuml
@startuml
skinparam componentStyle uml2

' ============================================
' PATRON COMMAND - FRONTEND (TypeScript)
' ============================================

package "commands" {
    interface "Command<T>" as cmdInterface {
        + execute(): Promise<T>
        + undo(): Promise<void>
        + getDescription(): string
    }

    class "UpdateStatusCommand" as updateStatus {
        - previousStatus: string | null
        + execute(): Promise<Shipment>
        + undo(): Promise<void>
        + getDescription(): string
    }

    class "CommandHistory" as history {
        - undoStack: Command[]
        - redoStack: Command[]
        + execute<T>(command): Promise<T>
        + undo(): Promise<void>
        + redo(): Promise<void>
        + canUndo(): boolean
        + canRedo(): boolean
    }

    note left of history
        Singleton exportado como
        "commandHistory"
    end note
}

package "hooks" {
    class "useCommand" as hook {
        + execute<T>(command): Promise<T>
        + undo(): Promise<void>
        + redo(): Promise<void>
        + canUndo: boolean
        + canRedo: boolean
    }
}

package "pages" {
    class "ShipmentsPage" as page {
        + handleUpdateStatus(id, status): void
        + undo(): void
    }
}

' Relaciones
cmdInterface <|.. updateStatus

history --> cmdInterface : manages

hook ..> history : uses singleton
page ..> hook : uses
page ..> updateStatus : creates

@enduml
```

---

## Diagrama de Secuencia — Cambio de Estado con Undo

```plantuml
@startuml
skinparam componentStyle uml2

' ============================================
' SECUENCIA - CAMBIO DE ESTADO CON UNDO
' ============================================

actor "Usuario" as user
participant "ShipmentsPage" as page
participant "useCommand" as hook
participant "CommandHistory" as history
participant "UpdateStatusCommand" as cmd
participant "Backend API" as api

== 1. Cambiar Estado ==

user -> page: selecciona nuevo status
page -> hook: execute(cmd)
activate hook

hook -> history: execute(cmd)
activate history

history -> cmd: execute()
activate cmd

cmd -> api: GET /api/shipments/{id}
api --> cmd: Shipment (current)
cmd -> cmd: previousStatus = current.status

cmd -> api: PATCH /api/shipments/{id}/status
api --> cmd: Shipment (updated)
cmd --> history: Shipment
deactivate cmd

history -> history: undoStack.push(cmd)
history --> hook: Shipment
deactivate history

hook --> page: Shipment
deactivate hook

== 2. Deshacer (Undo) ==

user -> page: clic "↩ Deshacer"
page -> hook: undo()
activate hook

hook -> history: undo()
activate history

history -> history: cmd = undoStack.pop()

history -> cmd: undo()
activate cmd

cmd -> api: PATCH /api/shipments/{id}/status (previousStatus)
api --> cmd: Shipment (restored)
cmd --> history: void
deactivate cmd

history -> history: redoStack.push(cmd)
history --> hook: void
deactivate history

hook --> page: void
deactivate hook

page -> page: fetchShipments()

@enduml
```

---

## Diagrama de Secuencia — Undo For Shipment (Backend)

```plantuml
@startuml
skinparam componentStyle uml2

' ============================================
' SECUENCIA - UNDO FOR SHIPMENT (BACKEND)
' ============================================

actor "Cliente REST" as client
participant "ShipmentController" as controller
participant "TrackShipmentService" as service
participant "ShipmentCommandInvoker" as invoker
participant "UpdateStatusCommand" as cmd
participant "ShipmentRepository" as repo
database "PostgreSQL" as db

== Undo del último comando para un shipment ==

client -> controller: POST /api/shipments/{id}/undo
activate controller

controller -> service: undoForShipment(id)
activate service

service -> invoker: undoForShipment(id)
activate invoker

invoker -> invoker: buscar cmd en history por shipmentId
invoker -> invoker: history.remove(found)

invoker -> cmd: undo()
activate cmd

cmd -> repo: save(previousState)
activate repo
repo -> db: UPDATE shipments SET status=...
db --> repo: OK
repo --> cmd: Shipment (restored)
deactivate repo

cmd -> cmd: guardar ShipmentEvent de reversión
cmd -> cmd: publicar ShipmentStatusChangedEvent (inverso)
cmd --> invoker: Optional<Shipment>
deactivate cmd

invoker -> invoker: redoStack.push(cmd)
invoker --> service: Optional<Shipment>
deactivate invoker

service --> controller: Shipment
deactivate service

controller --> client: Shipment (200 OK)
deactivate controller

@enduml
```

---

## Diagrama de Componentes — Arquitectura Completa

```plantuml
@startuml
skinparam componentStyle uml2

' ============================================
' ARQUITECTURA COMPLETA - PATRON COMMAND
' ============================================

package "Frontend (React/TypeScript)" as frontend {
    component "useCommand hook" as hook
    component "CommandHistory" as hist
    component "UpdateStatusCommand" as frontCmd
    component "ShipmentsPage" as page
}

package "API Gateway (REST)" as api {
    component "PATCH /{id}/status" as patchStatus
    component "POST /{id}/undo" as undoEndpoint
    component "GET /commands" as commandsEndpoint
}

package "Backend (Spring Boot)" as backend {
    component "TrackShipmentService" as service
    component "ShipmentCommandInvoker" as invoker
    component "UpdateStatusCommand" as backendCmd
    component "UpdateLocationCommand" as locCmd
    component "CreateShipmentCommand" as createCmd
    component "CompositeShipmentCommand" as compCmd
}

package "Persistencia" as db {
    database "ShipmentRepository" as shipmentRepo
    database "ShipmentEventRepository" as eventRepo
}

' Flujo frontend
page --> hook : 1. useCommand()
hook --> hist : 2. execute(cmd)
hist --> frontCmd : 3. execute()
frontCmd --> api : 4. HTTP Request

' Flujo backend
patchStatus --> service : 5. updateStatus()
undoEndpoint --> service : 5. undoForShipment()
commandsEndpoint --> service : 5. getCommandHistory()

service --> invoker : 6. execute/undo
invoker --> backendCmd : 7. executes/manages
invoker --> locCmd : 7. executes/manages
invoker --> createCmd : 7. executes/manages
invoker --> compCmd : 7. executes/manages

backendCmd --> shipmentRepo : persist/restore
backendCmd --> eventRepo : log event

note right of invoker
  history[0..50]
  redoStack[0..50]
  undoForShipment(id)
  undoLast()
  redo()
end note

note right of frontCmd
  Captura previousStatus
  vía GET antes de PATCH
  undo() revierte con PATCH
end note

@enduml
```

---

## Descripción de los Diagramas

### 1. Diagrama de Clases — Backend
Muestra la estructura del patrón Command en el backend:
- `ShipmentCommand` es la interfaz que definen los 4 comandos concretos
- `UpdateStatusCommand`, `UpdateLocationCommand`, `CreateShipmentCommand` son comandos individuales
- `CompositeShipmentCommand` compone múltiples comandos (Composite pattern)
- `ShipmentCommandInvoker` mantiene el historial, ejecuta comandos y soporta undo/redo
- `TrackShipmentService` delega todas las operaciones en el Invoker
- `ShipmentController` expone endpoints para comandar desde REST

### 2. Diagrama de Clases — Frontend
Muestra la estructura del patrón Command en el frontend:
- `Command<T>` es la interfaz genérica
- `UpdateStatusCommand` captura el estado anterior y ejecuta/deshace vía API
- `CommandHistory` es el singleton que mantiene los stacks de undo/redo
- `useCommand` es el hook React que expone execute, undo, redo, canUndo, canRedo

### 3. Diagrama de Secuencia — Cambio de Estado con Undo
Flujo completo desde que el usuario cambia un estado hasta que puede deshacerlo:
1. Usuario selecciona nuevo estado → se crea `UpdateStatusCommand` y se ejecuta
2. El comando obtiene el estado actual, luego envía el PATCH
3. `CommandHistory` guarda el comando en el undo stack
4. Usuario hace clic en "Deshacer" → se ejecuta `command.undo()` que envía un PATCH inverso

### 4. Diagrama de Secuencia — Undo For Shipment
Flujo de deshacer desde el endpoint REST del backend:
1. `POST /api/shipments/{id}/undo` llega al controller
2. Busca el comando más reciente para ese shipment en el historial del Invoker
3. Ejecuta `undo()` que restaura el estado previo en DB y publica evento inverso

### 5. Diagrama de Componentes
Vista general de la arquitectura completa mostrando cómo frontend y backend se conectan a través de la API REST para implementar el patrón Command de extremo a extremo.

---

## Elementos UML Principales

| Elemento | Tipo | Descripción |
|----------|------|-------------|
| **ShipmentCommand** | Interface | Contrato para todos los comandos del backend |
| **UpdateStatusCommand** | ConcreteCommand | Cambia estado de un envío (con undo) |
| **UpdateLocationCommand** | ConcreteCommand | Cambia ubicación de un envío (con undo) |
| **CreateShipmentCommand** | ConcreteCommand | Crea un envío (undo = CANCELLED) |
| **CompositeShipmentCommand** | ConcreteCommand | Macro comando que agrupa subcomandos |
| **ShipmentCommandInvoker** | Invoker | Ejecuta comandos, mantiene historial, undo/redo |
| **Command<T>** | Interface | Contrato para comandos del frontend |
| **CommandHistory** | Invoker | Singleton con stacks de undo/redo (frontend) |
| **useCommand** | Hook | Hook React que expone el CommandHistory |

### Flujo de Ejecución

```
Cliente → ShipmentController → TrackShipmentService → ShipmentCommandInvoker.execute()
                                                          ↓
                                                    UpdateStatusCommand.execute()
                                                          ↓
                                                    ShipmentRepository.save()
                                                    EventRepository.save()
                                                    EventPublisher.publishEvent()
                                                          ↓
                                                    Retorna Shipment
```

### Flujo de Undo

```
Cliente → POST /{id}/undo → ShipmentController → TrackShipmentService.undoForShipment()
                                                          ↓
                                                    ShipmentCommandInvoker.undoForShipment()
                                                          ↓
                                                    UpdateStatusCommand.undo()
                                                          ↓
                                                    ShipmentRepository.save(previousState)
                                                    EventRepository.save(reverse event)
                                                    EventPublisher.publishEvent(inverse)
                                                          ↓
                                                    Retorna Shipment restaurado
```

---

## Ejecutar los Diagramas

Para visualizar los diagramas:
1. Copia el código entre los bloques ```plantuml
2. Pégalo en [PlantUML Online Editor](https://www.planttext.com)
3. O usa la extensión **PlantUML** en VS Code
