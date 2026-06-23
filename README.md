# credit-application-service

Microservicio del sistema **NeoLend Financial Corp** responsable de gestionar el ciclo de vida de las solicitudes de crédito, desde su creación hasta el desembolso.

---

## Cobertura de la Rúbrica

| N° MVP | Descripción | Ponderación | Cobertura en este servicio |
|--------|-------------|-------------|---------------------------|
| 1 | Solicitud de crédito, motor de scoring con fuentes alternativas y aprobación automática (Incisos I, II, III) | 60% |  **Inciso I** – Creación de solicitud con monto, plazo y motivo. Gestión de estado hacia `DATA_COLLECTING` y `SCORING`. |
| 2 | Desembolso multi-canal e integración con billeteras/corresponsales, y módulo de cobranza (Incisos IV, V) | 70% |  **Inciso IV** – Transición de estado `APPROVED → DISBURSED` que dispara el flujo de desembolso. |
| 3 | Portal de inversionistas, detección de fraude y módulo gamificado (Incisos VI, VII, VIII) | 80% | ⚙️ Parcial – Expone estado de solicitudes consultable por otros servicios (inversionistas, fraude). |
| 4 | Trazabilidad auditada de decisiones de scoring con firma digital para la Superintendencia (Contexto Adicional b) | 100% |  Parcial – Provee `application_id` como agregado raíz para el `audit.event_store`. |

> Este servicio es el **núcleo del flujo MVP 1**. El motor de scoring (Inciso II) y la aprobación automática (Inciso III) son responsabilidad del `scoring-service`, que consume los datos expuestos aquí.

---

## ¿Qué hace este servicio?

- Recibe solicitudes de crédito desde la app móvil/web.
- Almacena los datos en la tabla `credit.credit_applications` de Neon PostgreSQL.
- Controla el **ciclo de estados** de cada solicitud con transiciones válidas:

```
CREATED → DATA_COLLECTING → SCORING → APPROVED → DISBURSED
                                    ↘ MANUAL_REVIEW → APPROVED
                         (cualquier estado) → REJECTED
```

- Valida los datos de entrada (monto, plazo, UUID del solicitante).
- Expone endpoints REST consumidos por otros microservicios del ecosistema NeoLend.

---

## Requisitos previos

- Node.js >= 18
- Cuenta en [Neon](https://neon.tech) con el schema SQL de NeoLend aplicado
- npm

---

## Instalación

```bash
# 1. Clonar el repositorio
git clone <repo-url>
cd credit-application-service

# 2. Instalar dependencias
npm install



---

## Variables de entorno

Completa los valores:

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `PORT` | Puerto del servidor | `3002` |
| `NODE_ENV` | Ambiente | `development` |
| `DATABASE_URL` | Connection string de Neon | `postgresql://user:pass@ep-xxx.neon.tech/db?sslmode=require` |
| `SECRET_JWT_SEED` | Semilla para JWT (uso futuro con auth middleware) | `NeoLend-Secret-Key` |
| `AUTO_APPROVAL_LIMIT` | Monto máximo para aprobación automática (USD) | `500` |
| `MIN_SCORE_APPROVAL` | Score mínimo para aprobación | `700` |
| `AUDIT_ENABLED` | Habilitar trazabilidad en `audit.event_store` | `true` |
| `DIGITAL_SIGNATURE_SECRET` | Secreto para firmas digitales de auditoría | `NeoLendAuditSignature2026` |

---

## Ejecución

```bash
# Desarrollo (con hot-reload)
npm run dev

# Producción
npm start
```

El servidor arranca en `http://localhost:3002` (o el `PORT` configurado).

Verificar que está corriendo:
```bash
curl http://localhost:3002/health
```

---

## Endpoints

### `POST /api/credit-applications`
Crear una nueva solicitud de crédito.

**Body:**
```json
{
  "applicant_id": "uuid-del-solicitante",
  "requested_amount": 350.00,
  "currency": "USD",
  "term_months": 12,
  "purpose": "Gastos médicos"
}
```

**Respuesta 201:**
```json
{
  "id": "uuid-generado",
  "applicant_id": "uuid-del-solicitante",
  "requested_amount": "350.00",
  "currency": "USD",
  "term_months": 12,
  "purpose": "Gastos médicos",
  "status": "CREATED",
  "created_at": "2026-06-23T00:00:00.000Z",
  "updated_at": "2026-06-23T00:00:00.000Z"
}
```

---

### `GET /api/credit-applications/:id`
Obtener una solicitud por su ID.

---

### `GET /api/credit-applications/applicant/:applicantId`
Listar todas las solicitudes de un solicitante, ordenadas por fecha descendente.

---

### `PATCH /api/credit-applications/:id/status`
Actualizar el estado de una solicitud. Solo acepta transiciones válidas.

**Body:**
```json
{
  "status": "DATA_COLLECTING"
}
```

**Error 422** si la transición no es válida:
```json
{
  "error": "Transición inválida: CREATED → DISBURSED. Permitidas: [DATA_COLLECTING, REJECTED]"
}
```

---

## Estados de solicitud

| Estado | Descripción |
|--------|-------------|
| `CREATED` | Solicitud recibida y registrada |
| `DATA_COLLECTING` | Recopilando datos externos (buró, servicios públicos, etc.) |
| `SCORING` | Motor de scoring procesando el puntaje crediticio |
| `APPROVED` | Solicitud aprobada (automática ≤ USD 500, o manual) |
| `MANUAL_REVIEW` | Requiere revisión de analista de riesgo |
| `REJECTED` | Solicitud rechazada |
| `DISBURSED` | Crédito desembolsado al solicitante |

---

## Estructura del proyecto

```
src/
├── config/
│   └── database.js          # Conexión Sequelize + Neon SSL
├── models/
│   └── CreditApplication.js # Modelo → credit.credit_applications
├── services/
│   └── creditApplicationService.js  # Lógica de negocio
├── controllers/
│   └── creditApplicationController.js
├── routes/
│   └── creditApplicationRoutes.js
├── validators/
│   └── creditApplicationValidator.js  # Validación Joi
├── middleware/
│   └── errorHandler.js
└── app.js                   # Bootstrap del servidor
```

---

## Integración con otros microservicios

```
App Móvil
    │
    ▼
credit-application-service  ──── (application_id) ───▶  external-data-service
    │                                                          │
    │◀──────── status: DATA_COLLECTING → SCORING ─────────────┘
    │
    ├── (application_id) ──▶  scoring-service
    │       └── APPROVED / REJECTED / MANUAL_REVIEW
    │
    └── (application_id) ──▶  audit.event_store (trazabilidad Superintendencia)
```
