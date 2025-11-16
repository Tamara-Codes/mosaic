"""
Supabase client configuration and utilities
"""
from supabase import create_client, Client
import os
from dotenv import load_dotenv

load_dotenv()

# Supabase configuration
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")  # Service role key for backend
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY")  # Anon key for public access

if not SUPABASE_URL or not SUPABASE_KEY:
    raise ValueError("SUPABASE_URL and SUPABASE_KEY must be set in environment variables")

# Create Supabase client
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

def get_supabase_client() -> Client:
    """Get Supabase client instance"""
    return supabase

def get_supabase_anon_client() -> Client:
    """Get Supabase client with anon key for public access"""
    if not SUPABASE_ANON_KEY:
        raise ValueError("SUPABASE_ANON_KEY must be set for public access")
    return create_client(SUPABASE_URL, SUPABASE_ANON_KEY)

