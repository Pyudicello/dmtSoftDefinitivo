# PREVENIA — Documento de Base de Datos y Modelo Relacional (v0.2 — Día 2)

## 1. Convenciones y Estándares de Diseño

* **Motor**: PostgreSQL 16+.
* **Nomenclatura**:
  * Tablas y Columnas: `snake_case` en plural para tablas (`organizations`, `users`, `companies`, `user_company_assignments`, `expirations`).
  * Claves Primarias: `id UUID PRIMARY KEY`.
  * Claves Foráneas: `fk_<tabla_origen>_<tabla_destino_o_campo>` (ej: `fk_users_company`).
  * Claves Únicas: `uk_<tabla>_<campos>` (ej: `uk_assignments_user_company`).
  * Restricciones Check: `chk_<tabla>_<campo>` (ej: `chk_users_role`).
  * Índices: `idx_<tabla>_<campo(s)>` (ej: `idx_companies_organization_id`).
* **Zonas Horarias**: Columnas `TIMESTAMP WITH TIME ZONE` (`TIMESTAMPTZ`), asegurando registros normalizados en UTC.
* **Identificadores**: `UUID v4` nativo para todas las tablas.

---

## 2. Historial de Migraciones Flyway

| Versión | Archivo | Descripción |
|---|---|---|
| **V1** | `V1__initial_schema.sql` | Creación de tablas base: `organizations`, `users`, `companies`, `user_company_assignments`, `expiration_categories`, `expirations`, índices y constraints. |
| **V2** | `V2__add_user_company_id_and_dev_seed.sql` | Agrega columna `company_id` a `users` con FK a `companies(id)`. Carga de datos de prueba determinísticos (2 Organizaciones, 4 Empresas, 6 Usuarios con passwords BCrypt, y 3 Asignaciones). |

---

## 3. Diccionario de Tablas

### 3.1 `organizations`
Inquilinos principales (consultoras).

| Columna | Tipo | Nulable | Restricciones / Default | Descripción |
|---|---|---|---|---|
| `id` | `UUID` | NO | `PRIMARY KEY` | Identificador único |
| `name` | `VARCHAR(150)` | NO | | Nombre comercial de la consultora |
| `legal_name` | `VARCHAR(255)` | SÍ | | Razón social legal |
| `tax_id` | `VARCHAR(30)` | SÍ | | CUIT / Identificación fiscal |
| `email` | `VARCHAR(255)` | NO | | Email corporativo |
| `phone` | `VARCHAR(50)` | SÍ | | Teléfono de contacto |
| `status` | `VARCHAR(30)` | NO | `DEFAULT 'ACTIVE'`, `chk_organizations_status` | `ACTIVE`, `SUSPENDED`, `INACTIVE` |
| `created_at` | `TIMESTAMPTZ` | NO | `DEFAULT CURRENT_TIMESTAMP` | Fecha de creación UTC |
| `updated_at` | `TIMESTAMPTZ` | NO | `DEFAULT CURRENT_TIMESTAMP` | Fecha de actualización UTC |

---

### 3.2 `users`
Usuarios, roles y credenciales seguras.

| Columna | Tipo | Nulable | Restricciones / Default | Descripción |
|---|---|---|---|---|
| `id` | `UUID` | NO | `PRIMARY KEY` | Identificador único |
| `organization_id` | `UUID` | SÍ | `FK -> organizations(id) RESTRICT` | Organización (NULL solo para PLATFORM_ADMIN) |
| `company_id` | `UUID` | SÍ | `FK -> companies(id) SET NULL` | Empresa cliente asociada (rol `CLIENT`) |
| `first_name` | `VARCHAR(100)` | NO | | Nombre |
| `last_name` | `VARCHAR(100)` | NO | | Apellido |
| `email` | `VARCHAR(255)` | NO | `UNIQUE` | Correo electrónico de acceso |
| `password_hash` | `VARCHAR(255)` | SÍ | | Hash BCrypt (10 rounds) |
| `external_identity_id` | `VARCHAR(255)` | SÍ | | Sub de Cognito / OIDC futuro |
| `role` | `VARCHAR(50)` | NO | `chk_users_role` | `PLATFORM_ADMIN`, `CONSULTANT_ADMIN`, `TECHNICIAN`, `CLIENT` |
| `status` | `VARCHAR(30)` | NO | `DEFAULT 'ACTIVE'`, `chk_users_status` | `ACTIVE`, `INACTIVE`, `BLOCKED` |
| `created_at` | `TIMESTAMPTZ` | NO | `DEFAULT CURRENT_TIMESTAMP` | Creación UTC |
| `updated_at` | `TIMESTAMPTZ` | NO | `DEFAULT CURRENT_TIMESTAMP` | Actualización UTC |

* **Índices**:
  * `idx_users_organization_id` ON (`organization_id`)
  * `idx_users_company_id` ON (`company_id`)
  * `idx_users_role` ON (`role`)
  * `idx_users_status` ON (`status`)

---

