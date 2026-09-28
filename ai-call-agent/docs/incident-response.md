# Incident Response & Secret Rotation Protocol

**Project**: AI Call Agent  
**Version**: v1.0.0  
**Date**: September 27, 2026  

---

## 1. Incident Severity Levels & Response Playbook

- **SEV-1 (Critical)**: Total telephony webhook failure, backend crash, or database outage.
  - *Response Time Target*: < 15 Minutes.
  - *Action*: Trigger automated fallback greeting, notify DevOps lead, inspect `/health` endpoint and container logs.
- **SEV-2 (Major)**: High AI response latency (> 3s) or background report generation failure.
  - *Response Time Target*: < 1 Hour.
  - *Action*: Warm up Ollama GPU instance or fall back to cloud AI provider.
- **SEV-3 (Minor)**: UI styling defect or non-blocking report export formatting issue.
  - *Response Time Target*: < 24 Hours.

---

## 2. Emergency Secret Rotation Procedure

If a secret or credential is exposed or compromised:

### Step 1: Rotate JWT `SECRET_KEY`
```bash
# 1. Generate new 64-char key
NEW_SECRET=$(openssl rand -hex 32)

# 2. Update SECRET_KEY in backend environment & restart backend container
# Note: Existing logged-in sessions will be invalidated and prompted to re-authenticate.
```

### Step 2: Rotate Twilio Auth Token & Webhook Signing Secret
1. Log into Twilio Console and click **Request Secondary Auth Token**.
2. Update `TWILIO_AUTH_TOKEN` in `backend/.env`.
3. Promote secondary token to primary and revoke compromised token.

### Step 3: Rotate Database Password
1. Update database user password on PostgreSQL / Neon console.
2. Update `DATABASE_URL` in backend & worker environment variables.
3. Restart backend and worker services.
