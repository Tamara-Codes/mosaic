from app.services.clerk_webhook import ClerkWebhookHandler
from fastapi import APIRouter
from fastapi import Request

router = APIRouter()
handler = ClerkWebhookHandler()


@router.post("/webhooks/clerk")
async def webhook_handler(request: Request):
    return await handler.handle_webhook(request)
