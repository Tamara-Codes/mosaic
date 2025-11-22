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
from openai import OpenAI
from core.supabase_client import get_supabase_client, get_supabase_anon_client
from slugify import slugify
from utils.storage_utils import upload_image_to_storage, delete_image_from_storage, get_image_url

# Load environment variables
load_dotenv()

from core.config import CORS_ORIGINS, OPENAI_API_KEY, MENU_URL
from services.languages import load_supported_languages, save_supported_languages
from services.auth import get_clerk_user_id, get_restaurant_by_clerk_user, require_auth
from services.webhooks import verify_signature, handle_user_created, handle_user_deleted

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
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize OpenAI client
openai_client = OpenAI(api_key=OPENAI_API_KEY)

# Load supported languages
SUPPORTED_LANGUAGES = load_supported_languages()

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
    Public endpoint to get menu data for a restaurant
    Returns: menu items, restaurant info, and theme_identifier
    """
    supabase = get_supabase_anon_client()
    
    # Get restaurant by slug
    restaurant_result = supabase.table('restaurants').select('*').eq('slug', restaurant_slug).execute()
    
    if not restaurant_result.data:
        raise HTTPException(status_code=404, detail="Restaurant not found")
    
    restaurant = restaurant_result.data[0]
    
    # Get active menu (for now, get the first active menu)
    menu_result = supabase.table('menus').select('*').eq('restaurant_id', restaurant['id']).eq('is_active', True).limit(1).execute()
    
    if not menu_result.data:
        raise HTTPException(status_code=404, detail="No active menu found")
    
    menu = menu_result.data[0]
    
    # Get menu items
    items_result = supabase.table('menu_items').select('*').eq('restaurant_id', restaurant['id']).eq('menu_id', menu['id']).eq('is_available', True).execute()
    
    # Get categories
    categories_result = supabase.table('categories').select('*').eq('restaurant_id', restaurant['id']).order('order_index').execute()
    
    # Get translations for menu items and ensure image URLs are public URLs
    menu_items = items_result.data
    for item in menu_items:
        translations_result = supabase.table('translations').select('*').eq('menu_item_id', item['id']).execute()
        item['translations'] = translations_result.data
        # Ensure image_path is a full public URL if it exists
        if item.get('image_path'):
            item['image_path'] = get_image_url(item['image_path'])
    
    # Get category translations
    categories = categories_result.data
    for category in categories:
        cat_translations_result = supabase.table('category_translations').select('*').eq('category_id', category['id']).execute()
        category['translations'] = cat_translations_result.data
    
    return JSONResponse({
        "restaurant": {
            "id": restaurant['id'],
            "name": restaurant['name'],
            "slug": restaurant['slug'],
            "description": restaurant['description'],
            "address": restaurant['address'],
            "phone": restaurant['phone'],
            "email": restaurant['email'],
            "theme_identifier": restaurant['theme_identifier']
        },
        "menu": {
            "id": menu['id'],
            "name": menu['name'],
            "slug": menu['slug'],
            "description": menu['description']
        },
        "menu_items": menu_items,
        "categories": categories
    })

# Restaurant Info Endpoints (Authenticated)
@app.get("/restaurant-info")
async def get_restaurant_info(clerk_user_id: str = Depends(require_auth)):
    """Get restaurant information for authenticated user"""
    restaurant = await get_restaurant_by_clerk_user(clerk_user_id)
    if not restaurant:
        raise HTTPException(status_code=404, detail="Restaurant not found")
    
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

@app.post("/restaurant-info")
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
        # Check if slug already exists before creating
        existing = supabase.table('restaurants').select('id, name, email').eq('slug', slug).execute()
        if existing.data:
            existing_restaurant = existing.data[0]
            raise HTTPException(
                status_code=400, 
                detail=f"Restaurant with name '{name}' (slug: '{slug}') already exists. "
                       f"If this is your restaurant, please ensure you're using the email '{existing_restaurant.get('email', 'N/A')}' "
                       f"or contact support to link your account."
            )
        
        # Create new (shouldn't happen if auth is set up correctly)
        update_data = {
            "name": name,
            "slug": slug,
            "description": description or "",
            "address": address or "",
            "phone": phone or "",
            "email": email or "",
            "clerk_user_id": clerk_user_id
        }
        
        if theme_identifier:
            update_data["theme_identifier"] = theme_identifier
        
        try:
            result = supabase.table('restaurants').insert(update_data).execute()
            if not result.data:
                raise HTTPException(status_code=500, detail="Failed to create restaurant")
            return JSONResponse(result.data[0])
        except Exception as e:
            error_msg = str(e)
            if "duplicate key" in error_msg.lower() or "23505" in error_msg:
                raise HTTPException(
                    status_code=400,
                    detail=f"Restaurant with this name or slug already exists. Please contact support to link your account."
                )
            raise HTTPException(status_code=500, detail=f"Error creating restaurant: {error_msg}")

# Menu Items Endpoints (Authenticated)
@app.get("/menu-items")
async def get_menu_items(clerk_user_id: str = Depends(require_auth)):
    """Get all menu items for authenticated user's restaurant"""
    restaurant = await get_restaurant_by_clerk_user(clerk_user_id)
    if not restaurant:
        raise HTTPException(status_code=404, detail="Restaurant not found")
    
    supabase = get_supabase_client()
    result = supabase.table('menu_items').select('*').eq('restaurant_id', restaurant['id']).execute()
    return JSONResponse(result.data)

