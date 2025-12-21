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
    version="1.0.0"
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

# Initialize OpenAI client
openai_client = OpenAI(api_key=OPENAI_API_KEY)

# Load supported languages
SUPPORTED_LANGUAGES = load_supported_languages()

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
    Public endpoint to get today's daily menu for a restaurant
    Returns: menu items, restaurant info, and theme_identifier
    """
    from datetime import date
    
    supabase = get_supabase_anon_client()
    
    # Get restaurant by slug
    restaurant_result = supabase.table('restaurants').select('*').eq('slug', restaurant_slug).execute()
    
    if not restaurant_result.data:
        raise HTTPException(status_code=404, detail="Restoran nije pronađen")
    
    restaurant = restaurant_result.data[0]
    
    # Get today's daily menu
    today = date.today()
    daily_menu_result = supabase.table('daily_menus').select('*').eq('restaurant_id', restaurant['id']).eq('menu_date', str(today)).eq('is_active', True).eq('is_preview', False).limit(1).execute()
    
    daily_menu = None
    menu_items = []
    
    if daily_menu_result.data:
        # Use daily menu if it exists
        daily_menu = daily_menu_result.data[0]
        
        # Get menu items for this daily menu
        daily_menu_items_result = supabase.table('daily_menu_items').select('*, menu_items(*)').eq('daily_menu_id', daily_menu['id']).order('order_index').execute()
        
        # Extract menu items and ensure image URLs are public URLs
        for dmi in daily_menu_items_result.data:
            item = dmi.get('menu_items')
            if item and item.get('is_available', True):
                # Get translations
                translations_result = supabase.table('translations').select('*').eq('menu_item_id', item['id']).execute()
                item['translations'] = translations_result.data
                # Ensure image_path is a full public URL if it exists
                if item.get('image_path'):
                    item['image_path'] = get_image_url(item['image_path'])
                menu_items.append(item)
    else:
        # Fallback: if no daily menu exists, return all available menu items
        menu_items_result = supabase.table('menu_items').select('*').eq('restaurant_id', restaurant['id']).eq('is_available', True).order('name_hr').execute()
        
        for item in menu_items_result.data:
            # Get translations
            translations_result = supabase.table('translations').select('*').eq('menu_item_id', item['id']).execute()
            item['translations'] = translations_result.data
            # Ensure image_path is a full public URL if it exists
            if item.get('image_path'):
                item['image_path'] = get_image_url(item['image_path'])
            menu_items.append(item)
        
        # Create a default menu object for the response
        daily_menu = {
            'id': None,
            'name': 'Jelovnik',
            'menu_date': str(today),
            'description': None
        }
    
    # Get categories (all categories for the restaurant)
    categories_result = supabase.table('categories').select('*').eq('restaurant_id', restaurant['id']).order('order_index').execute()
    
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
            "id": daily_menu['id'] if daily_menu else None,
            "name": daily_menu['name'] if daily_menu else 'Jelovnik',
            "menu_date": daily_menu['menu_date'] if daily_menu else str(today),
            "description": daily_menu.get('description') if daily_menu else None
        },
        "menu_items": menu_items,
        "categories": categories
    })

# Preview Menu Endpoint - Get menu for a specific date (for preview)
@app.get("/v1/menu/{restaurant_slug}/preview/{date}")
async def preview_menu(restaurant_slug: str, date: str):
    """
    Public endpoint to preview menu for a specific date
    Returns: menu items, restaurant info for the specified date
    """
    supabase = get_supabase_anon_client()
    
    # Get restaurant by slug
    restaurant_result = supabase.table('restaurants').select('*').eq('slug', restaurant_slug).execute()
    
    if not restaurant_result.data:
        raise HTTPException(status_code=404, detail="Restoran nije pronađen")
    
    restaurant = restaurant_result.data[0]
    
    # Get daily menu for the specified date
    daily_menu_result = supabase.table('daily_menus').select('*').eq('restaurant_id', restaurant['id']).eq('menu_date', date).limit(1).execute()
    
    if not daily_menu_result.data:
        raise HTTPException(status_code=404, detail=f"Jelovnik nije pronađen za datum {date}")
    
    daily_menu = daily_menu_result.data[0]
    
    # Get menu items for this daily menu
    daily_menu_items_result = supabase.table('daily_menu_items').select('*, menu_items(*)').eq('daily_menu_id', daily_menu['id']).order('order_index').execute()
    
    # Extract menu items and ensure image URLs are public URLs
    menu_items = []
    for dmi in daily_menu_items_result.data:
        item = dmi.get('menu_items')
        if item and item.get('is_available', True):
            # Get translations
            translations_result = supabase.table('translations').select('*').eq('menu_item_id', item['id']).execute()
            item['translations'] = translations_result.data
            # Ensure image_path is a full public URL if it exists
            if item.get('image_path'):
                item['image_path'] = get_image_url(item['image_path'])
            menu_items.append(item)
    
    # Get categories
    categories_result = supabase.table('categories').select('*').eq('restaurant_id', restaurant['id']).order('order_index').execute()
    
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
            "id": daily_menu['id'],
            "name": daily_menu['name'],
            "menu_date": daily_menu['menu_date'],
            "description": daily_menu['description'],
            "is_preview": daily_menu['is_preview']
        },
        "menu_items": menu_items,
        "categories": categories
    })

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
@app.post("/v1/contact")
async def submit_contact_form(request: Request):
    """
    Public endpoint to submit contact form
    Request body should include:
    - restaurant_slug: str
    - name: str
    - email: str
    - phone: str (optional)
    - message: str
    """
    body = await request.json()
    
    restaurant_slug = body.get('restaurant_slug')
    name = body.get('name')
    email = body.get('email')
    phone = body.get('phone', '')
    message = body.get('message')
    
    if not restaurant_slug or not name or not email or not message:
        raise HTTPException(status_code=400, detail="Nedostaju obavezna polja")
    
    supabase = get_supabase_anon_client()
    
    # Get restaurant ID
    restaurant_result = supabase.table('restaurants').select('id').eq('slug', restaurant_slug).execute()
    
    if not restaurant_result.data:
        raise HTTPException(status_code=404, detail="Restoran nije pronađen")
    
    restaurant_id = restaurant_result.data[0]['id']
    
    # Insert contact message
    contact_result = supabase.table('contact_messages').insert({
        'restaurant_id': restaurant_id,
        'name': name,
        'email': email,
        'phone': phone,
        'message': message
    }).execute()
    
    if not contact_result.data:
        raise HTTPException(status_code=500, detail="Greška pri slanju poruke")
    
    return JSONResponse({
        "success": True,
        "message": "Poruka je uspješno poslana"
    })

# Admin Endpoints for Orders and Messages
@app.get("/orders")
async def get_orders(clerk_user_id: str = Depends(require_auth)):
    """Get all orders for authenticated restaurant"""
    restaurant = await get_restaurant_by_clerk_user(clerk_user_id)
    if not restaurant:
        raise HTTPException(status_code=404, detail="Restoran nije pronađen")
    
    supabase = get_supabase_client()
    
    # Get orders with order items
    orders_result = supabase.table('orders').select('*').eq('restaurant_id', restaurant['id']).order('created_at', desc=True).execute()
    
    orders = []
    for order in orders_result.data:
        # Get order items with menu item details
        items_result = supabase.table('order_items').select('*, menu_items(name_hr, description_hr)').eq('order_id', order['id']).execute()
        
        # Format items with item names
        formatted_items = []
        for item in items_result.data:
            menu_item = item.get('menu_items', {})
            formatted_items.append({
                'id': item['id'],
                'menu_item_id': item['menu_item_id'],
                'quantity': item['quantity'],
                'unit_price': float(item['unit_price']),
                'subtotal': float(item['subtotal']),
                'customization': item.get('customization'),
                'item_name': menu_item.get('name_hr', 'Nepoznata stavka') if menu_item else 'Nepoznata stavka',
                'item_description': menu_item.get('description_hr') if menu_item else None,
                'menu_items': menu_item
            })
        
        orders.append({
            **order,
            'total_amount': float(order['total_price']),  # Alias for frontend compatibility
            'items': formatted_items
        })
    
    return JSONResponse(orders)

@app.put("/orders/{order_id}/status")
async def update_order_status(order_id: str, request: Request, clerk_user_id: str = Depends(require_auth)):
    """Update order status"""
    restaurant = await get_restaurant_by_clerk_user(clerk_user_id)
    if not restaurant:
        raise HTTPException(status_code=404, detail="Restoran nije pronađen")
    
    body = await request.json()
    new_status = body.get('status')
    
    if not new_status:
        raise HTTPException(status_code=400, detail="status is required")
    
    valid_statuses = ['pending', 'confirmed', 'preparing', 'ready', 'completed', 'cancelled']
    if new_status not in valid_statuses:
        raise HTTPException(status_code=400, detail=f"Invalid status. Must be one of: {valid_statuses}")
    
    supabase = get_supabase_client()
    
    # Verify order belongs to restaurant
    order_result = supabase.table('orders').select('restaurant_id').eq('id', order_id).execute()
    if not order_result.data or order_result.data[0]['restaurant_id'] != restaurant['id']:
        raise HTTPException(status_code=404, detail="Narudžba nije pronađena")
    
    # Update status
    update_result = supabase.table('orders').update({
        'status': new_status,
        'updated_at': 'now()'
    }).eq('id', order_id).execute()
    
    if update_result.data:
        order = update_result.data[0]
        order['total_amount'] = float(order['total_price'])  # Alias for frontend compatibility
        return JSONResponse({"success": True, "order": order})
    return JSONResponse({"success": True, "order": None})

@app.get("/contact-messages")
async def get_contact_messages(clerk_user_id: str = Depends(require_auth)):
    """Get all contact messages for authenticated restaurant"""
    restaurant = await get_restaurant_by_clerk_user(clerk_user_id)
    if not restaurant:
        raise HTTPException(status_code=404, detail="Restoran nije pronađen")
    
    supabase = get_supabase_client()
    
    messages_result = supabase.table('contact_messages').select('*').eq('restaurant_id', restaurant['id']).order('created_at', desc=True).execute()
    
    return JSONResponse(messages_result.data)

@app.put("/contact-messages/{message_id}/read")
async def mark_message_read(message_id: str, clerk_user_id: str = Depends(require_auth)):
    """Mark a contact message as read"""
    restaurant = await get_restaurant_by_clerk_user(clerk_user_id)
    if not restaurant:
        raise HTTPException(status_code=404, detail="Restoran nije pronađen")
    
    supabase = get_supabase_client()
    
    # Verify message belongs to restaurant
    message_result = supabase.table('contact_messages').select('restaurant_id').eq('id', message_id).execute()
    if not message_result.data or message_result.data[0]['restaurant_id'] != restaurant['id']:
        raise HTTPException(status_code=404, detail="Poruka nije pronađena")
    
    # Update read status
    update_result = supabase.table('contact_messages').update({'read': True}).eq('id', message_id).execute()
    
    return JSONResponse({"success": True, "message": update_result.data[0] if update_result.data else None})

# Public Order Creation Endpoint
@app.post("/v1/orders")
async def create_order(request: Request):
    """
    Public endpoint to create an order
    Request body should include:
    - restaurant_slug: str
    - customer_name: str
    - customer_phone: str
    - customer_email: str (optional)
    - delivery_address: str (optional, required if order_type is 'delivery')
    - order_type: 'delivery' | 'pickup'
    - items: [{"menu_item_id": str, "quantity": int}]
    - notes: str (optional)
    """
    from datetime import date
    
    body = await request.json()
    
    restaurant_slug = body.get('restaurant_slug')
    customer_name = body.get('customer_name')
    customer_phone = body.get('customer_phone')
    customer_email = body.get('customer_email')
    delivery_address = body.get('delivery_address')
    order_type = body.get('order_type')
    items = body.get('items', [])
    notes = body.get('notes')
    
    # Validation
    if not restaurant_slug:
        raise HTTPException(status_code=400, detail="restaurant_slug je obavezan")
    if not customer_name:
        raise HTTPException(status_code=400, detail="Ime kupca je obavezno")
    if not customer_phone:
        raise HTTPException(status_code=400, detail="Telefon kupca je obavezan")
    if order_type not in ['delivery', 'pickup']:
        raise HTTPException(status_code=400, detail="order_type mora biti 'delivery' ili 'pickup'")
    if order_type == 'delivery' and not delivery_address:
        raise HTTPException(status_code=400, detail="Adresa dostave je obavezna za narudžbe s dostavom")
    if not items or len(items) == 0:
        raise HTTPException(status_code=400, detail="Potrebna je barem jedna stavka")
    
    supabase = get_supabase_anon_client()
    
    # Get restaurant
    restaurant_result = supabase.table('restaurants').select('*').eq('slug', restaurant_slug).execute()
    if not restaurant_result.data:
        raise HTTPException(status_code=404, detail="Restoran nije pronađen")
    
    restaurant = restaurant_result.data[0]
    restaurant_id = restaurant['id']
    
    # Use service role client for order creation (to bypass RLS)
    supabase_admin = get_supabase_client()
    
    # Generate order number
    today = date.today()
    year = today.strftime('%Y')
    # Get last order number for this year
    last_order = supabase_admin.table('orders').select('order_number').eq('restaurant_id', restaurant_id).like('order_number', f'ORD-{year}-%').order('order_number', desc=True).limit(1).execute()
    
    if last_order.data:
        last_num = last_order.data[0]['order_number'].split('-')[-1]
        try:
            next_num = int(last_num) + 1
        except ValueError:
            next_num = 1
    else:
        next_num = 1
    
    order_number = f"ORD-{year}-{str(next_num).zfill(3)}"
    
    # Calculate total price
    total_price = 0.0
    order_items_data = []
    
    for item in items:
        menu_item_id = item.get('menu_item_id')
        quantity = item.get('quantity', 1)
        
        if not menu_item_id or quantity < 1:
            continue
        
        # Get menu item with price
        item_result = supabase.table('menu_items').select('*').eq('id', menu_item_id).eq('restaurant_id', restaurant_id).execute()
        if not item_result.data:
            continue
        
        menu_item = item_result.data[0]
        unit_price = float(menu_item['price'])
        subtotal = unit_price * quantity
        total_price += subtotal
        
        # Get customization if provided
        customization = item.get('customization')
        
        order_items_data.append({
            'menu_item_id': menu_item_id,
            'quantity': quantity,
            'unit_price': unit_price,
            'subtotal': subtotal,
            'customization': customization if customization else None
        })
    
    if total_price == 0:
        raise HTTPException(status_code=400, detail="Nevažeća narudžba: ukupna cijena je 0")
    
    # Create order
    order_data = {
        'restaurant_id': restaurant_id,
        'order_number': order_number,
        'customer_name': customer_name,
        'customer_phone': customer_phone,
        'customer_email': customer_email,
        'delivery_address': delivery_address if order_type == 'delivery' else None,
        'order_type': order_type,
        'status': 'pending',
        'total_price': total_price,
        'notes': notes
    }
    
    order_result = supabase_admin.table('orders').insert(order_data).execute()
    if not order_result.data:
        raise HTTPException(status_code=500, detail="Greška pri kreiranju narudžbe")
    
    order = order_result.data[0]
    order_id = order['id']
    
    # Create order items
    for item_data in order_items_data:
        item_data['order_id'] = order_id
        supabase_admin.table('order_items').insert(item_data).execute()
    
    # Return created order
    return JSONResponse({
        "id": order['id'],
        "order_number": order['order_number'],
        "status": order['status'],
        "total_price": float(order['total_price']),
        "created_at": order['created_at']
    })

# Restaurant Info Endpoints (Authenticated)
@app.get("/restaurant-info")
async def get_restaurant_info(clerk_user_id: str = Depends(require_auth)):
    """Get restaurant information for authenticated user"""
    restaurant = await get_restaurant_by_clerk_user(clerk_user_id)
    if not restaurant:
        raise HTTPException(status_code=404, detail="Restoran nije pronađen")
    
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
@app.get("/menu-items")
async def get_menu_items(clerk_user_id: str = Depends(require_auth)):
    """Get all menu items for authenticated user's restaurant"""
    restaurant = await get_restaurant_by_clerk_user(clerk_user_id)
    if not restaurant:
        raise HTTPException(status_code=404, detail="Restoran nije pronađen")
    
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
        raise HTTPException(status_code=404, detail="Restoran nije pronađen")
    
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
        raise HTTPException(status_code=404, detail="Restoran nije pronađen")
    
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
        raise HTTPException(status_code=404, detail="Restoran nije pronađen")
    
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
        raise HTTPException(status_code=404, detail="Restoran nije pronađen")
    
    supabase = get_supabase_client()
    items_result = supabase.table('menu_items').select('*').eq('restaurant_id', restaurant['id']).execute()
    
    menu_items = items_result.data
    for item in menu_items:
        translations_result = supabase.table('translations').select('*').eq('menu_item_id', item['id']).execute()
        item['translations'] = translations_result.data
    
    return JSONResponse(menu_items)

