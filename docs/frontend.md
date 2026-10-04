# PREVENIA — Arquitectura Frontend & Sistema de Diseño (Día 4)

## 1. Visión General

El frontend de **PREVENIA** está desarrollado como una SPA / SSR híbrida moderna utilizando **Next.js (App Router)**, **React 19**, **TypeScript** y **TanStack Query (React Query v5)**.

La interfaz está concebida como una herramienta de trabajo profesional B2B para consultoras y técnicos de Higiene y Seguridad Laboral: sobria, limpia, altamente responsiva y enfocada en la claridad operativa sin animaciones superfluas.

---

## 2. Estructura de Directorios

```
frontend/src/
├── app/                        # Next.js App Router
│   ├── layout.tsx              # Root layout con QueryProvider, AuthProvider y ToastProvider
│   ├── page.tsx                # Portal de inicio y matriz rápida de autenticación
│   ├── not-found.tsx           # Error 404 personalizado con navegación al dashboard
│   ├── error.tsx               # Error boundary global con opción de reintento
│   ├── login/                  # /login - Formulario de acceso y demo logins
│   ├── dashboard/              # /dashboard - Métricas consolidadas y próximos vencimientos
│   ├── companies/              # /companies - Listado, búsqueda y paginación
│   │   ├── new/                # /companies/new - Formulario de alta de empresa
│   │   └── [id]/               # /companies/[id] - Detalle, métricas y vencimientos de empresa
│   └── expirations/            # /expirations - Listado unificado con filtros avanzados
│       ├── new/                # /expirations/new - Creación (soporta ?companyId=)
│       └── [id]/               # /expirations/[id] - Detalle y acciones administrativas
│           └── edit/           # /expirations/[id]/edit - Edición de campos autorizados
│
├── components/
│   ├── layout/                 # Estructura visual de la aplicación
│   │   ├── AppLayout.tsx       # Layout maestro (Sidebar + Header + Main)
│   │   ├── Sidebar.tsx         # Navegación lateral responsive por rol
│   │   └── Header.tsx          # Barra superior con usuario, rol y menú móvil
│   ├── auth/
│   │   └── ProtectedRoute.tsx  # Guardia de autenticación y autorización por rol (403/redirect)
│   └── ui/                     # Componentes atómicos reutilizables
│       ├── ExpirationStatusBadge.tsx # Badges de ciclo de vida y estado temporal
│       ├── StatCard.tsx              # Cards de métricas con enlaces semánticos
│       ├── PageHeader.tsx            # Cabecera con título, breadcrumbs y acciones
│       ├── LoadingSkeleton.tsx       # Skeletons para tarjetas, tablas y detalles
│       ├── EmptyState.tsx            # Estados vacíos claros y accionables
│       ├── ErrorState.tsx            # Estados de error con botón de reintento
│       └── ConfirmDialog.tsx         # Modales de confirmación para acciones críticas
│
├── context/
│   ├── AuthContext.tsx         # Estado de autenticación, JWT y quickLogin
│   └── ToastContext.tsx        # Sistema de notificaciones toast flotantes
│
├── lib/
│   ├── api-client.ts           # Cliente HTTP centralizado (JWT, errores, 401 interceptor)
│   ├── date-utils.ts           # Formateo español (DD/MM/YYYY) y etiquetas 'Vence en X días'
│   └── query-keys.ts           # Fábrica centralizada de Query Keys para TanStack Query
│
├── services/                   # Clientes de API por dominio
│   ├── auth.service.ts
│   ├── dashboard.service.ts
│   ├── company.service.ts
│   └── expiration.service.ts
│
└── types/
    └── index.ts                # Modelos TypeScript del dominio
```

---

## 3. Principio de Autoridad del Backend

El frontend **nunca calcula ni decide** si un vencimiento es `URGENT`, `UPCOMING` o `EXPIRED`, ni decide qué empresas le pertenecen a un técnico o cliente:
1. El backend calcula dinámicamente el `deadlineStatus` mediante un `Clock` inyectable.
2. El backend filtra los datos mediante `TenantContext` y `UserCompanyAssignment`.
3. El frontend actúa como intérprete y presentador visual de dichos datos.

