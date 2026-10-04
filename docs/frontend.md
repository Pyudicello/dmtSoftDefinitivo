# PREVENIA — Arquitectura Frontend & Experiencia Operativa (Día 5)

## 1. Visión General

El frontend de **PREVENIA** proporciona una suite operativa de alta eficiencia diseñada específicamente para técnicos y administradores de consultoras de Higiene y Seguridad Laboral.

En el **Día 5**, la plataforma incorpora:
* **Vista Dual de Vencimientos ([/expirations](file:///c:/Users/pyudi/Documents/Proyectos%202026/dmt_soft_3_vencimientos/frontend/src/app/expirations/page.tsx)):** Alternancia fluida entre **[ Lista ]** y **[ Calendario Mensual ]** sincronizada con la URL (`?view=list` / `?view=calendar`).
* **Barra de Filtros Server-Side Unificada:** Filtros por Empresa, Categoría, Estado Unificado, Rango de Fechas (con atajos rápidos: *Hoy*, *Próx. 7d*, *Próx. 30d*, *Este Mes*), Técnico Responsable y Búsqueda textual con debounce de 300ms.
* **Centro de Alertas Operativas ([/alerts](file:///c:/Users/pyudi/Documents/Proyectos%202026/dmt_soft_3_vencimientos/frontend/src/app/alerts/page.tsx)):** Panel de priorización de obligaciones que requieren atención inmediata (`CRITICAL` para vencidos, `HIGH` para urgentes de 0-7 días, `MEDIUM` para próximos de 8-30 días).
* **Badge de Alertas en Tiempo Real:** Contador integrado en la Sidebar y Header que refleja las alertas activas del ámbito autorizado del usuario.
* **Garantía Anti-Timezone:** Tratamiento de fechas `LocalDate` (`YYYY-MM-DD`) sin conversiones UTC que pudieran alterar el día calendario.

---

## 2. Estructura de Directorios

```
frontend/src/
├── app/
│   ├── layout.tsx              # Root Layout con QueryProvider, AuthProvider, ToastProvider
│   ├── page.tsx                # Landing y Matriz de Acceso Rápido por Rol
│   ├── not-found.tsx           # Error 404 personalizado
│   ├── error.tsx               # Error Boundary global
│   ├── login/                  # /login - Acceso al sistema
│   ├── dashboard/              # /dashboard - KPIs consolidados y Top 10 vencimientos
│   ├── alerts/                 # /alerts - Centro de alertas operativas priorizadas
│   ├── companies/              # /companies - Listado, búsqueda y paginación
│   │   ├── new/                # /companies/new - Alta de empresa cliente
│   │   └── [id]/               # /companies/[id] - Detalle, métricas y vencimientos
│   └── expirations/            # /expirations - Vista Dual (Lista & Calendario) + Filtros URL
│       ├── new/                # /expirations/new - Creación (soporta ?companyId=)
│       └── [id]/               # /expirations/[id] - Detalle y auditoría
│           └── edit/           # /expirations/[id]/edit - Edición de campos autorizados
│
├── components/
│   ├── layout/                 # Sidebar con badge de alertas, Header con campana, AppLayout, ProtectedRoute
│   └── ui/                     # ExpirationStatusBadge, StatCard, PageHeader, LoadingSkeleton, EmptyState, ErrorState, ConfirmDialog
│
├── context/
│   ├── AuthContext.tsx         # Sesión JWT y Switcher de roles
│   └── ToastContext.tsx        # Sistema de notificaciones flotantes
│
├── lib/
│   ├── api-client.ts           # Cliente HTTP con Bearer JWT y manejo de 401
│   ├── date-utils.ts           # Formateo español, etiquetas temporales y generador de grilla de calendario
│   └── query-keys.ts           # Factoría centralizada de Query Keys para TanStack Query
│
├── services/                   # Clientes de API REST
│   ├── auth.service.ts
│   ├── alert.service.ts        # GET /api/v1/alerts
│   ├── company.service.ts
│   ├── dashboard.service.ts
│   ├── expiration.service.ts   # CRUD, filtros combinados y listados
│   └── user.service.ts         # GET /api/v1/users (técnicos)
│
└── types/
    └── index.ts                # Modelos TypeScript del dominio
```

---

## 3. Vista Dual de Vencimientos (`/expirations`)

### Sincronización con Query Params (URL State)
Todos los filtros y configuraciones de visualización se persisten en la URL para permitir recargas transparentes y enlaces compartibles:
* `view`: `'list'` | `'calendar'`
* `companyId`: UUID de empresa
* `categoryId`: UUID de categoría
* `status`: `'ALL'` | `'EXPIRED'` | `'URGENT'` | `'UPCOMING'` | `'CURRENT'` | `'COMPLETED'` | `'CANCELLED'`
* `responsibleUserId`: UUID del técnico asignado
* `from`: Fecha inicio (`YYYY-MM-DD`)
* `to`: Fecha fin (`YYYY-MM-DD`)
* `search`: Búsqueda textual por título o descripción (debounced 300ms)
* `page` y `size`: Paginación server-side (en vista Lista)
* `sort`: Campo y dirección de ordenamiento (ej. `expirationDate,asc`)

### Vista Lista
* **Desktop:** Tabla densa con cabeceras ordenables, indicador de dirección (↑ / ↓), badges semánticos y botones de acción rápida (*Ver*, *Completar*, *Cancelar*, *Editar*).
* **Mobile (< 768px):** Tarjetas individuales estructuradas sin desbordamiento horizontal.
* **Paginación:** Selector de tamaño de página (10, 20, 50), contador total de elementos y navegación anterior/siguiente.

### Vista Calendario Mensual
* **Navegación:** Selector de Mes y Año, botón *Hoy*, *Mes Anterior* y *Mes Siguiente*.
* **Cálculo de Rango:** Consulta al backend exclusivamente el rango visible en la grilla mensual (`from` y `to`), asegurando máxima velocidad de carga.
* **Eventos por Día:** Pills de colores semánticos con nombre de empresa y título de la obligación.
* **Control de Desbordamiento:** Días con más de 2 eventos muestran botón `+N más` que abre un modal con el listado completo del día.
* **Mobile Agenda:** En teléfonos móviles (< 768px), el calendario se presenta automáticamente como una agenda cronológica mensual de días con obligaciones.

---

## 4. Centro de Alertas Operativas (`/alerts`)

Permite identificar y resolver inmediatamente las obligaciones vencidas o en riesgo inminente:

| Nivel de Prioridad | Condición del Backend | Criterio de Ordenamiento |
|---|---|---|
| 🔴 **CRITICAL** | `EXPIRED` (`expirationDate < hoy` y `ACTIVE`) | `expirationDate ASC` (más antiguo primero para priorizar deuda acumulada) |
| 🟠 **HIGH** | `URGENT` (`hoy <= expirationDate <= hoy + 7d` y `ACTIVE`) | `expirationDate ASC` (los que vencen hoy o antes primero) |
| 🟡 **MEDIUM** | `UPCOMING` (`hoy + 8d <= expirationDate <= hoy + 30d` y `ACTIVE`) | `expirationDate ASC` |

### Acciones Directas:
Desde cada tarjeta de alerta, el usuario autorizado puede:
1. **Ver Detalle:** Navega a la ficha técnica `/expirations/[id]`.
2. **Completar:** Abre modal de confirmación con campo para notas de certificado/resolución.
3. **Editar:** Accede a la edición rápida `/expirations/[id]/edit`.

---

## 5. Estrategia de Caching e Invalidación

Tras ejecutar cualquier acción de completado, cancelación, creación o edición, TanStack Query invalida automáticamente en paralelo:
* `queryKeys.expirations.all` (listados y calendario)
* `queryKeys.alerts.all` (centro de alertas y badges de sidebar/header)
* `queryKeys.dashboard.all` (métricas y tarjetas KPI)
* `queryKeys.companies.all` (métricas de empresas)
