"""
FastAPI application using Supabase for data persistence
This replaces the old SQLite-based main.py
"""
import sys
import os
from pathlib import Path

# Add the api directory to Python path for Vercel
api_dir = Path(__file__).parent
sys.path.insert(0, str(api_dir))

from fastapi import FastAPI, Depends, HTTPException, UploadFile, File, Form, Header, Request, Body
from fastapi.responses import JSONResponse, PlainTextResponse
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Optional
import json
import qrcode
from io import BytesIO
import base64
from dotenv import load_dotenv
import logging
from core.supabase_client import get_supabase_client, get_supabase_anon_client
from slugify import slugify
from utils.storage_utils import upload_image_to_storage, delete_image_from_storage, get_image_url

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Suppress httpx INFO logs (only show WARNING and above)
logging.getLogger('httpx').setLevel(logging.WARNING)

from core.config import CORS_ORIGINS, MENU_URL
from services.auth import get_clerk_user_email, get_restaurant_by_clerk_user, require_auth
from services.webhooks import verify_signature, handle_user_created, handle_user_deleted
from services.gemini_translator import translate_menu_item, translate_category, translate_batch
from services.email_service import send_vip_form_email
from services.language_service import get_all_languages, get_restaurant_languages, add_restaurant_language, remove_restaurant_language
from services.image_generator import generate_food_image
from services.chatbot_agent import process_chat_message
from services.whatsapp import (
    verify_payload_signature as whatsapp_verify_signature,
    verify_webhook as whatsapp_verify_webhook,
    parse_incoming_message,
    send_whatsapp_message,
    send_whatsapp_template,
    lookup_restaurant_by_whatsapp,
    get_conversation_history,
    update_conversation_history,
)

# SECURITY: Import security middleware
from middleware.security_headers import SecurityHeadersMiddleware
from middleware.rate_limiter import RateLimiterMiddleware
from schemas.contact import VIPFormRequest

app = FastAPI(
    title="Restaurant Menu API",
    description="Multi-tenant restaurant menu management system",
    version="1.0.0",
    # SECURITY: Set maximum request size (10MB for file uploads)
    max_request_size=10 * 1024 * 1024,  # 10MB
)

# SECURITY: Add security headers middleware (must be first)
app.add_middleware(SecurityHeadersMiddleware)

# SECURITY: Add rate limiting middleware
app.add_middleware(RateLimiterMiddleware, default_limit=100, default_window=60)

# CORS middleware
# SECURITY: Restricted headers and exposed headers for better security
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=[
        "Content-Type",
        "Authorization",
        "Accept",
        "Origin",
        "X-Requested-With",
    ],
    expose_headers=[
        "Content-Type",
        "Content-Length",
        "X-RateLimit-Limit",
        "X-RateLimit-Remaining",
        "X-RateLimit-Reset",
    ],
)

# Catch-all OPTIONS handler for CORS preflight
@app.options("/{full_path:path}")
async def options_handler(full_path: str):
    """Handle all OPTIONS requests for CORS preflight"""
    return JSONResponse(content={}, status_code=200)

@app.get("/")
async def root():
    """Root endpoint - API info"""
    return JSONResponse({"message": "API is running. Use the React frontend at http://localhost:5173"})

@app.post("/webhooks/clerk")
async def clerk_webhook(request: Request):
    """Handle Clerk webhook events"""
    body = await request.body()
    
    # Verify signature
    if not verify_signature(request.headers, body):
        raise HTTPException(status_code=401, detail="Invalid webhook signature")
    
    # Parse event
    event = json.loads(body.decode('utf-8'))
    event_type = event.get("type")
    event_data = event.get("data", {})
    
    # Handle events
    if event_type == "user.created":
        result = await handle_user_created(event_data)
        return JSONResponse(result)
    elif event_type == "user.deleted":
        result = await handle_user_deleted(event_data)
        return JSONResponse(result)
    elif event_type == "user.updated":
        return JSONResponse({"message": "User updated", "handled": False})
    else:
        return JSONResponse({"message": f"Event {event_type} not handled", "handled": False})

# Public Menu Endpoint - Returns menu data + theme_identifier
@app.get("/api/v1/menu/{restaurant_slug}")
async def get_public_menu(restaurant_slug: str):
    """
    Public endpoint to get menu for a restaurant
    Returns: menu items, restaurant info, and theme_identifier
    """
    logger.info(f"Fetching public menu for restaurant: {restaurant_slug}")
    supabase = get_supabase_anon_client()

    # Get restaurant by slug
    restaurant_result = supabase.table('restaurants').select('*').eq('slug', restaurant_slug).execute()

    if not restaurant_result.data:
        logger.warning(f"Restaurant not found: {restaurant_slug}")
        raise HTTPException(status_code=404, detail="Restoran nije pronađen")

    restaurant = restaurant_result.data[0]
    logger.info(f"Found restaurant {restaurant['name']} (id: {restaurant['id']})")

    # Get all available menu items for the restaurant
    menu_items_result = supabase.table('menu_items').select('*').eq('restaurant_id', restaurant['id']).eq('is_available', True).order('name_hr').execute()
    menu_items = menu_items_result.data

    # Batch fetch ALL translations for these items (1 query instead of N)
    item_ids = [item['id'] for item in menu_items]
    all_translations = []
    if item_ids:
        translations_result = supabase.table('translations').select('*').in_('menu_item_id', item_ids).execute()
        all_translations = translations_result.data

    # Group translations by menu_item_id
    translations_by_item = {}
    for trans in all_translations:
        item_id = trans['menu_item_id']
        if item_id not in translations_by_item:
            translations_by_item[item_id] = []
        translations_by_item[item_id].append(trans)

    # Attach translations to each item
    for item in menu_items:
        item['translations'] = translations_by_item.get(item['id'], [])
        # Ensure image_path is a full public URL if it exists
        if item.get('image_path'):
            item['image_path'] = get_image_url(item['image_path'])

    # Get categories (all categories for the restaurant)
    categories_result = supabase.table('categories').select('*').eq('restaurant_id', restaurant['id']).order('order_index').execute()
    categories = categories_result.data

    # Batch fetch ALL category translations (1 query instead of M)
    category_ids = [cat['id'] for cat in categories]
    all_cat_translations = []
    if category_ids:
        cat_translations_result = supabase.table('category_translations').select('*').in_('category_id', category_ids).execute()
        all_cat_translations = cat_translations_result.data

    # Group category translations by category_id
    cat_translations_by_id = {}
    for trans in all_cat_translations:
        cat_id = trans['category_id']
        if cat_id not in cat_translations_by_id:
            cat_translations_by_id[cat_id] = []
        cat_translations_by_id[cat_id].append(trans)

    # Attach category translations to each category
    for category in categories:
        category['category_translations'] = cat_translations_by_id.get(category['id'], [])

    # Get restaurant description translations
    restaurant_translations_result = supabase.table('restaurant_translations').select('*').eq('restaurant_id', restaurant['id']).execute()
    restaurant_translations = restaurant_translations_result.data

    # Get UI translations (food, drink, etc.)
    ui_translations_result = supabase.table('ui_translations').select('*').eq('restaurant_id', restaurant['id']).execute()
    ui_translations = ui_translations_result.data

    return JSONResponse({
        "restaurant": {
            "id": restaurant['id'],
            "name": restaurant['name'],
            "slug": restaurant['slug'],
            "description": restaurant['description'],
            "address": restaurant['address'],
            "phone": restaurant['phone'],
            # SECURITY: Email removed from public endpoint to prevent harvesting
            # Email is only available in authenticated endpoints
            "logo_url": restaurant.get('logo_url'),
            "theme_identifier": restaurant['theme_identifier'],
            "description_translations": restaurant_translations
        },
        "menu_items": menu_items,
        "categories": categories,
        "ui_translations": ui_translations
    })

# Preview Menu Endpoint - Get menu for a specific date (for preview)
# Public Restaurant Info Endpoint
@app.get("/api/v1/restaurant/{restaurant_slug}")
async def get_restaurant_public(restaurant_slug: str):
    """Get restaurant information (public)"""
    supabase = get_supabase_anon_client()
    
    restaurant_result = supabase.table('restaurants').select('*').eq('slug', restaurant_slug).execute()
    
    if not restaurant_result.data:
        raise HTTPException(status_code=404, detail="Restoran nije pronađen")
    
    restaurant = restaurant_result.data[0]
    
    return JSONResponse({
        "id": restaurant['id'],
        "name": restaurant['name'],
        "slug": restaurant['slug'],
        "description": restaurant['description'],
        "address": restaurant['address'],
        "phone": restaurant['phone'],
        # SECURITY: Email removed from public endpoint
        "theme_identifier": restaurant['theme_identifier']
    })

# Sitemap Endpoint
@app.get("/sitemap.xml")
@app.get("/api/sitemap.xml")
async def generate_sitemap():
    """Generate sitemap.xml with all public restaurant pages"""
    from fastapi.responses import Response
    from datetime import datetime
    
    supabase = get_supabase_anon_client()
    base_url = os.getenv("MENU_URL", "https://ferros.menu")
    
    # Get all restaurants with slugs
    restaurants_result = supabase.table('restaurants').select('slug, updated_at').execute()
    restaurants = restaurants_result.data if restaurants_result.data else []
    
    # Generate sitemap XML
    sitemap = '<?xml version="1.0" encoding="UTF-8"?>\n'
    sitemap += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
    
    # Add homepage
    sitemap += '  <url>\n'
    sitemap += f'    <loc>{base_url}/</loc>\n'
    sitemap += '    <changefreq>weekly</changefreq>\n'
    sitemap += '    <priority>1.0</priority>\n'
    sitemap += '  </url>\n'
    
    # Add each restaurant page
    for restaurant in restaurants:
        if restaurant.get('slug'):
            updated_at = restaurant.get('updated_at', datetime.now().isoformat())
            # Format date for sitemap (YYYY-MM-DD)
            lastmod = updated_at.split('T')[0] if 'T' in str(updated_at) else str(updated_at)[:10]
            
            sitemap += '  <url>\n'
            sitemap += f'    <loc>{base_url}/{restaurant["slug"]}</loc>\n'
            sitemap += f'    <lastmod>{lastmod}</lastmod>\n'
            sitemap += '    <changefreq>weekly</changefreq>\n'
            sitemap += '    <priority>0.8</priority>\n'
            sitemap += '  </url>\n'
    
    sitemap += '</urlset>'
    
    return Response(content=sitemap, media_type="application/xml")

