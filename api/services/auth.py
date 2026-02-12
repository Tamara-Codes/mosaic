"""
Authentication services
"""
from typing import Optional
from fastapi import Header, HTTPException
import os
import jwt
from jwt import PyJWKClient
import httpx
from core.supabase_client import get_supabase_client

CLERK_SECRET_KEY = os.getenv("CLERK_SECRET_KEY")

async def get_clerk_user_email(user_id: str) -> Optional[str]:
    """
    Fetch user email from Clerk API using the user ID.
    """
    if not CLERK_SECRET_KEY:
        print("ERROR: CLERK_SECRET_KEY not set")
        return None
    
    try:
        # Call Clerk API to get user details
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"https://api.clerk.com/v1/users/{user_id}",
                headers={
                    "Authorization": f"Bearer {CLERK_SECRET_KEY}",
                    "Content-Type": "application/json"
                }
            )
            
            if response.status_code == 200:
                user_data = response.json()
                # Get primary email address
                email_addresses = user_data.get("email_addresses", [])
                primary_email_id = user_data.get("primary_email_address_id")
                
                # Find primary email
                for email_obj in email_addresses:
                if email_obj.get("id") == primary_email_id:
                    email = email_obj.get("email_address")
                    # SECURITY: Don't log email addresses in production
                    import os
                    if os.getenv("ENVIRONMENT", "production").lower() == "development":
                        print(f"DEBUG: Fetched email from Clerk API")
                    return email
                
                # Fallback to first email if primary not found
                if email_addresses:
                    email = email_addresses[0].get("email_address")
                    # SECURITY: Don't log email addresses
                    return email
            else:
                print(f"ERROR: Clerk API returned status {response.status_code}: {response.text}")
                return None
    except Exception as e:
        print(f"ERROR: Failed to fetch user from Clerk API: {e}")
        return None

async def verify_clerk_token(token: str) -> Optional[dict]:
    """
    Verify Clerk JWT token and return user info.
    Uses Clerk's JWKS endpoint for proper token verification.
    Returns dict with 'user_id' and 'email' if successful.
    """
    try:
        # First, decode token without verification to get issuer
        unverified = jwt.decode(token, options={"verify_signature": False})
        issuer = unverified.get("iss", "")
        
        if not issuer or not issuer.startswith("https://"):
            print("Invalid token issuer")
            return None
        
        # Extract domain from issuer (format: https://<domain>)
        domain = issuer.replace("https://", "").split("/")[0]
        jwks_url = f"https://{domain}/.well-known/jwks.json"
        
        # Use JWKS to verify token
        jwks_client = PyJWKClient(jwks_url)
        signing_key = jwks_client.get_signing_key_from_jwt(token)
        
        # Verify token with proper key
        decoded = jwt.decode(
            token,
            signing_key.key,
            algorithms=["RS256"],
            options={"verify_exp": True}
        )
        
        # SECURITY: Removed debug logging of token contents
        # Only log in development mode if explicitly enabled
        import os
        if os.getenv("ENVIRONMENT", "production").lower() == "development" and os.getenv("DEBUG_TOKENS", "false").lower() == "true":
            print(f"DEBUG: Decoded token fields: {decoded.keys()}")
        # Never log full token contents
        
        # Extract user ID and email from token
        # Clerk tokens usually have email in these fields
        email = (
            decoded.get("email") or 
            decoded.get("email_address") or 
            decoded.get("primary_email_address") or
            decoded.get("azp")  # Sometimes email is in azp field
        )
        
        return {
            "user_id": decoded.get("sub"),
            "email": email
        }
    except jwt.ExpiredSignatureError:
        print("Token has expired")
        return None
    except jwt.InvalidTokenError as e:
        print(f"Invalid token: {e}")
        return None
    except Exception as e:
        print(f"Error verifying Clerk token: {e}")
        return None

async def get_clerk_user_info(authorization: Optional[str] = Header(None)) -> Optional[dict]:
    """
    Extract and verify Clerk user info from authorization header.
    Returns dict with user_id and email, or None if authentication is missing or invalid.
    """
    if not authorization:
        return None
    
    parts = authorization.split()
    if len(parts) != 2 or parts[0].lower() != "bearer":
        return None
    
    token = parts[1]
    user_info = await verify_clerk_token(token)
    return user_info

async def get_clerk_user_id(authorization: Optional[str] = Header(None)) -> Optional[str]:
    """
    Extract and verify Clerk user ID from authorization header.
    Returns None if authentication is missing or invalid.
    """
    user_info = await get_clerk_user_info(authorization)
    return user_info["user_id"] if user_info else None

async def get_restaurant_by_clerk_user(clerk_user_id: str):
    """Get restaurant for a Clerk user"""
    supabase = get_supabase_client()
    print(f"DEBUG: Searching for restaurant with clerk_user_id: '{clerk_user_id}' (length: {len(clerk_user_id)})")
    
    # First, get ALL restaurants to see what we have
    all_result = supabase.table('restaurants').select('id, name, email, clerk_user_id').execute()
    print(f"DEBUG: All restaurants in database:")
    for r in (all_result.data or []):
        stored_id = r.get('clerk_user_id')
        print(f"  - {r.get('name')}: clerk_user_id='{stored_id}' (length: {len(stored_id) if stored_id else 0}), email={r.get('email')}")
        if stored_id:
            print(f"    Match check: '{clerk_user_id}' == '{stored_id}' ? {clerk_user_id == stored_id}")
    
    # Now try the actual query
    result = supabase.table('restaurants').select('*').eq('clerk_user_id', clerk_user_id).execute()
    print(f"DEBUG: Query result count: {len(result.data or [])}")
    
    if result.data:
        print(f"DEBUG: ✅ Found restaurant: {result.data[0]['name']}")
        return result.data[0]
    
    print(f"DEBUG: ❌ No restaurant found for clerk_user_id: '{clerk_user_id}'")
    return None

async def require_auth(authorization: Optional[str] = Header(None)):
    """Dependency to require authentication"""
    clerk_user_id = await get_clerk_user_id(authorization)
    
    if not clerk_user_id:
        raise HTTPException(status_code=401, detail="Authentication required")
    return clerk_user_id

