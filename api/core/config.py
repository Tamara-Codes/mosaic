"""
Application configuration
"""
import os
from dotenv import load_dotenv

load_dotenv()

# CORS settings
# SECURITY: Explicit origin list - no wildcards for security
# Get CORS origins from environment variable (comma separated)
env_origins = os.getenv("CORS_ORIGINS", "")
additional_origins = [origin.strip() for origin in env_origins.split(",") if origin.strip()]

# Base allowed origins
BASE_CORS_ORIGINS = [
    "https://ferros.menu",
    "https://www.ferros.menu",
]

# Development origins (only in dev mode)
DEV_CORS_ORIGINS = [
    "http://localhost:5173",
    "http://localhost:5174",
    "http://localhost:5175",
    "http://localhost:5180",
    "http://localhost:5181",
    "http://localhost:3000",
    "http://localhost:8000",
]

# Determine if we're in development
is_dev = os.getenv("ENVIRONMENT", "production").lower() in ["development", "dev", "local"]

# Build final CORS origins list
if is_dev:
    CORS_ORIGINS = BASE_CORS_ORIGINS + DEV_CORS_ORIGINS + additional_origins
else:
    # Production: only allow explicit origins
    CORS_ORIGINS = BASE_CORS_ORIGINS + additional_origins

# SECURITY: Remove any invalid origins (wildcards, http in production, etc.)
CORS_ORIGINS = [
    origin for origin in CORS_ORIGINS
    if origin and not origin.startswith("*")  # No wildcards
    and (is_dev or origin.startswith("https://"))  # HTTPS only in production
]

# Gemini (AI provider for translations)
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

# Menu URL for QR codes - should point to the public menu domain
MENU_URL = os.getenv("MENU_URL", "http://localhost:5180")



