# AI Call Agent - Security, Compliance & Governance Architecture

## 1. Overview & Threat Model

The AI Call Agent interfaces directly with the Public Switched Telephone Network (PSTN), streams bidirectional voice audio, stores confidential call transcripts, and performs spam/fraud evaluations. This document outlines the security controls, regulatory compliance frameworks, and ethical governance safeguards.

---

## 2. Authentication & Role-Based Access Control (RBAC)

The application implements strict Role-Based Access Control:

| Role | Permissions | Constraints |
|---|---|---|
| **Admin** | Full system configuration, user provisioning, webhook secret rotation, audit log inspection, human spam complaint submission to regulators. | Requires Multi-Factor Authentication (MFA). |
| **Receptionist / Operator** | View live calls, search call history, read transcripts, listen to recordings, review flagged spam, mark false positives. | Cannot delete audit logs or alter telephony routing rules. |
| **Viewer / Auditor** | Read-only access to aggregate analytics, sanitized call metrics, and audit logs. | Caller PII (phone numbers, full names) is masked (e.g., `+91 98765*****`). |

---

## 3. Webhook Signature Verification & Ingress Protection

Telephony providers invoke webhooks upon incoming calls, state transitions, and audio streaming requests. Unauthenticated or spoofed webhooks could allow an attacker to inject fraudulent call sessions.

### Signature Verification Algorithm
1. Every inbound webhook must include an HMAC-SHA256 signature header (e.g., `X-Twilio-Signature` or `X-Telephony-Signature`).
2. The backend reconstructs the signature using:
   - The full request URL including query parameters.
   - The sorted POST form parameters or raw request body.
   - The shared `TELEPHONY_WEBHOOK_SECRET`.
3. Signatures are verified using a constant-time comparison (`hmac.compare_digest`) to prevent timing attacks.
4. Requests with invalid or missing signatures are rejected immediately with `403 Forbidden` and logged in the audit stream.

---

## 4. Privacy, Consent & Legal Compliance (India DPDP Act & Global)

### 4.1. Recording Consent & Two-Party Notification
Under telecommunications wiretapping and data protection statutes (including the Indian Digital Personal Data Protection Act 2023 - DPDP, and GDPR/US state two-party consent laws), recording a conversation without notice is unlawful.

**System Enforcement:**
- Prior to recording or streaming audio to third-party AI APIs, the agent plays a mandatory bilingual disclosure:
  > *"This call may be recorded and processed by an AI assistant for quality and call routing purposes. (यह कॉल गुणवत्ता और रूटिंग उद्देश्यों के लिए रिकॉर्ड और प्रोसेस की जा सकती है।)"*
- If the caller explicitly objects or disconnects, recording is aborted immediately.

### 4.2. Data Minimization & PII Scrubbing
- **Transcript Sanitization**: Before transcripts are stored in PostgreSQL or sent to analytics, a local NER/regex scrubber strips credit card numbers, CVVs, Indian Aadhaar numbers, PAN cards, and one-time passwords (OTPs).
- **Masking in Dashboard**: Standard viewers see masked caller numbers (`+91 98765XXXXX`).

### 4.3. Private Object Storage for Call Audio
- Voice audio is **never** committed to relational tables or public CDNs.
- Stored in AWS S3 or compatible object storage with:
  - Server-Side Encryption with Customer-Managed Keys (SSE-KMS, AES-256).
  - Strict bucket policies blocking all public access (`BlockPublicAcls = True`).
  - Access granted only via short-lived (15-minute) pre-signed URLs generated for authenticated operators.

---

## 5. Human-in-the-Loop Spam & Telecom Complaint Governance

### The "No Autonomous Telecom Complaint" Invariant
> **CRITICAL RULE**: The system is strictly forbidden from autonomously filing official spam or fraud complaints with telecom regulators (e.g., Telecom Regulatory Authority of India - TRAI, DoT Chakshu portal, or US FTC/FCC) based solely on AI classification.

**Rationale:**
1. AI classifiers can produce false positives (e.g., a legitimate doctor calling from an unregistered clinic or a client with an urgent emergency).
2. Autonomous regulatory complaints could lead to legal liability, blacklisting of legitimate numbers, and regulatory penalties.

**Workflow Enforcement:**
1. Calls scoring >= 70 are routed to the `/spam-review` dashboard queue.
2. A human operator must listen to the audio or read the transcript.
3. The operator clicks **"Confirm Spam"**.
4. Only if the operator explicitly checks **"Submit Official Regulatory Report"** and provides their employee ID does the system queue an external filing.
5. All actions are immutably logged in `audit_logs` and `spam_reports`.

---

## 6. Rate Limiting, DDoS Mitigation & Transport Security

- **Transport Layer Security**: All traffic strictly enforced via TLS 1.3. Plain HTTP automatically redirected to HTTPS.
- **Rate Limiting**:
  - Webhook endpoints: Rate limited per caller IP and telecom subnet (e.g., 100 req/sec burst).
  - API endpoints: 60 requests/minute per authenticated user token.
- **CORS Policy**: Configurable through `ALLOWED_ORIGINS`. Defaults in production strictly to the trusted frontend domain (no wildcard `*` with credentials).
- **Environment Isolation**: Secrets stored in environment variables, never committed to Git. `.env.example` contains only non-secret placeholders.