# Public VIP Form Endpoint
# Admin Endpoints for Orders and Messages
# Restaurant Info Endpoints (Authenticated)
@app.get("/api/v1/restaurant-info")
async def get_restaurant_info(clerk_user_id: str = Depends(require_auth), authorization: Optional[str] = Header(None)):
    """Get restaurant information for authenticated user"""
    logger.info(f"=== Restaurant Info Request for Clerk User: {clerk_user_id} ===")
    supabase = get_supabase_client()
    restaurant = await get_restaurant_by_clerk_user(clerk_user_id)
    
    # If not found by clerk_user_id, try to link by email from Clerk user
    if not restaurant:
        logger.info(f"No restaurant found for clerk_user_id: {clerk_user_id}")
        
        # Get user email from Clerk API (JWT doesn't contain email)
        user_email = await get_clerk_user_email(clerk_user_id)
        
        if user_email:
            # Find restaurant by email (that doesn't have a clerk_user_id yet)
            restaurants = supabase.table('restaurants').select('*').eq('email', user_email).execute()
            
            available = [r for r in (restaurants.data or []) if not r.get('clerk_user_id')]
            
            if available:
                # Link the restaurant to this Clerk user
                result = supabase.table('restaurants').update({
                    'clerk_user_id': clerk_user_id
                }).eq('id', available[0]['id']).execute()
                
                if result.data:
                    restaurant = result.data[0]
                    logger.info(f"✅ Successfully linked restaurant {restaurant['name']} (ID: {restaurant['id']}) to Clerk user {clerk_user_id}")
                else:
                    logger.error(f"❌ Failed to link restaurant - no data returned from update")
            else:
                logger.warning(f"❌ No unlinked restaurant found for email: {user_email}")
        else:
            logger.error(f"❌ Could not fetch email from Clerk API for user {clerk_user_id}")
    else:
        logger.info(f"✅ Found existing restaurant: {restaurant['name']} (ID: {restaurant['id']})")
    
    if not restaurant:
        logger.error(f"❌ Final result: No restaurant found for user {clerk_user_id}")
        raise HTTPException(status_code=404, detail="Restoran nije pronađen. Kontaktirajte administratora da kreira restoran za vašu email adresu.")
    
    logger.info(f"=== Returning restaurant info for: {restaurant['name']} ===")
    return JSONResponse({
        "id": restaurant['id'],
        "name": restaurant['name'],
        "slug": restaurant['slug'],
        "description": restaurant['description'],
        "address": restaurant['address'],
        "phone": restaurant['phone'],
        "email": restaurant['email'],
        "theme_identifier": restaurant['theme_identifier'],
        "ai_image_prompt": restaurant.get('ai_image_prompt', ''),
        "whatsapp_phone": restaurant.get('whatsapp_phone', ''),
        "chatbot_system_prompt": restaurant.get('chatbot_system_prompt', '')
    })

@app.post("/api/v1/restaurant-info")
async def save_restaurant_info(
    name: str = Form(...),
    description: Optional[str] = Form(None),
    address: Optional[str] = Form(None),
    phone: Optional[str] = Form(None),
    email: Optional[str] = Form(None),
    theme_identifier: Optional[str] = Form(None),
    ai_image_prompt: Optional[str] = Form(None),
    whatsapp_phone: Optional[str] = Form(None),
    chatbot_system_prompt: Optional[str] = Form(None),
    clerk_user_id: str = Depends(require_auth)
):
    """Save or update restaurant information"""
    supabase = get_supabase_client()
    restaurant = await get_restaurant_by_clerk_user(clerk_user_id)
    
    # If restaurant not found by clerk_user_id, try to find by email (for linking)
    if not restaurant and email:
        email_match = supabase.table('restaurants').select('*').eq('email', email).execute()
        if email_match.data:
            # Found restaurant by email - link it to this user if it's not already linked
            restaurant_by_email = email_match.data[0]
            if not restaurant_by_email.get('clerk_user_id'):
                # Link it to this user
                supabase.table('restaurants').update({
                    'clerk_user_id': clerk_user_id
                }).eq('id', restaurant_by_email['id']).execute()
                restaurant = restaurant_by_email
            elif restaurant_by_email.get('clerk_user_id') == clerk_user_id:
                # Already linked to this user
                restaurant = restaurant_by_email
    
    # Restaurant must exist - users cannot create restaurants
    if not restaurant:
        raise HTTPException(
            status_code=404,
            detail=f"No restaurant found for your account. Please contact administrator to create a restaurant for email: {email or 'your email'}"
        )
    
    slug = slugify(name)
    
    # If restaurant exists, only update slug if it's different and available
    if restaurant:
        current_slug = restaurant.get('slug')
        if slug != current_slug:
            # Check if new slug is available
            existing = supabase.table('restaurants').select('id').eq('slug', slug).execute()
            if existing.data and existing.data[0]['id'] != restaurant['id']:
                # Slug is taken by another restaurant, keep current slug
                slug = current_slug
        
        update_data = {
            "name": name,
            "slug": slug,
            "description": description or "",
            "address": address or "",
            "phone": phone or "",
            "email": email or "",
        }
        
        if theme_identifier:
            update_data["theme_identifier"] = theme_identifier

        if ai_image_prompt is not None:
            update_data["ai_image_prompt"] = ai_image_prompt

        if whatsapp_phone is not None:
            update_data["whatsapp_phone"] = whatsapp_phone

        if chatbot_system_prompt is not None:
            update_data["chatbot_system_prompt"] = chatbot_system_prompt

        # Update existing
        result = supabase.table('restaurants').update(update_data).eq('id', restaurant['id']).execute()
        if not result.data:
            raise HTTPException(status_code=500, detail="Failed to update restaurant")

        # Send WhatsApp welcome template if phone number was added/changed
        if whatsapp_phone and whatsapp_phone != restaurant.get('whatsapp_phone'):
            phone_digits = whatsapp_phone.lstrip('+')
            await send_whatsapp_template(phone_digits, "welcome_connect")

        return JSONResponse(result.data[0])
    else:
        # This should never happen - restaurant should exist at this point
        # Restaurants must be created manually in Supabase by admin
        raise HTTPException(
            status_code=404,
            detail=f"No restaurant found for your account. Please contact administrator to create a restaurant for email: {email or 'your email'}"
        )

# Promotion Endpoints
@app.get("/api/v1/promotion")
async def get_promotion(clerk_user_id: str = Depends(require_auth)):
    """Get promotion for authenticated user's restaurant"""
    restaurant = await get_restaurant_by_clerk_user(clerk_user_id)
    if not restaurant:
        raise HTTPException(status_code=404, detail="Restoran nije pronađen")

    supabase = get_supabase_client()
    result = supabase.table('promotions').select('*').eq('restaurant_id', restaurant['id']).limit(1).execute()

    if not result.data:
        return JSONResponse(None)

    promotion = result.data[0]
    # If linked to a menu item, fetch the item details
    if promotion.get('menu_item_id'):
        item_result = supabase.table('menu_items').select('*').eq('id', promotion['menu_item_id']).execute()
        if item_result.data:
            item = item_result.data[0]
            if item.get('image_path'):
                from utils.storage_utils import get_image_url as get_img_url
                item['image_path'] = get_img_url(item['image_path'])
            promotion['menu_item'] = item

    return JSONResponse(promotion)


@app.post("/api/v1/promotion")
async def upsert_promotion(
    request: Request,
    clerk_user_id: str = Depends(require_auth)
):
    """Create or update promotion for authenticated user's restaurant"""
    restaurant = await get_restaurant_by_clerk_user(clerk_user_id)
    if not restaurant:
        raise HTTPException(status_code=404, detail="Restoran nije pronađen")

    body = await request.json()
    supabase = get_supabase_client()

    promotion_data = {
        "restaurant_id": restaurant['id'],
        "title": body.get("title", "Dnevna ponuda"),
        "menu_item_id": body.get("menu_item_id"),
        "custom_name": body.get("custom_name"),
        "custom_description": body.get("custom_description"),
        "custom_price": body.get("custom_price"),
        "image_url": body.get("image_url"),
        "is_active": body.get("is_active", False),
    }

    # Check if promotion already exists for this restaurant
    existing = supabase.table('promotions').select('id').eq('restaurant_id', restaurant['id']).execute()

    if existing.data:
        # Update existing
        result = supabase.table('promotions').update(promotion_data).eq('id', existing.data[0]['id']).execute()
    else:
        # Insert new
        result = supabase.table('promotions').insert(promotion_data).execute()

    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to save promotion")

    return JSONResponse(result.data[0])


