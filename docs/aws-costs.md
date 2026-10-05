# PREVENIA — Estimación y Control de Costos en AWS (v0.1)

> **Principio Fundamental**: Arquitectura profesional, segura y de bajo costo para PREVENIA v0.1 (MVP productivo). No sobredimensionar ni crear servicios innecesarios.

---

## 1. Comparativa de Regiones AWS

Para un producto SaaS enfocado inicialmente en consultoras y empresas de **Argentina y Latinoamérica**:

| Factor | **us-east-1 (N. Virginia, USA)** *(Recomendada)* | **sa-east-1 (São Paulo, Brasil)** |
| :--- | :--- | :--- |
| **Costo RDS / ECS / ALB** | **Línea base más económica de AWS** | **~40% a 60% más costosa** |
| **Latencia a Argentina** | ~130 - 150 ms (imperceptible para SaaS transaccional) | ~35 - 50 ms |
| **Disponibilidad Servicios** | 100% servicios y nuevas características | Algunos servicios/instancias limitados |
| **Free Tier / Ofertas** | Máxima cobertura de capa gratuita | Cobertura estándar pero precios base más altos |
| **Decisión Técnica** | **ELEGIDA para PREVENIA v0.1** (optimización de presupuesto) | Opción para escalar cuando la facturación lo justifique |

---

## 2. Desglose Detallado por Servicio y Estimación Mensual

### A. Escenario MVP v0.1 — Arquitectura de Costo Optimizado (Recomendada)

| Servicio AWS | Configuración / Dimensionamiento | Costo Mínimo (Free Tier activo) | Costo Esperable (Sin Free Tier) | Riesgo / Crecimiento |
| :--- | :--- | :--- | :--- | :--- |
| **Amazon RDS PostgreSQL** | `db.t4g.micro` (1 vCPU, 1 GB RAM), 20 GB Storage gp3, Single-AZ, Backups 7 días | **$0.00** (750 hrs/mes en Free Tier 12m) | **~$13.50 / mes** | $0.115/GB extra si se superan 20 GB |
| **Amazon ECS Fargate** | 1 Task Backend (0.25 vCPU, 0.5 GB RAM) + 1 Task Frontend (0.25 vCPU, 0.5 GB RAM) | ~$8.00 / mes | **~$15.00 / mes** | Escalar a más tasks si sube el tráfico |
| **Application Load Balancer (ALB)** | 1 ALB público con reglas de path (`/api/*` → Backend, `/*` → Frontend), TLS/ACM | ~$16.00 / mes | **~$18.00 / mes** | $0.008 por LCU-hora adicional |
| **AWS CloudFront** | CDN para assets estáticos y Frontend caching | **$0.00** (1 TB data transfer Free Tier mensual) | **$0.00 - $1.00 / mes** | Costo por peticiones si excede 10M |
| **Amazon ECR** | Repositorio Docker con Lifecycle Policy (conservar solo 5 imágenes recientes) | **$0.00** (500 MB Free Tier) | **~$0.50 / mes** | $0.10/GB storage |
| **Secrets / Config** | **AWS Systems Manager Parameter Store** (SecureString KMS estándar) | **$0.00** (Parámetros estándar gratis) | **$0.00 / mes** | Secrets Manager costaría $0.40/secreto/mes |
| **Amazon CloudWatch** | Logs ECS con retención a 14 días + 3 Alarmas básicas de métricas | **$0.00** (5 GB logs + 10 alarmas gratis) | **~$1.00 / mes** | $0.50/GB ingestión sobre 5 GB |
| **Amazon Route 53** | 1 Hosted Zone para `prevenia.com` (si se usa dominio en AWS) | $0.50 / mes | **$0.50 / mes** | $0.40/millón de consultas |
| **AWS Certificate Manager (ACM)** | Certificados SSL/TLS públicos para HTTPS | **$0.00** (Completamente gratuito) | **$0.00 / mes** | $0.00 |
| **Networking (Estrategia NAT $0)** | ECS en Public Subnet con SG estricto (solo acepta tráfico del ALB) + RDS en Private Subnet | **$0.00** | **$0.00 / mes** | Ahorro directo de $32.40/mes |
| **TOTAL ESTIMADO MENSUAL** | **PREVENIA v0.1 (Single-AZ, Low Cost)** | **~$25.00 / mes** | **~$48.00 / mes** | **Presupuesto AWS Budgets: USD 30.00** |

---

## 3. Decisiones Críticas de Red y Ahorro de Costos

### ¿Por qué NO usar NAT Gateway en el MVP?
- Un **AWS Managed NAT Gateway** cobra una tarifa fija de **$0.045 por hora** (~$32.40 USD/mes por 1 solo Gateway en 1 AZ, o ~$65 USD/mes si es Multi-AZ), más $0.045 por GB procesado.
- Para PREVENIA v0.1, el backend y frontend residen en ECS Fargate con IPs públicas asignadas en subredes públicas, pero protegidos por **Security Groups que bloquean todo tráfico entrante salvo el proveniente del ALB**.
- La base de datos **RDS PostgreSQL permanece 100% aislada en subredes privadas** sin salida ni IP pública (`PubliclyAccessible = false`).
- **Ahorro neto mensual**: **~$32.40 a $65.00 USD/mes**.

### ¿Por qué SSM Parameter Store en lugar de Secrets Manager?
- **AWS Secrets Manager**: Cobra **$0.40 USD/mes por secreto** + $0.05 por cada 10,000 llamadas a la API. (4 secretos = ~$1.60/mes + costos de rotación).
- **AWS Systems Manager (SSM) Parameter Store**: Los parámetros estándar (incluyendo `SecureString` cifrados con clave KMS administrada por AWS) son **100% GRATUITOS**.
- Cumple exactamente con la misma seguridad de cifrado en reposo y en tránsito.

---

## 4. Política de Retención de Logs CloudWatch
Para evitar cobros por almacenamiento acumulativo de logs en CloudWatch:
- Grupo `/ecs/prevenia-backend`: **14 días de retención**.
- Grupo `/ecs/prevenia-frontend`: **14 días de retención**.

---

## 5. Configuración Obligatoria de AWS Budgets

Se define la creación de un presupuesto mensual en la consola de AWS:
- **Nombre**: `Prevenia-Monthly-Budget`
- **Monto Límite**: **USD 30.00**
- **Umbrales de Alarma**:
  - **Alerta 1 (50%)**: Envío de email cuando el gasto proyectado o real alcance **USD 15.00**.
  - **Alerta 2 (80%)**: Envío de email cuando el gasto real alcance **USD 24.00**.
  - **Alerta 3 (100%)**: Envío de email urgente si se superan los **USD 30.00**.