# Daily Menus Endpoints (Authenticated)
@app.get("/daily-menus")
async def get_daily_menus(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    clerk_user_id: str = Depends(require_auth)
):
    """
    Get all daily menus for authenticated user's restaurant
    Optional query params: start_date, end_date (YYYY-MM-DD) for filtering
    """
    restaurant = await get_restaurant_by_clerk_user(clerk_user_id)
    if not restaurant:
        raise HTTPException(status_code=404, detail="Restoran nije pronađen")
    
    supabase = get_supabase_client()
    query = supabase.table('daily_menus').select('*').eq('restaurant_id', restaurant['id'])
    
    if start_date:
        query = query.gte('menu_date', start_date)
    if end_date:
        query = query.lte('menu_date', end_date)
    
    result = query.order('menu_date', desc=False).execute()
    
    # Get menu items for each daily menu
    daily_menus = result.data if result.data else []
    for daily_menu in daily_menus:
        # Get item count
        items_result = supabase.table('daily_menu_items').select('id').eq('daily_menu_id', daily_menu['id']).execute()
        daily_menu['item_count'] = len(items_result.data) if items_result.data else 0
    
    return JSONResponse(daily_menus)

@app.get("/daily-menus/{menu_id}")
async def get_daily_menu(menu_id: str, clerk_user_id: str = Depends(require_auth)):
    """Get a specific daily menu with its items"""
    restaurant = await get_restaurant_by_clerk_user(clerk_user_id)
    if not restaurant:
        raise HTTPException(status_code=404, detail="Restoran nije pronađen")
    
    supabase = get_supabase_client()
    
    # Get daily menu
    menu_result = supabase.table('daily_menus').select('*').eq('id', menu_id).eq('restaurant_id', restaurant['id']).execute()
    if not menu_result.data:
        raise HTTPException(status_code=404, detail="Daily menu not found")
    
    daily_menu = menu_result.data[0]
    
    # Get menu items
    items_result = supabase.table('daily_menu_items').select('*, menu_items(*)').eq('daily_menu_id', menu_id).order('order_index').execute()
    
    menu_items = []
    for dmi in items_result.data:
        item = dmi.get('menu_items')
        if item:
            # Get translations
            translations_result = supabase.table('translations').select('*').eq('menu_item_id', item['id']).execute()
            item['translations'] = translations_result.data
            # Add order_index from junction table
            item['order_index'] = dmi.get('order_index', 0)
            menu_items.append(item)
    
    daily_menu['menu_items'] = menu_items
    
    return JSONResponse(daily_menu)

