#!/usr/bin/env python3
"""
Script to link a Clerk user to a restaurant in Supabase
This is useful when the webhook didn't fire or the email doesn't match
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

def list_restaurants():
    """List all restaurants in the database"""
    supabase = get_supabase_client()
    result = supabase.table('restaurants').select('*').execute()
    
    if not result.data:
        print("No restaurants found in database")
        return []
    
    print("\n📋 Restaurants in database:")
    print("-" * 80)
    for restaurant in result.data:
        linked = "✅" if restaurant.get('clerk_user_id') else "❌"
        print(f"{linked} ID: {restaurant['id']}")
        print(f"   Name: {restaurant.get('name', 'N/A')}")
        print(f"   Slug: {restaurant.get('slug', 'N/A')}")
        print(f"   Email: {restaurant.get('email', 'N/A')}")
        print(f"   Clerk User ID: {restaurant.get('clerk_user_id', 'Not linked')}")
        print()
    
    return result.data

def link_user_to_restaurant(clerk_user_id: str, restaurant_id: int = None, restaurant_email: str = None):
    """
    Link a Clerk user to a restaurant
    
    Args:
        clerk_user_id: The Clerk user ID
        restaurant_id: The restaurant ID (if known)
        restaurant_email: The restaurant email (alternative to restaurant_id)
    """
    supabase = get_supabase_client()
    
    # Check if user is already linked
    existing = supabase.table('restaurants').select('*').eq('clerk_user_id', clerk_user_id).execute()
    if existing.data:
        print(f"⚠️  User {clerk_user_id} is already linked to restaurant:")
        restaurant = existing.data[0]
        print(f"   ID: {restaurant['id']}")
        print(f"   Name: {restaurant.get('name', 'N/A')}")
        print(f"   Email: {restaurant.get('email', 'N/A')}")
        return restaurant
    
    # Find restaurant
    restaurant = None
    if restaurant_id:
        result = supabase.table('restaurants').select('*').eq('id', restaurant_id).execute()
        if result.data:
            restaurant = result.data[0]
    elif restaurant_email:
        result = supabase.table('restaurants').select('*').eq('email', restaurant_email).execute()
        if result.data:
            restaurant = result.data[0]
    
    if not restaurant:
        print("❌ Restaurant not found. Please check the ID or email.")
        return None
    
    # Check if restaurant is already linked to another user
    if restaurant.get('clerk_user_id'):
        print(f"⚠️  Restaurant is already linked to user: {restaurant['clerk_user_id']}")
        response = input("Do you want to update the link? (y/n): ")
        if response.lower() != 'y':
            return None
    
    # Link the user
    result = supabase.table('restaurants').update({
        'clerk_user_id': clerk_user_id
    }).eq('id', restaurant['id']).execute()
    
    if result.data:
        print(f"✅ Successfully linked user {clerk_user_id} to restaurant:")
        print(f"   ID: {result.data[0]['id']}")
        print(f"   Name: {result.data[0].get('name', 'N/A')}")
        print(f"   Email: {result.data[0].get('email', 'N/A')}")
        return result.data[0]
    else:
        print("❌ Failed to link user to restaurant")
        return None

def check_user_status(clerk_user_id: str):
    """Check if a user is linked to a restaurant"""
    supabase = get_supabase_client()
    result = supabase.table('restaurants').select('*').eq('clerk_user_id', clerk_user_id).execute()
    
    if result.data:
        restaurant = result.data[0]
        print(f"✅ User {clerk_user_id} is linked to restaurant:")
        print(f"   ID: {restaurant['id']}")
        print(f"   Name: {restaurant.get('name', 'N/A')}")
        print(f"   Email: {restaurant.get('email', 'N/A')}")
        
        # Check if restaurant has menu items
        items_result = supabase.table('menu_items').select('id').eq('restaurant_id', restaurant['id']).execute()
        print(f"   Menu Items: {len(items_result.data) if items_result.data else 0}")
        return restaurant
    else:
        print(f"❌ User {clerk_user_id} is not linked to any restaurant")
        return None


if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description='Link a Clerk user to a restaurant')
    parser.add_argument('--list', action='store_true', help='List all restaurants')
    parser.add_argument('--check', help='Check if a Clerk user ID is linked')
    parser.add_argument('--link', help='Clerk user ID to link')
    parser.add_argument('--restaurant-id', type=int, help='Restaurant ID to link to')
    parser.add_argument('--restaurant-email', help='Restaurant email to link to')
    
    args = parser.parse_args()
    
    if args.list:
        list_restaurants()
    elif args.check:
        check_user_status(args.check)
    elif args.link:
        if not args.restaurant_id and not args.restaurant_email:
            print("❌ Error: Please provide either --restaurant-id or --restaurant-email")
            sys.exit(1)
        link_user_to_restaurant(args.link, args.restaurant_id, args.restaurant_email)
    else:
        parser.print_help()

