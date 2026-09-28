# AI Call Agent - System Architecture

## 1. Executive Summary & Vision

The **AI Call Agent** is a multi-tenant, production-oriented virtual receptionist and intelligent call screening platform. It handles real-time inbound telephone calls, delivers bilingual conversational interactions (English and Hindi/Hinglish), extracts caller intent, evaluates multi-factor spam/fraud risk, safely forwards legitimate callers to designated targets, and exposes a real-time operations dashboard for observability, call review, and human-in-the-loop spam management.

Stage 1 establishes the architectural foundation, contracts, data schemas, deployment topologies, security boundaries, and runnable mock services.

---

## 2. High-Level System Architecture Diagram

```mermaid
flowchart TB
    subgraph TelecomCarrier["Telephony & PSTN Infrastructure"]
        PSTN["Caller on PSTN / Mobile Carrier"]
        CarrierForward["Mobile Forwarding / SIP Trunk"]
        TelephonyProvider["Telephony Gateway\n(Twilio / Indian SIP Provider / Exotel)"]
    end

    subgraph EdgeAndIngress["Edge & Gateway Layer"]
        CDN["Vercel Edge / Cloudflare"]
        WAF["Reverse Proxy / WAF / SSL Termination"]
        BackendAPI["FastAPI Application Server (Render / Container)"]
    end

    subgraph CoreBackend["Application & Realtime Orchestration"]
        WebhookRouter["Telephony Webhook Router & HMAC Verifier"]
        CallStateMachine["Call State Machine & Event Stream"]
        TelephonyAdapter["Telephony Abstraction Layer (TAL)"]
        VoiceAdapter["Voice AI Adapter Layer"]
        SpamEngine["Multi-Signal Spam & Fraud Engine"]
        ForwardingService["Call Transfer & Routing Service"]
    end

    subgraph AIAndThirdParty["AI & Specialized Services (Future Stages)"]
        OpenAIRealtime["OpenAI Realtime API / Audio WS"]
        ReputationDB["Number Reputation / CNAM / DND Registry"]
        STT_TTS["Local Whisper / Indic TTS (Fallback)"]
    end

    subgraph PersistenceAndAsync["Persistence & Asynchronous Layer"]
        NeonDB[("Neon PostgreSQL\n(Calls, Events, Assessments, Audits)")]
        RedisCache[("Redis (Pub/Sub, Call Sessions, Locks)")]
        CeleryWorker["Async Celery Workers (Analytics, Reporting)"]
        S3Storage[("Private S3/Cloud Storage\n(Encrypted Audio Recordings)")]
    end

    subgraph ClientDashboard["Operations & Administration (Next.js)"]
        AdminUI["Next.js App Router (TypeScript, Tailwind, shadcn/ui)"]
        AdminUser["Receptionist / Ops Admin / Reviewer"]
    end

    %% Call Flow Links
    PSTN -->|Dials Number| CarrierForward
    CarrierForward --> TelephonyProvider
    TelephonyProvider -->|Inbound Webhook (Signed HMAC)| WAF
    WAF --> BackendAPI
    BackendAPI --> WebhookRouter
    WebhookRouter --> CallStateMachine
    CallStateMachine --> TelephonyAdapter
    CallStateMachine --> VoiceAdapter
    CallStateMachine --> SpamEngine
    CallStateMachine --> ForwardingService

    %% AI Integration Links
    VoiceAdapter -.->|Bi-directional Audio Stream| OpenAIRealtime
    VoiceAdapter -.->|Fallback STT/TTS| STT_TTS
    SpamEngine -.->|Lookup Check| ReputationDB

    %% Persistence Links
    CallStateMachine --> NeonDB
    CallStateMachine --> RedisCache
    BackendAPI --> S3Storage
    CeleryWorker --> NeonDB
    CeleryWorker --> RedisCache

    %% Dashboard Links
    AdminUser --> AdminUI
    AdminUI --> CDN
    CDN -->|REST API / Status / Review| BackendAPI
    RedisCache -.->|WebSocket / SSE Live Events| AdminUI
```

---

## 3. Core Architectural Subsystems

### 3.1. Telephony Abstraction Layer (TAL)
To prevent vendor lock-in and address regional telecommunications regulations (such as Telecom Regulatory Authority of India - TRAI guidelines, Do Not Disturb/UCC norms, and carrier-specific SIP interconnects), all telephony interactions are decoupled behind the `TelephonyAdapter` interface:
- **Twilio Adapter**: Primary international PSTN adapter.
- **Indian SIP/Exotel Adapter**: Dedicated SIP interconnect for Indian local E.164 DID routing, CLI validation, and compliant PSTN handoffs.
- **Mock Telephony Adapter**: Deterministic local testing fixture capable of simulating rings, answer events, speech turns, DTMF, transfers, and error timeouts without cloud dependencies.