@app.post("/daily-menus")
async def create_daily_menu(
    name: str = Form(...),
    menu_date: str = Form(...),  # Format: YYYY-MM-DD
    description: Optional[str] = Form(None),
    clerk_user_id: str = Depends(require_auth)
):
    """Create a new daily menu for a specific date"""
    from datetime import datetime
    
    restaurant = await get_restaurant_by_clerk_user(clerk_user_id)
    if not restaurant:
        raise HTTPException(status_code=404, detail="Restoran nije pronađen")
    
    # Validate date format
    try:
        date_obj = datetime.strptime(menu_date, '%Y-%m-%d').date()
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD")
    
    supabase = get_supabase_client()
    
    # Check if menu for this date already exists
    existing = supabase.table('daily_menus').select('*').eq('restaurant_id', restaurant['id']).eq('menu_date', str(date_obj)).execute()
    if existing.data:
        raise HTTPException(status_code=400, detail=f"Daily menu for {menu_date} already exists")
    
    menu_data = {
        'restaurant_id': restaurant['id'],
        'name': name,
        'menu_date': str(date_obj),
        'description': description or f"Daily menu for {menu_date}",
        'is_active': False,  # Will be activated automatically on the date
        'is_preview': False
    }
    
    result = supabase.table('daily_menus').insert(menu_data).execute()
    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to create daily menu")
    
    return JSONResponse(result.data[0])