@app.post("/api/v1/promotion/upload-image")
async def upload_promotion_image(
    image: UploadFile = File(...),
    clerk_user_id: str = Depends(require_auth)
):
    """Upload an image for a promotion"""
    restaurant = await get_restaurant_by_clerk_user(clerk_user_id)
    if not restaurant:
        raise HTTPException(status_code=404, detail="Restoran nije pronađen")

    # Validate file
    MAX_IMAGE_SIZE = 5 * 1024 * 1024
    content = await image.read()
    if len(content) > MAX_IMAGE_SIZE:
        raise HTTPException(status_code=413, detail="Image too large. Max 5MB.")
    await image.seek(0)

    allowed_types = ["image/jpeg", "image/jpg", "image/png", "image/webp"]
    if image.content_type not in allowed_types:
        raise HTTPException(status_code=400, detail="Invalid file type. Allowed: JPEG, PNG, WebP")

    import uuid as uuid_mod
    from utils.storage_utils import get_supabase_storage, BUCKET_NAME

    file_name = f"{uuid_mod.uuid4()}.png"
    file_path = f"{restaurant['id']}/promotions/{file_name}"

    storage = get_supabase_storage()
    storage.from_(BUCKET_NAME).upload(
        path=file_path,
        file=content,
        file_options={"content-type": image.content_type, "upsert": "false"}
    )
    public_url = storage.from_(BUCKET_NAME).get_public_url(file_path)

    return JSONResponse({"success": True, "image_url": public_url})


@app.get("/api/v1/menu/{restaurant_slug}/promotion")
async def get_public_promotion(restaurant_slug: str):
    """Public endpoint to get active promotion for a restaurant"""
    supabase = get_supabase_anon_client()

    # Get restaurant by slug
    restaurant_result = supabase.table('restaurants').select('id').eq('slug', restaurant_slug).execute()
    if not restaurant_result.data:
        raise HTTPException(status_code=404, detail="Restoran nije pronađen")

    restaurant_id = restaurant_result.data[0]['id']

    # Get active promotion
    result = supabase.table('promotions').select('*').eq('restaurant_id', restaurant_id).eq('is_active', True).limit(1).execute()

    if not result.data:
        return JSONResponse(None)

    promotion = result.data[0]

    # If linked to a menu item, fetch details
    if promotion.get('menu_item_id'):
        item_result = supabase.table('menu_items').select('*').eq('id', promotion['menu_item_id']).execute()
        if item_result.data:
            item = item_result.data[0]
            if item.get('image_path'):
                item['image_path'] = get_image_url(item['image_path'])
            promotion['menu_item'] = item

    return JSONResponse(promotion)


# AI Image Generation Endpoint
@app.post("/api/v1/generate-image")
async def generate_image(
    request: Request,
    clerk_user_id: str = Depends(require_auth)
):
    """Generate an AI food image using DALL-E 3"""
    restaurant = await get_restaurant_by_clerk_user(clerk_user_id)
    if not restaurant:
        raise HTTPException(status_code=404, detail="Restoran nije pronađen")

    body = await request.json()
    dish_name = body.get("dish_name", "").strip()
    dish_description = body.get("dish_description", "").strip()
    custom_style = body.get("custom_style", "").strip()

    if not dish_name:
        raise HTTPException(status_code=400, detail="Naziv jela je obavezan")

    restaurant_style = restaurant.get("ai_image_prompt", "")

    try:
        # Generate image with DALL-E 3
        temp_url = generate_food_image(dish_name, dish_description, custom_style, restaurant_style)

        # Download the temporary DALL-E image
        import httpx
        async with httpx.AsyncClient() as client:
            img_response = await client.get(temp_url)
            img_response.raise_for_status()
            image_bytes = img_response.content

        # Upload to Supabase Storage
        import uuid as uuid_mod
        file_name = f"{uuid_mod.uuid4()}.png"
        file_path = f"{restaurant['id']}/ai-generated/{file_name}"

        from utils.storage_utils import get_supabase_storage, BUCKET_NAME
        storage = get_supabase_storage()
        storage.from_(BUCKET_NAME).upload(
            path=file_path,
            file=image_bytes,
            file_options={"content-type": "image/png", "upsert": "false"}
        )
        public_url = storage.from_(BUCKET_NAME).get_public_url(file_path)

        return JSONResponse({"success": True, "image_url": public_url})

    except Exception as e:
        logger.error(f"Image generation failed: {e}")
        raise HTTPException(status_code=500, detail=f"Generiranje slike nije uspjelo: {str(e)}")

# Menu Items Endpoints (Authenticated)
@app.get("/api/v1/menu-items")
async def get_menu_items(clerk_user_id: str = Depends(require_auth)):
    """Get all menu items for authenticated user's restaurant"""
    restaurant = await get_restaurant_by_clerk_user(clerk_user_id)
    if not restaurant:
        raise HTTPException(status_code=404, detail="Restoran nije pronađen")
    
    supabase = get_supabase_client()
    result = supabase.table('menu_items').select('*').eq('restaurant_id', restaurant['id']).execute()
    return JSONResponse(result.data)

@app.post("/api/v1/menu-items")
async def create_menu_item(
    name_hr: str = Form(...),
    description_hr: Optional[str] = Form(None),
    price: float = Form(...),
    category_id: Optional[str] = Form(None),
    item_type: Optional[str] = Form("food"),
    is_available: Optional[str] = Form("true"),
    is_vegetarian: Optional[str] = Form("false"),
    is_vegan: Optional[str] = Form("false"),
    contains_gluten: Optional[str] = Form("false"),
    contains_dairy: Optional[str] = Form("false"),
    contains_nuts: Optional[str] = Form("false"),
    contains_fish: Optional[str] = Form("false"),
    contains_shellfish: Optional[str] = Form("false"),
    contains_eggs: Optional[str] = Form("false"),
    is_spicy: Optional[str] = Form("false"),
    image: Optional[UploadFile] = File(None),
    clerk_user_id: str = Depends(require_auth)
):
    """Create a new menu item"""
    restaurant = await get_restaurant_by_clerk_user(clerk_user_id)
    if not restaurant:
        raise HTTPException(status_code=404, detail="Restoran nije pronađen")

    logger.info(f"Creating menu item '{name_hr}' for restaurant {restaurant['id']}")

    # Get default menu, or create one if it doesn't exist
    supabase = get_supabase_client()
    menu_result = supabase.table('menus').select('*').eq('restaurant_id', restaurant['id']).eq('is_active', True).limit(1).execute()
    
    if not menu_result.data:
        # No active menu found - create a default one
        restaurant_name = restaurant.get('name', 'Restaurant')
        restaurant_slug = restaurant.get('slug', 'restaurant')
        
        # Create default menu
        menu_data = {
            'restaurant_id': restaurant['id'],
            'name': f'{restaurant_name} Menu',
            'slug': f'{restaurant_slug}-menu',
            'description': f'Main menu for {restaurant_name}',
            'is_active': True
        }
        
        new_menu_result = supabase.table('menus').insert(menu_data).execute()
        if not new_menu_result.data:
            raise HTTPException(status_code=500, detail="Failed to create default menu")
        
        menu_id = new_menu_result.data[0]['id']
    else:
        menu_id = menu_result.data[0]['id']
    
    # SECURITY: Handle image upload with size validation
    image_path = None
    if image:
        # SECURITY: Validate file size (max 5MB)
        MAX_IMAGE_SIZE = 5 * 1024 * 1024  # 5MB
        file_size = 0
        content = await image.read()
        file_size = len(content)
        await image.seek(0)  # Reset file pointer
        
        if file_size > MAX_IMAGE_SIZE:
            raise HTTPException(
                status_code=413,
                detail=f"Image file too large. Maximum size is 5MB, got {file_size / 1024 / 1024:.2f}MB"
            )
        
        # SECURITY: Validate file type
        allowed_types = ["image/jpeg", "image/jpg", "image/png", "image/webp"]
        if image.content_type not in allowed_types:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid file type. Allowed types: JPEG, PNG, WebP"
            )
        
        try:
            image_path = await upload_image_to_storage(
                file=image,
                restaurant_id=restaurant['id'],
                menu_item_id=None  # Will be set after item is created
            )
        except Exception as e:
            logger.error(f"Image upload error: {str(e)}")
            raise HTTPException(status_code=500, detail="Failed to upload image. Please try again.")
    
    def str_to_bool(value: Optional[str]) -> bool:
        return value.lower() in ("true", "on", "1") if value else False
    
    menu_item_data = {
        "restaurant_id": restaurant['id'],
        "menu_id": menu_id,
        "name_hr": name_hr,
        "description_hr": description_hr,
        "price": price,
        "category_id": category_id,
        "item_type": item_type if item_type in ['food', 'drink'] else 'food',
        "image_path": image_path,
        "is_available": str_to_bool(is_available),
        "is_vegetarian": str_to_bool(is_vegetarian),
        "is_vegan": str_to_bool(is_vegan),
        "contains_gluten": str_to_bool(contains_gluten),
        "contains_dairy": str_to_bool(contains_dairy),
        "contains_nuts": str_to_bool(contains_nuts),
        "contains_fish": str_to_bool(contains_fish),
        "contains_shellfish": str_to_bool(contains_shellfish),
        "contains_eggs": str_to_bool(contains_eggs),
        "is_spicy": str_to_bool(is_spicy),
    }
    
    result = supabase.table('menu_items').insert(menu_item_data).execute()
    menu_item = result.data[0]

    logger.info(f"Menu item '{name_hr}' created successfully with ID {menu_item['id']} (price: €{price}, type: {item_type})")

    # If image was uploaded, update the path with menu_item_id for better organization
    if image_path and image:
        # Re-upload with menu_item_id in path for better organization
        try:
            # Note: This is optional - you can keep the original upload or re-upload
            # For now, we'll keep the original upload path
            pass
        except:
            pass
    
    return JSONResponse(menu_item)