### 3.2. Voice AI Orchestration Subsystem
Voice interactions require sub-500ms latency to feel natural. The architecture specifies:
- **Bilingual Conversational Loop**: First greeting delivered in English with instant Hindi phrase detection ("नमस्ते, मैं आपकी क्या सहायता कर सकता हूँ?").
- **Streaming Pipeline**: WebSockets duplex audio streaming (PCM 16-bit 24kHz / G.711 mu-law) to OpenAI Realtime API or specialized low-latency speech models.
- **Intent Extraction Engine**: Continuous real-time extraction of structured slots (`caller_identity`, `target_person`, `purpose_of_call`, `urgency`, `callback_requested`).

### 3.3. Multi-Signal Spam & Fraud Engine
Unlike simple blocklists, the engine computes a composite risk score (0 to 100) using three weighted pillars:
1. **Pillar A: Number Reputation & Telephony Metadata (35%)**: Carrier profile, CLI spoofing indicators, TRAI telemarketer registration status, call frequency anomalies.
2. **Pillar B: Conversation Semantic Analysis (45%)**: Detection of social engineering patterns (urgent bank OTP demands, impersonation of government agencies like CBI/Police/Tax departments, lottery claims, aggressive investment pitches).
3. **Pillar C: Behavioral Signals (20%)**: Audio silence, refusal to state name, robotic playback artifacts, rapid hangup patterns.

Risk Classification:
- `0 - 39` -> **Legitimate**: Immediate warm/cold transfer to intended recipient.
- `40 - 69` -> **Uncertain**: Additional challenge phrase / interactive verification or screening voicemail.
- `70 - 100` -> **Spam / Malicious**: Politely terminated or routed to silent review sandbox.

### 3.4. Persistence & Event Stream Model
- **PostgreSQL (Neon)**: Primary relational store using UUIDs and UTC timestamps. Employs light event sourcing via `call_events` table for full forensic reconstruction of call interactions.
- **Recordings & Transcripts**: Audio files are never stored in SQL databases. They are encrypted (AES-256-GCM) and uploaded to private S3-compatible buckets with time-limited pre-signed URLs.

### 3.5. Administration & Review Dashboard
Next.js App Router application providing:
- Real-time call monitoring (`/live-calls`).
- Historical searchable call logs with transcripts (`/call-history`).
- Human-in-the-loop spam verification queue (`/spam-review`).
- Aggregate operational metrics (`/analytics`).
- System and telephony configuration (`/settings`).

---

## 4. Personal Mobile Number & Carrier Integration Architecture

### The Personal Mobile Dilemma
A virtual receptionist cannot directly intercept calls to a personal physical SIM card without carrier-level call forwarding or a dedicated virtual DID (Direct Inward Dialing) number:
1. **Conditional Call Forwarding (Recommended)**: The user's personal smartphone is configured via carrier MMI codes (e.g., `*67*<DID>#` when busy, `*61*<DID>#` when unanswered, or `*21*<DID>#` for unconditional divert) to forward calls to the AI Agent's virtual DID.
2. **Dedicated DID Inbound**: Business or public contact channels advertise the AI virtual DID directly.
3. **Country Support & KYC Verification**:
   - In India, purchasing DIDs and setting up SIP trunks requires Department of Telecommunications (DoT) and TRAI compliant Know-Your-Customer (KYC) documents (Company PAN, GSTIN, LOI, Authorized Signatory ID).
   - Telephony adapters must enforce valid E.164 formatting (`+91XXXXXXXXXX`) and verify trunk geographic restrictions prior to routing.

---

## 5. Technology Stack Rationale

| Layer | Selection | Justification |
|---|---|---|
| **Backend Framework** | FastAPI (Python 3.11+) | Async native, automatic OpenAPI docs, Pydantic type safety, ecosystem standard for AI/ML pipelines. |
| **Database** | PostgreSQL (Neon serverless) | ACID compliance, JSONB support for unstructured call metadata, branching capability, high reliability. |
| **Migrations** | Alembic | Industry standard for SQLAlchemy, deterministic version-controlled database schema evolution. |
| **Frontend Framework** | Next.js (App Router, TS) | Server components, streaming SSR, built-in optimization, standard enterprise SaaS UI framework. |
| **Styling** | Tailwind CSS + shadcn/ui | Accessible, highly polished component primitives, cohesive dark/light design system. |
| **Cache & Task Queue** | Redis + Celery (Future) | Reliable message broker, distributed locks, session cache for active call states. |
| **Deployment** | Render (Docker) + Vercel | Cost-effective, zero-maintenance container execution for backend, global edge distribution for frontend. |