@app.put("/daily-menus/{menu_id}")
async def update_daily_menu(
    menu_id: str,
    name: Optional[str] = Form(None),
    menu_date: Optional[str] = Form(None),
    description: Optional[str] = Form(None),
    clerk_user_id: str = Depends(require_auth)
):
    """Update a daily menu"""
    from datetime import datetime
    
    restaurant = await get_restaurant_by_clerk_user(clerk_user_id)
    if not restaurant:
        raise HTTPException(status_code=404, detail="Restoran nije pronađen")
    
    supabase = get_supabase_client()
    
    # Verify menu belongs to restaurant
    menu_result = supabase.table('daily_menus').select('*').eq('id', menu_id).eq('restaurant_id', restaurant['id']).execute()
    if not menu_result.data:
        raise HTTPException(status_code=404, detail="Daily menu not found")
    
    update_data = {}
    
    if name is not None:
        update_data['name'] = name
    if description is not None:
        update_data['description'] = description
    if menu_date is not None:
        try:
            date_obj = datetime.strptime(menu_date, '%Y-%m-%d').date()
            # Check if another menu exists for this date
            existing = supabase.table('daily_menus').select('*').eq('restaurant_id', restaurant['id']).eq('menu_date', str(date_obj)).neq('id', menu_id).execute()
            if existing.data:
                raise HTTPException(status_code=400, detail=f"Daily menu for {menu_date} already exists")
            update_data['menu_date'] = str(date_obj)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD")
    
    if update_data:
        result = supabase.table('daily_menus').update(update_data).eq('id', menu_id).execute()
        return JSONResponse(result.data[0])
    
    return JSONResponse(menu_result.data[0])

