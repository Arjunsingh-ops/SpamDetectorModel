# Production Deployment Guide

**Project**: AI Call Agent  
**Version**: v1.0.0  
**Date**: September 27, 2026  

---

## 1. Quick-Start Production Deployment Checklist

1. **Environment Config**: Copy `backend/.env.example` to `backend/.env` and update secrets.
2. **Database Provisioning**: Provision managed PostgreSQL (e.g. Neon) and run migrations: `alembic upgrade head`.
3. **Container Launch**: Run `docker-compose up -d --build`.
4. **Frontend Build**: Build Next.js application: `npm run build` and deploy to Vercel or Node.js host.

---

## 2. Docker Compose Launch Commands

```bash
# Build and launch all backend services (PostgreSQL, FastAPI Backend, APScheduler Worker)
docker-compose up -d --build

# Inspect running containers
docker-compose ps

# Monitor real-time logs
docker-compose logs -f backend worker
```

---

## 3. Verification & Smoke Testing

Verify system health:
```bash
curl -f http://localhost:8000/health
```
Expected response:
`{"status":"healthy","app_name":"ai-call-agent-backend",...}`