@app.put("/api/v1/menu-items/{item_id}")
async def update_menu_item(
    item_id: str,
    name_hr: Optional[str] = Form(None),
    description_hr: Optional[str] = Form(None),
    price: Optional[float] = Form(None),
    category_id: Optional[str] = Form(None),
    item_type: Optional[str] = Form(None),
    is_available: Optional[str] = Form(None),
    is_vegetarian: Optional[str] = Form(None),
    is_vegan: Optional[str] = Form(None),
    contains_gluten: Optional[str] = Form(None),
    contains_dairy: Optional[str] = Form(None),
    contains_nuts: Optional[str] = Form(None),
    contains_fish: Optional[str] = Form(None),
    contains_shellfish: Optional[str] = Form(None),
    contains_eggs: Optional[str] = Form(None),
    is_spicy: Optional[str] = Form(None),
    image: Optional[UploadFile] = File(None),
    clerk_user_id: str = Depends(require_auth)
):
    """Update a menu item"""
    restaurant = await get_restaurant_by_clerk_user(clerk_user_id)
    if not restaurant:
        raise HTTPException(status_code=404, detail="Restoran nije pronađen")

    supabase = get_supabase_client()

    # Verify item belongs to restaurant
    item_result = supabase.table('menu_items').select('*').eq('id', item_id).eq('restaurant_id', restaurant['id']).execute()
    if not item_result.data:
        logger.warning(f"Menu item {item_id} not found or doesn't belong to restaurant {restaurant['id']}")
        raise HTTPException(status_code=404, detail="Menu item not found")

    old_item = item_result.data[0]
    logger.info(f"Updating menu item '{old_item['name_hr']}' (ID: {item_id})")
    
    def str_to_bool(value: Optional[str]) -> bool:
        return value.lower() in ("true", "on", "1") if value else False
    
    update_data = {}
    
    if name_hr is not None:
        update_data["name_hr"] = name_hr
    if description_hr is not None:
        update_data["description_hr"] = description_hr
    if price is not None:
        update_data["price"] = price
    if category_id is not None:
        update_data["category_id"] = category_id
    if item_type is not None and item_type in ['food', 'drink']:
        update_data["item_type"] = item_type
    if is_available is not None:
        update_data["is_available"] = str_to_bool(is_available)
    if is_vegetarian is not None:
        update_data["is_vegetarian"] = str_to_bool(is_vegetarian)
    if is_vegan is not None:
        update_data["is_vegan"] = str_to_bool(is_vegan)
    if contains_gluten is not None:
        update_data["contains_gluten"] = str_to_bool(contains_gluten)
    if contains_dairy is not None:
        update_data["contains_dairy"] = str_to_bool(contains_dairy)
    if contains_nuts is not None:
        update_data["contains_nuts"] = str_to_bool(contains_nuts)
    if contains_fish is not None:
        update_data["contains_fish"] = str_to_bool(contains_fish)
    if contains_shellfish is not None:
        update_data["contains_shellfish"] = str_to_bool(contains_shellfish)
    if contains_eggs is not None:
        update_data["contains_eggs"] = str_to_bool(contains_eggs)
    if is_spicy is not None:
        update_data["is_spicy"] = str_to_bool(is_spicy)
    
    if image:
        # SECURITY: Validate file size (max 5MB)
        MAX_IMAGE_SIZE = 5 * 1024 * 1024  # 5MB
        file_size = 0
        content = await image.read()
        file_size = len(content)
        await image.seek(0)  # Reset file pointer
        
        if file_size > MAX_IMAGE_SIZE:
            raise HTTPException(
                status_code=413,
                detail=f"Image file too large. Maximum size is 5MB, got {file_size / 1024 / 1024:.2f}MB"
            )
        
        # SECURITY: Validate file type
        allowed_types = ["image/jpeg", "image/jpg", "image/png", "image/webp"]
        if image.content_type not in allowed_types:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid file type. Allowed types: JPEG, PNG, WebP"
            )
        
        # Delete old image if exists
        old_image_path = item_result.data[0].get('image_path')
        if old_image_path:
            delete_image_from_storage(old_image_path)
        
        # Upload new image to Supabase Storage
        try:
            image_path = await upload_image_to_storage(
                file=image,
                restaurant_id=restaurant['id'],
                menu_item_id=item_id
            )
            update_data["image_path"] = image_path
        except Exception as e:
            logger.error(f"Image upload error: {str(e)}")
            raise HTTPException(status_code=500, detail="Failed to upload image. Please try again.")
    
    if update_data:
        result = supabase.table('menu_items').update(update_data).eq('id', item_id).execute()
        updated_fields = ', '.join(update_data.keys())
        logger.info(f"Menu item '{old_item['name_hr']}' updated successfully. Fields: {updated_fields}")
        return JSONResponse(result.data[0])

    logger.info(f"No changes made to menu item '{old_item['name_hr']}'")
    return JSONResponse(item_result.data[0])

@app.delete("/api/v1/menu-items/{item_id}")
async def delete_menu_item(item_id: str, clerk_user_id: str = Depends(require_auth)):
    """Delete a menu item"""
    restaurant = await get_restaurant_by_clerk_user(clerk_user_id)
    if not restaurant:
        raise HTTPException(status_code=404, detail="Restoran nije pronađen")

    supabase = get_supabase_client()

    # Verify item belongs to restaurant
    item_result = supabase.table('menu_items').select('*').eq('id', item_id).eq('restaurant_id', restaurant['id']).execute()
    if not item_result.data:
        logger.warning(f"Menu item {item_id} not found or doesn't belong to restaurant {restaurant['id']}")
        raise HTTPException(status_code=404, detail="Menu item not found")

    item_name = item_result.data[0]['name_hr']
    logger.info(f"Deleting menu item '{item_name}' (ID: {item_id}) for restaurant {restaurant['id']}")

    # Delete image from Supabase Storage if exists
    image_path = item_result.data[0].get('image_path')
    if image_path:
        delete_image_from_storage(image_path)
        logger.info(f"Deleted image for menu item '{item_name}': {image_path}")

    supabase.table('menu_items').delete().eq('id', item_id).execute()
    logger.info(f"Menu item '{item_name}' deleted successfully")
    return JSONResponse({"message": "Menu item deleted"})

@app.get("/api/v1/menu-items-with-translations")
async def get_menu_items_with_translations(clerk_user_id: str = Depends(require_auth)):
    """Get all menu items with their translations"""
    restaurant = await get_restaurant_by_clerk_user(clerk_user_id)
    if not restaurant:
        raise HTTPException(status_code=404, detail="Restoran nije pronađen")
    
    supabase = get_supabase_client()
    items_result = supabase.table('menu_items').select('*').eq('restaurant_id', restaurant['id']).execute()
    menu_items = items_result.data

    # Batch fetch all translations (1 query instead of N)
    item_ids = [item['id'] for item in menu_items]
    all_translations = []
    if item_ids:
        translations_result = supabase.table('translations').select('*').in_('menu_item_id', item_ids).execute()
        all_translations = translations_result.data

    # Group translations by menu_item_id
    translations_by_item = {}
    for trans in all_translations:
        item_id = trans['menu_item_id']
        if item_id not in translations_by_item:
            translations_by_item[item_id] = []
        translations_by_item[item_id].append(trans)

    # Attach translations to each item
    for item in menu_items:
        item['translations'] = translations_by_item.get(item['id'], [])

    return JSONResponse(menu_items)

# Daily Menus Endpoints (Authenticated)
@app.get("/api/v1/categories")
async def get_categories(clerk_user_id: str = Depends(require_auth)):
    """Get all categories for authenticated user's restaurant"""
    restaurant = await get_restaurant_by_clerk_user(clerk_user_id)
    if not restaurant:
        raise HTTPException(status_code=404, detail="Restoran nije pronađen")
    
    supabase = get_supabase_client()
    result = supabase.table('categories').select('*').eq('restaurant_id', restaurant['id']).order('order_index').execute()
    
    categories_list = [cat['name'] for cat in result.data]
    categories_with_ids = [{"id": cat['id'], "name": cat['name'], "order": cat['order_index'], "category_type": cat.get('category_type', 'food')} for cat in result.data]

    return JSONResponse({
        "categories": categories_list,
        "categories_with_ids": categories_with_ids
    })

@app.get("/api/v1/categories-with-translations")
async def get_categories_with_translations(clerk_user_id: str = Depends(require_auth)):
    """Get all categories with their translations"""
    restaurant = await get_restaurant_by_clerk_user(clerk_user_id)
    if not restaurant:
        raise HTTPException(status_code=404, detail="Restoran nije pronađen")
    
    supabase = get_supabase_client()
    categories_result = supabase.table('categories').select('*').eq('restaurant_id', restaurant['id']).order('order_index').execute()
    categories = categories_result.data

    # Batch fetch all category translations (1 query instead of M)
    category_ids = [cat['id'] for cat in categories]
    all_translations = []
    if category_ids:
        translations_result = supabase.table('category_translations').select('*').in_('category_id', category_ids).execute()
        all_translations = translations_result.data

    # Group translations by category_id
    translations_by_category = {}
    for trans in all_translations:
        cat_id = trans['category_id']
        if cat_id not in translations_by_category:
            translations_by_category[cat_id] = []
        translations_by_category[cat_id].append(trans)

    # Attach translations to each category
    for category in categories:
        category['translations'] = translations_by_category.get(category['id'], [])
    
    return JSONResponse(categories)

