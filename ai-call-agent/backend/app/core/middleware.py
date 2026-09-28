"""Enterprise Middleware: Request Correlation ID, Security Headers, and Rate Limiting."""

import time
import uuid
from typing import Dict, Tuple
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from app.core.logging import logger


class RequestCorrelationMiddleware(BaseHTTPMiddleware):
    """
    Attaches a unique RFC4122 correlation ID (X-Request-ID) to every HTTP request.
    Enables distributed tracing across logs, microservices, and client headers.
    """

    async def dispatch(self, request: Request, call_next) -> Response:
        request_id = request.headers.get("X-Request-ID") or str(uuid.uuid4())
        start_time = time.perf_counter()

        # Attach request_id to request state for access in endpoints
        request.state.request_id = request_id

        response = await call_next(request)

        duration_ms = round((time.perf_counter() - start_time) * 1000, 2)
        response.headers["X-Request-ID"] = request_id
        response.headers["X-Response-Time-MS"] = str(duration_ms)

        logger.info(
            f"[{request.method}] {request.url.path} -> {response.status_code} ({duration_ms}ms) | ID: {request_id}"
        )
        return response


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """
    Applies OWASP enterprise recommended HTTP security headers.
    """

    async def dispatch(self, request: Request, call_next) -> Response:
        response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Cache-Control"] = "no-store, no-cache, must-revalidate, max-age=0"
        return response


class SlidingWindowRateLimiter:
    """
    In-memory sliding window rate limiter.
    Limits requests per IP address per sliding minute window.
    """

    def __init__(self, requests_per_minute: int = 120):
        self.requests_per_minute = requests_per_minute
        self.history: Dict[str, list] = {}

    def is_allowed(self, client_ip: str) -> Tuple[bool, int]:
        now = time.time()
        window_start = now - 60.0

        if client_ip not in self.history:
            self.history[client_ip] = []

        # Prune old timestamps
        self.history[client_ip] = [ts for ts in self.history[client_ip] if ts > window_start]

        if len(self.history[client_ip]) >= self.requests_per_minute:
            return False, len(self.history[client_ip])

        self.history[client_ip].append(now)
        return True, len(self.history[client_ip])


rate_limiter = SlidingWindowRateLimiter(requests_per_minute=180)


class RateLimitingMiddleware(BaseHTTPMiddleware):
    """Enforces sliding window rate limit per client IP."""

    async def dispatch(self, request: Request, call_next) -> Response:
        # Exempt health probes
        if request.url.path in ["/health", "/api/v1/health"]:
            return await call_next(request)

        client_ip = request.client.host if request.client else "127.0.0.1"
        allowed, count = rate_limiter.is_allowed(client_ip)

        if not allowed:
            logger.warning(f"Rate limit exceeded for IP {client_ip} on path {request.url.path}")
            return Response(
                content='{"error":{"code":"RATE_LIMIT_EXCEEDED","message":"Too many requests. Please slow down."}}',
                status_code=429,
                media_type="application/json",
            )

        response = await call_next(request)
        response.headers["X-RateLimit-Limit"] = "180"
        response.headers["X-RateLimit-Remaining"] = str(max(0, 180 - count))
        return response
