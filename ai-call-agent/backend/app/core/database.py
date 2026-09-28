"""Database Connection and Session Management."""

import time
from typing import Generator, Tuple
from sqlalchemy import create_engine, text
from sqlalchemy.orm import declarative_base, sessionmaker, Session
from app.core.config import settings
from app.core.logging import logger

# Base model for all declarative models
Base = declarative_base()

# Configure engine with pooling and connect timeout
engine_kwargs = {
    "pool_pre_ping": True,
    "echo": settings.DEBUG,
}

# Add pool options for PostgreSQL (SQLite used in some tests does not support pool_size)
if "postgresql" in settings.DATABASE_URL:
    engine_kwargs.update({
        "pool_size": settings.DB_POOL_SIZE,
        "max_overflow": settings.DB_MAX_OVERFLOW,
        "pool_timeout": settings.DB_POOL_TIMEOUT,
    })

engine = create_engine(settings.DATABASE_URL, **engine_kwargs)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db() -> Generator[Session, None, None]:
    """FastAPI Dependency providing a transactional database session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def check_database_connection() -> Tuple[bool, float, str]:
    """
    Safely ping the database to verify connectivity and measure latency.
    Returns (is_connected, latency_ms, dialect_name).
    Never raises an uncaught exception.
    """
    dialect = engine.dialect.name
    start_time = time.perf_counter()
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        latency_ms = round((time.perf_counter() - start_time) * 1000, 2)
        return True, latency_ms, dialect
    except Exception as e:
        logger.debug(f"Database health check failed: {e}")
        latency_ms = round((time.perf_counter() - start_time) * 1000, 2)
        return False, latency_ms, dialect