@app.post("/api/v1/categories")
async def create_category(
    name: str = Form(...),
    category_type: Optional[str] = Form("food"),
    order: Optional[int] = Form(None),
    clerk_user_id: str = Depends(require_auth)
):
    """Create a new category"""
    restaurant = await get_restaurant_by_clerk_user(clerk_user_id)
    if not restaurant:
        raise HTTPException(status_code=404, detail="Restoran nije pronađen")

    logger.info(f"Creating category '{name}' ({category_type}) for restaurant {restaurant['id']}")

    supabase = get_supabase_client()

    # Check if category already exists
    existing = supabase.table('categories').select('*').eq('restaurant_id', restaurant['id']).eq('name', name).execute()
    if existing.data:
        logger.warning(f"Category '{name}' already exists for restaurant {restaurant['id']}")
        raise HTTPException(status_code=400, detail="Category already exists")

    # Get max order
    all_categories = supabase.table('categories').select('order_index').eq('restaurant_id', restaurant['id']).execute()
    max_order = max([cat['order_index'] for cat in all_categories.data], default=-1) if all_categories.data else -1
    next_order = order if order is not None else (max_order + 1)

    category_data = {
        "restaurant_id": restaurant['id'],
        "name": name,
        "category_type": category_type if category_type in ['food', 'drink'] else 'food',
        "order_index": next_order
    }

    result = supabase.table('categories').insert(category_data).execute()
    logger.info(f"Category '{name}' created successfully with ID {result.data[0]['id']}")
    return JSONResponse(result.data[0])

@app.put("/api/v1/categories/reorder")
async def reorder_categories(
    request: Request,
    clerk_user_id: str = Depends(require_auth)
):
    """Reorder categories"""
    restaurant = await get_restaurant_by_clerk_user(clerk_user_id)
    if not restaurant:
        raise HTTPException(status_code=404, detail="Restoran nije pronađen")
    
    # Parse JSON body
    body = await request.json()
    categories_order = body if isinstance(body, list) else []
    
    supabase = get_supabase_client()
    
    for idx, item in enumerate(categories_order):
        if not isinstance(item, dict) or "id" not in item:
            continue
        supabase.table('categories').update({"order_index": idx}).eq('id', item["id"]).eq('restaurant_id', restaurant['id']).execute()
    
    return JSONResponse({"message": "Categories reordered"})

@app.delete("/api/v1/categories/{category_id}")
async def delete_category(category_id: str, clerk_user_id: str = Depends(require_auth)):
    """Delete a category"""
    restaurant = await get_restaurant_by_clerk_user(clerk_user_id)
    if not restaurant:
        raise HTTPException(status_code=404, detail="Restoran nije pronađen")

    supabase = get_supabase_client()

    # Verify category belongs to restaurant
    category_result = supabase.table('categories').select('*').eq('id', category_id).eq('restaurant_id', restaurant['id']).execute()
    if not category_result.data:
        logger.warning(f"Category {category_id} not found or doesn't belong to restaurant {restaurant['id']}")
        raise HTTPException(status_code=404, detail="Category not found")

    category_name = category_result.data[0]['name']
    logger.info(f"Deleting category '{category_name}' (ID: {category_id}) for restaurant {restaurant['id']}")

    # Remove category_id from menu items that belong to this category
    supabase.table('menu_items').update({"category_id": None}).eq('restaurant_id', restaurant['id']).eq('category_id', category_id).execute()

    # Delete category
    supabase.table('categories').delete().eq('id', category_id).execute()

    logger.info(f"Category '{category_name}' deleted successfully")
    return JSONResponse({"message": "Category deleted"})

# Translations Endpoints
@app.get("/api/v1/translations/{menu_item_id}")
async def get_translations(menu_item_id: str, clerk_user_id: str = Depends(require_auth)):
    """Get all translations for a menu item"""
    restaurant = await get_restaurant_by_clerk_user(clerk_user_id)
    if not restaurant:
        raise HTTPException(status_code=404, detail="Restoran nije pronađen")
    
    supabase = get_supabase_client()
    
    # Verify menu item belongs to restaurant
    item_result = supabase.table('menu_items').select('*').eq('id', menu_item_id).eq('restaurant_id', restaurant['id']).execute()
    if not item_result.data:
        raise HTTPException(status_code=404, detail="Menu item not found")
    
    result = supabase.table('translations').select('*').eq('menu_item_id', menu_item_id).execute()
    return JSONResponse(result.data)

@app.post("/api/v1/translations/generate/{menu_item_id}")
async def generate_translations(
    menu_item_id: str,
    language_codes: List[str],
    clerk_user_id: str = Depends(require_auth)
):
    """Generate AI translations for a menu item"""
    restaurant = await get_restaurant_by_clerk_user(clerk_user_id)
    if not restaurant:
        raise HTTPException(status_code=404, detail="Restoran nije pronađen")
    
    supabase = get_supabase_client()
    
    # Verify menu item belongs to restaurant
    item_result = supabase.table('menu_items').select('*').eq('id', menu_item_id).eq('restaurant_id', restaurant['id']).execute()
    if not item_result.data:
        raise HTTPException(status_code=404, detail="Menu item not found")
    
    menu_item = item_result.data[0]
    translations = []
    errors = []

    all_languages = get_all_languages()

    for lang_code in language_codes:
        if lang_code not in all_languages:
            errors.append(f"Unsupported language: {lang_code}")
            continue

        # Check if translation already exists
        existing = supabase.table('translations').select('*').eq('menu_item_id', menu_item_id).eq('language_code', lang_code).execute()
        if existing.data:
            errors.append(f"Translation for {all_languages[lang_code]} already exists")
            continue

        try:
            # Use Gemini for translation
            translation_data = translate_menu_item(
                menu_item['name_hr'],
                menu_item.get('description_hr', ''),
                lang_code,
                all_languages[lang_code]
            )

            translation_record = {
                "menu_item_id": menu_item_id,
                "language_code": lang_code,
                "language_name": all_languages[lang_code],
                "name": translation_data["name"],
                "description": translation_data.get("description", ""),
                "is_ai_generated": True
            }

            result = supabase.table('translations').insert(translation_record).execute()
            translations.append(result.data[0])

        except Exception as e:
            errors.append(f"Error generating translation for {all_languages[lang_code]}: {str(e)}")

    return JSONResponse({
        "success": len(translations) > 0,
        "translations": translations,
        "errors": errors
    })

@app.put("/api/v1/translations/{translation_id}")
async def update_translation(
    translation_id: str,
    name: Optional[str] = Form(None),
    description: Optional[str] = Form(None),
    clerk_user_id: str = Depends(require_auth)
):
    """Update a translation"""
    restaurant = await get_restaurant_by_clerk_user(clerk_user_id)
    if not restaurant:
        raise HTTPException(status_code=404, detail="Restoran nije pronađen")
    
    supabase = get_supabase_client()
    
    # Verify translation belongs to restaurant's menu item
    translation_result = supabase.table('translations').select('*, menu_items!inner(restaurant_id)').eq('id', translation_id).execute()
    if not translation_result.data:
        raise HTTPException(status_code=404, detail="Translation not found")

    if translation_result.data[0]['menu_items']['restaurant_id'] != restaurant['id']:
        raise HTTPException(status_code=403, detail="Not authorized")

    update_data = {}
    if name is not None:
        update_data["name"] = name
    if description is not None:
        update_data["description"] = description
    
    update_data["is_ai_generated"] = False  # Mark as manually edited
    
    if update_data:
        result = supabase.table('translations').update(update_data).eq('id', translation_id).execute()
        return JSONResponse(result.data[0])
    
    return JSONResponse(translation_result.data[0])

@app.delete("/api/v1/translations/{translation_id}")
async def delete_translation(translation_id: str, clerk_user_id: str = Depends(require_auth)):
    """Delete a translation"""
    restaurant = await get_restaurant_by_clerk_user(clerk_user_id)
    if not restaurant:
        raise HTTPException(status_code=404, detail="Restoran nije pronađen")
    
    supabase = get_supabase_client()

    translation_result = supabase.table('translations').select('*, menu_items!inner(restaurant_id)').eq('id', translation_id).execute()
    if not translation_result.data:
        raise HTTPException(status_code=404, detail="Translation not found")

    if translation_result.data[0]['menu_items']['restaurant_id'] != restaurant['id']:
        raise HTTPException(status_code=403, detail="Not authorized")

    supabase.table('translations').delete().eq('id', translation_id).execute()
    return JSONResponse({"message": "Translation deleted"})

# Category Translations Endpoints
@app.post("/api/v1/category-translations/generate/{category_id}")
async def generate_category_translations(
    category_id: str,
    language_codes: List[str],
    clerk_user_id: str = Depends(require_auth)
):
    """Generate AI translations for a category"""
    restaurant = await get_restaurant_by_clerk_user(clerk_user_id)
    if not restaurant:
        raise HTTPException(status_code=404, detail="Restoran nije pronađen")
    
    supabase = get_supabase_client()
    
    # Verify category belongs to restaurant
    category_result = supabase.table('categories').select('*').eq('id', category_id).eq('restaurant_id', restaurant['id']).execute()
    if not category_result.data:
        raise HTTPException(status_code=404, detail="Category not found")
    
    category = category_result.data[0]
    translations = []
    errors = []

    all_languages = get_all_languages()

    for lang_code in language_codes:
        if lang_code not in all_languages:
            errors.append(f"Unsupported language: {lang_code}")
            continue

        # Check if translation already exists
        existing = supabase.table('category_translations').select('*').eq('category_id', category_id).eq('language_code', lang_code).execute()
        if existing.data:
            errors.append(f"Translation for {all_languages[lang_code]} already exists")
            continue

        try:
            # Use Gemini for translation
            translation_data = translate_category(
                category['name'],
                lang_code,
                all_languages[lang_code]
            )

            translation_record = {
                "category_id": category_id,
                "language_code": lang_code,
                "language_name": all_languages[lang_code],
                "name": translation_data["name"],
                "is_ai_generated": True
            }

            result = supabase.table('category_translations').insert(translation_record).execute()
            translations.append(result.data[0])

        except Exception as e:
            errors.append(f"Error generating translation for {all_languages[lang_code]}: {str(e)}")
    
    return JSONResponse({
        "success": len(translations) > 0,
        "translations": translations,
        "errors": errors
    })

