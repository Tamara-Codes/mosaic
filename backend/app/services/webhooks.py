"""
Clerk webhook handlers
"""
import hmac
import hashlib
import base64
import json
from typing import Dict, Any
from fastapi import HTTPException
import os

WEBHOOK_SECRET = os.getenv("CLERK_WEBHOOK_SECRET")


def verify_signature(headers: dict, body: bytes) -> bool:
    """Verify webhook signature from Clerk (using Svix format)"""
    if not WEBHOOK_SECRET:
        print("WARNING: CLERK_WEBHOOK_SECRET not set, skipping verification")
        return True  # Skip verification if secret not set (dev mode)
    
    # FastAPI headers are case-insensitive, but try different casings to be safe
    svix_id = headers.get("svix-id") or headers.get("Svix-Id")
    svix_timestamp = headers.get("svix-timestamp") or headers.get("Svix-Timestamp")
    svix_signature = headers.get("svix-signature") or headers.get("Svix-Signature")
    
    if not all([svix_id, svix_timestamp, svix_signature]):
        print(f"Missing required headers. Available headers: {list(headers.keys())}")
        return False
    
    try:
        # Decode body to string for signing
        body_str = body.decode('utf-8')
        
        # Create signed content: id.timestamp.payload
        signed_content = f"{svix_id}.{svix_timestamp}.{body_str}"
        
        # Handle the webhook secret format
        # Clerk/Svix secrets are in format: whsec_<base64-encoded-secret>
        secret = WEBHOOK_SECRET
        if secret.startswith('whsec_'):
            # Decode the base64 part after 'whsec_'
            try:
                # Remove 'whsec_' prefix (6 characters)
                encoded_secret = secret[6:]
                # Base64 decode - add padding if needed
                missing_padding = len(encoded_secret) % 4
                if missing_padding:
                    encoded_secret += '=' * (4 - missing_padding)
                secret_bytes = base64.b64decode(encoded_secret)
                secret = secret_bytes
            except Exception as e:
                print(f"Error decoding webhook secret: {e}")
                # Fallback: try using the raw secret
                secret = secret.encode('utf-8')
        else:
            # If no prefix, use as-is (encode if string)
            secret = secret.encode('utf-8') if isinstance(secret, str) else secret
        
        # Calculate expected signature
        expected_signature = base64.b64encode(
            hmac.new(
                secret,
                signed_content.encode('utf-8'),
                hashlib.sha256
            ).digest()
        ).decode('utf-8')
        
        # Svix sends signatures in format: "v1,<signature1> v1,<signature2> ..."
        # We need to check all signatures (space-separated)
        signatures = svix_signature.split(' ')
        for sig in signatures:
            if sig.startswith('v1,'):
                received_signature = sig[3:]  # Remove 'v1,' prefix
                # Compare signatures using constant-time comparison
                if hmac.compare_digest(expected_signature, received_signature):
                    return True
        
        # Debug output (remove in production)
        print(f"Signature verification failed")
        print(f"Expected signature (first 20 chars): {expected_signature[:20]}...")
        print(f"Received signature header: {svix_signature[:50]}...")
        return False
    except Exception as e:
        # Log error for debugging
        print(f"Signature verification error: {e}")
        import traceback
        traceback.print_exc()
        return False


async def handle_user_created(data: Dict[str, Any]) -> Dict[str, Any]:
    """Link new user to restaurant by email"""
    from app.core.supabase_client import get_supabase_client
    
    user_id = data.get("id")
    emails = data.get("email_addresses", [])
    
    if not user_id:
        raise HTTPException(status_code=400, detail="User ID required")
    
    # Get primary email
    primary_email = next(
        (e.get("email_address") for e in emails if e.get("id") == data.get("primary_email_address_id")),
        emails[0].get("email_address") if emails else None
    )
    
    if not primary_email:
        return {"message": "No email found", "user_id": user_id}
    
    supabase = get_supabase_client()
    
    # Check if already linked
    existing = supabase.table('restaurants').select('*').eq('clerk_user_id', user_id).execute()
    if existing.data:
        return {"message": "Already linked", "restaurant": existing.data[0]}
    
    # Find restaurant by email
    restaurants = supabase.table('restaurants').select('*').eq('email', primary_email).execute()
    available = [r for r in (restaurants.data or []) if not r.get('clerk_user_id')]
    
    if available:
        result = supabase.table('restaurants').update({'clerk_user_id': user_id}).eq('id', available[0]['id']).execute()
        if result.data:
            return {"message": "User linked", "restaurant": result.data[0]}
    
    return {"message": "No restaurant found for email", "user_id": user_id, "email": primary_email}


async def handle_user_deleted(data: Dict[str, Any]) -> Dict[str, Any]:
    """Delete restaurant when user is deleted"""
    from app.core.supabase_client import get_supabase_client
    
    user_id = data.get("id")
    if not user_id:
        raise HTTPException(status_code=400, detail="User ID required")
    
    supabase = get_supabase_client()
    restaurant = supabase.table('restaurants').select('*').eq('clerk_user_id', user_id).execute()
    
    if not restaurant.data:
        return {"message": "Restaurant not found"}
    
    rest_id = restaurant.data[0]['id']
    
    # Delete related data
    supabase.table('menus').delete().eq('restaurant_id', rest_id).execute()
    supabase.table('menu_items').delete().eq('restaurant_id', rest_id).execute()
    supabase.table('categories').delete().eq('restaurant_id', rest_id).execute()
    supabase.table('restaurants').delete().eq('id', rest_id).execute()
    
    return {"message": "Restaurant deleted"}
