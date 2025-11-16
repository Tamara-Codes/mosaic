#!/usr/bin/env python3
"""
Script to create a restaurant in the database
This should be run before a user signs up with Clerk
"""
import sys
import os
from pathlib import Path

# Add backend to path
backend_path = Path(__file__).parent.parent / "backend"
sys.path.insert(0, str(backend_path))

from app.core.supabase_client import get_supabase_client
from dotenv import load_dotenv

load_dotenv(backend_path / ".env")

def create_restaurant(name: str, slug: str, email: str, description: str = None, 
                     address: str = None, phone: str = None, theme: str = "default-theme"):
    """
    Create a restaurant in the database
    
    Args:
        name: Restaurant name (e.g., "Bracera")
        slug: URL-friendly identifier (e.g., "bracera")
        email: Email address that will be used for Clerk signup
        description: Optional description
        address: Optional address
        phone: Optional phone number
        theme: Theme identifier (default: "default-theme")
    """
    supabase = get_supabase_client()
    
    # Check if restaurant with this email already exists
    existing = supabase.table('restaurants').select('*').eq('email', email).execute()
    if existing.data:
        print(f"⚠️  Restaurant with email {email} already exists!")
        restaurant = existing.data[0]
        if restaurant.get('clerk_user_id'):
            print(f"   Already linked to user: {restaurant['clerk_user_id']}")
        else:
            print(f"   Ready to be linked (ID: {restaurant['id']})")
        return restaurant
    
    # Check if slug already exists
    existing_slug = supabase.table('restaurants').select('*').eq('slug', slug).execute()
    if existing_slug.data:
        print(f"⚠️  Restaurant with slug '{slug}' already exists!")
        return existing_slug.data[0]
    
    # Create restaurant
    restaurant_data = {
        'name': name,
        'slug': slug,
        'email': email,
        'description': description,
        'address': address,
        'phone': phone,
        'theme_identifier': theme,
        'clerk_user_id': None  # Will be set when user signs up
    }
    
    result = supabase.table('restaurants').insert(restaurant_data).execute()
    
    if result.data:
        restaurant = result.data[0]
        print(f"✅ Restaurant '{name}' created successfully!")
        print(f"   ID: {restaurant['id']}")
        print(f"   Slug: {restaurant['slug']}")
        print(f"   Email: {restaurant['email']}")
        print(f"\n📝 Next steps:")
        print(f"   1. Sign up with Clerk using email: {email}")
        print(f"   2. The webhook will automatically link your account to this restaurant")
        return restaurant
    else:
        print("❌ Failed to create restaurant")
        return None


if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description='Create a restaurant in the database')
    parser.add_argument('--name', required=True, help='Restaurant name')
    parser.add_argument('--slug', required=True, help='URL-friendly slug (e.g., "bracera")')
    parser.add_argument('--email', required=True, help='Email address for Clerk signup')
    parser.add_argument('--description', help='Restaurant description')
    parser.add_argument('--address', help='Restaurant address')
    parser.add_argument('--phone', help='Restaurant phone number')
    parser.add_argument('--theme', default='default-theme', help='Theme identifier')
    
    args = parser.parse_args()
    
    create_restaurant(
        name=args.name,
        slug=args.slug,
        email=args.email,
        description=args.description,
        address=args.address,
        phone=args.phone,
        theme=args.theme
    )

