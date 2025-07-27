from app.services.clerk_webhook import ClerkWebhookHandler
from fastapi import APIRouter
from fastapi import Request
from app.core.config import supabase, CLERK_WEBHOOK_SECRET

router = APIRouter()
handler = ClerkWebhookHandler(supabase, CLERK_WEBHOOK_SECRET)



@router.post("/webhooks/clerk")
async def webhook_handler(request: Request):
    return await handler.handle_webhook(request)
