"""
Language management services
"""
import os
import json
from core.config import DEFAULT_SUPPORTED_LANGUAGES, LANGUAGES_FILE

def load_supported_languages():
    """Load supported languages from file or use default"""
    try:
        if os.path.exists(LANGUAGES_FILE):
            with open(LANGUAGES_FILE, 'r', encoding='utf-8') as f:
                return json.load(f)
        return DEFAULT_SUPPORTED_LANGUAGES.copy()
    except:
        return DEFAULT_SUPPORTED_LANGUAGES.copy()

def save_supported_languages(languages):
    """Save supported languages to file"""
    try:
        with open(LANGUAGES_FILE, 'w', encoding='utf-8') as f:
            json.dump(languages, f, ensure_ascii=False, indent=2)
        return True
    except:
        return False

