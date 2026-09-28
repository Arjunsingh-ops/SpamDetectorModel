# Production Architecture & Infrastructure Cost Plan

**Project**: AI Call Agent  
**Version**: v1.0.0  
**Date**: September 27, 2026  

---

## 1. Top-Level Production System Architecture

```
                                +---------------------------------------+
                                |      Next.js Admin Dashboard          |
                                |     (Hosted on Vercel / Netlify)       |
                                +-------------------+-------------------+
                                                    |
                                                    | HTTPS REST / WSS WebSockets
                                                    v
                                +---------------------------------------+
                                |      Reverse Proxy / Load Balancer    |
                                |       (Nginx / Cloudflare Ingress)     |
                                +-------------------+-------------------+
                                                    |
                               +--------------------+--------------------+
                               |                                         |
                               v                                         v
               +-------------------------------+         +-------------------------------+
               |    FastAPI Web Application    |         |   APScheduler Worker Service  |
               |  (Docker Container / Render)  |         |  (Background Reports & Email) |
               +---------------+---------------+         +---------------+---------------+
                               |                                         |
            +------------------+------------------+                      |
            |                  |                  |                      |
            v                  v                  v                      v
  +------------------+ +---------------+ +------------------+  +-------------------+
  | Managed PostgreSQL| | Local Ollama  | | Telephony Provider|  | SMTP Email Relay  |
  | (Neon / RDS DB)  | | Inference GPU | | (Twilio / PSTN)  |  | (SendGrid/Gmail)  |
  +------------------+ +---------------+ +------------------+  +-------------------+
```

---

## 2. Component Hosting Breakdown

| Subsystem Component | Environment Choice | Recommended Provider | Key Operational Features |
| :--- | :--- | :--- | :--- |
| **Frontend UI** | Serverless / Static Host | Vercel / Netlify | Global CDN, automatic SSL, Instant Next.js Turbopack builds. |
| **FastAPI Backend** | Container Service | Render / Railway / AWS ECS | Always-on container runtime, WebSocket persistent connections, HTTPS. |
| **PostgreSQL DB** | Managed Serverless DB | Neon / AWS RDS | SSL encryption in transit, automatic daily backups, point-in-time recovery. |
| **Background Worker** | Persistent Container | Render / Docker Compose | Single replica, idempotency locking, volume mounting for persistent PDF storage. |
| **AI Inference** | GPU Inference Host | RunPod / Lambda Labs | NVIDIA GPU (T4 / A10G) running Ollama (`llama3:8b`) for sub-second LLM latency. |
| **Telephony** | Programmable Voice | Twilio / Exotel | Programmable Voice API, Webhooks, SIP Trunking. |

---

## 3. Infrastructure Cost & Resource Sizing Plan

Based on actual **Stage 9 performance benchmarks** (18ms API response time, 320ms PDF generation, 10 concurrent browser sessions):

### Tier 1: Low-Cost / Free-Tier Development Option
- **Frontend**: Vercel Hobby Plan — **$0 / month**
- **Backend**: Render Free Web Service — **$0 / month**
- **Database**: Neon Free Tier (0.5 GiB storage) — **$0 / month**
- **AI Inference**: Local Ollama on Developer Workstation (NVIDIA RTX GPU) — **$0 / month**
- **Telephony**: Twilio Developer Trial Account — **$0 (Includes trial credit)**
- **Estimated Monthly Cost**: **$0 / month**

### Tier 2: Balanced Production Option (Small-to-Medium Enterprise)
- **Frontend**: Vercel Pro — **$20 / month**
- **Backend API**: Render Starter Container (2 GB RAM, 1 CPU) — **$7 / month**
- **Background Worker**: Render Starter Container — **$7 / month**
- **Managed PostgreSQL**: Neon Launch Plan (10 GB Storage) — **$19 / month**
- **AI GPU Inference**: RunPod Dedicated RTX 4090 / T4 GPU — **~$40 / month**
- **Telephony**: 1 Dedicated Local PSTN Number + Usage (~500 mins/mo) — **~$15 / month**
- **SMTP Delivery**: SendGrid Essentials — **$15 / month**
- **Estimated Fixed Cost**: **~$108 / month** + usage-based call charges (~$0.015/min)

### Tier 3: High-Capacity Enterprise Option (High Volume)
- **Frontend**: Vercel Enterprise — **Custom**
- **Backend**: AWS ECS / Fargate (Multi-AZ Cluster) — **~$120 / month**
- **Database**: AWS RDS PostgreSQL Multi-AZ (db.m6g.large) — **~$180 / month**
- **AI GPU Cluster**: Dedicated A10G GPU Node — **~$200 / month**
- **Telephony**: SIP Trunking + High-Volume Toll-Free — **Usage-based**
- **Estimated Fixed Cost**: **~$500+ / month**
