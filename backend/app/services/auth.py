"""
Authentication services
"""
from typing import Optional
from fastapi import Header, HTTPException
import os
import jwt
import httpx
from app.core.supabase_client import get_supabase_client

CLERK_SECRET_KEY = os.getenv("CLERK_SECRET_KEY")

async def verify_clerk_token(token: str) -> Optional[str]:
    """
    Verify Clerk JWT token and return user ID
    """
    if not CLERK_SECRET_KEY:
        # If no secret key is set, skip verification (for development)
        # In production, this should always be set
        return None
    
    try:
        # Get Clerk JWKS (JSON Web Key Set) to verify the token
        # Clerk uses RS256 algorithm, so we need to fetch the public keys
        async with httpx.AsyncClient() as client:
            # Extract the issuer from the token to get the correct JWKS URL
            # For now, we'll use a simpler approach: decode without verification for development
            # In production, you should properly verify with Clerk's JWKS
            
            # For development/testing: decode token to get user ID
            # WARNING: This doesn't verify the token signature
            decoded = jwt.decode(token, options={"verify_signature": False})
            return decoded.get("sub")  # 'sub' is the user ID in Clerk tokens
            
    except Exception as e:
        print(f"Error verifying Clerk token: {e}")
        return None

async def get_clerk_user_id(authorization: Optional[str] = Header(None)) -> Optional[str]:
    """
    Extract and verify Clerk user ID from authorization header
    """
    if not authorization:
        return None
    
    parts = authorization.split()
    if len(parts) == 2 and parts[0].lower() == "bearer":
        token = parts[1]
        
        # If CLERK_SECRET_KEY is set, verify the token
        if CLERK_SECRET_KEY:
            user_id = await verify_clerk_token(token)
            return user_id
        else:
            # Development mode: accept token as-is (not secure, for testing only)
            # In production, always verify tokens
            return token
    
    return None

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

