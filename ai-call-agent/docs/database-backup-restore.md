# PostgreSQL Backup, Restore & Migration Runbook

**Project**: AI Call Agent  
**Version**: v1.0.0  
**Date**: September 27, 2026  

---

## 1. Disaster Recovery Targets

- **Recovery Point Objective (RPO)**: **< 1 Hour** (Daily full backups + hourly WAL archiving / point-in-time recovery on Neon).
- **Recovery Time Objective (RTO)**: **< 15 Minutes** for database restoration.

---

## 2. Automated & Manual Backup Commands

### Creating a Compressed Database Dump (`pg_dump`)
```bash
# Execute pg_dump against the production database URL
pg_dump "$DATABASE_URL" -F c -b -v -f "callagent_backup_$(date +%Y%m%d_%H%M%S).dump"
```

### Automated Backup Strategy
- **Managed Provider (Neon / AWS RDS)**: Automatic daily snapshots with 7-day retention and Point-In-Time-Recovery (PITR).
- **Self-Hosted PostgreSQL**: Cron job executing `pg_dump` daily at 02:00 UTC, uploaded to encrypted private object storage.

---

## 3. Database Restoration Runbook (`pg_restore`)

> [!CAUTION]
> Always verify restoration on a **disposable staging database** first before applying to production!

```bash
# 1. Create a fresh target database
createdb -h localhost -U callagent callagent_restored_db

# 2. Restore schema and data from backup file
pg_restore -h localhost -U callagent -d callagent_restored_db -v "callagent_backup_20260927.dump"

# 3. Verify database tables and Alembic migration version
psql -d callagent_restored_db -c "SELECT version_num FROM alembic_version;"
```

---

## 4. Alembic Migration Rollback Procedures

To roll back the latest database migration safely:
```bash
cd backend
source .venv/bin/activate

# Check current version
alembic current

# Roll back 1 revision
alembic downgrade -1
```
