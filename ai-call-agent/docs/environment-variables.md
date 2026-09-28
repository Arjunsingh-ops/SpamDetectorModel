# Environment Variables & Configuration Guide

**Project**: AI Call Agent  
**Version**: v1.0.0  
**Date**: September 27, 2026  

---

## 1. Backend Environment Variables (`backend/.env`)

| Variable Name | Description | Default / Example Value | Required in Production |
| :--- | :--- | :--- | :--- |
| `APP_NAME` | Identifier name for application logs | `ai-call-agent-backend` | Yes |
| `ENVIRONMENT` | Target runtime environment | `production` | Yes |
| `DEBUG` | Enables verbose debug mode & tracebacks | `false` | Yes (`false`) |
| `PORT` | HTTP server listening port | `8000` | Yes |
| `HOST` | Bind IP address | `0.0.0.0` | Yes |
| `LOG_LEVEL` | Application logger verbosity | `INFO` | Yes |
| `SECRET_KEY` | HMAC key for JWT token signing | *(64-char random hex)* | **CRITICAL** |
| `ALGORITHM` | JWT token algorithm | `HS256` | Yes |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Bearer token validity duration | `480` (8 hours) | Yes |
| `ALLOWED_ORIGINS` | Comma-separated CORS allowed origins | `https://dashboard.company.com` | **CRITICAL** |
| `DATABASE_URL` | PostgreSQL connection URI with SSL mode | `postgresql://user:pw@neon.tech/db?sslmode=require` | **CRITICAL** |
| `DB_POOL_SIZE` | SQLAlchemy connection pool size | `20` | Yes |
| `DB_MAX_OVERFLOW` | Max connection pool overflow | `10` | Yes |
| `TELEPHONY_PROVIDER` | Telephony adapter module (`mock` / `twilio`) | `twilio` | Yes |
| `TWILIO_ACCOUNT_SID` | Twilio Account SID | `AC00000000000000000000000000000000` | Conditional |
| `TWILIO_AUTH_TOKEN` | Twilio Auth Token | *(Secret Token)* | Conditional |
| `TWILIO_PHONE_NUMBER` | Dedicated inbound PSTN number | `+911140000000` | Conditional |
| `TELEPHONY_WEBHOOK_URL` | Public HTTPS webhook callback URL | `https://api.company.com/api/v1/telephony/webhook` | Yes |
| `VOICE_AI_PROVIDER` | AI provider (`mock` / `ollama`) | `ollama` | Yes |
| `OLLAMA_BASE_URL` | Endpoint for Ollama LLM service | `http://ollama-service:11434` | Yes |
| `OLLAMA_MODEL` | Target LLM model name | `llama3:8b` | Yes |
| `SPAM_ENGINE_PROVIDER` | Fraud scoring engine provider | `hybrid_rules` | Yes |
| `SPAM_THRESHOLD_BLOCK` | Score above which call is auto-blocked | `70` | Yes |
| `SPAM_THRESHOLD_UNCERTAIN` | Score above which human review is needed | `40` | Yes |
| `REPORT_STORAGE_DIR` | Private file system directory for PDFs | `/app/storage/reports` | Yes |
| `SMTP_ENABLED` | Enable automated email report delivery | `true` | Yes |
| `SMTP_HOST` | Outbound SMTP server hostname | `smtp.sendgrid.net` | Conditional |
| `SMTP_PORT` | Outbound SMTP port | `587` | Conditional |
| `SMTP_USERNAME` | SMTP account username | `apikey` | Conditional |
| `SMTP_PASSWORD` | SMTP account password / API key | *(Secret Key)* | Conditional |
| `SMTP_FROM_ADDRESS` | Email sender address | `reports@company.com` | Conditional |

---

## 2. Frontend Environment Variables (`frontend/.env.local`)

| Variable Name | Description | Default / Example Value |
| :--- | :--- | :--- |
| `NEXT_PUBLIC_BACKEND_URL` | Public HTTPS URL of FastAPI backend API | `https://api.company.com` |
| `NEXT_PUBLIC_WS_URL` | Public WSS WebSocket URL for live call streaming | `wss://api.company.com` |

---

## 3. How to Generate Production Secrets

Generate a 64-character cryptographic secret for `SECRET_KEY`:
```bash
openssl rand -hex 32
```
