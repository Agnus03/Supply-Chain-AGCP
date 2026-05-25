# Patrón State - Implementación en CadenaSuministros

## 1. Introducción al Patrón State

El **Patrón State** es un patrón de comportamiento que permite a un objeto alterar su comportamiento cuando su estado interno cambia, dando la impresión de que la clase del objeto ha cambiado.

### Propósito
- Encapsular el comportamiento específico de cada estado en clases separadas
- Eliminar condicionales (`switch`/`if`) dispersos en el código
- Centralizar la lógica de transiciones entre estados
- Hacer explícitas las transiciones válidas e inválidas

---

## 2. Por qué se implementó en este proyecto

### Problema Identificado

En la aplicación CadenaSuministros, los envíos (`Shipment`) tienen un ciclo de vida con 4 estados:

- `PENDING` — Pendiente
- `IN_TRANSIT` — En tránsito
- `DELIVERED` — Entregado
- `DELAYED` — Retrasado

Cada estado tiene **comportamiento asociado** que se refleja en la UI:

| Comportamiento | Dónde se usaba |
|---------------|----------------|
| Etiqueta visible | `statusClass()` switch en ShipmentHistory, switch inline en ReportsPage |
| Color (hex / CSS var) | STATUS_COLORS en GeoMap, COLORS en StatusDonut |
| Transiciones permitidas | Ninguna — se mostraban todas las opciones sin validación |
| ¿Requiere confirmación? | Comparación literal `status === 'DELIVERED' || status === 'DELAYED'` |
| Variante del diálogo de confirmación | Comparación literal `status === 'DELAYED' ? 'danger' : 'primary'` |
| Clase CSS para badge | `statusClass()` switch en ShipmentHistory |

**Antes**: Cada pieza de información sobre el estado vivía en un archivo diferente, duplicada y sin relación. Agregar un nuevo estado requería modificar 6+ archivos.

```
// Disperso por el código:
STATUS_COLORS = { PENDING: '#f59e0b', ... }        // GeoMap.tsx
STATUS_LABELS  = { PENDING: 'Pendiente', ... }       // GeoMap.tsx + constants.ts
COLORS         = ['var(--warning)', ...]             // StatusDonut.tsx
statusClass()  { switch(status) { ... } }            // ShipmentHistory.tsx
if (newStatus === 'DELIVERED' || ...) { ... }        // ShipmentsPage.tsx
```

### Solución

Centralizar toda la configuración de cada estado en un solo lugar: `SHIPMENT_STATE_CONFIG`. Cada estado es ahora un objeto con todas sus propiedades, eliminando todos los `switch`/`if` literales y mapas duplicados.

---

## 3. Estructura Implementada

### Ubicación
- `frontend/src/utils/constants.ts` — El `SHIPMENT_STATE_CONFIG`
- `frontend/src/types/index.ts` — La interfaz `ShipmentStateConfig`

### Interfaz

```typescript
export interface ShipmentStateConfig {
  status: ShipmentStatus;           // Identificador del estado
  label: string;                    // Etiqueta visible (español)
  color: string;                    // Color hex (GeoMap SVG)
  colorVar: string;                 // Variable CSS (stat cards, donut)
  allowedTransitions: ShipmentStatus[];  // Transiciones válidas
  isTerminal: boolean;                    // ¿Estado final?
  badgeClass: string;                    // Clase CSS para badges
  confirmVariant: 'primary' | 'danger' | null;  // null = sin confirmación
}
```

### Configuración de Estados

```typescript
export const SHIPMENT_STATE_CONFIG: Record<ShipmentStatus, ShipmentStateConfig> = {
  PENDING: {
    status: 'PENDING',
    label: 'Pendiente',
    color: '#f59e0b',
    colorVar: 'var(--warning)',
    allowedTransitions: ['IN_TRANSIT', 'DELAYED'],
    isTerminal: false,
    badgeClass: 'badge-pending',
    confirmVariant: null,
  },
  IN_TRANSIT: {
    status: 'IN_TRANSIT',
    label: 'En tránsito',
    color: '#3b82f6',
    colorVar: 'var(--primary)',
    allowedTransitions: ['DELIVERED', 'DELAYED'],
    isTerminal: false,
    badgeClass: 'badge-transit',
    confirmVariant: null,
  },
  DELIVERED: {
    status: 'DELIVERED',
    label: 'Entregado',
    color: '#22c55e',
    colorVar: 'var(--success)',
    allowedTransitions: [],
    isTerminal: true,
    badgeClass: 'badge-delivered',
    confirmVariant: 'primary',
  },
  DELAYED: {
    status: 'DELAYED',
    label: 'Retrasado',
    color: '#ef4444',
    colorVar: 'var(--danger)',
    allowedTransitions: ['PENDING', 'IN_TRANSIT', 'DELIVERED'],
    isTerminal: false,
    badgeClass: 'badge-delayed',
    confirmVariant: 'danger',
  },
};
```

### Diagrama de Estados y Transiciones