### 3.3 `companies`
Empresas clientes administradas por una consultora.

| Columna | Tipo | Nulable | Restricciones / Default | Descripción |
|---|---|---|---|---|
| `id` | `UUID` | NO | `PRIMARY KEY` | Identificador único |
| `organization_id` | `UUID` | NO | `FK -> organizations(id) CASCADE` | Consultora administradora |
| `business_name` | `VARCHAR(150)` | NO | | Nombre de fantasía / comercial |
| `legal_name` | `VARCHAR(255)` | SÍ | | Razón social |
| `tax_id` | `VARCHAR(30)` | SÍ | | CUIT de la empresa cliente |
| `address` | `VARCHAR(255)` | SÍ | | Dirección postal |
| `city` | `VARCHAR(100)` | SÍ | | Ciudad |
| `province` | `VARCHAR(100)` | SÍ | | Provincia / Estado |
| `country` | `VARCHAR(50)` | NO | `DEFAULT 'AR'` | Código de país ISO |
| `email` | `VARCHAR(255)` | SÍ | | Correo electrónico |
| `phone` | `VARCHAR(50)` | SÍ | | Teléfono de contacto |
| `status` | `VARCHAR(30)` | NO | `DEFAULT 'ACTIVE'`, `chk_companies_status` | `ACTIVE`, `INACTIVE`, `ARCHIVED` |
| `created_at` | `TIMESTAMPTZ` | NO | `DEFAULT CURRENT_TIMESTAMP` | Creación UTC |
| `updated_at` | `TIMESTAMPTZ` | NO | `DEFAULT CURRENT_TIMESTAMP` | Actualización UTC |

---

### 3.4 `user_company_assignments`
Asignación de técnicos a empresas clientes.

| Columna | Tipo | Nulable | Restricciones / Default | Descripción |
|---|---|---|---|---|
| `id` | `UUID` | NO | `PRIMARY KEY` | Identificador único |
| `organization_id` | `UUID` | NO | `FK -> organizations(id) CASCADE` | Tenant |
| `user_id` | `UUID` | NO | `FK -> users(id) CASCADE` | Técnico asignado |
| `company_id` | `UUID` | NO | `FK -> companies(id) CASCADE` | Empresa cliente asignada |
| `assigned_at` | `TIMESTAMPTZ` | NO | `DEFAULT CURRENT_TIMESTAMP` | Fecha de asignación |
| `active` | `BOOLEAN` | NO | `DEFAULT TRUE` | Estado de la asignación |
| `created_at` | `TIMESTAMPTZ` | NO | `DEFAULT CURRENT_TIMESTAMP` | Creación UTC |
| `updated_at` | `TIMESTAMPTZ` | NO | `DEFAULT CURRENT_TIMESTAMP` | Actualización UTC |

* **Restricción Única**: `uk_assignments_user_company` ON (`organization_id`, `user_id`, `company_id`)

---

## 4. Datos Semilla para Desarrollo Local (`V2`)

| Tipo | ID / UUID | Nombre / Email | Rol / Detalle | Password Inicial |
|---|---|---|---|---|
| **Org A** | `11111111-1111-1111-1111-111111111111` | Seguridad Integral Córdoba | Consultora Principal | - |
| **Org B** | `11111111-1111-1111-1111-111111111112` | Prevención Litoral SRL | Consultora Secundaria | - |
| **Empresa (Org A)** | `22222222-2222-2222-2222-222222222221` | Banco Macro | CUIT: 30-50000173-5 | - |
| **Empresa (Org A)** | `22222222-2222-2222-2222-222222222222` | Andreani Logística | CUIT: 30-52994025-9 | - |
| **Empresa (Org A)** | `22222222-2222-2222-2222-222222222223` | Coca-Cola Andina | CUIT: 30-54668721-3 | - |
| **Empresa (Org B)** | `22222222-2222-2222-2222-222222222224` | TechCorp Litoral | CUIT: 30-71234567-8 | - |
| **Usuario Global** | `33333333-3333-3333-3333-333333333331` | `platform@prevenia.com` | `PLATFORM_ADMIN` | `Admin1234!` |
| **Admin Org A** | `33333333-3333-3333-3333-333333333332` | `admin@demo.com` | `CONSULTANT_ADMIN` (Org A) | `Demo1234!` |
| **Técnico Carlos** | `33333333-3333-3333-3333-333333333333` | `carlos@demo.com` | `TECHNICIAN` (Asignado a Macro y Andreani) | `Demo1234!` |
| **Técnico Martín** | `33333333-3333-3333-3333-333333333334` | `martin@demo.com` | `TECHNICIAN` (Asignado a Coca-Cola) | `Demo1234!` |
| **Cliente Macro** | `33333333-3333-3333-3333-333333333335` | `macro@demo.com` | `CLIENT` (Asociado a Banco Macro) | `Demo1234!` |
| **Admin Org B** | `33333333-3333-3333-3333-333333333336` | `admin.b@demo.com` | `CONSULTANT_ADMIN` (Org B) | `Demo1234!` |