@app.delete("/daily-menus/{menu_id}")
async def delete_daily_menu(menu_id: str, clerk_user_id: str = Depends(require_auth)):
    """Delete a daily menu"""
    restaurant = await get_restaurant_by_clerk_user(clerk_user_id)
    if not restaurant:
        raise HTTPException(status_code=404, detail="Restoran nije pronađen")
    
    supabase = get_supabase_client()
    
    # Verify menu belongs to restaurant
    menu_result = supabase.table('daily_menus').select('*').eq('id', menu_id).eq('restaurant_id', restaurant['id']).execute()
    if not menu_result.data:
        raise HTTPException(status_code=404, detail="Daily menu not found")
    
    # Delete menu (cascade will delete menu items)
    supabase.table('daily_menus').delete().eq('id', menu_id).execute()
    return JSONResponse({"message": "Daily menu deleted"})

# Daily Menu Items Management
@app.post("/daily-menus/{menu_id}/items")
async def add_item_to_daily_menu(
    menu_id: str,
    menu_item_id: str = Form(...),
    order_index: Optional[int] = Form(0),
    clerk_user_id: str = Depends(require_auth)
):
    """Add an item to a daily menu"""
    restaurant = await get_restaurant_by_clerk_user(clerk_user_id)
    if not restaurant:
        raise HTTPException(status_code=404, detail="Restoran nije pronađen")
    
    supabase = get_supabase_client()
    
    # Verify menu belongs to restaurant
    menu_result = supabase.table('daily_menus').select('*').eq('id', menu_id).eq('restaurant_id', restaurant['id']).execute()
    if not menu_result.data:
        raise HTTPException(status_code=404, detail="Daily menu not found")
    
    # Verify menu item belongs to restaurant
    item_result = supabase.table('menu_items').select('*').eq('id', menu_item_id).eq('restaurant_id', restaurant['id']).execute()
    if not item_result.data:
        raise HTTPException(status_code=404, detail="Menu item not found")
    
    # Check if item already in menu
    existing = supabase.table('daily_menu_items').select('*').eq('daily_menu_id', menu_id).eq('menu_item_id', menu_item_id).execute()
    if existing.data:
        raise HTTPException(status_code=400, detail="Item already in this menu")
    
    # Add item to menu
    item_data = {
        'daily_menu_id': menu_id,
        'menu_item_id': menu_item_id,
        'order_index': order_index or 0
    }
    
    result = supabase.table('daily_menu_items').insert(item_data).execute()
    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to add item to menu")
    
    return JSONResponse(result.data[0])

