"""
Authentication services
"""
from typing import Optional
from fastapi import Header, HTTPException
import os
import jwt
from jwt import PyJWKClient
from core.supabase_client import get_supabase_client

CLERK_SECRET_KEY = os.getenv("CLERK_SECRET_KEY")

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
        
        # Debug: print all fields in the token to see what's available
        print(f"DEBUG: Decoded token fields: {decoded.keys()}")
        print(f"DEBUG: Full decoded token: {decoded}")
        
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
    result = supabase.table('restaurants').select('*').eq('clerk_user_id', clerk_user_id).execute()
    if result.data:
        return result.data[0]
    return None

async def require_auth(authorization: Optional[str] = Header(None)):
    """Dependency to require authentication"""
    clerk_user_id = await get_clerk_user_id(authorization)
    
    if not clerk_user_id:
        raise HTTPException(status_code=401, detail="Authentication required")
    return clerk_user_id

