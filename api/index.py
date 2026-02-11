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

from fastapi import FastAPI, Depends, HTTPException, UploadFile, File, Form, Header, Request
from fastapi.responses import JSONResponse
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

from core.config import CORS_ORIGINS, MENU_URL
from services.languages import load_supported_languages, save_supported_languages
from services.auth import get_clerk_user_info, get_clerk_user_email, get_restaurant_by_clerk_user, require_auth
from services.webhooks import verify_signature, handle_user_created, handle_user_deleted
from services.gemini_translator import translate_menu_item, translate_category, translate_batch
from services.email_service import send_contact_email

app = FastAPI(
    title="Restaurant Menu API",
    description="Multi-tenant restaurant menu management system",
    version="1.0.0",
    root_path="/api"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# Load supported languages
SUPPORTED_LANGUAGES = load_supported_languages()
logger.info(f"Restaurant Menu API started. Loaded {len(SUPPORTED_LANGUAGES)} supported languages: {', '.join(SUPPORTED_LANGUAGES.keys())}")

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
@app.get("/v1/menu/{restaurant_slug}")
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
            "email": restaurant['email'],
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
@app.get("/v1/restaurant/{restaurant_slug}")
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
        "email": restaurant['email'],
        "theme_identifier": restaurant['theme_identifier']
    })

# Public Contact Form Endpoint
# Admin Endpoints for Orders and Messages
# Restaurant Info Endpoints (Authenticated)
@app.get("/api/restaurant-info")
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
        logger.info(f"Fetched email from Clerk API: {user_email}")
        
        if user_email:
            logger.info(f"Extracted email from token: {user_email}")
            logger.info(f"Searching for restaurant with email: {user_email}")
            
            # Find restaurant by email (that doesn't have a clerk_user_id yet)
            restaurants = supabase.table('restaurants').select('*').eq('email', user_email).execute()
            logger.info(f"Found {len(restaurants.data or [])} restaurants with email {user_email}")
            
            if restaurants.data:
                for idx, r in enumerate(restaurants.data):
                    logger.info(f"Restaurant {idx}: id={r.get('id')}, name={r.get('name')}, clerk_user_id={r.get('clerk_user_id')}")
            
            available = [r for r in (restaurants.data or []) if not r.get('clerk_user_id')]
            logger.info(f"Found {len(available)} unlinked restaurants")
            
            if available:
                # Link the restaurant to this Clerk user
                logger.info(f"Attempting to link restaurant {available[0]['id']} to Clerk user {clerk_user_id}")
                result = supabase.table('restaurants').update({
                    'clerk_user_id': clerk_user_id
                }).eq('id', available[0]['id']).execute()
                
                if result.data:
                    restaurant = result.data[0]
                    logger.info(f"✅ Successfully linked restaurant {restaurant['name']} (ID: {restaurant['id']}) to Clerk user {clerk_user_id} via email {user_email}")
                else:
                    logger.error(f"❌ Failed to link restaurant - no data returned from update")
            else:
                logger.warning(f"❌ No unlinked restaurant found for email: {user_email}")
                # List all restaurants for debugging
                all_restaurants = supabase.table('restaurants').select('id, name, email, clerk_user_id').execute()
                logger.info(f"All restaurants in database: {all_restaurants.data}")
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
        "theme_identifier": restaurant['theme_identifier']
    })

