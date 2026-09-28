# Deployment Rollback & Migration Recovery Protocol

**Project**: AI Call Agent  
**Version**: v1.0.0  
**Date**: September 27, 2026  

---

## 1. Application Container Rollback

If a new backend or frontend deployment introduces runtime errors:

### Rollback Next.js Frontend (Vercel / Netlify)
1. Go to host deployment history.
2. Select previous stable build deployment ID.
3. Click **Promote to Production** (Instant zero-downtime rollback).

### Rollback FastAPI Backend (Render / Docker Host)
```bash
# Re-tag previous stable image as latest and redeploy
docker tag ai-call-agent-backend:v1.0.0-previous ai-call-agent-backend:latest
docker-compose up -d --no-deps backend worker
```

---

## 2. Database Migration Rollback

```bash
cd backend
source .venv/bin/activate

# Step 1: Verify current version
alembic current

# Step 2: Downgrade 1 revision safely
alembic downgrade -1
```
