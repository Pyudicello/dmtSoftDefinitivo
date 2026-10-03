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

## 🏛️ Arquitectura del Sistema

PREVENIA adopta una arquitectura de **Modular Monolith** (Monolito Modular) orientada al dominio en el backend, desacoplada de una aplicación cliente moderna en **Next.js (App Router)**:

```
┌────────────────────────────────────────────────────────┐
│             Navegador / Cliente Web                    │
│             (Next.js 15 + TypeScript)                 │
└───────────────────────────┬────────────────────────────┘
                            │ HTTP / REST / JSON (CORS)
                            ▼
┌────────────────────────────────────────────────────────┐
│       PREVENIA Backend (Spring Boot 3.3.4)             │
│                                                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │ organization │  │     user     │  │   company    │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │  assignment  │  │  expiration  │  │    shared    │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
└───────────────────────────┬────────────────────────────┘
                            │ JPA / Hibernate / Flyway
                            ▼
┌────────────────────────────────────────────────────────┐
│             PostgreSQL 16 (Multi-Tenant)               │
│     (UUIDs, Schema versionado, Índices Compuestos)    │
└────────────────────────────────────────────────────────┘
```

Para una explicación exhaustiva de decisiones técnicas, consultar:
* 📘 [docs/architecture.md](file:///docs/architecture.md) — Filosofía arquitectónica, multi-tenancy, y estrategia cloud.
* 📗 [docs/domain-model.md](file:///docs/domain-model.md) — Modelo de dominio, entidades, ciclo de vida y reglas de negocio.
* 📙 [docs/database.md](file:///docs/database.md) — Diccionario de datos, restricciones, índices y migraciones Flyway.

---

## 🛠️ Stack Tecnológico

* **Backend**:
  * Java 21 LTS
  * Spring Boot 3.3.4 (Spring Web, Spring Data JPA, Spring Validation, Spring Security, Spring Actuator)
  * Flyway Database Migrations
  * Lombok & Hibernate ORM (modo `validate`)
  * Maven Wrapper (`mvnw`)
* **Frontend**:
  * Next.js 15 (App Router)
  * React 19 & TypeScript 5.7
  * Lucide React Icons
  * Arquitectura Feature-based (`src/features`, `src/services`, `src/lib`, `src/components`)
* **Persistencia & DevOps**:
  * PostgreSQL 16 Alpine
  * Docker & Docker Compose
  * Multi-stage Dockerfiles optimizados para producción con usuarios sin privilegios root

---

## 📋 Requisitos Previos

Asegúrese de contar con las siguientes herramientas instaladas en su entorno:

* **Java**: OpenJDK 21 LTS o superior.
* **Node.js**: v20.x o v22.x+ (npm incluido).
* **Docker & Docker Compose**: Docker Desktop o Docker Engine v24+.
* **Git**: v2.x+.

---

## 🚀 Guía de Inicio Rápido

### 1. Clonar el Repositorio y Configurar Entorno

```bash
git clone <URL_DEL_REPOSITORIO>
cd dmt_soft_3_vencimientos
```

Copiar el archivo de variables de entorno base:

```bash
# Windows PowerShell
Copy-Item .env.example .env

# Linux / macOS
cp .env.example .env
```

---

### 2. Opción A — Ejecución Integral con Docker Compose (Recomendada)

Levanta todo el stack (PostgreSQL, Backend Spring Boot y Frontend Next.js) en contenedores aislados:

```bash
docker compose up --build -d
```

Verificar el estado de los contenedores:

```bash
docker compose ps
```

Detener el stack completo:

```bash
docker compose down
```

Para reiniciar la base de datos limpiando los volúmenes persistentes:

```bash
docker compose down -v
```

---

### 3. Opción B — Ejecución Híbrida / Desarrollo Local

Ideal para flujo de desarrollo rápido con hot-reloading:

#### Paso 1: Levantar únicamente PostgreSQL con Docker Compose
```bash
docker compose up postgres -d
```

#### Paso 2: Ejecutar Backend Spring Boot
```bash
cd backend
# Windows:
.\mvnw.cmd spring-boot:run
# Linux / macOS:
./mvnw spring-boot:run
```

El backend iniciará en el puerto `8080`, conectará automáticamente a PostgreSQL y ejecutará la migración Flyway `V1__initial_schema.sql`.

#### Paso 3: Ejecutar Frontend Next.js (en otra terminal)
```bash
cd frontend
npm install
npm run dev
```

El frontend estará disponible en `http://localhost:3000`.

---

## 🌐 URLs y Endpoints de Verificación

| Componente | URL / Endpoint | Descripción |
|---|---|---|
| **Frontend Dashboard** | [http://localhost:3000](http://localhost:3000) | Panel de verificación de estado y fundación Día 1 |
| **System Info API** | [http://localhost:8080/api/v1/system/info](http://localhost:8080/api/v1/system/info) | Diagnóstico de versión y ambiente |
| **Actuator Health** | [http://localhost:8080/actuator/health](http://localhost:8080/actuator/health) | Healthcheck general y estado de conexión PostgreSQL |
| **Base de Datos** | `localhost:5432` | DB: `prevenia`, User: `prevenia`, Pass: `prevenia_local_secret` |

---

## 🧪 Pruebas y Validación de Calidad

### Backend (Compilación, Verificación y Tests)
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

---

## 📂 Estructura del Proyecto

```
dmt_soft_3_vencimientos/
├── backend/                             # Backend Spring Boot (Modular Monolith)
│   ├── src/
│   │   ├── main/
│   │   │   ├── java/com/prevenia/
│   │   │   │   ├── PreveniaApplication.java
│   │   │   │   ├── shared/              # Clases base, excepciones, seguridad, CORS
│   │   │   │   ├── system/              # Endpoints de diagnóstico del sistema
│   │   │   │   ├── organization/        # Dominio de Organizaciones (Tenancy)
│   │   │   │   ├── user/                # Dominio de Usuarios e Identidad
│   │   │   │   ├── company/             # Dominio de Empresas Clientes
│   │   │   │   ├── assignment/          # Dominio de Asignaciones Técnicas
│   │   │   │   └── expiration/          # Dominio Núcleo de Vencimientos y Categorías
│   │   │   └── resources/
│   │   │       ├── application.yml      # Configuración base
│   │   │       ├── application-local.yml# Perfil de desarrollo
│   │   │       └── db/migration/
│   │   │           └── V1__initial_schema.sql # Migración Flyway inicial
│   │   └── test/                        # Tests unitarios y de integración
│   ├── pom.xml                          # Dependencias Maven
│   └── Dockerfile                       # Multi-stage Dockerfile para producción
│
├── frontend/                            # Frontend Next.js (App Router)
│   ├── src/
│   │   ├── app/                         # Páginas y layout raíz
│   │   ├── components/                  # Componentes reutilizables
│   │   ├── features/                    # Módulos organizados por feature
│   │   ├── lib/                         # Cliente API tipado
│   │   ├── services/                    # Servicios de backend
│   │   └── types/                       # Definiciones TypeScript
│   ├── package.json                     # Scripts y dependencias
│   ├── tsconfig.json                    # Configuración TypeScript
│   └── Dockerfile                       # Multi-stage Dockerfile para producción
│
├── docs/                                # Documentación de Arquitectura y Dominio
│   ├── architecture.md
│   ├── domain-model.md
│   └── database.md
│
├── docker-compose.yml                   # Orquestación de contenedores locales
├── .env.example                         # Plantilla de variables de entorno
├── .gitignore                           # Exclusiones de Git
└── README.md                            # Documentación principal
```

---

## 🧭 Preparación para el Día 2

La fundación técnica establecida en el Día 1 deja los cimientos 100% listos para:
1. **Autenticación & JWT**: Integración de filtros de seguridad en `SecurityConfig` (local o Cognito/OIDC).
2. **Módulo Organization**: Servicios y endpoints para alta y gestión de consultoras.
3. **Módulo User**: Registro, asignación de roles (`PLATFORM_ADMIN`, `CONSULTANT_ADMIN`, `TECHNICIAN`, `CLIENT`) y hash seguro de contraseñas.
4. **Módulo Company**: CRUD de empresas clientes asociadas al tenant autenticado.
5. **Módulo Assignment**: Lógica para asignar técnicos a empresas con restricciones de acceso.
6. **Módulo Expiration**: Registro de vencimientos y cálculo dinámico de estados operativos y temporales.

---

## 📄 Convenciones de Commits

El proyecto sigue el estándar de **Conventional Commits**:
* `feat(...)`: Nueva funcionalidad o módulo.
* `fix(...)`: Corrección de errores.
* `docs(...)`: Cambios en la documentación.
* `chore(...)`: Tareas de mantenimiento, dependencias o tooling.
* `refactor(...)`: Reestructuración de código sin alterar comportamiento.