```
                    ┌──────────┐
                    │ PENDING  │
                    └────┬─────┘
                    │         │
                 IN_TRANSIT  DELAYED
                    │         │
                    ▼         ▼
              ┌──────────┐ ┌──────────┐
              │IN_TRANSIT│ │ DELAYED  │
              └────┬─────┘ └────┬─────┘
                   │         │        │
               DELIVERED  PENDING  IN_TRANSIT
                   │         │        │
                   ▼         ▼        ▼
              ┌──────────┐ ┌──────────┐ ┌──────────┐
              │DELIVERED │ │ PENDING  │ │IN_TRANSIT│
              └──────────┘ └──────────┘ └──────────┘
                (terminal)    (recuperación)
```

---

## 4. Cómo funciona

### Uso en componentes

#### ShipmentHistory — badge classes

```typescript
// Antes: switch con 4 cases
function statusClass(status: string): string {
  switch (status) {
    case 'PENDING': return 'badge-pending';
    case 'IN_TRANSIT': return 'badge-transit';
    case 'DELIVERED': return 'badge-delivered';
    case 'DELAYED': return 'badge-delayed';
    default: return 'badge-pending';
  }
}

// Después: lookup en config (0 branches)
function statusClass(status: string): string {
  return SHIPMENT_STATE_CONFIG[status as ShipmentStatus]?.badgeClass ?? 'badge-pending';
}
```

#### ShipmentsPage — confirmación de transiciones

```typescript
// Antes: comparación literal de strings
if (newStatus === 'DELIVERED' || newStatus === 'DELAYED') { ... }

// Después: consulta la configuración del estado destino
const targetConfig = SHIPMENT_STATE_CONFIG[newStatus as ShipmentStatus];
if (targetConfig?.confirmVariant) { ... }
```

#### GeoMap — colores y etiquetas

```typescript
// Antes: mapas locales duplicados
const STATUS_COLORS = { PENDING: '#f59e0b', ... };
const STATUS_LABELS = { PENDING: 'Pendiente', ... };

// Después: lookup en config central
const config = SHIPMENT_STATE_CONFIG[c.status as ShipmentStatus];
const color = config?.color ?? '#94a3b8';
const label = config?.label ?? c.status;
```

---

## 5. Beneficios

### Beneficios del Patrón

| Beneficio | Descripción |
|-----------|-------------|
| **Fuente única de verdad** | Toda la configuración de estados vive en `SHIPMENT_STATE_CONFIG` |
| **Eliminación de condicionales** | 0 `switch`/`if` literales sobre strings de estado en la UI |
| **Transiciones explícitas** | `allowedTransitions` documenta qué movimientos son válidos |
| **Extensibilidad** | Agregar un nuevo estado requiere 1 bloque en `SHIPMENT_STATE_CONFIG` |
| **Consistencia visual** | Colores, labels y clases CSS siempre sincronizados |
| **Type safety** | TypeScript valida que los estados y transiciones sean válidos |

### Archivos impactados

| Archivo | Antes | Después |
|---------|-------|---------|
| `utils/constants.ts` | 3 exports planos | 1 config central + 3 exports derivados |
| `types/index.ts` | — | + `ShipmentStateConfig` interface |
| `pages/ShipmentsPage.tsx` | 2 comparaciones literales | lookup en `config.confirmVariant` |
| `components/ShipmentHistory.tsx` | `switch` 4 cases | lookup en `config.badgeClass` |
| `components/dashboard/GeoMap.tsx` | 2 mapas locales duplicados | lookup en config central |
| `components/dashboard/StatusDonut.tsx` | array local `COLORS` | derivado de config vía `STATUS_ORDER` |
| `pages/ReportsPage.tsx` | switch inline 4 branches | lookup en `config.badgeClass` |

---

## 6. Consideraciones Técnicas

### Solo Frontend

A diferencia de otros patrones implementados en el backend (Facade, Proxy, Composite), el patrón State se implementó **exclusivamente en el frontend** porque:

1. El backend ya maneja el status como String sin validación de transiciones
2. La lógica de UI (colores, badges, labels, confirmación) pertenece naturalmente al frontend
3. No se requirió modificar la API REST ni la base de datos

### Integración con Infrastructure existente

- **STATUS_LABELS**, **STATUS_ORDER** y **STATUS_OPTIONS** se mantienen como exports para compatibilidad con otros módulos que importan estas constantes
- Los valores derivados son idénticos a los originales, garantizando que **todos los tests existentes sigan pasando**

### Para agregar un nuevo estado

1. Agregar el valor al tipo `ShipmentStatus` en `types/index.ts`
2. Agregar un bloque en `SHIPMENT_STATE_CONFIG` en `constants.ts`
3. Todos los componentes consumen automáticamente el nuevo estado

---

## 7. Conclusión

El patrón State proporciona una solución elegante para eliminar los condicionales dispersos sobre el estado de los envíos, centralizando toda la configuración en un solo lugar. La implementación demuestra cómo un patrón de diseño tradicionalmente visto como "orientado a objetos con clases polimórficas" se puede aplicar efectivamente en el frontend usando **configuración data-driven** con TypeScript.

### Estado de los tests

```
 Test Files  9 passed (9)
      Tests  49 passed (49)
```

Todos los tests existentes continúan pasando sin modificaciones.
