"""
WhatsApp Business API integration service.
Handles webhook verification, incoming messages, and sending replies.
"""
import logging
from typing import Optional, Tuple

import httpx

from core.config import WHATSAPP_ACCESS_TOKEN, WHATSAPP_PHONE_NUMBER_ID, WHATSAPP_VERIFY_TOKEN
from core.supabase_client import get_supabase_client

logger = logging.getLogger(__name__)

GRAPH_API_URL = f"https://graph.facebook.com/v21.0/{WHATSAPP_PHONE_NUMBER_ID}/messages"

# In-memory conversation history keyed by phone number (last 5 exchanges)
_conversation_cache: dict[str, list[dict[str, str]]] = {}
MAX_HISTORY = 5


def verify_webhook(mode: Optional[str], token: Optional[str], challenge: Optional[str]) -> Optional[str]:
    """
    Verify Meta webhook subscription.
    Returns the challenge string if verification succeeds, None otherwise.
    """
    if mode == "subscribe" and token == WHATSAPP_VERIFY_TOKEN:
        logger.info("WhatsApp webhook verified successfully")
        return challenge
    logger.warning("WhatsApp webhook verification failed (mode=%s)", mode)
    return None


def parse_incoming_message(payload: dict) -> Optional[Tuple[str, str]]:
    """
    Extract sender phone number and message text from a WhatsApp webhook payload.
    Returns (phone_number, message_text) or None if the payload doesn't contain a text message.
    """
    try:
        entry = payload.get("entry", [])
        if not entry:
            return None
        changes = entry[0].get("changes", [])
        if not changes:
            return None
        value = changes[0].get("value", {})
        messages = value.get("messages", [])
        if not messages:
            return None

        msg = messages[0]
        if msg.get("type") != "text":
            return None

        phone = msg["from"]
        text = msg["text"]["body"]
        return phone, text
    except (KeyError, IndexError):
        logger.exception("Failed to parse WhatsApp webhook payload")
        return None


async def send_whatsapp_message(to: str, message: str) -> bool:
    """Send a text message via the WhatsApp Cloud API."""
    headers = {
        "Authorization": f"Bearer {WHATSAPP_ACCESS_TOKEN}",
        "Content-Type": "application/json",
    }
    body = {
        "messaging_product": "whatsapp",
        "to": to,
        "type": "text",
        "text": {"body": message},
    }
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.post(GRAPH_API_URL, json=body, headers=headers, timeout=15)
            resp.raise_for_status()
            logger.info("WhatsApp message sent to %s", to)
            return True
    except httpx.HTTPError:
        logger.exception("Failed to send WhatsApp message to %s", to)
        return False


def lookup_restaurant_by_whatsapp(phone: str) -> Optional[dict]:
    """
    Find a restaurant whose whatsapp_phone matches the given number.
    Tries exact match first, then normalized (digits-only) comparison.
    """
    supabase = get_supabase_client()

    # Exact match
    result = supabase.table("restaurants").select("*").eq("whatsapp_phone", phone).execute()
    if result.data:
        return result.data[0]

    # Try with '+' prefix (Meta sends numbers without '+')
    if not phone.startswith("+"):
        result = supabase.table("restaurants").select("*").eq("whatsapp_phone", f"+{phone}").execute()
        if result.data:
            return result.data[0]

    return None


def get_conversation_history(phone: str) -> list[dict[str, str]]:
    """Return the cached conversation history for a phone number."""
    return _conversation_cache.get(phone, [])


def update_conversation_history(phone: str, user_message: str, assistant_message: str) -> None:
    """Append a user/assistant exchange and keep only the last MAX_HISTORY exchanges."""
    history = _conversation_cache.get(phone, [])
    history.append({"role": "user", "content": user_message})
    history.append({"role": "assistant", "content": assistant_message})
    # Keep last MAX_HISTORY * 2 messages (each exchange = 2 messages)
    _conversation_cache[phone] = history[-(MAX_HISTORY * 2):]
