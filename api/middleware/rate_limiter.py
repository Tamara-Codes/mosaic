"""
Rate limiting middleware for FastAPI.
Uses Upstash Redis so limits are shared across all serverless instances.

Only two endpoints are limited:
  - /api/v1/generate-image  : 20 per day   (DALL-E costs real money)
  - /api/v1/contact         : 5 per hour   (spam protection)
"""
import logging
import os
from datetime import datetime, timezone
from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse
from upstash_redis import Redis

logger = logging.getLogger(__name__)

# Endpoints to limit: path -> (max_requests, window_seconds, window_label)
LIMITS = {
    "/api/v1/generate-image": (20, 86400, "day"),
    "/api/v1/contact":        (10, 3600,  "hour"),
}


def _get_redis() -> Redis:
    url   = os.environ["UPSTASH_REDIS_REST_URL"]
    token = os.environ["UPSTASH_REDIS_REST_TOKEN"]
    return Redis(url=url, token=token)


def _window_key(path: str, ip: str, window_seconds: int) -> str:
    """
    Build a Redis key that changes once per window.
    For a daily window: key changes each UTC day.
    For an hourly window: key changes each UTC hour.
    """
    now = datetime.now(timezone.utc)
    if window_seconds >= 86400:
        slot = now.strftime("%Y%m%d")
    else:
        slot = now.strftime("%Y%m%d%H")
    safe_path = path.strip("/").replace("/", "_")
    return f"rl:{safe_path}:{ip}:{slot}"


class RateLimiterMiddleware(BaseHTTPMiddleware):

    async def dispatch(self, request: Request, call_next):
        path = request.url.path

        if path not in LIMITS:
            return await call_next(request)

        limit, window, window_label = LIMITS[path]

        # Resolve client IP
        forwarded = request.headers.get("X-Forwarded-For")
        ip = forwarded.split(",")[0].strip() if forwarded else (
            request.client.host if request.client else "unknown"
        )

        key = _window_key(path, ip, window)

        try:
            redis = _get_redis()
            count = redis.incr(key)
            if count == 1:
                redis.expire(key, window)
        except Exception:
            logger.exception("Rate limiter Redis error — allowing request through")
            return await call_next(request)

        if count > limit:
            return JSONResponse(
                status_code=429,
                content={
                    "error": "Too many requests",
                    "message": f"Limit of {limit} requests per {window_label} exceeded. Try again later.",
                },
                headers={
                    "X-RateLimit-Limit":     str(limit),
                    "X-RateLimit-Remaining": "0",
                    "Retry-After":           str(window),
                },
            )

        response = await call_next(request)
        response.headers["X-RateLimit-Limit"]     = str(limit)
        response.headers["X-RateLimit-Remaining"] = str(max(0, limit - count))
        return response
