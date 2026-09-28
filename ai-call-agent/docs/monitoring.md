# Monitoring, Alerting & Observability Plan

**Project**: AI Call Agent  
**Version**: v1.0.0  
**Date**: September 27, 2026  

---

## 1. Health Probes & Endpoint Probes

The FastAPI backend exposes built-in health and readiness probes:
- **`GET /health`**: Returns application status, database connectivity, and configured providers.
- **`GET /ready`**: Kubernetes / container orchestrator readiness check ensuring DB connections are alive.

```json
{
  "status": "healthy",
  "app_name": "ai-call-agent-backend",
  "version": "v1.0.0",
  "database": "connected",
  "telephony_provider": "twilio",
  "voice_ai_provider": "ollama"
}
```

---

## 2. Structured JSON Logging

All logs are formatted in structured JSON containing:
- Timestamp (UTC)
- Environment & log level
- Request Correlation ID (`X-Request-ID`)
- Call Session Correlation ID (`call_id`)
- Redacted caller identity (no raw PII logged)

---

## 3. Recommended Alerting Thresholds

| Metric | Alert Condition | Severity | Escalation Action |
| :--- | :--- | :--- | :--- |
| **API Error Rate** | > 2% HTTP 5xx responses over 5 mins | HIGH | Notify DevOps & Inspect logs |
| **DB Latency** | P95 > 200ms over 5 mins | MEDIUM | Inspect database pool & slow queries |
| **Telephony Webhook Failures** | > 1 failed webhook verification | HIGH | Inspect signature secrets & SSL certs |
| **AI Inference Timeout** | LLM latency > 3,000ms | HIGH | Restart Ollama container / GPU node |
| **Worker Queue Backlog** | > 10 pending report jobs | MEDIUM | Scale report worker containers |
