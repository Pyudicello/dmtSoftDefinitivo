# PREVENIA — Arquitectura del Sistema (v0.3 — Día 3)

## 1. Visión y Principios Arquitectónicos
**PREVENIA** está estructurado como un **Monolito Modular** en Spring Boot (Backend) y Next.js 15 App Router (Frontend).

### Principios Rectores:
1. **Seguridad y Tenancy en Backend**: La base de datos y la capa de servicios son la única fuente de verdad; el frontend refleja únicamente lo que el backend autoriza.
2. **Separación entre Estado Administrativo y Clasificación Temporal**: El ciclo de vida administrativo (`ACTIVE`, `COMPLETED`, `CANCELLED`) se persiste físicamente. La urgencia temporal (`URGENT`, `UPCOMING`, `CURRENT`, `EXPIRED`) se calcula dinámicamente según la fecha actual.
3. **Abstracción del Reloj (`java.time.Clock`)**: Nunca se usa `LocalDate.now()` disperso; el motor inyecta un bean `Clock` configurable (default: `America/Argentina/Buenos_Aires`) que permite testing determinista y simulación temporal.
4. **Consultas Multi-Tenant vía Specifications**: Las consultas no traen listas completas a memoria; `ExpirationSpecification` traduce los scopes de seguridad y filtros en cláusulas SQL `WHERE` eficientes ejecutadas directamente por PostgreSQL.

---

## 2. Diagrama de Módulos Backend

```mermaid
graph TD
    subgraph "Infraestructura & Config"
        SecurityConfig[SecurityConfig & JwtFilter]
        TimeConfig[TimeConfig - Clock Bean]
        GlobalExceptionHandler[GlobalExceptionHandler]
    end

    subgraph "Módulo Identity & Access"
        UserRepo[UserRepository]
        AssignmentRepo[UserCompanyAssignmentRepository]
        AuthService[AuthService]
        SecFacade[SecurityContextFacade]
    end

    subgraph "Módulo Expiration (Core Día 3)"
        ExpController[ExpirationController]
        ExpCatController[ExpirationCategoryController]
        ExpService[ExpirationService]
        ExpCatService[ExpirationCategoryService]
        ExpClassifier[ExpirationDeadlineClassifier]
        ExpSpec[ExpirationSpecification]
        ExpRepo[ExpirationRepository]
        ExpCatRepo[ExpirationCategoryRepository]
    end

    ExpController --> ExpService
    ExpCatController --> ExpCatService
    ExpService --> SecFacade
    ExpService --> ExpClassifier
    ExpService --> ExpSpec
    ExpService --> ExpRepo
    ExpService --> ExpCatRepo
    ExpService --> AssignmentRepo
    ExpClassifier --> TimeConfig
```

---

## 3. Especificación de Consultas Multi-Tenant (`ExpirationSpecification`)

Para garantizar que un usuario jamás acceda a datos fuera de su ámbito ni mediante filtros maliciosos:

```java
public static Specification<Expiration> forUserScope(AuthenticatedUser user, Set<UUID> assignedCompanyIds) {
    return (root, query, cb) -> {
        if (user.getRole() == UserRole.PLATFORM_ADMIN) {
            return cb.conjunction(); // Sin restricciones de tenant
        }
        if (user.getRole() == UserRole.CONSULTANT_ADMIN) {
            return cb.equal(root.get("organizationId"), user.getOrganizationId());
        }
        if (user.getRole() == UserRole.TECHNICIAN) {
            if (assignedCompanyIds == null || assignedCompanyIds.isEmpty()) {
                return cb.disjunction(); // Bloqueo total si no tiene empresas asignadas
            }
            return cb.and(
                cb.equal(root.get("organizationId"), user.getOrganizationId()),
                root.get("company").get("id").in(assignedCompanyIds)
            );
        }
        if (user.getRole() == UserRole.CLIENT) {
            if (user.getCompanyId() == null) {
                return cb.disjunction();
            }
            return cb.equal(root.get("company").get("id"), user.getCompanyId());
        }
        return cb.disjunction();
    };
}
```

La consulta final se compone con `Specification.where(baseScope).and(userFilters)` garantizando que el alcance autorizado nunca sea sobreescrito.

---

## 4. Endpoints del Core de Vencimientos

| Método | Endpoint | Roles Permitidos | Descripción |
|---|---|---|---|
| `GET` | `/api/v1/expirations` | Todos (Filtrado por rol/tenant) | Listado paginado con filtros por empresa, categoría, fechas y estados. |
| `GET` | `/api/v1/expirations/{id}` | Todos (Scope verificado) | Detalle completo de un vencimiento. Retorna 404 ante accesos no autorizados. |
| `POST` | `/api/v1/expirations` | `PLATFORM_ADMIN`, `CONSULTANT_ADMIN`, `TECHNICIAN` (Asignado) | Crea una nueva obligación técnica. Rechazado con 403 para `CLIENT`. |
| `PUT` | `/api/v1/expirations/{id}` | `PLATFORM_ADMIN`, `CONSULTANT_ADMIN`, `TECHNICIAN` (Asignado) | Actualiza campos editables (título, fechas, notas, responsable). Empresa inmutable. |
| `POST` | `/api/v1/expirations/{id}/complete` | `PLATFORM_ADMIN`, `CONSULTANT_ADMIN`, `TECHNICIAN` (Asignado) | Marca la obligación como `COMPLETED` con fecha y notas de cumplimiento. |
| `POST` | `/api/v1/expirations/{id}/cancel` | `PLATFORM_ADMIN`, `CONSULTANT_ADMIN`, `TECHNICIAN` (Asignado) | Marca la obligación como `CANCELLED` con motivo de cancelación. |
| `DELETE` | `/api/v1/expirations/{id}` | `PLATFORM_ADMIN`, `CONSULTANT_ADMIN`, `TECHNICIAN` (Asignado) | Eliminación lógica / cancelación para preservar auditoría. |
| `GET` | `/api/v1/expirations/upcoming` | Todos (Scope verificado) | Vencimientos activos con fecha entre hoy y los próximos 30 días. |
| `GET` | `/api/v1/expirations/expired` | Todos (Scope verificado) | Vencimientos activos con fecha anterior a hoy. |
| `GET` | `/api/v1/companies/{companyId}/expirations` | Todos (Scope verificado) | Vencimientos de una empresa específica respetando permisos. |
| `GET` | `/api/v1/expiration-categories` | Todos | Listado de categorías disponibles (Globales + Tenant). |
| `POST` | `/api/v1/expiration-categories` | `PLATFORM_ADMIN`, `CONSULTANT_ADMIN` | Alta de nueva categoría (Rechaza códigos duplicados con 409). |