@app.post("/menu-items")
async def create_menu_item(
    name_hr: str = Form(...),
    description_hr: Optional[str] = Form(None),
    price: float = Form(...),
    category: Optional[str] = Form(None),
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
        raise HTTPException(status_code=404, detail="Restaurant not found")
    
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
        "name_en": name_hr,  # Default to Croatian name
        "description_hr": description_hr,
        "description_en": description_hr,
        "price": price,
        "category": category,
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

@app.put("/menu-items/{item_id}")
async def update_menu_item(
    item_id: str,
    name_hr: Optional[str] = Form(None),
    description_hr: Optional[str] = Form(None),
    price: Optional[float] = Form(None),
    category: Optional[str] = Form(None),
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
        raise HTTPException(status_code=404, detail="Restaurant not found")
    
    supabase = get_supabase_client()
    
    # Verify item belongs to restaurant
    item_result = supabase.table('menu_items').select('*').eq('id', item_id).eq('restaurant_id', restaurant['id']).execute()
    if not item_result.data:
        raise HTTPException(status_code=404, detail="Menu item not found")
    
    def str_to_bool(value: Optional[str]) -> bool:
        return value.lower() in ("true", "on", "1") if value else False
    
    update_data = {}
    
    if name_hr is not None:
        update_data["name_hr"] = name_hr
        update_data["name_en"] = name_hr  # Keep in sync
    if description_hr is not None:
        update_data["description_hr"] = description_hr
        update_data["description_en"] = description_hr
    if price is not None:
        update_data["price"] = price
    if category is not None:
        update_data["category"] = category
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
        return JSONResponse(result.data[0])
    
    return JSONResponse(item_result.data[0])

@app.delete("/menu-items/{item_id}")
async def delete_menu_item(item_id: str, clerk_user_id: str = Depends(require_auth)):
    """Delete a menu item"""
    restaurant = await get_restaurant_by_clerk_user(clerk_user_id)
    if not restaurant:
        raise HTTPException(status_code=404, detail="Restaurant not found")
    
    supabase = get_supabase_client()
    
    # Verify item belongs to restaurant
    item_result = supabase.table('menu_items').select('*').eq('id', item_id).eq('restaurant_id', restaurant['id']).execute()
    if not item_result.data:
        raise HTTPException(status_code=404, detail="Menu item not found")
    
    # Delete image from Supabase Storage if exists
    image_path = item_result.data[0].get('image_path')
    if image_path:
        delete_image_from_storage(image_path)
    
    supabase.table('menu_items').delete().eq('id', item_id).execute()
    return JSONResponse({"message": "Menu item deleted"})

@app.get("/menu-items-with-translations")
async def get_menu_items_with_translations(clerk_user_id: str = Depends(require_auth)):
    """Get all menu items with their translations"""
    restaurant = await get_restaurant_by_clerk_user(clerk_user_id)
    if not restaurant:
        raise HTTPException(status_code=404, detail="Restaurant not found")
    
    supabase = get_supabase_client()
    items_result = supabase.table('menu_items').select('*').eq('restaurant_id', restaurant['id']).execute()
    
    menu_items = items_result.data
    for item in menu_items:
        translations_result = supabase.table('translations').select('*').eq('menu_item_id', item['id']).execute()
        item['translations'] = translations_result.data
    
    return JSONResponse(menu_items)

# Categories Endpoints
@app.get("/categories")
async def get_categories(clerk_user_id: str = Depends(require_auth)):
    """Get all categories for authenticated user's restaurant"""
    restaurant = await get_restaurant_by_clerk_user(clerk_user_id)
    if not restaurant:
        raise HTTPException(status_code=404, detail="Restaurant not found")
    
    supabase = get_supabase_client()
    result = supabase.table('categories').select('*').eq('restaurant_id', restaurant['id']).order('order_index').execute()
    
    categories_list = [cat['name'] for cat in result.data]
    categories_with_ids = [{"id": cat['id'], "name": cat['name'], "order": cat['order_index']} for cat in result.data]
    
    return JSONResponse({
        "categories": categories_list,
        "categories_with_ids": categories_with_ids
    })

@app.get("/categories-with-translations")
async def get_categories_with_translations(clerk_user_id: str = Depends(require_auth)):
    """Get all categories with their translations"""
    restaurant = await get_restaurant_by_clerk_user(clerk_user_id)
    if not restaurant:
        raise HTTPException(status_code=404, detail="Restaurant not found")
    
    supabase = get_supabase_client()
    categories_result = supabase.table('categories').select('*').eq('restaurant_id', restaurant['id']).order('order_index').execute()
    
    categories = categories_result.data
    for category in categories:
        translations_result = supabase.table('category_translations').select('*').eq('category_id', category['id']).execute()
        category['translations'] = translations_result.data
    
    return JSONResponse(categories)

@app.post("/categories")
async def create_category(
    name: str = Form(...),
    order: Optional[int] = Form(None),
    clerk_user_id: str = Depends(require_auth)
):
    """Create a new category"""
    restaurant = await get_restaurant_by_clerk_user(clerk_user_id)
    if not restaurant:
        raise HTTPException(status_code=404, detail="Restaurant not found")
    
    supabase = get_supabase_client()
    
    # Check if category already exists
    existing = supabase.table('categories').select('*').eq('restaurant_id', restaurant['id']).eq('name', name).execute()
    if existing.data:
        raise HTTPException(status_code=400, detail="Category already exists")
    
    # Get max order
    all_categories = supabase.table('categories').select('order_index').eq('restaurant_id', restaurant['id']).execute()
    max_order = max([cat['order_index'] for cat in all_categories.data], default=-1) if all_categories.data else -1
    next_order = order if order is not None else (max_order + 1)
    
    category_data = {
        "restaurant_id": restaurant['id'],
        "name": name,
        "order_index": next_order
    }
    
    result = supabase.table('categories').insert(category_data).execute()
    return JSONResponse(result.data[0])

@app.put("/categories/reorder")
async def reorder_categories(
    request: Request,
    clerk_user_id: str = Depends(require_auth)
):
    """Reorder categories"""
    restaurant = await get_restaurant_by_clerk_user(clerk_user_id)
    if not restaurant:
        raise HTTPException(status_code=404, detail="Restaurant not found")
    
    # Parse JSON body
    body = await request.json()
    categories_order = body if isinstance(body, list) else []
    
    supabase = get_supabase_client()
    
    for idx, item in enumerate(categories_order):
        if not isinstance(item, dict) or "id" not in item:
            continue
        supabase.table('categories').update({"order_index": idx}).eq('id', item["id"]).eq('restaurant_id', restaurant['id']).execute()
    
    return JSONResponse({"message": "Categories reordered"})

@app.delete("/categories/{category_id}")
async def delete_category(category_id: str, clerk_user_id: str = Depends(require_auth)):
    """Delete a category"""
    restaurant = await get_restaurant_by_clerk_user(clerk_user_id)
    if not restaurant:
        raise HTTPException(status_code=404, detail="Restaurant not found")
    
    supabase = get_supabase_client()
    
    # Verify category belongs to restaurant
    category_result = supabase.table('categories').select('*').eq('id', category_id).eq('restaurant_id', restaurant['id']).execute()
    if not category_result.data:
        raise HTTPException(status_code=404, detail="Category not found")
    
    category_name = category_result.data[0]['name']
    
    # Remove category from menu items
    supabase.table('menu_items').update({"category": None}).eq('restaurant_id', restaurant['id']).eq('category', category_name).execute()
    
    # Delete category
    supabase.table('categories').delete().eq('id', category_id).execute()
    
    return JSONResponse({"message": "Category deleted"})

# Translations Endpoints
@app.get("/translations/{menu_item_id}")
async def get_translations(menu_item_id: str, clerk_user_id: str = Depends(require_auth)):
    """Get all translations for a menu item"""
    restaurant = await get_restaurant_by_clerk_user(clerk_user_id)
    if not restaurant:
        raise HTTPException(status_code=404, detail="Restaurant not found")
    
    supabase = get_supabase_client()
    
    # Verify menu item belongs to restaurant
    item_result = supabase.table('menu_items').select('*').eq('id', menu_item_id).eq('restaurant_id', restaurant['id']).execute()
    if not item_result.data:
        raise HTTPException(status_code=404, detail="Menu item not found")
    
    result = supabase.table('translations').select('*').eq('menu_item_id', menu_item_id).execute()
    return JSONResponse(result.data)

@app.post("/translations/generate/{menu_item_id}")
async def generate_translations(
    menu_item_id: str,
    language_codes: List[str],
    clerk_user_id: str = Depends(require_auth)
):
    """Generate AI translations for a menu item"""
    restaurant = await get_restaurant_by_clerk_user(clerk_user_id)
    if not restaurant:
        raise HTTPException(status_code=404, detail="Restaurant not found")
    
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
            prompt = f"""Translate the following restaurant menu item from Croatian to {SUPPORTED_LANGUAGES[lang_code]}.
Keep the translation natural and appetizing for a restaurant menu.

Croatian Name: {menu_item['name_hr']}
Croatian Description: {menu_item.get('description_hr', '')}

Provide the translation in the following JSON format:
{{
    "name": "translated name",
    "description": "translated description"
}}"""
            
            response = openai_client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": "You are a professional translator specialized in restaurant menus. Always respond with valid JSON."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.3,
                response_format={"type": "json_object"}
            )
            
            translation_data = json.loads(response.choices[0].message.content)
            
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

@app.put("/translations/{translation_id}")
async def update_translation(
    translation_id: str,
    name: Optional[str] = Form(None),
    description: Optional[str] = Form(None),
    clerk_user_id: str = Depends(require_auth)
):
    """Update a translation"""
    restaurant = await get_restaurant_by_clerk_user(clerk_user_id)
    if not restaurant:
        raise HTTPException(status_code=404, detail="Restaurant not found")
    
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

@app.delete("/translations/{translation_id}")
async def delete_translation(translation_id: str, clerk_user_id: str = Depends(require_auth)):
    """Delete a translation"""
    restaurant = await get_restaurant_by_clerk_user(clerk_user_id)
    if not restaurant:
        raise HTTPException(status_code=404, detail="Restaurant not found")
    
    supabase = get_supabase_client()
    supabase.table('translations').delete().eq('id', translation_id).execute()
    return JSONResponse({"message": "Translation deleted"})

# Category Translations Endpoints
@app.post("/category-translations/generate/{category_id}")
async def generate_category_translations(
    category_id: str,
    language_codes: List[str],
    clerk_user_id: str = Depends(require_auth)
):
    """Generate AI translations for a category"""
    restaurant = await get_restaurant_by_clerk_user(clerk_user_id)
    if not restaurant:
        raise HTTPException(status_code=404, detail="Restaurant not found")
    
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
            prompt = f"""Translate the following restaurant menu category name from Croatian to {SUPPORTED_LANGUAGES[lang_code]}.
Keep the translation natural and appropriate for a restaurant menu category.

Croatian Category Name: {category['name']}

Provide the translation in the following JSON format:
{{
    "name": "translated category name"
}}"""
            
            response = openai_client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": "You are a professional translator specialized in restaurant menus. Always respond with valid JSON."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.3,
                response_format={"type": "json_object"}
            )
            
            translation_data = json.loads(response.choices[0].message.content)
            
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