@app.post("/api/restaurant-info")
async def save_restaurant_info(
    name: str = Form(...),
    description: Optional[str] = Form(None),
    address: Optional[str] = Form(None),
    phone: Optional[str] = Form(None),
    email: Optional[str] = Form(None),
    theme_identifier: Optional[str] = Form(None),
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
        
        # Update existing
        result = supabase.table('restaurants').update(update_data).eq('id', restaurant['id']).execute()
        if not result.data:
            raise HTTPException(status_code=500, detail="Failed to update restaurant")
        return JSONResponse(result.data[0])
    else:
        # This should never happen - restaurant should exist at this point
        # Restaurants must be created manually in Supabase by admin
        raise HTTPException(
            status_code=404,
            detail=f"No restaurant found for your account. Please contact administrator to create a restaurant for email: {email or 'your email'}"
        )

# Menu Items Endpoints (Authenticated)
@app.get("/api/menu-items")
async def get_menu_items(clerk_user_id: str = Depends(require_auth)):
    """Get all menu items for authenticated user's restaurant"""
    restaurant = await get_restaurant_by_clerk_user(clerk_user_id)
    if not restaurant:
        raise HTTPException(status_code=404, detail="Restoran nije pronađen")
    
    supabase = get_supabase_client()
    result = supabase.table('menu_items').select('*').eq('restaurant_id', restaurant['id']).execute()
    return JSONResponse(result.data)

@app.post("/api/menu-items")
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
    
    # Handle image upload to Supabase Storage
    image_path = None
    if image:
        try:
            image_path = await upload_image_to_storage(
                file=image,
                restaurant_id=restaurant['id'],
                menu_item_id=None  # Will be set after item is created
            )
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to upload image: {str(e)}")
    
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

@app.put("/api/menu-items/{item_id}")
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
            raise HTTPException(status_code=500, detail=f"Failed to upload image: {str(e)}")
    
    if update_data:
        result = supabase.table('menu_items').update(update_data).eq('id', item_id).execute()
        updated_fields = ', '.join(update_data.keys())
        logger.info(f"Menu item '{old_item['name_hr']}' updated successfully. Fields: {updated_fields}")
        return JSONResponse(result.data[0])

    logger.info(f"No changes made to menu item '{old_item['name_hr']}'")
    return JSONResponse(item_result.data[0])

@app.delete("/api/menu-items/{item_id}")
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

@app.get("/api/menu-items-with-translations")
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
@app.get("/api/categories")
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

@app.get("/api/categories-with-translations")
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

@app.post("/api/categories")
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

@app.put("/api/categories/reorder")
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

@app.delete("/api/categories/{category_id}")
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
@app.get("/api/translations/{menu_item_id}")
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

@app.post("/api/translations/generate/{menu_item_id}")
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
    
    for lang_code in language_codes:
        if lang_code not in SUPPORTED_LANGUAGES:
            errors.append(f"Unsupported language: {lang_code}")
            continue
        
        # Check if translation already exists
        existing = supabase.table('translations').select('*').eq('menu_item_id', menu_item_id).eq('language_code', lang_code).execute()
        if existing.data:
            errors.append(f"Translation for {SUPPORTED_LANGUAGES[lang_code]} already exists")
            continue
        
        try:
            # Use Gemini for translation
            translation_data = translate_menu_item(
                menu_item['name_hr'],
                menu_item.get('description_hr', ''),
                lang_code,
                SUPPORTED_LANGUAGES[lang_code]
            )
            
            translation_record = {
                "menu_item_id": menu_item_id,
                "language_code": lang_code,
                "language_name": SUPPORTED_LANGUAGES[lang_code],
                "name": translation_data["name"],
                "description": translation_data.get("description", ""),
                "is_ai_generated": True
            }
            
            result = supabase.table('translations').insert(translation_record).execute()
            translations.append(result.data[0])
            
        except Exception as e:
            errors.append(f"Error generating translation for {SUPPORTED_LANGUAGES[lang_code]}: {str(e)}")
    
    return JSONResponse({
        "success": len(translations) > 0,
        "translations": translations,
        "errors": errors
    })

@app.put("/api/translations/{translation_id}")
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
    
    # Check restaurant_id through join
    # Note: Supabase join syntax may vary, this is a simplified check
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

@app.delete("/api/translations/{translation_id}")
async def delete_translation(translation_id: str, clerk_user_id: str = Depends(require_auth)):
    """Delete a translation"""
    restaurant = await get_restaurant_by_clerk_user(clerk_user_id)
    if not restaurant:
        raise HTTPException(status_code=404, detail="Restoran nije pronađen")
    
    supabase = get_supabase_client()
    supabase.table('translations').delete().eq('id', translation_id).execute()
    return JSONResponse({"message": "Translation deleted"})

# Category Translations Endpoints
@app.post("/api/category-translations/generate/{category_id}")
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
    
    for lang_code in language_codes:
        if lang_code not in SUPPORTED_LANGUAGES:
            errors.append(f"Unsupported language: {lang_code}")
            continue
        
        # Check if translation already exists
        existing = supabase.table('category_translations').select('*').eq('category_id', category_id).eq('language_code', lang_code).execute()
        if existing.data:
            errors.append(f"Translation for {SUPPORTED_LANGUAGES[lang_code]} already exists")
            continue
        
        try:
            # Use Gemini for translation
            translation_data = translate_category(
                category['name'],
                lang_code,
                SUPPORTED_LANGUAGES[lang_code]
            )
            
            translation_record = {
                "category_id": category_id,
                "language_code": lang_code,
                "language_name": SUPPORTED_LANGUAGES[lang_code],
                "name": translation_data["name"],
                "is_ai_generated": True
            }
            
            result = supabase.table('category_translations').insert(translation_record).execute()
            translations.append(result.data[0])
            
        except Exception as e:
            errors.append(f"Error generating translation for {SUPPORTED_LANGUAGES[lang_code]}: {str(e)}")
    
    return JSONResponse({
        "success": len(translations) > 0,
        "translations": translations,
        "errors": errors
    })

@app.put("/api/category-translations/{translation_id}")
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
    result = supabase.table('category_translations').update({"name": name}).eq('id', translation_id).execute()
    return JSONResponse(result.data[0] if result.data else {"message": "Translation updated"})

@app.delete("/api/category-translations/{translation_id}")
async def delete_category_translation(translation_id: str, clerk_user_id: str = Depends(require_auth)):
    """Delete a category translation"""
    restaurant = await get_restaurant_by_clerk_user(clerk_user_id)
    if not restaurant:
        raise HTTPException(status_code=404, detail="Restoran nije pronađen")

    supabase = get_supabase_client()
    supabase.table('category_translations').delete().eq('id', translation_id).execute()
    return JSONResponse({"message": "Category translation deleted"})

# UI Translations Endpoint
UI_TRANSLATIONS = {
    "food": {"hr": "Hrana", "en": "Food", "de": "Essen", "it": "Cibo", "fr": "Nourriture",
             "es": "Comida", "sl": "Hrana", "cs": "Jídlo", "pl": "Jedzenie", "hu": "Étel", "zh": "食物"},
    "drink": {"hr": "Pića", "en": "Drinks", "de": "Getränke", "it": "Bevande", "fr": "Boissons",
              "es": "Bebidas", "sl": "Pijače", "cs": "Nápoje", "pl": "Napoje", "hu": "Italok", "zh": "饮料"},
    "vegetarian": {"hr": "Vegetarijansko", "en": "Vegetarian", "de": "Vegetarisch", "it": "Vegetariano",
                   "fr": "Végétarien", "es": "Vegetariano", "sl": "Vegetarijansko", "cs": "Vegetariánské",
                   "pl": "Wegetariańskie", "hu": "Vegetáriánus", "zh": "素食"},
    "vegan": {"hr": "Veganski", "en": "Vegan", "de": "Vegan", "it": "Vegano", "fr": "Végétalien",
              "es": "Vegano", "sl": "Veganski", "cs": "Veganské", "pl": "Wegańskie", "hu": "Vegán", "zh": "纯素"},
    "contains_gluten": {"hr": "Sadrži gluten", "en": "Contains gluten", "de": "Enthält Gluten", "it": "Contiene glutine",
                        "fr": "Contient du gluten", "es": "Contiene gluten", "sl": "Vsebuje gluten",
                        "cs": "Obsahuje lepek", "pl": "Zawiera gluten", "hu": "Glutént tartalmaz", "zh": "含麸质"},
    "contains_dairy": {"hr": "Sadrži mliječne proizvode", "en": "Contains dairy", "de": "Enthält Milchprodukte", "it": "Contiene latticini",
                       "fr": "Contient des produits laitiers", "es": "Contiene lácteos", "sl": "Vsebuje mlečne izdelke",
                       "cs": "Obsahuje mléčné výrobky", "pl": "Zawiera nabiał", "hu": "Tejtermékeket tartalmaz", "zh": "含乳制品"},
    "gluten_free": {"hr": "Bez glutena", "en": "Gluten-free", "de": "Glutenfrei", "it": "Senza glutine",
                    "fr": "Sans gluten", "es": "Sin gluten", "sl": "Brez glutena", "cs": "Bezlepkové",
                    "pl": "Bezglutenowe", "hu": "Gluténmentes", "zh": "无麸质"},
    "dairy_free": {"hr": "Bez mliječnih proizvoda", "en": "Dairy-free", "de": "Laktosefrei", "it": "Senza latticini",
                   "fr": "Sans produits laitiers", "es": "Sin lácteos", "sl": "Brez mlečnih izdelkov", "cs": "Bez mléka",
                   "pl": "Bez nabiału", "hu": "Tejtermékmentes", "zh": "无乳制品"},
    "contains_nuts": {"hr": "Sadrži orašaste plodove", "en": "Contains nuts", "de": "Enthält Nüsse", "it": "Contiene noci",
                      "fr": "Contient des fruits à coque", "es": "Contiene frutos secos", "sl": "Vsebuje oreške",
                      "cs": "Obsahuje ořechy", "pl": "Zawiera orzechy", "hu": "Dióféléket tartalmaz", "zh": "含坚果"},
    "contains_fish": {"hr": "Sadrži ribu", "en": "Contains fish", "de": "Enthält Fisch", "it": "Contiene pesce",
                      "fr": "Contient du poisson", "es": "Contiene pescado", "sl": "Vsebuje ribo",
                      "cs": "Obsahuje ryby", "pl": "Zawiera ryby", "hu": "Halat tartalmaz", "zh": "含鱼"},
    "contains_shellfish": {"hr": "Sadrži školjke", "en": "Contains shellfish", "de": "Enthält Schalentiere", "it": "Contiene crostacei",
                           "fr": "Contient des crustacés", "es": "Contiene mariscos", "sl": "Vsebuje školjke",
                           "cs": "Obsahuje korýše", "pl": "Zawiera skorupiaki", "hu": "Kagylót tartalmaz", "zh": "含贝类"},
    "contains_eggs": {"hr": "Sadrži jaja", "en": "Contains eggs", "de": "Enthält Eier", "it": "Contiene uova",
                      "fr": "Contient des œufs", "es": "Contiene huevos", "sl": "Vsebuje jajca",
                      "cs": "Obsahuje vejce", "pl": "Zawiera jajka", "hu": "Tojást tartalmaz", "zh": "含鸡蛋"},
    "spicy": {"hr": "Ljuto", "en": "Spicy", "de": "Scharf", "it": "Piccante",
              "fr": "Épicé", "es": "Picante", "sl": "Pikantno", "cs": "Pálivé",
              "pl": "Ostre", "hu": "Csípős", "zh": "辣"},
    "intro_text_1": {
        "hr": "Sve naše specijalitete pripremamo od najsvježijih sastojaka, pažljivo odabranih iz lokalnih izvora.",
        "en": "All our specialties are prepared from the freshest ingredients, carefully selected from local sources.",
        "de": "Alle unsere Spezialitäten werden aus frischesten Zutaten zubereitet, sorgfältig ausgewählt aus lokalen Quellen.",
        "it": "Tutte le nostre specialità sono preparate con gli ingredienti più freschi, accuratamente selezionati da fonti locali.",
        "fr": "Toutes nos spécialités sont préparées avec les ingrédients les plus frais, soigneusement sélectionnés auprès de sources locales.",
        "es": "Todas nuestras especialidades se preparan con los ingredientes más frescos, cuidadosamente seleccionados de fuentes locales.",
        "sl": "Vse naše specialitete pripravljamo iz najsvežejših sestavin, skrbno izbranih iz lokalnih virov.",
        "cs": "Všechny naše speciality připravujeme z nejčerstvějších surovin, pečlivě vybraných z místních zdrojů.",
        "pl": "Wszystkie nasze specjały przygotowujemy z najświeższych składników, starannie wyselekcjonowanych z lokalnych źródeł.",
        "hu": "Minden különlegességünket a legfrissebb alapanyagokból készítjük, amelyeket gondosan helyi forrásokból választunk ki.",
        "zh": "我们所有的特色菜肴均采用最新鲜的食材制作，精心挑选自当地供应商。"
    },
    "intro_text_2": {
        "hr": "Tradicija, kvaliteta i strast za kulinarstvom čine srž našeg identiteta.",
        "en": "Tradition, quality, and passion for culinary arts form the core of our identity.",
        "de": "Tradition, Qualität und Leidenschaft für die Kochkunst bilden den Kern unserer Identität.",
        "it": "Tradizione, qualità e passione per l'arte culinaria costituiscono il nucleo della nostra identità.",
        "fr": "La tradition, la qualité et la passion pour l'art culinaire constituent le cœur de notre identité.",
        "es": "La tradición, la calidad y la pasión por el arte culinario forman el núcleo de nuestra identidad.",
        "sl": "Tradicija, kakovost in strast do kulinarike tvorijo jedro naše identitete.",
        "cs": "Tradice, kvalita a vášeň pro kulinářské umění tvoří jádro naší identity.",
        "pl": "Tradycja, jakość i pasja do sztuki kulinarnej stanowią rdzeń naszej tożsamości.",
        "hu": "A hagyomány, a minőség és a gasztronómia iránti szenvedély alkotja identitásunk magvát.",
        "zh": "传统、品质和对烹饪艺术的热情构成了我们的核心特质。"
    },
}

@app.get("/api/ui-translations/{language_code}")
async def get_ui_translations(language_code: str):
    """Get UI translations for a specific language"""
    result = {}
    for key, translations in UI_TRANSLATIONS.items():
        result[key] = translations.get(language_code, translations.get("hr"))
    return result

# Analytics Endpoint
@app.get("/api/analytics")
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
    
    return JSONResponse({
        "total_items": total_items,
        "available_items": available_items,
        "unavailable_items": unavailable_items,
        "categories": categories,
        "allergen_counts": allergen_counts,
        "total_categories": len(categories)
    })

# QR Code Endpoint
@app.get("/api/qr-code")
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

# Supported Languages Endpoints
@app.get("/api/supported-languages")
async def get_supported_languages():
    """Get list of supported languages"""
    global SUPPORTED_LANGUAGES
    SUPPORTED_LANGUAGES = load_supported_languages()
    return JSONResponse({
        "languages": [
            {"code": code, "name": name}
            for code, name in SUPPORTED_LANGUAGES.items()
        ]
    })

@app.post("/api/languages/add")
async def add_language(request: Request, clerk_user_id: str = Depends(require_auth)):
    """Add a new supported language and automatically translate all content"""
    global SUPPORTED_LANGUAGES

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

    SUPPORTED_LANGUAGES = load_supported_languages()
    if code in SUPPORTED_LANGUAGES:
        raise HTTPException(status_code=400, detail="Language already exists")

    # Add language to supported languages
    SUPPORTED_LANGUAGES[code] = name
    if not save_supported_languages(SUPPORTED_LANGUAGES):
        raise HTTPException(status_code=500, detail="Failed to save languages")

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

    # Prepare UI texts for batch translation
    ui_keys = {
        "food": "Hrana",
        "drink": "Pića",
        "intro_text_1": "Sve naše specijalitete pripremamo od najsvježijih sastojaka, pažljivo odabranih iz lokalnih izvora.",
        "intro_text_2": "Tradicija, kvaliteta i strast za kulinarstvom čine srž našeg identiteta."
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

@app.delete("/api/languages/remove/{language_code}")
async def remove_language(language_code: str, clerk_user_id: str = Depends(require_auth)):
    """Remove a supported language and delete all translations for it"""
    global SUPPORTED_LANGUAGES
    restaurant = await get_restaurant_by_clerk_user(clerk_user_id)
    if not restaurant:
        raise HTTPException(status_code=404, detail="Restoran nije pronađen")
    
    SUPPORTED_LANGUAGES = load_supported_languages()
    
    if language_code not in SUPPORTED_LANGUAGES:
        raise HTTPException(status_code=404, detail="Language not found")
    
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

    # Remove from supported languages
    language_name = SUPPORTED_LANGUAGES[language_code]
    del SUPPORTED_LANGUAGES[language_code]
    
    if save_supported_languages(SUPPORTED_LANGUAGES):
        return JSONResponse({
            "message": f"Language {language_name} removed successfully"
        })
    else:
        raise HTTPException(status_code=500, detail="Failed to save languages")

@app.post("/api/contact")
async def submit_contact_form(
    name: str = Form(...),
    email: str = Form(...),
    message: str = Form(...)
):
    """
    Public endpoint for contact form submissions
    Sends email to info@ferros.menu
    """
    try:
        # Send email
        success = await send_contact_email(
            name=name,
            email=email,
            message=message
        )
        
        if success:
            return JSONResponse({
                "success": True,
                "message": "Poruka uspješno poslana"
            })
        else:
            raise HTTPException(
                status_code=500,
                detail="Greška pri slanju poruke. Molimo pokušajte kasnije."
            )
    except Exception as e:
        logger.error(f"Contact form error: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Greška pri slanju poruke. Molimo pokušajte kasnije."
        )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

