# AI Call Agent - REST & Webhook API Contract

## 1. Overview & Conventions

All endpoints adhere to RESTful conventions. Timestamps are formatted in ISO-8601 UTC (`YYYY-MM-DDTHH:MM:SS.mmmmmmZ`). IDs are standard UUIDv4 strings.

Base URLs:
- Production: `https://api.aicallagent.internal/api/v1`
- Development: `http://localhost:8000/api/v1`

Standard HTTP status codes:
- `200 OK`: Request succeeded.
- `201 Created`: Resource successfully created.
- `400 Bad Request`: Validation failure or malformed payload.
- `401 Unauthorized`: Missing or invalid authentication token.
- `403 Forbidden`: Authenticated user lacks permission.
- `404 Not Found`: Target resource does not exist.
- `422 Unprocessable Entity`: Schema validation error.
- `429 Too Many Requests`: Rate limit exceeded.
- `500 Internal Server Error`: Unhandled server exception.

---

## 2. Health & System Status Endpoints

### 2.1. GET `/health`
Public liveness probe. Does **not** require database or external credential availability. Used by orchestrators (Kubernetes/Render/Docker) to verify process liveness.

**Response (200 OK):**
```json
{
  "status": "healthy",
  "timestamp": "2026-09-26T12:00:00.000000Z",
  "service": "ai-call-agent-backend",
  "version": "1.0.0"
}
```

### 2.2. GET `/api/v1/status`
System readiness and integration diagnostic probe. Inspects database connectivity, active telephony adapter mode, spam detection adapter mode, and runtime environment.

**Response (200 OK):**
```json
{
  "status": "operational",
  "environment": "development",
  "database": {
    "connected": true,
    "dialect": "postgresql",
    "latency_ms": 4.2
  },
  "adapters": {
    "telephony": {
      "provider": "mock",
      "mode": "simulation",
      "ready": true
    },
    "voice_ai": {
      "provider": "mock",
      "mode": "bilingual_simulation",
      "languages": ["en-IN", "hi-IN"],
      "ready": true
    },
    "spam_engine": {
      "provider": "mock",
      "mode": "rule_based_heuristics",
      "ready": true
    }
  },
  "version": "1.0.0",
  "timestamp": "2026-09-26T12:00:00.000000Z"
}
```

---

## 3. Telephony Webhook Ingestion API

### 3.1. POST `/api/v1/telephony/webhook/inbound`
Called by telecom provider (Twilio, Indian SIP Gateway, Exotel) upon an inbound call.

**Headers:**
- `X-Telephony-Signature`: HMAC SHA-256 signature of request body and URL.
- `Content-Type`: `application/x-www-form-urlencoded` or `application/json`.

**Request Body (JSON representation):**
```json
{
  "CallSid": "CAa817b9491a9238f49e0c5b78d21c900e",
  "From": "+919876543210",
  "To": "+911140001234",
  "CallStatus": "ringing",
  "Direction": "inbound",
  "CallerName": "Unknown",
  "ApiVersion": "2010-04-01"
}
```

**Response (200 OK - Telephony Execution Schema):**
```json
{
  "action": "answer_and_stream",
  "call_session_id": "b05e0c65-680c-4e8c-8515-b38466ce78d8",
  "stream_url": "wss://api.aicallagent.internal/api/v1/voice/stream/b05e0c65-680c-4e8c-8515-b38466ce78d8",
  "initial_greeting": "Hello, thank you for calling. How may I direct your call? (नमस्ते, मैं आपकी क्या सहायता कर सकता हूँ?)"
}
```

### 3.2. POST `/api/v1/telephony/webhook/status`
Receives call status updates (ringing, in-progress, completed, busy, no-answer).

---

## 4. Calls Management API

### 4.1. GET `/api/v1/calls`
Retrieve paginated list of calls with filtering options.

**Query Parameters:**
- `page` (int, default: 1)
- `limit` (int, default: 20, max: 100)
- `status` (string, optional: `in_progress`, `completed`, `blocked`, `transferred`, `failed`)
- `disposition` (string, optional: `spam`, `legitimate`, `uncertain`)
- `search` (string, optional: caller number, recipient, or intent keyword)

**Response (200 OK):**
```json
{
  "items": [
    {
      "id": "b05e0c65-680c-4e8c-8515-b38466ce78d8",
      "external_call_sid": "CAa817b9491a9238f49e0c5b78d21c900e",
      "caller_number": "+919876543210",
      "recipient_number": "+911140001234",
      "status": "completed",
      "disposition": "transferred",
      "detected_language": "hi-IN",
      "caller_name": "Rohan Sharma",
      "caller_intent": "Inquiry regarding commercial property lease in Sector 62",
      "duration_seconds": 142,
      "spam_score": 12,
      "created_at": "2026-09-26T11:45:10.000000Z",
      "completed_at": "2026-09-26T11:47:32.000000Z"
    }
  ],
  "total": 1,
  "page": 1,
  "limit": 20,
  "pages": 1
}
```

### 4.2. GET `/api/v1/calls/{call_id}`
Returns comprehensive call details including events timeline, spam breakdown, and transfer records.

---

## 5. Spam Review & Human Verification API

### 5.1. GET `/api/v1/spam/review-queue`
Returns calls flagged as spam or suspicious requiring human verification.

### 5.2. POST `/api/v1/spam/review/{call_id}/decision`
Admin submits verified review decision.

**Request Body:**
```json
{
  "decision": "confirmed_spam", // or "marked_false_positive"
  "submit_telecom_report": false,
  "notes": "Verified fraudulent KYC update impersonation attempt."
}
```

**Policy Rule:** `submit_telecom_report` can **only** be set to `true` by an authorized human operator with administrative role; the automated AI is prohibited from directly filing complaints with TRAI / DoT without human signoff.

---

## 6. Analytics API

### 6.1. GET `/api/v1/analytics/overview`
Returns summary KPI metrics:
```json
{
  "total_calls": 348,
  "legitimate_calls": 268,
  "spam_calls_blocked": 68,
  "uncertain_screened": 12,
  "avg_duration_seconds": 88.4,
  "language_distribution": {
    "english": 182,
    "hindi": 134,
    "hinglish": 32
  },
  "spam_detection_accuracy": 98.2
}
```