@app.put("/api/v1/category-translations/{translation_id}")
async def update_category_translation(
    translation_id: str,
    name: str = Form(...),
    clerk_user_id: str = Depends(require_auth)
):
    """Update a category translation"""
    restaurant = await get_restaurant_by_clerk_user(clerk_user_id)
    if not restaurant:
        raise HTTPException(status_code=404, detail="Restoran nije pronađen")
    
    supabase = get_supabase_client()

    ct_result = supabase.table('category_translations').select('*, categories!inner(restaurant_id)').eq('id', translation_id).execute()
    if not ct_result.data:
        raise HTTPException(status_code=404, detail="Translation not found")

    if ct_result.data[0]['categories']['restaurant_id'] != restaurant['id']:
        raise HTTPException(status_code=403, detail="Not authorized")

    result = supabase.table('category_translations').update({"name": name}).eq('id', translation_id).execute()
    return JSONResponse(result.data[0] if result.data else {"message": "Translation updated"})

@app.delete("/api/v1/category-translations/{translation_id}")
async def delete_category_translation(translation_id: str, clerk_user_id: str = Depends(require_auth)):
    """Delete a category translation"""
    restaurant = await get_restaurant_by_clerk_user(clerk_user_id)
    if not restaurant:
        raise HTTPException(status_code=404, detail="Restoran nije pronađen")

    supabase = get_supabase_client()

    ct_result = supabase.table('category_translations').select('*, categories!inner(restaurant_id)').eq('id', translation_id).execute()
    if not ct_result.data:
        raise HTTPException(status_code=404, detail="Translation not found")

    if ct_result.data[0]['categories']['restaurant_id'] != restaurant['id']:
        raise HTTPException(status_code=403, detail="Not authorized")

    supabase.table('category_translations').delete().eq('id', translation_id).execute()
    return JSONResponse({"message": "Category translation deleted"})

# UI Translations Endpoint
@app.get("/api/v1/ui-translations/{language_code}")
async def get_ui_translations(language_code: str):
    """Get UI translations for a specific language from Supabase"""
    supabase = get_supabase_client()
    # Get all restaurants' UI translations for this language
    result = supabase.table('ui_translations').select('translation_key, translation_value').eq('language_code', language_code).execute()
    translations = {}
    for row in (result.data or []):
        translations[row['translation_key']] = row['translation_value']
    return translations

# Analytics Endpoint
@app.get("/api/v1/analytics")
async def get_analytics(clerk_user_id: str = Depends(require_auth)):
    """Get analytics data for dashboard"""
    restaurant = await get_restaurant_by_clerk_user(clerk_user_id)
    if not restaurant:
        raise HTTPException(status_code=404, detail="Restoran nije pronađen")
    
    supabase = get_supabase_client()
    all_items_result = supabase.table('menu_items').select('*').eq('restaurant_id', restaurant['id']).execute()
    all_items = all_items_result.data
    
    total_items = len(all_items)
    available_items = len([item for item in all_items if item.get('is_available', True)])
    unavailable_items = total_items - available_items
    
    # Count by category
    categories = {}
    for item in all_items:
        cat = item.get('category') or "Bez kategorije"
        categories[cat] = categories.get(cat, 0) + 1
    
    # Allergen counts
    allergen_counts = {
        "vegetarian": len([item for item in all_items if item.get('is_vegetarian', False)]),
        "vegan": len([item for item in all_items if item.get('is_vegan', False)]),
        "gluten": len([item for item in all_items if item.get('contains_gluten', False)]),
        "dairy": len([item for item in all_items if item.get('contains_dairy', False)]),
        "nuts": len([item for item in all_items if item.get('contains_nuts', False)]),
        "fish": len([item for item in all_items if item.get('contains_fish', False)]),
        "shellfish": len([item for item in all_items if item.get('contains_shellfish', False)]),
        "eggs": len([item for item in all_items if item.get('contains_eggs', False)]),
        "spicy": len([item for item in all_items if item.get('is_spicy', False)]),
    }
    
    # Menu view analytics
    from datetime import datetime, timedelta, timezone
    now = datetime.now(timezone.utc)
    thirty_days_ago = (now - timedelta(days=30)).isoformat()

    views_result = supabase.table('menu_views') \
        .select('language_code,device_type,event_type,created_at') \
        .eq('restaurant_id', restaurant['id']) \
        .eq('event_type', 'scan') \
        .execute()
    all_views = views_result.data or []

    views_30d = [v for v in all_views if v['created_at'] >= thirty_days_ago]

    # Language breakdown (all time)
    language_counts: dict = {}
    for v in all_views:
        lang = v['language_code']
        language_counts[lang] = language_counts.get(lang, 0) + 1

    # Device breakdown (all time)
    device_counts: dict = {}
    for v in all_views:
        dev = v['device_type']
        device_counts[dev] = device_counts.get(dev, 0) + 1

    # Daily views for last 30 days
    daily_views: dict = {}
    for v in views_30d:
        day = v['created_at'][:10]  # YYYY-MM-DD
        daily_views[day] = daily_views.get(day, 0) + 1

    return JSONResponse({
        "total_items": total_items,
        "available_items": available_items,
        "unavailable_items": unavailable_items,
        "categories": categories,
        "allergen_counts": allergen_counts,
        "total_categories": len(categories),
        "total_views": len(all_views),
        "views_last_30_days": len(views_30d),
        "language_breakdown": language_counts,
        "device_breakdown": device_counts,
        "daily_views": daily_views,
    })

# QR Code Endpoint
@app.get("/api/v1/qr-code")
async def generate_qr_code_api(clerk_user_id: str = Depends(require_auth)):
    """Generate QR code for the menu - requires authentication"""
    restaurant = await get_restaurant_by_clerk_user(clerk_user_id)
    if not restaurant:
        raise HTTPException(status_code=404, detail="Restoran nije pronađen")
    
    # Get restaurant slug for menu URL - use root path for clean URLs
    menu_url = f"{MENU_URL}/{restaurant['slug']}"
    
    # Generate QR code
    qr = qrcode.QRCode(version=1, box_size=10, border=5)
    qr.add_data(menu_url)
    qr.make(fit=True)
    
    img = qr.make_image(fill_color="black", back_color="white")
    
    # Convert to base64
    buffer = BytesIO()
    img.save(buffer, format="PNG")
    img_str = base64.b64encode(buffer.getvalue()).decode()
    
    return JSONResponse({
        "qr_code": img_str,
        "menu_url": menu_url
    })

# Menu View Tracking Endpoint
@app.post("/api/v1/track/{restaurant_slug}")
async def track_menu_view(restaurant_slug: str, request: Request):
    """Public endpoint to track menu views and language switches"""
    body = await request.json()

    anon_supabase = get_supabase_anon_client()
    restaurant_result = anon_supabase.table('restaurants').select('id').eq('slug', restaurant_slug).execute()
    if not restaurant_result.data:
        raise HTTPException(status_code=404, detail="Restoran nije pronađen")

    restaurant_id = restaurant_result.data[0]['id']

    # Parse device type from User-Agent
    user_agent = request.headers.get('user-agent', '').lower()
    if any(kw in user_agent for kw in ['ipad', 'tablet', 'kindle']):
        device_type = 'tablet'
    elif any(kw in user_agent for kw in ['mobile', 'android', 'iphone', 'ipod', 'blackberry', 'windows phone']):
        device_type = 'mobile'
    else:
        device_type = 'desktop'

    language_code = body.get('language_code', 'hr')
    event_type = body.get('event_type', 'scan')
    referrer = body.get('referrer') or None

    service_supabase = get_supabase_client()
    service_supabase.table('menu_views').insert({
        "restaurant_id": restaurant_id,
        "language_code": language_code,
        "device_type": device_type,
        "event_type": event_type,
        "referrer": referrer,
    }).execute()

    return JSONResponse({"success": True})


# Supported Languages Endpoints
@app.get("/api/v1/available-languages")
async def get_available_languages():
    """Get all available languages from the master list (public)"""
    all_langs = get_all_languages()
    return JSONResponse({
        "languages": [
            {"code": code, "name": name}
            for code, name in all_langs.items()
        ]
    })

@app.get("/api/v1/supported-languages")
async def get_supported_languages(clerk_user_id: str = Depends(require_auth)):
    """Get active languages for the authenticated user's restaurant"""
    restaurant = await get_restaurant_by_clerk_user(clerk_user_id)
    if not restaurant:
        raise HTTPException(status_code=404, detail="Restoran nije pronađen")

    langs = get_restaurant_languages(restaurant['id'])
    return JSONResponse({
        "languages": langs
    })

