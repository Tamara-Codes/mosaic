"""
Application configuration
"""
import os
from dotenv import load_dotenv

load_dotenv()

# CORS settings
# Get CORS origins from environment variable (comma separated)
env_origins = os.getenv("CORS_ORIGINS", "")
additional_origins = [origin.strip() for origin in env_origins.split(",") if origin.strip()]

CORS_ORIGINS = [
    "http://localhost:5173",
    "http://localhost:5174",
    "http://localhost:5175",
    "http://localhost:5181",
    "http://localhost:3000",
    "https://mos-a-ic-livid.vercel.app",
    "https://mos-a-ic-git-main-tamaras-projects-5517455e.vercel.app",
    "https://*.vercel.app",
] + additional_origins

# Gemini (AI provider for translations)
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

# Menu URL for QR codes
MENU_URL = os.getenv("MENU_URL", "http://localhost:5181")

# Supported languages
DEFAULT_SUPPORTED_LANGUAGES = {
    "en": "English",
    "de": "German",
    "it": "Italian",
    "fr": "French",
    "es": "Spanish",
    "sl": "Slovenian",
    "cs": "Czech",
    "pl": "Polish",
    "hu": "Hungarian",
    "zh": "Chinese"
}

LANGUAGES_FILE = "supported_languages.json"

