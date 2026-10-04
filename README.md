# PREVENIA — Plataforma SaaS de Gestión de Higiene y Seguridad Laboral

[![Java](https://img.shields.io/badge/Java-21%20LTS-ED8B00?logo=openjdk&logoColor=white)](https://openjdk.org/)
[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.3.4-6DB33F?logo=springboot&logoColor=white)](https://spring.io/projects/spring-boot)
[![Next.js](https://img.shields.io/badge/Next.js-15-000000?logo=nextdotjs&logoColor=white)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Flyway](https://img.shields.io/badge/Flyway-10-CC0200?logo=flyway&logoColor=white)](https://flywaydb.org/)
[![Docker](https://img.shields.io/badge/Docker%20Compose-Ready-2496ED?logo=docker&logoColor=white)](https://www.docker.com/)

**PREVENIA** es una solución SaaS multi-tenant diseñada para consultoras, profesionales y empresas del rubro de **Higiene y Seguridad Laboral**. Su propósito central es la gestión integral, auditoría y control proactivo de **vencimientos y obligaciones normativas recurrentes** (matafuegos, capacitaciones, coberturas de ART, visitas técnicas, inspecciones de ascensores y autoelevadores, protocolos de medición, seguros y planes de evacuación).

---

## 🏛️ Arquitectura del Sistema (Día 3 — Core de Vencimientos)

PREVENIA adopta una arquitectura de **Modular Monolith** (Monolito Modular) orientada al dominio en el backend, con **Spring Security + JWT**, aislamiento multi-tenant estricto por `organization_id`, motor de clasificación temporal desacoplado mediante `java.time.Clock` inyectable y un cliente web moderno en **Next.js 15 (App Router)**:

```
┌────────────────────────────────────────────────────────┐
│             Navegador / Cliente Web                    │
│      (Next.js 15 + Cockpit de Vencimientos)            │
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
│  ┌──────────────────────────────────────────────────┐  │
│  │  ExpirationDeadlineClassifier + TimeConfig Clock │  │
│  └──────────────────────────────────────────────────┘  │
└───────────────────────────┬────────────────────────────┘
                            │ JPA / Hibernate / Flyway (V1, V2, V3)
                            ▼
┌────────────────────────────────────────────────────────┐
│             PostgreSQL 16 (Multi-Tenant)               │
│     (UUIDs, Constraints de Fechas, Índices Compuestos)│
└────────────────────────────────────────────────────────┘
```

Para una explicación exhaustiva de decisiones técnicas, consultar:
* 📘 [docs/architecture.md](file:///docs/architecture.md) — Filosofía arquitectónica, motor de especificaciones JPA y aislamiento multi-tenant.
* 📗 [docs/domain-model.md](file:///docs/domain-model.md) — Modelo de dominio, ciclo de vida, clasificación temporal y matriz de permisos.
* 📙 [docs/database.md](file:///docs/database.md) — Diccionario de datos, migración V3, índices de alto rendimiento y constraints.

---

## ⏱️ Motor de Clasificación Temporal

El backend calcula el estado temporal (`deadlineStatus`) al vuelo en cada consulta inyectando un bean `Clock`, sin persistir estados temporales volátiles:

| Clasificación | Condición Temporal | Días Restantes (`daysUntilExpiration`) | Significado |
|---|---|---|---|
| `EXPIRED` | `expirationDate < hoy` | `< 0` | Vencido. Plazo legal expirado. |
| `URGENT` | `hoy <= expirationDate <= hoy + 7d` | `0 a 7` | Urgente. Vence hoy o en los próximos 7 días inclusive. |
| `UPCOMING` | `hoy + 8d <= expirationDate <= hoy + 30d` | `8 a 30` | Próximo. Ventana de gestión mensual. |
| `CURRENT` | `expirationDate > hoy + 30d` | `> 30` | Vigente. Margen holgado. |

* **Regla de Precedencia**: Los vencimientos con `lifecycleStatus = COMPLETED` o `CANCELLED` devuelven `deadlineStatus = null` y no computan como alertas activas.

---

## 🔐 Matriz de Permisos del Core de Vencimientos

| Endpoint / Recurso | PLATFORM_ADMIN | CONSULTANT_ADMIN | TECHNICIAN | CLIENT |
|---|:---:|:---:|:---:|:---:|
| `POST /api/v1/auth/login` | ✅ Público | ✅ Público | ✅ Público | ✅ Público |
| `GET /api/v1/expirations` | ✅ Todos | ✅ De su Org | ✅ De empresas asignadas | ✅ Solo su empresa |
| `GET /api/v1/expirations/upcoming` | ✅ Todos | ✅ De su Org | ✅ De empresas asignadas | ✅ Solo su empresa |
| `GET /api/v1/expirations/expired` | ✅ Todos | ✅ De su Org | ✅ De empresas asignadas | ✅ Solo su empresa |
| `GET /api/v1/companies/{id}/expirations` | ✅ Cualquiera | ✅ Solo de su Org | ✅ Solo si asignada | ✅ Solo su empresa |
| `GET /api/v1/expirations/{id}` | ✅ Cualquiera | ✅ Solo de su Org (404 ajenas) | ✅ Solo si asignada (404 otras) | ✅ Solo su empresa (404 otras) |
| `POST /api/v1/expirations` | ✅ Cualquier Org | ✅ En su Org | ✅ En empresas asignadas | ❌ 403 Forbidden |
| `PUT /api/v1/expirations/{id}` | ✅ Sí | ✅ Solo en su Org | ✅ Solo en empresas asignadas | ❌ 403 Forbidden |
| `POST /api/v1/expirations/{id}/complete` | ✅ Sí | ✅ Solo en su Org | ✅ Solo en empresas asignadas | ❌ 403 Forbidden |
| `POST /api/v1/expirations/{id}/cancel` | ✅ Sí | ✅ Solo en su Org | ✅ Solo en empresas asignadas | ❌ 403 Forbidden |
| `DELETE /api/v1/expirations/{id}` | ✅ Sí | ✅ Solo en su Org | ✅ Solo en empresas asignadas | ❌ 403 Forbidden |
| `GET /api/v1/expiration-categories` | ✅ Todas | ✅ Globales + Org | ✅ Globales + Org | ✅ Globales + Org |
| `POST /api/v1/expiration-categories` | ✅ Global o Org | ✅ En su Org | ❌ 403 Forbidden | ❌ 403 Forbidden |

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

## 📋 Requisitos Previos

* **Java**: OpenJDK 21 LTS o superior.
* **Node.js**: v20.x o v22.x+ (npm incluido).
* **Docker & Docker Compose**: Docker Desktop o Engine v24+.
* **Git**: v2.x+.

---

## 🚀 Guía de Inicio Rápido

### 1. Variables de Entorno

```bash
# Windows PowerShell
Copy-Item .env.example .env

# Linux / macOS
cp .env.example .env
```

Variables clave de configuración:
* `JWT_SECRET`: Clave simétrica HMAC-SHA256 para firma de tokens.
* `APP_EXPIRATION_URGENT_DAYS`: Umbral para clasificación `URGENT` (default: `7`).
* `APP_EXPIRATION_UPCOMING_DAYS`: Umbral para clasificación `UPCOMING` (default: `30`).
* `APP_TIME_ZONE`: Zona horaria del sistema (default: `America/Argentina/Buenos_Aires`).

---

### 2. Opción A — Ejecución con Docker Compose (Recomendada)

```bash
docker compose up --build -d
```

Verificar estado:
```bash
docker compose ps
```

Detener:
```bash
docker compose down
```

---

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

Acceder a:
* **Cockpit Web**: [http://localhost:3000](http://localhost:3000)
* **Vencimientos Cockpit**: [http://localhost:3000/expirations](http://localhost:3000/expirations)
* **API REST**: [http://localhost:8080/api/v1](http://localhost:8080/api/v1)

---

## 🧪 Pruebas Manuales con cURL

### 1. Autenticación como Técnico Carlos
```bash
curl -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"carlos@demo.com","password":"Demo1234!"}'
```

### 2. Consultar Vencimientos Autorizados (Carlos ve solo Macro y Andreani)
```bash
curl -X GET "http://localhost:8080/api/v1/expirations?page=0&size=10" \
  -H "Authorization: Bearer <TOKEN_CARLOS>"
```

### 3. Consultar Próximos Vencimientos (≤ 30 días)
```bash
curl -X GET "http://localhost:8080/api/v1/expirations/upcoming" \
  -H "Authorization: Bearer <TOKEN_CARLOS>"
```

### 4. Consultar Vencimientos Vencidos (< Hoy)
```bash
curl -X GET "http://localhost:8080/api/v1/expirations/expired" \
  -H "Authorization: Bearer <TOKEN_CARLOS>"
```

### 5. Registrar un Nuevo Vencimiento (Carlos en Banco Macro)
```bash
curl -X POST http://localhost:8080/api/v1/expirations \
  -H "Authorization: Bearer <TOKEN_CARLOS>" \
  -H "Content-Type: application/json" \
  -d '{
    "companyId": "33333333-3333-3333-3333-333333333331",
    "categoryId": "44444444-4444-4444-4444-444444444441",
    "title": "Recarga anual matafuegos sucursal Centro",
    "description": "Extintores ABC del edificio central",
    "issueDate": "2026-09-01",
    "expirationDate": "2026-10-15",
    "notes": "Proveedor habitual: Extintores Córdoba"
  }'
```

### 6. Completar un Vencimiento
```bash
curl -X POST http://localhost:8080/api/v1/expirations/<EXPIRATION_ID>/complete \
  -H "Authorization: Bearer <TOKEN_CARLOS>" \
  -H "Content-Type: application/json" \
  -d '{"notes":"Capacitación de evacuación realizada y certificada"}'
```

### 7. Comprobar Protección Anti-IDOR (Carlos intenta consultar vencimiento de Coca-Cola)
```bash
curl -i -X GET http://localhost:8080/api/v1/expirations/55555555-5555-5555-5555-555555555556 \
  -H "Authorization: Bearer <TOKEN_CARLOS>"
```
*(Responde HTTP 404 NOT_FOUND con estructura de error limpia).*

---

## 🧪 Ejecución de Tests Automatizados

### Backend (62 Tests Automatizados de Dominio, Fechas e Integración Multi-Tenant)
```bash
cd backend
.\mvnw.cmd clean verify
```

### Frontend (Typecheck, Lint y Build de Producción)
```bash
cd frontend
npm run typecheck
npm run lint
npm run build
```
