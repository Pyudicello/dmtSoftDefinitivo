# PREVENIA — Esquema de Base de Datos (v0.3 — Día 3)

## 1. Motor y Estrategia de Persistencia
* **RDBMS**: PostgreSQL 16 (Compatible con H2 en modo PostgreSQL para tests de integración).
* **Gestor de Migraciones**: Flyway.
* **Política de Migraciones**: Inmutables una vez aplicadas (`V1`, `V2`, `V3`).

---

## 2. Historial de Migraciones

| Versión | Archivo | Propósito |
|---|---|---|
| **V1** | `V1__init_schema.sql` | Esquema fundacional: `organizations`, `users`, `companies`, `expiration_categories`, `expirations`. |
| **V2** | `V2__security_and_roles_schema.sql` | Roles, `user_company_assignments`, índices de seguridad y seeds de usuarios/empresas. |
| **V3** | `V3__update_expiration_core.sql` | Core de Vencimientos: actualización de estados de ciclo de vida (`ACTIVE`, `COMPLETED`, `CANCELLED`), campos de completado/cancelado, `@Version` para bloqueo optimista, constraint `chk_expirations_dates`, índices compuestos e inserción de seeds operativos. |

---

## 3. Tablas del Core de Vencimientos

### 3.1 `expiration_categories` (Categorías de Vencimiento)
```sql
CREATE TABLE expiration_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    code VARCHAR(50) NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    icon VARCHAR(50),
    color_code VARCHAR(20),
    is_system BOOLEAN NOT NULL DEFAULT FALSE,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```
* **Aislamiento Global vs Tenant**:
  * Si `organization_id IS NULL` e `is_system = TRUE`: Categoría del sistema compartida.
  * Si `organization_id IS NOT NULL`: Categoría propia de la consultora.
* **Índices**:
  * `idx_exp_cat_org`: `(organization_id)`
  * `idx_exp_cat_code`: `(code)`
  * `idx_exp_cat_system`: `(is_system, active)`

---

### 3.2 `expirations` (Obligaciones y Vencimientos)
```sql
CREATE TABLE expirations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES expiration_categories(id) ON DELETE RESTRICT,
    responsible_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    issue_date DATE,
    expiration_date DATE NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
    recurrence_type VARCHAR(30) NOT NULL DEFAULT 'NONE',
    notification_days_before INT NOT NULL DEFAULT 30,
    notes TEXT,
    completed_at TIMESTAMPTZ,
    completion_notes TEXT,
    cancelled_at TIMESTAMPTZ,
    cancel_reason TEXT,
    version INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    updated_by UUID,
    
    CONSTRAINT chk_expirations_status CHECK (status IN ('ACTIVE', 'COMPLETED', 'CANCELLED')),
    CONSTRAINT chk_expirations_dates CHECK (issue_date IS NULL OR issue_date <= expiration_date)
);
```

* **Restricciones de Integridad (Constraints)**:
  * `chk_expirations_status`: Valida que el estado administrativo persista solo valores del enum `ExpirationLifecycleStatus`.
  * `chk_expirations_dates`: Valida que la fecha de emisión no sea posterior a la fecha de vencimiento.
* **Concurrencia Optimista**: Columna `version INT NOT NULL DEFAULT 0` mapeada con `@Version` en JPA para prevenir *lost updates* concurrentes entre técnicos.
* **Índices de Alto Rendimiento**:
  * `idx_expirations_org_date`: `(organization_id, expiration_date)`
  * `idx_expirations_company_date`: `(company_id, expiration_date)`
  * `idx_expirations_org_status`: `(organization_id, status)`
  * `idx_expirations_category`: `(category_id)`
  * `idx_expirations_resp_user`: `(responsible_user_id)`
  * `idx_expirations_dates`: `(expiration_date)`

---

## 4. Tipos de Datos y Manejo Temporal
* **Fechas de Negocio / Calendario**: `DATE` (`java.time.LocalDate`) para `expiration_date` e `issue_date`. No requieren componente horario ni zona horaria.
* **Auditoría y Eventos**: `TIMESTAMPTZ` (`java.time.OffsetDateTime` UTC) para `created_at`, `updated_at`, `completed_at`, `cancelled_at`.