@app.post("/api/v1/languages/add")
async def add_language(request: Request, clerk_user_id: str = Depends(require_auth)):
    """Add a new supported language and automatically translate all content"""
    # Verify user has a restaurant
    restaurant = await get_restaurant_by_clerk_user(clerk_user_id)
    if not restaurant:
        raise HTTPException(status_code=404, detail="Restoran nije pronađen")

    # Parse JSON body
    body = await request.json()
    code = body.get("code")
    name = body.get("name")

    logger.info(f"Adding language {name} ({code}) for restaurant {restaurant['id']}")

    if not code or not name:
        raise HTTPException(status_code=400, detail="Language code and name are required")

    # Validate language code exists in master languages table
    all_languages = get_all_languages()
    if code not in all_languages:
        raise HTTPException(status_code=400, detail="Invalid language code")

    # Check if already active for this restaurant
    current_langs = get_restaurant_languages(restaurant['id'])
    if any(l['code'] == code for l in current_langs):
        raise HTTPException(status_code=400, detail="Language already active for this restaurant")

    # Add to restaurant_languages
    try:
        add_restaurant_language(restaurant['id'], code)
    except Exception as e:
        logger.error(f"Failed to add restaurant language: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to add language")

    supabase = get_supabase_client()

    # Get all menu items and categories
    menu_items_result = supabase.table('menu_items').select('*').eq('restaurant_id', restaurant['id']).execute()
    all_menu_items = menu_items_result.data

    categories_result = supabase.table('categories').select('*').eq('restaurant_id', restaurant['id']).execute()
    all_categories = categories_result.data

    # Batch check for existing translations (2 queries instead of N+M queries)
    item_ids = [item['id'] for item in all_menu_items]
    category_ids = [cat['id'] for cat in all_categories]

    existing_item_translations = set()
    existing_category_translations = set()

    if item_ids:
        existing_items = supabase.table('translations').select('menu_item_id').in_('menu_item_id', item_ids).eq('language_code', code).execute()
        existing_item_translations = {t['menu_item_id'] for t in existing_items.data}

    if category_ids:
        existing_cats = supabase.table('category_translations').select('category_id').in_('category_id', category_ids).eq('language_code', code).execute()
        existing_category_translations = {t['category_id'] for t in existing_cats.data}

    # Filter out items and categories that already have translations
    items_to_translate = [item for item in all_menu_items if item['id'] not in existing_item_translations]
    categories_to_translate = [cat for cat in all_categories if cat['id'] not in existing_category_translations]

    logger.info(f"Found {len(items_to_translate)} menu items and {len(categories_to_translate)} categories to translate")

    items_translated = 0
    items_failed = 0
    categories_translated = 0
    categories_failed = 0
    restaurant_description_translated = 0
    ui_translations_added = 0

    # Prepare UI texts for batch translation (Croatian base values)
    ui_keys = {
        "food": "Hrana",
        "drink": "Pića",
        "intro_text_2": "Tradicija, kvaliteta i strast za kulinarstvom čine srž našeg identiteta.",
        "vegetarian": "Vegetarijansko",
        "vegan": "Vegansko",
        "spicy": "Ljuto",
        "contains_gluten": "Gluten",
        "contains_dairy": "Mliječno",
        "contains_nuts": "Orašasti plodovi",
        "contains_fish": "Riba",
        "contains_shellfish": "Školjke",
        "contains_eggs": "Jaja",
        "gluten_free": "Bez glutena",
        "dairy_free": "Bez mliječnih proizvoda",
    }

    # Check which UI translations don't exist yet
    existing_ui = supabase.table('ui_translations').select('translation_key').eq('restaurant_id', restaurant['id']).eq('language_code', code).execute()
    existing_ui_keys = {t['translation_key'] for t in existing_ui.data}
    ui_texts_to_translate = {k: v for k, v in ui_keys.items() if k not in existing_ui_keys}

    # Check if restaurant description needs translation
    restaurant_desc = None
    if restaurant.get('description'):
        existing_desc = supabase.table('restaurant_translations').select('*').eq('restaurant_id', restaurant['id']).eq('language_code', code).execute()
        if not existing_desc.data:
            restaurant_desc = restaurant['description']

    # Batch translate ALL content in ONE API call
    if items_to_translate or categories_to_translate or restaurant_desc or ui_texts_to_translate:
        try:
            logger.info(f"Starting batch translation to {name}")
            batch_result = translate_batch(
                items_to_translate,
                categories_to_translate,
                code,
                name,
                restaurant_description=restaurant_desc,
                ui_texts=ui_texts_to_translate
            )

            # Bulk insert all item translations (1 request instead of N)
            if batch_result.get('items'):
                translation_records = []
                for translated_item in batch_result['items']:
                    translation_records.append({
                        "menu_item_id": translated_item['id'],
                        "language_code": code,
                        "language_name": name,
                        "name": translated_item['name'],
                        "description": translated_item.get('description', ''),
                        "is_ai_generated": True
                    })

                if translation_records:
                    try:
                        supabase.table('translations').insert(translation_records).execute()
                        items_translated = len(translation_records)
                    except Exception as e:
                        items_failed = len(translation_records)
                        logger.error(f"Failed to bulk insert item translations: {str(e)}")

            # Bulk insert all category translations (1 request instead of M)
            if batch_result.get('categories'):
                category_translation_records = []
                for translated_category in batch_result['categories']:
                    category_translation_records.append({
                        "category_id": translated_category['id'],
                        "language_code": code,
                        "language_name": name,
                        "name": translated_category['name'],
                        "is_ai_generated": True
                    })

                if category_translation_records:
                    try:
                        supabase.table('category_translations').insert(category_translation_records).execute()
                        categories_translated = len(category_translation_records)
                    except Exception as e:
                        categories_failed = len(category_translation_records)
                        logger.error(f"Failed to bulk insert category translations: {str(e)}")

            # Insert restaurant description translation if included
            if batch_result.get('restaurant_description') and restaurant_desc:
                try:
                    translation_record = {
                        "restaurant_id": restaurant['id'],
                        "language_code": code,
                        "language_name": name,
                        "description": batch_result['restaurant_description'],
                        "is_ai_generated": True
                    }
                    supabase.table('restaurant_translations').insert(translation_record).execute()
                    restaurant_description_translated = 1
                except Exception as e:
                    logger.error(f"Failed to insert restaurant description translation: {str(e)}")

            # Bulk insert UI translations if included
            if batch_result.get('ui_texts') and ui_texts_to_translate:
                ui_translation_records = []
                for key, translated_value in batch_result['ui_texts'].items():
                    ui_translation_records.append({
                        "restaurant_id": restaurant['id'],
                        "language_code": code,
                        "language_name": name,
                        "translation_key": key,
                        "translation_value": translated_value,
                        "is_ai_generated": True
                    })

                if ui_translation_records:
                    try:
                        supabase.table('ui_translations').insert(ui_translation_records).execute()
                        ui_translations_added = len(ui_translation_records)
                    except Exception as e:
                        logger.error(f"Failed to bulk insert UI translations: {str(e)}")

        except Exception as e:
            logger.error(f"Batch translation failed: {str(e)}")
            items_failed = len(items_to_translate)
            categories_failed = len(categories_to_translate)

    # Mark translations as complete - this fires a single UPDATE event for the public menu to listen to
    supabase.table('restaurant_languages').update({"translations_complete": True}).eq('restaurant_id', restaurant['id']).eq('language_code', code).execute()

    logger.info(f"Language {name} added successfully. Translated {items_translated}/{len(all_menu_items)} items, {categories_translated}/{len(all_categories)} categories, {restaurant_description_translated} restaurant description, {ui_translations_added} UI elements")

    return JSONResponse({
        "message": f"Language {name} added successfully",
        "items_translated": items_translated,
        "items_failed": items_failed,
        "categories_translated": categories_translated,
        "categories_failed": categories_failed,
        "total_items": len(all_menu_items),
        "total_categories": len(all_categories),
        "restaurant_description_translated": restaurant_description_translated
    })

@app.delete("/api/v1/languages/remove")
async def bulk_remove_languages(language_codes: List[str] = Body(..., embed=True), clerk_user_id: str = Depends(require_auth)):
    """Remove multiple supported languages and delete all their translations"""
    if not language_codes:
        raise HTTPException(status_code=400, detail="No language codes provided")

    restaurant = await get_restaurant_by_clerk_user(clerk_user_id)
    if not restaurant:
        raise HTTPException(status_code=404, detail="Restoran nije pronađen")

    current_langs = get_restaurant_languages(restaurant['id'])
    valid_entries = [l for l in current_langs if l['code'] in language_codes]
    valid_codes = [l['code'] for l in valid_entries]

    if not valid_codes:
        raise HTTPException(status_code=404, detail="None of the provided languages are active for this restaurant")

    supabase = get_supabase_client()

    menu_items_result = supabase.table('menu_items').select('id').eq('restaurant_id', restaurant['id']).execute()
    menu_item_ids = [item['id'] for item in menu_items_result.data]

    if menu_item_ids:
        supabase.table('translations').delete().in_('menu_item_id', menu_item_ids).in_('language_code', valid_codes).execute()

    categories_result = supabase.table('categories').select('id').eq('restaurant_id', restaurant['id']).execute()
    category_ids = [cat['id'] for cat in categories_result.data]

    if category_ids:
        supabase.table('category_translations').delete().in_('category_id', category_ids).in_('language_code', valid_codes).execute()

    supabase.table('restaurant_translations').delete().eq('restaurant_id', restaurant['id']).in_('language_code', valid_codes).execute()
    supabase.table('ui_translations').delete().eq('restaurant_id', restaurant['id']).in_('language_code', valid_codes).execute()
    supabase.table('restaurant_languages').delete().eq('restaurant_id', restaurant['id']).in_('language_code', valid_codes).execute()

    return JSONResponse({
        "message": f"Removed {len(valid_codes)} language(s) successfully",
        "removed": valid_codes
    })

