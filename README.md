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

## 🏛️ Arquitectura del Sistema (Día 2 — Usuarios, Empresas y Permisos)

PREVENIA adopta una arquitectura de **Modular Monolith** (Monolito Modular) orientada al dominio en el backend, con **Spring Security + JWT** y aislamiento multi-tenant estricto por `organization_id`, desacoplada de un cliente web moderno en **Next.js 15 (App Router)**:

```
┌────────────────────────────────────────────────────────┐
│             Navegador / Cliente Web                    │
│      (Next.js 15 + AuthContext + Dynamic Roles)        │
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
│  │   company    │  │  assignment  │  │    shared    │  │
│  │ (Anti-IDOR)  │  │(Tech-Company)│  │(Error Advice)│  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
└───────────────────────────┬────────────────────────────┘
                            │ JPA / Hibernate (validate) / Flyway (V1, V2)
                            ▼
┌────────────────────────────────────────────────────────┐
│             PostgreSQL 16 (Multi-Tenant)               │
│     (UUIDs, Schema versionado, Índices Compuestos)    │
└────────────────────────────────────────────────────────┘
```

Para una explicación exhaustiva de decisiones técnicas, consultar:
* 📘 [docs/architecture.md](file:///docs/architecture.md) — Filosofía arquitectónica, seguridad JWT, multi-tenancy y anti-IDOR.
* 📗 [docs/domain-model.md](file:///docs/domain-model.md) — Modelo de dominio, matriz de permisos y entidades.
* 📙 [docs/database.md](file:///docs/database.md) — Diccionario de datos, migraciones Flyway y catálogo de seeds.

---

## 🔐 Matriz de Permisos

| Endpoint / Recurso | PLATFORM_ADMIN | CONSULTANT_ADMIN | TECHNICIAN | CLIENT |
|---|:---:|:---:|:---:|:---:|
| `POST /api/v1/auth/login` | ✅ Público | ✅ Público | ✅ Público | ✅ Público |
| `GET /api/v1/companies` | ✅ Todas las empresas | ✅ Empresas de su Org | ✅ Solo asignadas | ✅ Solo su empresa |
| `GET /api/v1/companies/{id}` | ✅ Todas las empresas | ✅ Solo de su Org (404 ajenas) | ✅ Solo si asignada (404 otras) | ✅ Solo su empresa (404 otras) |
| `POST /api/v1/companies` | ✅ Sí (cualquier Org) | ✅ Sí (su propia Org) | ❌ 403 Forbidden | ❌ 403 Forbidden |
| `POST /api/v1/users` | ✅ Sí | ✅ Sí (no PLATFORM_ADMIN) | ❌ 403 Forbidden | ❌ 403 Forbidden |
| `GET /api/v1/users` | ✅ Todos | ✅ Solo de su Org | ❌ 403 Forbidden | ❌ 403 Forbidden |
| `POST /api/v1/companies/{id}/technicians/{uId}` | ✅ Sí | ✅ Solo en su Org | ❌ 403 Forbidden | ❌ 403 Forbidden |
| `DELETE /api/v1/companies/{id}/technicians/{uId}`| ✅ Sí | ✅ Solo en su Org | ❌ 403 Forbidden | ❌ 403 Forbidden |
| `GET /api/v1/companies/{id}/technicians` | ✅ Sí | ✅ Solo en su Org | ❌ 403 Forbidden | ❌ 403 Forbidden |

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

Variables clave en `.env`:
* `JWT_SECRET`: Clave simétrica HMAC-SHA256 para firma de tokens.
* `JWT_EXPIRATION_MINUTES`: Minutos de validez del JWT (default: 1440 = 24hs).

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
* **Frontend Cockpit / Login**: [http://localhost:3000](http://localhost:3000)
* **API REST**: [http://localhost:8080/api/v1](http://localhost:8080/api/v1)

---

## 🧪 Pruebas Manuales con cURL

### 1. Autenticación (Login)
```bash
curl -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"carlos@demo.com","password":"Demo1234!"}'
```

### 2. Consultar Empresas Asignadas (Carlos - TECHNICIAN)
```bash
curl -X GET http://localhost:8080/api/v1/companies \
  -H "Authorization: Bearer <TOKEN_OBTENIDO>"
```
*(Devuelve únicamente Banco Macro y Andreani).*

### 3. Comprobar Protección Anti-IDOR (Carlos intenta ver Coca-Cola)
```bash
curl -i -X GET http://localhost:8080/api/v1/companies/22222222-2222-2222-2222-222222222223 \
  -H "Authorization: Bearer <TOKEN_CARLOS>"
```
*(Responde HTTP 404 NOT_FOUND con estructura de error limpia).*

### 4. Intento de Creación de Empresa por Técnico (Bloqueado)
```bash
curl -i -X POST http://localhost:8080/api/v1/companies \
  -H "Authorization: Bearer <TOKEN_CARLOS>" \
  -H "Content-Type: application/json" \
  -d '{"businessName":"Nueva Empresa Indebida"}'
```
*(Responde HTTP 403 FORBIDDEN).*

---

## 🧪 Ejecución de Tests Automatizados

### Backend (Suite Completa de Seguridad e Integración Multi-Tenant)
```bash
cd backend
.\mvnw.cmd clean verify
```
*(Ejecuta 31 tests automatizados que prueban exhaustivamente la matriz de permisos).*

### Frontend (Typecheck, Lint y Build)
```bash
cd frontend
npm run typecheck
npm run lint
npm run build
```
