"""
Rate limiting middleware for FastAPI
Simple in-memory rate limiter (for production, consider Redis-based solution)
"""
from fastapi import Request, HTTPException
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse
from collections import defaultdict
from time import time
from typing import Dict, Tuple
import os


class RateLimiterMiddleware(BaseHTTPMiddleware):
    """
    Rate limiting middleware
    Uses in-memory storage (simple but not distributed)
    For production at scale, use Redis-based rate limiting
    """
    
    def __init__(self, app, default_limit: int = 100, default_window: int = 60):
        super().__init__(app)
        self.default_limit = default_limit
        self.default_window = default_window
        self.requests: Dict[str, list] = defaultdict(list)
        
        # Per-endpoint limits (requests per window)
        self.endpoint_limits = {
            "/api/v1/contact": (3, 3600),  # 3 per hour for contact form
            "/api/v1/translations/generate": (10, 60),  # 10 per minute for AI translations
            "/api/v1/languages/add": (2, 3600),  # 2 per hour for adding languages
            "/webhooks/clerk": (100, 60),  # 100 per minute for webhooks
        }
    
    def _get_client_id(self, request: Request) -> str:
        """Get client identifier (IP address or user ID)"""
        # Try to get user ID from auth token if available
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            # For authenticated users, we could extract user ID
            # For now, use IP + path for better granularity
            pass
        
        # Use IP address
        forwarded = request.headers.get("X-Forwarded-For")
        if forwarded:
            # X-Forwarded-For can contain multiple IPs, take the first one
            ip = forwarded.split(",")[0].strip()
        else:
            ip = request.client.host if request.client else "unknown"
        
        # Include path for per-endpoint limiting
        path = request.url.path
        return f"{ip}:{path}"
    
    def _is_rate_limited(self, client_id: str, limit: int, window: int) -> Tuple[bool, int]:
        """
        Check if client is rate limited
        Returns: (is_limited, remaining_requests)
        """
        now = time()
        window_start = now - window
        
        # Clean old requests outside the window
        self.requests[client_id] = [
            req_time for req_time in self.requests[client_id]
            if req_time > window_start
        ]
        
        # Check limit
        request_count = len(self.requests[client_id])
        
        if request_count >= limit:
            return True, 0
        
        # Add current request
        self.requests[client_id].append(now)
        remaining = limit - request_count - 1
        
        return False, remaining
    
    async def dispatch(self, request: Request, call_next):
        # Skip rate limiting in development (optional)
        is_dev = os.getenv("ENVIRONMENT", "production").lower() in ["development", "dev", "local"]
        skip_rate_limit = os.getenv("SKIP_RATE_LIMIT", "false").lower() == "true"
        
        if is_dev and skip_rate_limit:
            return await call_next(request)
        
        client_id = self._get_client_id(request)
        path = request.url.path
        
        # Get limit for this endpoint or use default
        limit, window = self.endpoint_limits.get(path, (self.default_limit, self.default_window))
        
        # Check rate limit
        is_limited, remaining = self._is_rate_limited(client_id, limit, window)
        
        if is_limited:
            return JSONResponse(
                status_code=429,
                content={
                    "error": "Too many requests",
                    "message": f"Rate limit exceeded. Please try again later.",
                    "retry_after": window
                },
                headers={
                    "X-RateLimit-Limit": str(limit),
                    "X-RateLimit-Remaining": "0",
                    "X-RateLimit-Reset": str(int(time() + window)),
                    "Retry-After": str(window)
                }
            )
        
        # Add rate limit headers to response
        response = await call_next(request)
        response.headers["X-RateLimit-Limit"] = str(limit)
        response.headers["X-RateLimit-Remaining"] = str(remaining)
        response.headers["X-RateLimit-Reset"] = str(int(time() + window))
        
        return response