@app.delete("/api/v1/languages/remove/{language_code}")
async def remove_language(language_code: str, clerk_user_id: str = Depends(require_auth)):
    """Remove a supported language and delete all translations for it"""
    restaurant = await get_restaurant_by_clerk_user(clerk_user_id)
    if not restaurant:
        raise HTTPException(status_code=404, detail="Restoran nije pronađen")

    # Verify language is active for this restaurant
    current_langs = get_restaurant_languages(restaurant['id'])
    lang_entry = next((l for l in current_langs if l['code'] == language_code), None)
    if not lang_entry:
        raise HTTPException(status_code=404, detail="Language not active for this restaurant")

    supabase = get_supabase_client()

    # Delete all translations for this language for this restaurant's items
    menu_items_result = supabase.table('menu_items').select('id').eq('restaurant_id', restaurant['id']).execute()
    menu_item_ids = [item['id'] for item in menu_items_result.data]

    if menu_item_ids:
        supabase.table('translations').delete().in_('menu_item_id', menu_item_ids).eq('language_code', language_code).execute()

    # Delete category translations
    categories_result = supabase.table('categories').select('id').eq('restaurant_id', restaurant['id']).execute()
    category_ids = [cat['id'] for cat in categories_result.data]

    if category_ids:
        supabase.table('category_translations').delete().in_('category_id', category_ids).eq('language_code', language_code).execute()

    # Delete restaurant description translations
    supabase.table('restaurant_translations').delete().eq('restaurant_id', restaurant['id']).eq('language_code', language_code).execute()

    # Delete UI translations
    supabase.table('ui_translations').delete().eq('restaurant_id', restaurant['id']).eq('language_code', language_code).execute()

    # Remove from restaurant_languages
    remove_restaurant_language(restaurant['id'], language_code)

    language_name = lang_entry['name']
    return JSONResponse({
        "message": f"Language {language_name} removed successfully"
    })

@app.post("/api/v1/contact")
async def submit_contact_form(
    restaurantName: str = Form(...),
    email: str = Form(...),
    mobile: Optional[str] = Form(None),
    menu: Optional[UploadFile] = File(None)
):
    """
    Public endpoint for VIP form submissions
    SECURITY: Protected by rate limiting (3 requests per hour per IP)
    Sends email to info@ferros.menu with optional menu file attachment
    """
    try:
        # SECURITY: Validate input using Pydantic model
        try:
            vip_data = VIPFormRequest(
                restaurantName=restaurantName,
                email=email,
                mobile=mobile,
            )
        except Exception as e:
            # Return generic error to avoid information disclosure
            logger.warning(f"VIP form validation failed: {str(e)}")
            raise HTTPException(
                status_code=400,
                detail="Invalid form data. Please check your input and try again."
            )
        
        # Validate file if provided
        ALLOWED_MIME_TYPES = {
            "application/pdf",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "image/jpeg",
            "image/png",
            "image/webp",
            "image/gif",
        }
        menu_file_data = None
        if menu:
            if menu.content_type not in ALLOWED_MIME_TYPES:
                raise HTTPException(
                    status_code=400,
                    detail="Invalid file type. Only PDF, DOCX, and images (JPEG, PNG, WebP, GIF) are allowed."
                )
            # Read file content
            contents = await menu.read()
            if len(contents) > 10 * 1024 * 1024:  # 10MB limit
                raise HTTPException(
                    status_code=400,
                    detail="File size exceeds 10MB limit."
                )
            menu_file_data = {
                "filename": menu.filename,
                "content": contents,
                "content_type": menu.content_type
            }
            logger.info(f"Menu file received: {menu.filename} ({len(contents)} bytes)")
        
        # Send email with optional attachment
        success, error_message = await send_vip_form_email(
            restaurant_name=vip_data.restaurantName,
            email=vip_data.email,
            mobile=vip_data.mobile,
            menu_file=menu_file_data
        )
        
        if success:
            return JSONResponse({
                "success": True,
                "message": "VIP zahtjev uspješno poslan"
            })
        else:
            # Log the actual error for debugging
            logger.error(f"VIP form email failed: {error_message}")
            raise HTTPException(
                status_code=500,
                detail="Greška pri slanju zahtjeva. Molimo pokušajte kasnije."
            )
    except HTTPException:
        raise
    except Exception as e:
        # SECURITY: Don't expose internal error details
        logger.error(f"VIP form error: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Greška pri slanju zahtjeva. Molimo pokušajte kasnije."
        )

# WhatsApp Webhook Endpoints
@app.get("/api/v1/whatsapp/webhook")
async def whatsapp_webhook_verify(request: Request):
    """Verification endpoint for Meta WhatsApp webhook setup"""
    mode = request.query_params.get("hub.mode")
    token = request.query_params.get("hub.verify_token")
    challenge = request.query_params.get("hub.challenge")

    result = whatsapp_verify_webhook(mode, token, challenge)
    if result is not None:
        return PlainTextResponse(content=result, status_code=200)
    raise HTTPException(status_code=403, detail="Verification failed")


@app.post("/api/v1/whatsapp/webhook")
async def whatsapp_webhook_incoming(request: Request):
    """Receive incoming WhatsApp messages and reply via the chatbot agent"""
    body = await request.body()
    signature = request.headers.get("X-Hub-Signature-256")
    if not whatsapp_verify_signature(body, signature):
        raise HTTPException(status_code=401, detail="Invalid signature")

    payload = await request.json()

    parsed = parse_incoming_message(payload)
    if not parsed:
        # Not a text message or status update — acknowledge anyway
        return JSONResponse({"status": "ignored"})

    phone, message_text = parsed
    logger.info("WhatsApp message from %s: %s", phone, message_text[:80])

    # Find which restaurant this phone number belongs to
    restaurant = lookup_restaurant_by_whatsapp(phone)
    if not restaurant:
        await send_whatsapp_message(phone, "Vaš broj nije povezan s nijednim restoranom. Povežite ga u postavkama dashboarda.")
        return JSONResponse({"status": "no_restaurant"})

    # Get cached conversation history for this phone
    conversation_history = get_conversation_history(phone)

    try:
        result = await process_chat_message(
            message=message_text,
            restaurant_slug=restaurant["slug"],
            conversation_history=conversation_history,
        )
        ai_response = result["response"]
    except Exception:
        logger.exception("Chatbot error for WhatsApp user %s", phone)
        ai_response = "Došlo je do greške. Pokušajte ponovo."

    # Update conversation cache
    update_conversation_history(phone, message_text, ai_response)

    # Send reply back via WhatsApp
    await send_whatsapp_message(phone, ai_response)

    return JSONResponse({"status": "ok"})


# Customer Feedback Endpoints
@app.post("/api/v1/feedback/{restaurant_slug}")
async def submit_feedback(restaurant_slug: str, request: Request):
    """Public endpoint to submit customer feedback for a restaurant"""
    logger.info(f"Feedback submission received for slug: {restaurant_slug}")
    body = await request.json()
    logger.info(f"Feedback payload: food_rating={body.get('food_rating')}, overall_rating={body.get('overall_rating')}, has_comment={bool(body.get('comment'))}")

    anon_supabase = get_supabase_anon_client()
    restaurant_result = anon_supabase.table('restaurants').select('id').eq('slug', restaurant_slug).execute()
    if not restaurant_result.data:
        logger.warning(f"Feedback rejected: restaurant not found for slug '{restaurant_slug}'")
        raise HTTPException(status_code=404, detail="Restoran nije pronađen")

    restaurant_id = restaurant_result.data[0]['id']
    logger.info(f"Inserting feedback for restaurant_id: {restaurant_id}")

    supabase = get_supabase_client()
    try:
        result = supabase.table('customer_feedback').insert({
            "restaurant_id": restaurant_id,
            "food_rating": body.get("food_rating"),
            "overall_rating": body.get("overall_rating"),
            "comment": body.get("comment") or None,
        }).execute()
        logger.info(f"Feedback inserted successfully: {result.data}")
    except Exception as e:
        logger.error(f"Failed to insert feedback for restaurant_id {restaurant_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to save feedback")

    return JSONResponse({"success": True})


@app.get("/api/v1/feedback")
async def get_feedback(clerk_user_id: str = Depends(require_auth)):
    """Get feedback for authenticated user's restaurant"""
    logger.info(f"Fetching feedback for clerk_user_id: {clerk_user_id}")
    restaurant = await get_restaurant_by_clerk_user(clerk_user_id)
    if not restaurant:
        raise HTTPException(status_code=404, detail="Restoran nije pronađen")

    supabase = get_supabase_client()
    result = supabase.table('customer_feedback').select('*') \
        .eq('restaurant_id', restaurant['id']) \
        .order('created_at', desc=True).execute()
    logger.info(f"Returning {len(result.data)} feedback entries for restaurant '{restaurant['name']}'")
    return JSONResponse(result.data)


# Chatbot Endpoint
@app.post("/api/v1/chatbot/message")
async def chatbot_message(
    request: Request
):
    """
    Chatbot endpoint for menu management assistance.
    Uses LangGraph agent with Gemini to help users manage their menu.
    For demo purposes, uses restaurant_slug instead of authentication.
    """
    try:
        body = await request.json()
        message = body.get("message", "").strip()
        restaurant_slug = body.get("restaurant_slug", "").strip()
        conversation_history = body.get("conversation_history", [])
        
        if not message:
            raise HTTPException(status_code=400, detail="Message is required")
        
        if not restaurant_slug:
            raise HTTPException(status_code=400, detail="restaurant_slug is required")
        
        # Process the message through the agent
        result = await process_chat_message(
            message=message,
            restaurant_slug=restaurant_slug,
            conversation_history=conversation_history
        )
        
        return JSONResponse({
            "response": result["response"],
            "tool_calls": result.get("tool_calls", []),
            "tools_were_called": result.get("tools_were_called", False),
            "conversation_history": result.get("conversation_history", [])
        })
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in chatbot endpoint: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail="Something went wrong with the chatbot. Please try again."
        )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