@app.put("/category-translations/{translation_id}")
async def update_category_translation(
    translation_id: str,
    name: str = Form(...),
    clerk_user_id: str = Depends(require_auth)
):
    """Update a category translation"""
    restaurant = await get_restaurant_by_clerk_user(clerk_user_id)
    if not restaurant:
        raise HTTPException(status_code=404, detail="Restaurant not found")
    
    supabase = get_supabase_client()
    result = supabase.table('category_translations').update({"name": name}).eq('id', translation_id).execute()
    return JSONResponse(result.data[0] if result.data else {"message": "Translation updated"})

@app.delete("/category-translations/{translation_id}")
async def delete_category_translation(translation_id: str, clerk_user_id: str = Depends(require_auth)):
    """Delete a category translation"""
    restaurant = await get_restaurant_by_clerk_user(clerk_user_id)
    if not restaurant:
        raise HTTPException(status_code=404, detail="Restaurant not found")
    
    supabase = get_supabase_client()
    supabase.table('category_translations').delete().eq('id', translation_id).execute()
    return JSONResponse({"message": "Category translation deleted"})

# Analytics Endpoint
@app.get("/analytics")
async def get_analytics(clerk_user_id: str = Depends(require_auth)):
    """Get analytics data for dashboard"""
    restaurant = await get_restaurant_by_clerk_user(clerk_user_id)
    if not restaurant:
        raise HTTPException(status_code=404, detail="Restaurant not found")
    
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
@app.get("/qr-code")
async def generate_qr_code_api(clerk_user_id: Optional[str] = Depends(get_clerk_user_id)):
    """Generate QR code for the menu"""
    menu_url = MENU_URL
    
    # If authenticated, get restaurant slug for specific menu URL
    if clerk_user_id:
        restaurant = await get_restaurant_by_clerk_user(clerk_user_id)
        if restaurant:
            menu_url = f"{menu_url}/menu/{restaurant['slug']}"
    
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
@app.get("/supported-languages")
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

