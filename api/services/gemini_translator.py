"""
Gemini AI translation service for restaurant menu items
"""
import google.generativeai as genai
from api.core.config import GEMINI_API_KEY
import json
import logging

logger = logging.getLogger(__name__)

genai.configure(api_key=GEMINI_API_KEY)

def translate_menu_item(name_hr: str, description_hr: str, target_language: str, language_name: str) -> dict:
    """
    Translate a menu item from Croatian to the target language using Gemini.

    Args:
        name_hr: Croatian name of the menu item
        description_hr: Croatian description of the menu item
        target_language: Target language code (e.g., 'en', 'de', 'zh')
        language_name: Full name of the target language (e.g., 'English', 'Chinese')

    Returns:
        Dictionary with 'name' and 'description' keys containing translations
    """
    model = genai.GenerativeModel('gemini-2.5-flash-lite')

    prompt = f"""Translate the following restaurant menu item from Croatian to {language_name}.
Keep the translation natural and appetizing for a restaurant menu.

Croatian Name: {name_hr}
Croatian Description: {description_hr or ''}

Respond with ONLY valid JSON in this exact format:
{{"name": "translated name", "description": "translated description"}}"""

    try:
        logger.debug(f"Calling Gemini API to translate item '{name_hr}' to {language_name}")
        response = model.generate_content(
            prompt,
            generation_config={"temperature": 0.3}
        )
        result = json.loads(response.text)
        logger.debug(f"Gemini translation successful: '{name_hr}' -> '{result.get('name')}'")
        return result
    except Exception as e:
        logger.error(f"Gemini API error translating item '{name_hr}': {str(e)}")
        raise

def translate_category(name: str, target_language: str, language_name: str) -> dict:
    """
    Translate a category name from Croatian to the target language using Gemini.

    Args:
        name: Croatian category name
        target_language: Target language code (e.g., 'en', 'de', 'zh')
        language_name: Full name of the target language (e.g., 'English', 'Chinese')

    Returns:
        Dictionary with 'name' key containing the translation
    """
    model = genai.GenerativeModel('gemini-2.5-flash-lite')

    prompt = f"""Translate the following restaurant menu category name from Croatian to {language_name}.
Keep the translation natural and appropriate for a restaurant menu category.

Croatian Category Name: {name}

Respond with ONLY valid JSON in this exact format:
{{"name": "translated category name"}}"""

    try:
        logger.debug(f"Calling Gemini API to translate category '{name}' to {language_name}")
        response = model.generate_content(
            prompt,
            generation_config={"temperature": 0.3}
        )
        result = json.loads(response.text)
        logger.debug(f"Gemini translation successful: '{name}' -> '{result.get('name')}'")
        return result
    except Exception as e:
        logger.error(f"Gemini API error translating category '{name}': {str(e)}")
        raise

def translate_batch(items: list, categories: list, target_language: str, language_name: str,
                   restaurant_description: str = None, ui_texts: dict = None) -> dict:
    """
    Translate all menu items, categories, restaurant description, and UI texts in a single API call.
    """
    model = genai.GenerativeModel('gemini-2.5-flash-lite')  # Using 2.5-flash-lite for better speed

    try:
        count_msg = f"{len(items)} items, {len(categories)} categories"
        if restaurant_description:
            count_msg += ", restaurant description"
        if ui_texts:
            count_msg += f", {len(ui_texts)} UI texts"
        logger.info(f"Calling Gemini API for batch translation: {count_msg} to {language_name}")

        # Build data structure
        items_json = [{"id": item['id'], "name_hr": item['name_hr'], "description_hr": item.get('description_hr', '')} for item in items]
        categories_json = [{"id": cat['id'], "name": cat['name']} for cat in categories]

        data = {"items": items_json, "categories": categories_json}
        if restaurant_description:
            data["restaurant_description"] = restaurant_description
        if ui_texts:
            data["ui_texts"] = ui_texts

        prompt = f"""Translate this Croatian restaurant menu to {language_name}. Return ONLY the JSON with translated values.

Input:
{json.dumps(data, ensure_ascii=False)}

Output format:
{{
  "items": [{{"id": "keep_same", "name": "translated", "description": "translated"}}, ...],
  "categories": [{{"id": "keep_same", "name": "translated"}}, ...]"""

        if restaurant_description:
            prompt += """,
  "restaurant_description": "translated\""""
        if ui_texts:
            prompt += """,
  "ui_texts": {{"key": "translated", ...}}"""
        prompt += "\n}"

        import time

        # Log prompt size
        prompt_size = len(prompt)
        logger.info(f"📝 Prompt size: {prompt_size} chars (~{prompt_size//4} tokens)")

        # Time the API call
        start = time.time()
        logger.info(f"⏳ Sending request to Gemini API...")

        response = model.generate_content(
            prompt,
            generation_config={"temperature": 0.2}
        )

        api_elapsed = time.time() - start
        logger.info(f"✅ Gemini API responded in {api_elapsed:.2f}s")

        # Time JSON parsing
        parse_start = time.time()
        result = json.loads(response.text)
        parse_elapsed = time.time() - parse_start

        total_elapsed = time.time() - start
        logger.info(f"🎯 Total: {total_elapsed:.2f}s (API: {api_elapsed:.2f}s, parsing: {parse_elapsed:.3f}s)")
        return result
    except Exception as e:
        logger.error(f"Gemini API error during batch translation to {language_name}: {str(e)}")
        raise
