# PREVENIA — Runbook Operativo de Producción (v0.1)

---

## 1. Verificación del Estado del Sistema (Health Checks)

### 1.1. Health Check del Backend (Spring Boot Actuator)
- **URL Pública**: `https://api.prevenia.com/actuator/health` (o a través del ALB `/actuator/health`).
- **Respuesta Esperada**:
  ```json
  {
    "status": "UP"
  }
  ```
- **Liveness & Readiness Probes**:
  - `GET /actuator/health/liveness` → `{"status": "UP"}`
  - `GET /actuator/health/readiness` → `{"status": "UP"}`

### 1.2. Health Check del Frontend (Next.js)
- **URL Pública**: `https://app.prevenia.com/login`
- **Código HTTP Esperado**: `200 OK`

---

## 2. Inspección de Logs en Tiempo Real (CloudWatch Logs)

### 2.1. Vía AWS CLI
```bash
# Logs del Backend (últimos 30 minutos)
aws logs tail /ecs/prevenia-backend --since 30m --follow

# Logs del Frontend (últimos 30 minutos)
aws logs tail /ecs/prevenia-frontend --since 30m --follow
```

### 2.2. Vía Consola AWS
1. Abrir **CloudWatch** → **Logs** → **Log groups**.
2. Seleccionar `/ecs/prevenia-backend` o `/ecs/prevenia-frontend`.
3. Filtrar por términos (`ERROR`, `WARN`, `Exception`).

---

## 3. Procedimiento de Rollback Inmediato

Si una nueva versión en producción presenta errores imprevistos:

### 3.1. Rollback en ECS Fargate (Vía Task Definition)
Cada despliegue en ECS registra una nueva revisión de la Task Definition (`prevenia-backend-task:N`).

```bash
# Listar las últimas revisiones
aws ecs list-task-definitions --family-prefix prevenia-backend --sort DESC

# Actualizar el servicio a la revisión anterior estable (ejemplo: revisión 4)
aws ecs update-service \
  --cluster prevenia-cluster \
  --service prevenia-backend-service \
  --task-definition prevenia-backend:4 \
  --force-new-deployment
```

### 3.2. Rollback con Tags de Imágenes en Amazon ECR
Cada imagen en ECR se etiqueta con el SHA del commit de Git (ej: `prevenia-backend:a83fd19`).  
Para revertir, se actualiza la Task Definition para apuntar al SHA del commit anterior estable.

---

## 4. Gestión y Respaldos de Base de Datos (Amazon RDS)

### 4.1. Snapshots Manuales Antes de Migraciones Sensibles
Antes de aplicar cambios mayores de base de datos:
```bash
aws rds create-db-snapshot \
  --db-instance-identifier prevenia-prod-db \
  --db-snapshot-identifier prevenia-pre-migration-$(date +%Y%m%d%H%M)
```

### 4.2. Restauración Point-in-Time (PITR)
RDS mantiene backups continuos durante 7 días. Si ocurre una pérdida de datos:
1. Ir a **RDS** → **Databases** → Seleccionar `prevenia-prod-db`.
2. Elegir **Actions** → **Restore to point in time**.
3. Seleccionar la fecha y hora exacta deseada y crear la nueva instancia restaurada.

---

## 5. Qué Hacer si el Backend No Inicia (`UNHEALTHY` en ECS)

1. **Revisar Logs de Inicialización en CloudWatch**:
   - Verificar si Flyway falló por conflicto de migración.
   - Verificar si la conexión a PostgreSQL fue rechazada (credenciales incorrectas en SSM o Security Group bloqueando puerto 5432).
2. **Revisar Memory Limit Exceeded (OOMKilled)**:
   - Si la tarea se reinicia constantemente, verificar en CloudWatch Metrics si el consumo de memoria alcanzó el 100% de la cuota de la tarea (512 MB). En tal caso, incrementar la memoria de la tarea a 1024 MB.
3. **Validar Estado de la Red**:
   - Confirmar que el Security Group de RDS permite tráfico en el puerto `5432` proveniente del Security Group de la tarea de ECS Backend.
