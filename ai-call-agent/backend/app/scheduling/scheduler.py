"""Persistent Task Scheduler Module.

Tasks 14 & 15: Background job scheduler initialization, job locking, and schedule sync.
"""

from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger
from app.core.logging import logger

_scheduler: BackgroundScheduler = None


def get_scheduler() -> BackgroundScheduler:
    global _scheduler
    if _scheduler is None:
        _scheduler = BackgroundScheduler(timezone="UTC")
    return _scheduler


def start_scheduler():
    scheduler = get_scheduler()
    if not scheduler.running:
        try:
            scheduler.start()
            logger.info("APScheduler Background Scheduler started successfully.")
        except Exception as e:
            logger.warning(f"Could not start BackgroundScheduler: {e}")


def shutdown_scheduler():
    global _scheduler
    if _scheduler and _scheduler.running:
        _scheduler.shutdown(wait=False)
        logger.info("APScheduler Background Scheduler shut down.")