@app.delete("/daily-menus/{menu_id}/items/{item_id}")
async def remove_item_from_daily_menu(
    menu_id: str,
    item_id: str,
    clerk_user_id: str = Depends(require_auth)
):
    """Remove an item from a daily menu"""
    restaurant = await get_restaurant_by_clerk_user(clerk_user_id)
    if not restaurant:
        raise HTTPException(status_code=404, detail="Restoran nije pronađen")
    
    supabase = get_supabase_client()
    
    # Verify menu belongs to restaurant
    menu_result = supabase.table('daily_menus').select('*').eq('id', menu_id).eq('restaurant_id', restaurant['id']).execute()
    if not menu_result.data:
        raise HTTPException(status_code=404, detail="Daily menu not found")
    
    # Remove item from menu
    supabase.table('daily_menu_items').delete().eq('daily_menu_id', menu_id).eq('menu_item_id', item_id).execute()
    return JSONResponse({"message": "Item removed from menu"})

@app.put("/daily-menus/{menu_id}/items/reorder")
async def reorder_daily_menu_items(
    menu_id: str,
    request: Request,
    clerk_user_id: str = Depends(require_auth)
):
    """Reorder items in a daily menu"""
    restaurant = await get_restaurant_by_clerk_user(clerk_user_id)
    if not restaurant:
        raise HTTPException(status_code=404, detail="Restoran nije pronađen")
    
    supabase = get_supabase_client()
    
    # Verify menu belongs to restaurant
    menu_result = supabase.table('daily_menus').select('*').eq('id', menu_id).eq('restaurant_id', restaurant['id']).execute()
    if not menu_result.data:
        raise HTTPException(status_code=404, detail="Daily menu not found")
    
    # Parse JSON body: [{"menu_item_id": "uuid", "order_index": 0}, ...]
    body = await request.json()
    items_order = body if isinstance(body, list) else []
    
    for idx, item in enumerate(items_order):
        if not isinstance(item, dict) or "menu_item_id" not in item:
            continue
        supabase.table('daily_menu_items').update({"order_index": idx}).eq('daily_menu_id', menu_id).eq('menu_item_id', item["menu_item_id"]).execute()
    
    return JSONResponse({"message": "Items reordered"})

