# PREVENIA — Documento de Base de Datos y Modelo Relacional (v0.1)

## 1. Convenciones y Estándares de Diseño

* **Motor**: PostgreSQL 16+.
* **Nomenclatura**:
  * Tablas y Columnas: `snake_case` en plural para tablas (`organizations`, `expirations`).
  * Claves Primarias: `id UUID PRIMARY KEY`.
  * Claves Foráneas: `fk_<tabla_origen>_<tabla_destino_o_campo>` (ej: `fk_expirations_company`).
  * Claves Únicas: `uk_<tabla>_<campos>` (ej: `uk_assignments_user_company`).
  * Restricciones Check: `chk_<tabla>_<campo>` (ej: `chk_expirations_status`).
  * Índices: `idx_<tabla>_<campo(s)>` (ej: `idx_expirations_org_date_status`).
* **Zonas Horarias**: Columnas `TIMESTAMP WITH TIME ZONE` (`TIMESTAMPTZ`), asegurando registros normalizados en UTC.
* **Identificadores**: `UUID v4` nativo para todas las tablas.

---

## 2. Diccionario de Tablas (Esquema V1)

### 2.1 `organizations`
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

* **Índices**:
  * `idx_organizations_status` ON (`status`)
  * `idx_organizations_tax_id` ON (`tax_id`)

---

### 2.2 `users`
Usuarios y credenciales.

| Columna | Tipo | Nulable | Restricciones / Default | Descripción |
|---|---|---|---|---|
| `id` | `UUID` | NO | `PRIMARY KEY` | Identificador único |
| `organization_id` | `UUID` | SÍ | `FK -> organizations(id) RESTRICT` | Organización a la que pertenece |
| `first_name` | `VARCHAR(100)` | NO | | Nombre |
| `last_name` | `VARCHAR(100)` | NO | | Apellido |
| `email` | `VARCHAR(255)` | NO | `UNIQUE` | Correo electrónico de acceso |
| `password_hash` | `VARCHAR(255)` | SÍ | | Hash de contraseña (BCrypt) |
| `external_identity_id` | `VARCHAR(255)` | SÍ | | Sub de Cognito / OIDC |
| `role` | `VARCHAR(50)` | NO | `chk_users_role` | `PLATFORM_ADMIN`, `CONSULTANT_ADMIN`, `TECHNICIAN`, `CLIENT` |
| `status` | `VARCHAR(30)` | NO | `DEFAULT 'ACTIVE'`, `chk_users_status` | `ACTIVE`, `INACTIVE`, `BLOCKED` |
| `created_at` | `TIMESTAMPTZ` | NO | `DEFAULT CURRENT_TIMESTAMP` | Creación UTC |
| `updated_at` | `TIMESTAMPTZ` | NO | `DEFAULT CURRENT_TIMESTAMP` | Actualización UTC |

* **Índices**:
  * `idx_users_organization_id` ON (`organization_id`)
  * `idx_users_role` ON (`role`)
  * `idx_users_status` ON (`status`)

---

### 2.3 `companies`
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

* **Índices**:
  * `idx_companies_organization_id` ON (`organization_id`)
  * `idx_companies_org_status` ON (`organization_id`, `status`)
  * `idx_companies_tax_id` ON (`tax_id`)

---

### 2.4 `user_company_assignments`
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
* **Índices**:
  * `idx_assignments_org_user` ON (`organization_id`, `user_id`)
  * `idx_assignments_org_company` ON (`organization_id`, `company_id`)

---

### 2.5 `expiration_categories`
Catálogo de tipos de vencimiento.

