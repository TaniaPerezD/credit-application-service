# NeoLend Financial Corp — Microservicios de Crédito

Repositorio con dos microservicios del ecosistema **NeoLend Financial Corp**:

| Servicio | Puerto | Responsabilidad |
|----------|--------|-----------------|
| `credit-application-service` | 3002 | Ciclo de vida de solicitudes de crédito |
| `external-data-service` | 3007 | Consulta de fuentes de datos externas (buró, servicios públicos, billeteras, e-commerce, recargas) |

Ambos comparten la misma base de datos **Neon PostgreSQL** con schemas separados (`credit` y `scoring`).


## Requisitos previos

- Node.js >= 18
- npm
- Cuenta en [Neon](https://neon.tech) con el schema SQL de NeoLend aplicado

---

## Instalación y arranque

### credit-application-service (puerto 3002)

```bash
# En la raíz del repositorio
npm install

npm run dev             # desarrollo con hot-reload
# npm start             # producción
```

Verificar:
```bash
curl http://localhost:3002/health
```

### external-data-service (puerto 3003)

```bash
cd external-data-service
npm install


npm run dev
# npm start
```

Verificar:
```bash
curl http://localhost:3003/health
# La respuesta incluye el estado del circuit breaker del buró crediticio
```

> Ambos servicios pueden correr simultáneamente en terminales separadas.

---

## Variables de entorno

### credit-application-service (`.env`)

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `PORT` | Puerto del servidor | `3002` |
| `NODE_ENV` | Ambiente | `development` |
| `DATABASE_URL` | Connection string de Neon | `postgresql://user:pass@ep-xxx.neon.tech/db?sslmode=require` |
| `SECRET_JWT_SEED` | Semilla para JWT | `NeoLend-Secret-Key` |
| `AUTO_APPROVAL_LIMIT` | Monto máximo para aprobación automática (USD) | `500` |
| `MIN_SCORE_APPROVAL` | Score mínimo para aprobación directa | `700` |
| `MIN_SCORE_MANUAL_REVIEW` | Score mínimo para revisión manual | `600` |
| `AUDIT_ENABLED` | Habilitar trazabilidad en `audit.event_store` | `true` |
| `DIGITAL_SIGNATURE_SECRET` | Secreto para firmas digitales de auditoría | `NeoLendAuditSignature2026` |

### external-data-service (`external-data-service/.env`)

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `PORT` | Puerto del servidor | `3007` |
| `NODE_ENV` | Ambiente | `development` |
| `DATABASE_URL` | Misma URL de Neon que el servicio anterior | `postgresql://...` |
| `CIRCUIT_BREAKER_THRESHOLD` | Fallos antes de abrir el circuit breaker | `5` |
| `CIRCUIT_BREAKER_RESET_MS` | Ms hasta intentar recuperar el buró | `30000` |

---

## Endpoints — credit-application-service

Base URL: `http://localhost:3002`

### `GET /health`
Estado del servicio.

### `POST /api/credit-applications`
Crear una nueva solicitud de crédito.

**Body:**
```json
{
  "applicant_id": "550e8400-e29b-41d4-a716-446655440000",
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
  "applicant_id": "550e8400-e29b-41d4-a716-446655440000",
  "requested_amount": "350.00",
  "currency": "USD",
  "term_months": 12,
  "purpose": "Gastos médicos",
  "status": "CREATED",
  "created_at": "2026-06-23T00:00:00.000Z",
  "updated_at": "2026-06-23T00:00:00.000Z"
}
```

### `GET /api/credit-applications/:id`
Obtener una solicitud por su ID.

### `GET /api/credit-applications/applicant/:applicantId`
Listar todas las solicitudes de un solicitante, ordenadas por fecha descendente.

### `PATCH /api/credit-applications/:id/status`
Actualizar el estado de una solicitud. Solo acepta transiciones válidas según la máquina de estados.

**Body:**
```json
{ "status": "DATA_COLLECTING" }
```

**Error 422** si la transición no es válida:
```json
{
  "error": "Transición inválida: CREATED → DISBURSED. Permitidas: [DATA_COLLECTING, REJECTED]"
}
```

---

## Estados de solicitud y transiciones válidas

```
CREATED → DATA_COLLECTING → SCORING → APPROVED → DISBURSED
                                    ↘ MANUAL_REVIEW → APPROVED
              (desde cualquier estado activo) → REJECTED
```

| Estado | Descripción |
|--------|-------------|
| `CREATED` | Solicitud recibida y registrada |
| `DATA_COLLECTING` | Recopilando datos externos vía `external-data-service` |
| `SCORING` | Motor de scoring procesando el puntaje crediticio |
| `APPROVED` | Aprobada (automática si monto ≤ `AUTO_APPROVAL_LIMIT` y score ≥ `MIN_SCORE_APPROVAL`) |
| `MANUAL_REVIEW` | Requiere revisión de analista de riesgo |
| `REJECTED` | Solicitud rechazada (estado terminal) |
| `DISBURSED` | Crédito desembolsado (estado terminal) |

---

## Endpoints — external-data-service

Base URL: `http://localhost:3007`

### `GET /health`
Incluye el estado actual del circuit breaker del buró crediticio:
```json
{
  "status": "ok",
  "service": "external-data-service",
  "circuit_breaker": { "state": "CLOSED", "failures": 0 }
}
```

### `POST /api/external-data/credit-bureau`
Consulta al buró crediticio (simula mainframe IBM Z). **Tiempo de respuesta: 8–15 segundos.**

**Body:**
```json
{
  "application_id": "uuid-de-la-solicitud",
  "document_number": "12345678"
}
```

**Respuesta 200:**
```json
{
  "application_id": "...",
  "credit_bureau_score": 750,
  "report_date": "2026-06-23",
  "has_delinquency": false,
  "risk_category": "BAJO",
  "from_cache": false
}
```

**Respuesta 503** si el circuit breaker está abierto:
```json
{
  "error": "Circuit breaker ABIERTO: buró crediticio no disponible",
  "circuit_breaker": { "state": "OPEN", "failures": 5 }
}
```

### `POST /api/external-data/utilities`
Historial de pagos de servicios públicos (LUZ, AGUA, GAS, TELEFONÍA). Latencia: 500–1500ms.

**Body:**
```json
{
  "application_id": "uuid-de-la-solicitud",
  "applicant_id": "uuid-del-solicitante"
}
```

### `POST /api/external-data/wallets`
Actividad en billeteras digitales (YAPE, PLIN, NEQUI, DAVIPLATA). Latencia: 300–1000ms.

Mismo body que `/utilities`.

### `POST /api/external-data/ecommerce`
Historial en plataformas de e-commerce (MERCADOLIBRE, AMAZON, SHOPIFY). Latencia: 400–1000ms.

Mismo body que `/utilities`.

### `POST /api/external-data/mobile-topups`
Historial de recargas móviles (CLARO, MOVISTAR, ENTEL, BITEL). Latencia: 200–700ms.

Mismo body que `/utilities`.

### `GET /api/external-data/summary/:applicationId`
Resumen consolidado con todos los scores y el score compuesto.

**Respuesta 200:**
```json
{
  "application_id": "...",
  "credit_bureau_score": 750,
  "utility_payment_score": 820,
  "wallet_transaction_score": 690,
  "ecommerce_score": 710,
  "mobile_topup_score": 650,
  "composite_score": 724,
  "all_sources_ready": true
}
```

> `composite_score` es el promedio de las fuentes disponibles. `all_sources_ready` es `true` cuando los 5 scores están presentes.

---

## Cómo probar en Postman (flujo completo)

### Paso 1 — Crear solicitud
`POST http://localhost:3002/api/credit-applications`
```json
{
  "applicant_id": "550e8400-e29b-41d4-a716-446655440000",
  "requested_amount": 350,
  "term_months": 12,
  "purpose": "Capital de trabajo"
}
```
Guardar el `id` retornado como `{{application_id}}`.

### Paso 2 — Avanzar a DATA_COLLECTING
`PATCH http://localhost:3002/api/credit-applications/{{application_id}}/status`
```json
{ "status": "DATA_COLLECTING" }
```

### Paso 3 — Consultar el buró (esperar 8–15s)
`POST http://localhost:3003/api/external-data/credit-bureau`
```json
{
  "application_id": "{{application_id}}",
  "document_number": "12345678"
}
```

### Paso 4 — Consultar las otras 4 fuentes (en paralelo o secuencial)
```
POST http://localhost:3003/api/external-data/utilities
POST http://localhost:3003/api/external-data/wallets
POST http://localhost:3003/api/external-data/ecommerce
POST http://localhost:3003/api/external-data/mobile-topups
```
Body para todas:
```json
{
  "application_id": "{{application_id}}",
  "applicant_id": "550e8400-e29b-41d4-a716-446655440000"
}
```

### Paso 5 — Ver el resumen consolidado
`GET http://localhost:3003/api/external-data/summary/{{application_id}}`

### Paso 6 — Avanzar a SCORING y luego APPROVED
```
PATCH .../status  →  { "status": "SCORING" }
PATCH .../status  →  { "status": "APPROVED" }
PATCH .../status  →  { "status": "DISBURSED" }
```

---

## Estructura del repositorio

```
credit-application-service/          ← raíz del repo (puerto 3002)
├── src/
│   ├── config/database.js            # Sequelize + Neon SSL
│   ├── models/CreditApplication.js   # → credit.credit_applications
│   ├── services/creditApplicationService.js
│   ├── controllers/creditApplicationController.js
│   ├── routes/creditApplicationRoutes.js
│   ├── validators/creditApplicationValidator.js
│   ├── middleware/errorHandler.js
│   └── app.js
├── .env.example
├── package.json
│
external-data-service/                ← subfolder (puerto 3003)
├── src/
│   ├── config/database.js
│   ├── models/ExternalDataSnapshot.js  # → scoring.external_data_snapshots
│   ├── simulators/
│   │   ├── circuitBreaker.js           # Circuit breaker manual (CLOSED/OPEN/HALF_OPEN)
│   │   ├── creditBureauSimulator.js    # IBM Z mainframe + caché en memoria
│   │   ├── utilitiesSimulator.js
│   │   ├── walletsSimulator.js
│   │   ├── ecommerceSimulator.js
│   │   └── mobileTopupsSimulator.js
│   ├── services/externalDataService.js
│   ├── controllers/externalDataController.js
│   ├── routes/externalDataRoutes.js
│   ├── validators/externalDataValidator.js
│   ├── middleware/errorHandler.js
│   └── app.js
├── .env.example
└── package.json
```