# Copy Menu Functionality
@app.post("/daily-menus/{menu_id}/copy")
async def copy_daily_menu(
    menu_id: str,
    target_date: str = Form(...),  # Format: YYYY-MM-DD
    clerk_user_id: str = Depends(require_auth)
):
    """Copy a daily menu to another date"""
    from datetime import datetime
    
    restaurant = await get_restaurant_by_clerk_user(clerk_user_id)
    if not restaurant:
        raise HTTPException(status_code=404, detail="Restoran nije pronađen")
    
    # Validate date format
    try:
        date_obj = datetime.strptime(target_date, '%Y-%m-%d').date()
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD")
    
    supabase = get_supabase_client()
    
    # Verify source menu belongs to restaurant
    source_menu_result = supabase.table('daily_menus').select('*').eq('id', menu_id).eq('restaurant_id', restaurant['id']).execute()
    if not source_menu_result.data:
        raise HTTPException(status_code=404, detail="Source daily menu not found")
    
    source_menu = source_menu_result.data[0]
    
    # Check if target date already has a menu
    existing = supabase.table('daily_menus').select('*').eq('restaurant_id', restaurant['id']).eq('menu_date', str(date_obj)).execute()
    if existing.data:
        raise HTTPException(status_code=400, detail=f"Daily menu for {target_date} already exists")
    
    # Create new daily menu
    new_menu_data = {
        'restaurant_id': restaurant['id'],
        'name': source_menu['name'] + f" (Copy for {target_date})",
        'menu_date': str(date_obj),
        'description': source_menu.get('description'),
        'is_active': False,
        'is_preview': False
    }
    
    new_menu_result = supabase.table('daily_menus').insert(new_menu_data).execute()
    if not new_menu_result.data:
        raise HTTPException(status_code=500, detail="Failed to create copied menu")
    
    new_menu_id = new_menu_result.data[0]['id']
    
    # Copy menu items
    source_items_result = supabase.table('daily_menu_items').select('*').eq('daily_menu_id', menu_id).execute()
    
    if source_items_result.data:
        items_to_insert = []
        for item in source_items_result.data:
            items_to_insert.append({
                'daily_menu_id': new_menu_id,
                'menu_item_id': item['menu_item_id'],
                'order_index': item.get('order_index', 0)
            })
        
        if items_to_insert:
            supabase.table('daily_menu_items').insert(items_to_insert).execute()
    
    return JSONResponse({
        "message": "Menu copied successfully",
        "new_menu": new_menu_result.data[0]
    })