| Columna | Tipo | Nulable | Restricciones / Default | Descripción |
|---|---|---|---|---|
| `id` | `UUID` | NO | `PRIMARY KEY` | Identificador único |
| `organization_id` | `UUID` | SÍ | `FK -> organizations(id) CASCADE` | NULL = Sistema global; UUID = Custom del Tenant |
| `code` | `VARCHAR(50)` | NO | | Código nemotécnico (ej: MATAFUEGOS) |
| `name` | `VARCHAR(100)` | NO | | Nombre para mostrar |
| `description` | `TEXT` | SÍ | | Detalle descriptivo |
| `icon` | `VARCHAR(50)` | SÍ | | Identificador de icono UI |
| `color_code` | `VARCHAR(20)` | SÍ | | Código HEX de color distintivo |
| `is_system` | `BOOLEAN` | NO | `DEFAULT FALSE` | Indica si es categoría global |
| `active` | `BOOLEAN` | NO | `DEFAULT TRUE` | Estado activo |
| `created_at` | `TIMESTAMPTZ` | NO | `DEFAULT CURRENT_TIMESTAMP` | Creación UTC |
| `updated_at` | `TIMESTAMPTZ` | NO | `DEFAULT CURRENT_TIMESTAMP` | Actualización UTC |

* **Índices**:
  * `idx_categories_organization_id` ON (`organization_id`)
  * `idx_categories_code` ON (`code`)

---

### 2.6 `expirations`
Núcleo del negocio: Vencimientos y compromisos normativos.

| Columna | Tipo | Nulable | Restricciones / Default | Descripción |
|---|---|---|---|---|
| `id` | `UUID` | NO | `PRIMARY KEY` | Identificador único |
| `organization_id` | `UUID` | NO | `FK -> organizations(id) CASCADE` | Tenant |
| `company_id` | `UUID` | NO | `FK -> companies(id) CASCADE` | Empresa cliente |
| `category_id` | `UUID` | NO | `FK -> expiration_categories(id) RESTRICT` | Categoría de la obligación |
| `title` | `VARCHAR(200)` | NO | | Título breve de la obligación |
| `description` | `TEXT` | SÍ | | Detalle o alcance normativo |
| `issue_date` | `DATE` | SÍ | | Fecha de emisión / última revisión |
| `expiration_date` | `DATE` | NO | | Fecha de vencimiento |
| `status` | `VARCHAR(30)` | NO | `DEFAULT 'PENDING'`, `chk_expirations_status` | `PENDING`, `COMPLETED`, `CANCELLED` |
| `responsible_user_id` | `UUID` | SÍ | `FK -> users(id) SET NULL` | Técnico responsable |
| `recurrence_type` | `VARCHAR(30)` | NO | `DEFAULT 'NONE'`, `chk_expirations_recurrence` | `NONE`, `MONTHLY`, `QUARTERLY`, `SEMIANNUAL`, `YEARLY`, `CUSTOM` |
| `notification_days_before` | `INTEGER` | NO | `DEFAULT 30` | Días de anticipación para alerta |
| `notes` | `TEXT` | SÍ | | Observaciones operativas |
| `created_by` | `UUID` | SÍ | | Usuario creador |
| `updated_by` | `UUID` | SÍ | | Usuario modificador |
| `created_at` | `TIMESTAMPTZ` | NO | `DEFAULT CURRENT_TIMESTAMP` | Creación UTC |
| `updated_at` | `TIMESTAMPTZ` | NO | `DEFAULT CURRENT_TIMESTAMP` | Actualización UTC |

* **Índices Críticos de Rendimiento**:
  * `idx_expirations_org_id` ON (`organization_id`): Filtrado de tenant en todas las consultas.
  * `idx_expirations_company_id` ON (`company_id`): Listados por empresa cliente.
  * `idx_expirations_category_id` ON (`category_id`): Filtrado por tipo de vencimiento.
  * `idx_expirations_date` ON (`expiration_date`): Consultas para calendarios y vistas temporales.
  * `idx_expirations_status` ON (`status`): Filtrado de obligaciones activas vs cerradas.
  * `idx_expirations_org_date_status` ON (`organization_id`, `expiration_date`, `status`): **Índice compuesto ultra-optimizado** para el dashboard de alertas y widgets de vencimientos inminentes por tenant.
  * `idx_expirations_responsible` ON (`responsible_user_id`): Asignaciones por técnico.