@app.post("/languages/add")
async def add_language(request: Request):
    """Add a new supported language"""
    global SUPPORTED_LANGUAGES
    
    # Parse JSON body
    body = await request.json()
    code = body.get("code")
    name = body.get("name")
    
    if not code or not name:
        raise HTTPException(status_code=400, detail="Language code and name are required")
    
    SUPPORTED_LANGUAGES = load_supported_languages()
    if code in SUPPORTED_LANGUAGES:
        raise HTTPException(status_code=400, detail="Language already exists")
    
    SUPPORTED_LANGUAGES[code] = name
    if save_supported_languages(SUPPORTED_LANGUAGES):
        return JSONResponse({"message": f"Language {name} added successfully"})
    else:
        raise HTTPException(status_code=500, detail="Failed to save languages")

@app.delete("/languages/remove/{language_code}")
async def remove_language(language_code: str, clerk_user_id: str = Depends(require_auth)):
    """Remove a supported language and delete all translations for it"""
    global SUPPORTED_LANGUAGES
    restaurant = await get_restaurant_by_clerk_user(clerk_user_id)
    if not restaurant:
        raise HTTPException(status_code=404, detail="Restaurant not found")
    
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
    
    # Remove from supported languages
    language_name = SUPPORTED_LANGUAGES[language_code]
    del SUPPORTED_LANGUAGES[language_code]
    
    if save_supported_languages(SUPPORTED_LANGUAGES):
        return JSONResponse({
            "message": f"Language {language_name} removed successfully"
        })
    else:
        raise HTTPException(status_code=500, detail="Failed to save languages")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