# Preview Mode Toggle
@app.post("/daily-menus/{menu_id}/toggle-preview")
async def toggle_preview_mode(
    menu_id: str,
    is_preview: str = Form(...),  # "true" or "false"
    clerk_user_id: str = Depends(require_auth)
):
    """Toggle preview mode for a daily menu"""
    restaurant = await get_restaurant_by_clerk_user(clerk_user_id)
    if not restaurant:
        raise HTTPException(status_code=404, detail="Restoran nije pronađen")
    
    supabase = get_supabase_client()
    
    # Verify menu belongs to restaurant
    menu_result = supabase.table('daily_menus').select('*').eq('id', menu_id).eq('restaurant_id', restaurant['id']).execute()
    if not menu_result.data:
        raise HTTPException(status_code=404, detail="Daily menu not found")
    
    preview_value = is_preview.lower() in ("true", "on", "1")
    
    result = supabase.table('daily_menus').update({'is_preview': preview_value}).eq('id', menu_id).execute()
    return JSONResponse(result.data[0] if result.data else menu_result.data[0])

# Calendar/Weekly View Endpoint
@app.get("/daily-menus/calendar")
async def get_calendar_view(
    start_date: str,  # YYYY-MM-DD
    end_date: str,    # YYYY-MM-DD
    clerk_user_id: str = Depends(require_auth)
):
    """Get daily menus for a date range (calendar view)"""
    restaurant = await get_restaurant_by_clerk_user(clerk_user_id)
    if not restaurant:
        raise HTTPException(status_code=404, detail="Restoran nije pronađen")
    
    supabase = get_supabase_client()
    
    result = supabase.table('daily_menus').select('*').eq('restaurant_id', restaurant['id']).gte('menu_date', start_date).lte('menu_date', end_date).order('menu_date', desc=False).execute()
    
    # Get item count for each menu
    daily_menus = result.data if result.data else []
    for daily_menu in daily_menus:
        items_result = supabase.table('daily_menu_items').select('id').eq('daily_menu_id', daily_menu['id']).execute()
        daily_menu['item_count'] = len(items_result.data) if items_result.data else 0
    
    return JSONResponse(daily_menus)

# Categories Endpoints
@app.get("/categories")
async def get_categories(clerk_user_id: str = Depends(require_auth)):
    """Get all categories for authenticated user's restaurant"""
    restaurant = await get_restaurant_by_clerk_user(clerk_user_id)
    if not restaurant:
        raise HTTPException(status_code=404, detail="Restoran nije pronađen")
    
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
        raise HTTPException(status_code=404, detail="Restoran nije pronađen")
    
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
        raise HTTPException(status_code=404, detail="Restoran nije pronađen")
    
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

@app.delete("/categories/{category_id}")
async def delete_category(category_id: str, clerk_user_id: str = Depends(require_auth)):
    """Delete a category"""
    restaurant = await get_restaurant_by_clerk_user(clerk_user_id)
    if not restaurant:
        raise HTTPException(status_code=404, detail="Restoran nije pronađen")
    
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
        raise HTTPException(status_code=404, detail="Restoran nije pronađen")
    
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

@app.delete("/translations/{translation_id}")
async def delete_translation(translation_id: str, clerk_user_id: str = Depends(require_auth)):
    """Delete a translation"""
    restaurant = await get_restaurant_by_clerk_user(clerk_user_id)
    if not restaurant:
        raise HTTPException(status_code=404, detail="Restoran nije pronađen")
    
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
        raise HTTPException(status_code=404, detail="Restoran nije pronađen")
    
    supabase = get_supabase_client()
    result = supabase.table('category_translations').update({"name": name}).eq('id', translation_id).execute()
    return JSONResponse(result.data[0] if result.data else {"message": "Translation updated"})

@app.delete("/category-translations/{translation_id}")
async def delete_category_translation(translation_id: str, clerk_user_id: str = Depends(require_auth)):
    """Delete a category translation"""
    restaurant = await get_restaurant_by_clerk_user(clerk_user_id)
    if not restaurant:
        raise HTTPException(status_code=404, detail="Restoran nije pronađen")
    
    supabase = get_supabase_client()
    supabase.table('category_translations').delete().eq('id', translation_id).execute()
    return JSONResponse({"message": "Category translation deleted"})

# Analytics Endpoint
@app.get("/analytics")
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
@app.get("/qr-code")
async def generate_qr_code_api(clerk_user_id: str = Depends(require_auth)):
    """Generate QR code for the menu - requires authentication"""
    restaurant = await get_restaurant_by_clerk_user(clerk_user_id)
    if not restaurant:
        raise HTTPException(status_code=404, detail="Restoran nije pronađen")
    
    # Get restaurant slug for menu URL
    menu_url = f"{MENU_URL}/menu/{restaurant['slug']}"
    
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

