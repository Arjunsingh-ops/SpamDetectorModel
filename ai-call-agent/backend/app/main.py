"""FastAPI Enterprise Application Entrypoint."""

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.logging import logger
from app.core.exceptions import register_exception_handlers
from app.core.middleware import (
    RequestCorrelationMiddleware,
    SecurityHeadersMiddleware,
    RateLimitingMiddleware,
)
from app.api.v1.router import api_v1_router
from app.api.v1.endpoints.health import router as root_health_router
from app.api.v1.endpoints.ready import router as root_ready_router
from app.api.v1.endpoints.metrics import router as root_metrics_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application startup and shutdown lifecycle management."""
    logger.info(f"Starting {settings.APP_NAME} v{settings.APP_VERSION} [{settings.ENVIRONMENT}]")
    logger.info(f"Telephony Provider: {settings.TELEPHONY_PROVIDER} | Voice AI: {settings.VOICE_AI_PROVIDER}")
    logger.info(f"Configured CORS Origins: {settings.ALLOWED_ORIGINS}")
    yield
    logger.info(f"Shutting down {settings.APP_NAME}")


def create_application() -> FastAPI:
    """Factory function for enterprise FastAPI application instance."""
    app = FastAPI(
        title="AI Call Agent Enterprise Platform",
        description="Production-oriented AI Virtual Receptionist, Bilingual Dialogue Engine, and Multi-Signal Fraud Shield API",
        version=settings.APP_VERSION,
        docs_url="/docs" if settings.ENVIRONMENT != "production" else None,
        redoc_url="/redoc" if settings.ENVIRONMENT != "production" else None,
        openapi_url="/openapi.json" if settings.ENVIRONMENT != "production" else None,
        lifespan=lifespan,
    )

    # 1. Register OWASP Security Headers Middleware
    app.add_middleware(SecurityHeadersMiddleware)

    # 2. Register Request ID Tracing Middleware
    app.add_middleware(RequestCorrelationMiddleware)

    # 3. Register Sliding Window Rate Limiting Middleware
    app.add_middleware(RateLimitingMiddleware)

    # 4. Register CORS Middleware with strict configured origins
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.ALLOWED_ORIGINS,
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
        allow_headers=["*"],
    )

    # Register centralized exception handlers
    register_exception_handlers(app)

    # Root health, readiness and metrics endpoints for scrapers and orchestrators
    app.include_router(root_health_router)
    app.include_router(root_ready_router)
    app.include_router(root_metrics_router)

    # Versioned API routes under /api/v1
    app.include_router(api_v1_router, prefix=settings.API_V1_PREFIX)

    return app


app = create_application()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG,
    )
