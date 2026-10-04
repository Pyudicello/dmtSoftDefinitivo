# PREVENIA — Plataforma SaaS de Gestión de Higiene y Seguridad Laboral

[![Java](https://img.shields.io/badge/Java-21%20LTS-ED8B00?logo=openjdk&logoColor=white)](https://openjdk.org/)
[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.3.4-6DB33F?logo=springboot&logoColor=white)](https://spring.io/projects/spring-boot)
[![Next.js](https://img.shields.io/badge/Next.js-15-000000?logo=nextdotjs&logoColor=white)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![TanStack Query](https://img.shields.io/badge/TanStack%20Query-v5-FF4154?logo=reactquery&logoColor=white)](https://tanstack.com/query)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Flyway](https://img.shields.io/badge/Flyway-10-CC0200?logo=flyway&logoColor=white)](https://flywaydb.org/)
[![Docker](https://img.shields.io/badge/Docker%20Compose-Ready-2496ED?logo=docker&logoColor=white)](https://www.docker.com/)

**PREVENIA** es una solución SaaS multi-tenant diseñada para consultoras, profesionales y empresas del rubro de **Higiene y Seguridad Laboral**. Su propósito central es la gestión integral, auditoría y control proactivo de **vencimientos y obligaciones normativas recurrentes** (matafuegos, capacitaciones, coberturas de ART, visitas técnicas, inspecciones de ascensores y autoelevadores, protocolos de medición, seguros y planes de evacuación).

---

## 🏛️ Arquitectura del Sistema (Día 4 — UI Profesional)

PREVENIA adopta una arquitectura de **Modular Monolith** (Monolito Modular) orientada al dominio en el backend, con **Spring Security + JWT**, aislamiento multi-tenant estricto por `organization_id`, motor de clasificación temporal desacoplado mediante `java.time.Clock` inyectable y una aplicación web moderna en **Next.js 15 (App Router)** con **TanStack Query v5**:

```
┌────────────────────────────────────────────────────────┐
│             Navegador / Cliente Web                    │
│      (Next.js 15 + TanStack Query + UI Profesional)    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │   /login     │  │  /dashboard  │  │  /companies  │  │
│  │ (Auth Guard) │  │  (KPIs/Top)  │  │(CRUD/Search) │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │ /expirations │  │ /comp/[id]   │  │ /exp/[id]    │  │
│  │  (Filtros)   │  │ (Métricas)   │  │ (Lifecycle)  │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
└───────────────────────────┬────────────────────────────┘
                            │ HTTP / REST / Authorization: Bearer <JWT>
                            ▼
┌────────────────────────────────────────────────────────┐
│       PREVENIA Backend (Spring Boot 3.3.4)             │
│                                                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │     auth     │  │ organization │  │     user     │  │
│  │ (Login, JWT) │  │  (Tenancy)   │  │ (Roles, Sec) │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │   company    │  │  assignment  │  │  expiration  │  │
│  │ (Anti-IDOR)  │  │(Tech-Company)│  │ (Core Día 3) │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
│  ┌──────────────┐  ┌────────────────────────────────┐  │
│  │  dashboard   │  │  ExpirationDeadlineClassifier  │  │
│  │  (Aggregates)│  │  + TimeConfig Injectable Clock │  │
│  └──────────────┘  └────────────────────────────────┘  │
└───────────────────────────┬────────────────────────────┘
                            │ JPA / Hibernate / Flyway (V1, V2, V3)
                            ▼
┌────────────────────────────────────────────────────────┐
│             PostgreSQL 16 (Multi-Tenant)               │
│     (UUIDs, Constraints de Fechas, Índices Compuestos)│
└────────────────────────────────────────────────────────┘
```

Documentación técnica complementaria:
* 📘 [docs/frontend.md](file:///docs/frontend.md) — Arquitectura frontend, design tokens, responsive breakpoints y query keys.
* 📘 [docs/architecture.md](file:///docs/architecture.md) — Filosofía arquitectónica, motor de especificaciones JPA y aislamiento multi-tenant.
* 📗 [docs/domain-model.md](file:///docs/domain-model.md) — Modelo de dominio, ciclo de vida, clasificación temporal y matriz de permisos.
* 📙 [docs/database.md](file:///docs/database.md) — Diccionario de datos, migración V3, índices de alto rendimiento y constraints.

---

## 🖥️ Módulos y Pantallas de la Aplicación Web (Día 4)

| Ruta | Roles Autorizados | Funcionalidades Principales |
|---|---|---|
| `/login` | Público | Autenticación JWT con validación de credenciales, demo switcher de roles y redirección con `returnUrl`. |
| `/dashboard` | Todos | Resumen ejecutivo con 4 StatCards (Empresas, Vencidos, Próximos 7d, Próximos 30d), listado Top 10 próximos vencimientos y acciones rápidas de completar/cancelar. |
| `/companies` | Todos | Directorio de clientes con buscador server-side (`search`), paginación, métricas por empresa y visualización dual Desktop/Mobile Cards. |
| `/companies/new` | `PLATFORM_ADMIN`, `CONSULTANT_ADMIN` | Formulario de alta con validación de CUIT, razón social, datos de contacto y feedback toast. |
| `/companies/[id]` | Todos (filtrado) | Cabecera ejecutiva, resumen de métricas, tabs (Resumen / Vencimientos) y listado filtrado con creación directa (`/expirations/new?companyId=...`). |
| `/expirations` | Todos (filtrado) | Tabla maestra de vencimientos con filtros por empresa, estado de ciclo de vida (`ACTIVE`, `COMPLETED`, `CANCELLED`) y estado temporal (`EXPIRED`, `URGENT`, `UPCOMING`, `CURRENT`). |
| `/expirations/new` | Admins y Técnicos | Alta de vencimientos con selectores dinámicos de empresa y categoría, date picker y validación client/server. |
| `/expirations/[id]` | Todos (filtrado) | Ficha técnica de obligación, auditoría de creación y última actualización, y modales de completar/cancelar con notas. |
| `/expirations/[id]/edit` | Admins y Técnicos | Edición de título, categoría, fechas y notas, preservando inmutabilidad de la empresa para evitar fuga IDOR. |

---

## ⏱️ Motor de Clasificación Temporal

El backend calcula el estado temporal (`deadlineStatus`) al vuelo en cada consulta inyectando un bean `Clock`, sin persistir estados temporales volátiles:

| Clasificación | Condición Temporal | Días Restantes (`daysUntilExpiration`) | Badge UI |
|---|---|---|---|
| `EXPIRED` | `expirationDate < hoy` | `< 0` | 🔴 **Vencido** (Rojo) |
| `URGENT` | `hoy <= expirationDate <= hoy + 7d` | `0 a 7` | 🟠 **Urgente** (Naranja) |
| `UPCOMING` | `hoy + 8d <= expirationDate <= hoy + 30d` | `8 a 30` | 🟡 **Próximo** (Amarillo) |
| `CURRENT` | `expirationDate > hoy + 30d` | `> 30` | 🟢 **Vigente** (Verde) |

* **Regla de Precedencia**: Los vencimientos con `lifecycleStatus = COMPLETED` o `CANCELLED` devuelven `deadlineStatus = null` y se muestran como **Completado** (Verde suave) o **Cancelado** (Gris).

---

## 👥 Credenciales de Prueba (Entorno de Desarrollo)

| Email | Contraseña | Rol | Ámbito / Tenant |
|---|---|---|---|
| `platform@prevenia.com` | `Admin1234!` | `PLATFORM_ADMIN` | Administrador Global |
| `admin@demo.com` | `Demo1234!` | `CONSULTANT_ADMIN` | Seguridad Integral Córdoba (Org A) |
| `carlos@demo.com` | `Demo1234!` | `TECHNICIAN` | Org A (Asignado a: Macro, Andreani) |
| `martin@demo.com` | `Demo1234!` | `TECHNICIAN` | Org A (Asignado a: Coca-Cola) |
| `macro@demo.com` | `Demo1234!` | `CLIENT` | Org A (Asociado a: Banco Macro) |
| `admin.b@demo.com` | `Demo1234!` | `CONSULTANT_ADMIN` | Prevención Litoral SRL (Org B) |

---

## 🚀 Guía de Inicio Rápido

### 1. Variables de Entorno

```bash
# Windows PowerShell
Copy-Item .env.example .env

# Linux / macOS
cp .env.example .env
```

### 2. Opción A — Ejecución Completa con Docker Compose

```bash
docker compose up --build -d
```

Acceder a:
* **Aplicación Web**: [http://localhost:3000](http://localhost:3000)
* **API REST Backend**: [http://localhost:8080/api/v1](http://localhost:8080/api/v1)

### 3. Opción B — Desarrollo Local Híbrido

#### Paso 1: Base de Datos PostgreSQL
```bash
docker compose up postgres -d
```

#### Paso 2: Backend Spring Boot
```bash
cd backend
# Windows:
.\mvnw.cmd spring-boot:run
# Linux / macOS:
./mvnw spring-boot:run
```

#### Paso 3: Frontend Next.js (en otra terminal)
```bash
cd frontend
npm install
npm run dev
```

---

## 🧪 Ejecución de Tests Automatizados

### Backend (68 Tests de Integración Multi-Tenant, Dashboard y Dominio)
```bash
cd backend
# Windows:
.\mvnw.cmd clean verify
# Linux / macOS:
./mvnw clean verify
```

### Frontend (Typecheck, Lint y Build de Producción)
```bash
cd frontend
npm run typecheck
npm run lint
npm run build
```