---

## 4. Matriz de Navegación y Permisos por Rol

| Rol | Dashboard | Empresas | Crear Empresa | Detalle Empresa | Vencimientos | Crear/Editar Vencimiento |
|---|:---:|:---:|:---:|:---:|:---:|:---:|
| `PLATFORM_ADMIN` | Global | Todas | Sí | Sí | Todos | Sí |
| `CONSULTANT_ADMIN` | Consultora | Todas de la Org | Sí | Sí | Todos de la Org | Sí |
| `TECHNICIAN` | Asignadas | Solo Asignadas | No | Sí (Asignadas) | Solo Asignadas | Sí (Asignadas) |
| `CLIENT` | Su Empresa | Solo Su Empresa | No | Sí (Solo Lectura) | Solo Su Empresa | No (403) |

---

## 5. Estrategia de Caching e Invalidación (TanStack Query)

Las query keys están centralizadas en [query-keys.ts](file:///c:/Users/pyudi/Documents/Proyectos%202026/dmt_soft_3_vencimientos/frontend/src/lib/query-keys.ts):

* `dashboard.all`
* `companies.all`, `companies.list(page, size, search)`, `companies.detail(id)`, `companies.metrics(id)`
* `expirations.all`, `expirations.list(filters)`, `expirations.detail(id)`, `expirations.categories()`

**Patrón de Invalidación:**
Tras crear una empresa o vencimiento, o completar/cancelar una obligación, se invalidan en paralelo:
* Las listas de vencimientos y empresas.
* El detalle de la empresa afectada.
* El resumen del Dashboard (`dashboard.all`).

---

## 6. Sistema de Diseño & Tokens CSS

Definidos en [globals.css](file:///c:/Users/pyudi/Documents/Proyectos%202026/dmt_soft_3_vencimientos/frontend/src/app/globals.css):

### Colores Semánticos de Vencimiento
* **Vencido (`EXPIRED`):** Rojo (`#ef4444`, bg `rgba(239, 68, 68, 0.12)`)
* **Urgente (`URGENT`):** Naranja (`#f97316`, bg `rgba(249, 115, 22, 0.12)`)
* **Próximo (`UPCOMING`):** Amarillo (`#eab308`, bg `rgba(234, 179, 8, 0.12)`)
* **Vigente (`CURRENT`):** Verde (`#10b981`, bg `rgba(16, 185, 129, 0.12)`)
* **Completado (`COMPLETED`):** Esmeralda / Neutral (`#10b981`, icono check)
* **Cancelado (`CANCELLED`):** Gris (`#64748b`, tachado / icono cancel)

### Breakpoints Responsivos
* **Desktop Grande:** 1440px (Sidebar fija de 260px, grilla de 4 columnas en Dashboard)
* **Laptop / Tablet Horizontal:** 1024px (Grilla adaptada a 2-4 columnas)
* **Tablet Vertical:** 768px (Grilla de 2 columnas, menú colapsable)
* **Mobile:** 375px (Sidebar tipo Drawer flotante, tablas transformadas a Cards legibles sin scroll horizontal incómodo)

---

## 7. Manejo de Errores y Seguridad

1. **Anti-IDOR (Insecure Direct Object Reference):**
   Si un técnico o cliente intenta abrir por URL directa `/companies/{id}` o `/expirations/{id}` de un recurso no asignado o de otro tenant, el backend retorna `404 Not Found` (o `403 Forbidden`). El frontend renderiza un `ErrorState` limpio y permite volver sin filtrar existencia de datos.
2. **Expiración de Sesión (401):**
   El cliente HTTP intercepta cualquier `401 Unauthorized`, elimina el token de `localStorage` y redirige inmediatamente a `/login?returnUrl=...`.
3. **Página 404 y Boundary de Error:**
   Se implementan `not-found.tsx` y `error.tsx` nativos en Next.js.
