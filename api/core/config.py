"""
Application configuration
"""
import os
from dotenv import load_dotenv

load_dotenv()

# CORS settings
CORS_ORIGINS = [
    "http://localhost:5173",
    "http://localhost:5174",
    "http://localhost:3000",
    "https://mos-a-ic-livid.vercel.app",
    "https://mos-a-ic-git-main-tamaras-projects-5517455e.vercel.app",
    "https://*.vercel.app",  # Allow all Vercel preview deployments
]

# OpenAI
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

# Menu URL for QR codes
MENU_URL = os.getenv("MENU_URL", "http://localhost:5173")

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
    "hu": "Hungarian"
}

LANGUAGES_FILE = "supported_languages.json"

