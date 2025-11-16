#!/usr/bin/env python3
"""
Script to transfer restaurant ownership to a new user
This updates the restaurant's email and links it to a new Clerk user
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

def transfer_restaurant(restaurant_slug: str, new_email: str, new_clerk_user_id: str = None):
    """
    Transfer restaurant ownership to a new user
    
    Args:
        restaurant_slug: The restaurant's slug (e.g., "bracera")
        new_email: New manager's email address
        new_clerk_user_id: Optional - Clerk user ID if the new user has already signed up.
                          If not provided, the restaurant will be ready to link when they sign up.
    """
    supabase = get_supabase_client()
    
    # Find the restaurant
    result = supabase.table('restaurants').select('*').eq('slug', restaurant_slug).execute()
    
    if not result.data:
        print(f"❌ Restaurant with slug '{restaurant_slug}' not found!")
        return None
    
    restaurant = result.data[0]
    old_email = restaurant.get('email')
    old_user_id = restaurant.get('clerk_user_id')
    
    print(f"📋 Restaurant: {restaurant['name']}")
    print(f"   Current email: {old_email}")
    if old_user_id:
        print(f"   Current Clerk user ID: {old_user_id}")
    
    # Update restaurant with new email
    update_data = {
        'email': new_email
    }
    
    # If new_clerk_user_id is provided, link it immediately
    # Otherwise, leave clerk_user_id as is (or set to None if you want to unlink)
    if new_clerk_user_id:
        update_data['clerk_user_id'] = new_clerk_user_id
        print(f"\n🔄 Transferring ownership...")
        print(f"   New email: {new_email}")
        print(f"   New Clerk user ID: {new_clerk_user_id}")
    else:
        # Unlink the old user, ready for new user to sign up
        update_data['clerk_user_id'] = None
        print(f"\n🔄 Preparing for transfer...")
        print(f"   New email: {new_email}")
        print(f"   Restaurant unlinked from old user")
        print(f"   New manager should sign up with: {new_email}")
        print(f"   Webhook will automatically link them")
    
    # Update the restaurant
    update_result = supabase.table('restaurants').update(update_data).eq('id', restaurant['id']).execute()
    
    if update_result.data:
        updated_restaurant = update_result.data[0]
        print(f"\n✅ Restaurant ownership transferred successfully!")
        print(f"   Restaurant ID: {updated_restaurant['id']}")
        print(f"   New email: {updated_restaurant['email']}")
        
        if new_clerk_user_id:
            print(f"   Linked to Clerk user: {updated_restaurant['clerk_user_id']}")
        else:
            print(f"\n📝 Next steps:")
            print(f"   1. Have the new manager sign up with Clerk using: {new_email}")
            print(f"   2. The webhook will automatically link their account")
        
        return updated_restaurant
    else:
        print("❌ Failed to transfer restaurant")
        return None


def unlink_restaurant(restaurant_slug: str):
    """
    Unlink a restaurant from its current user (useful for testing or transfers)
    """
    supabase = get_supabase_client()
    
    result = supabase.table('restaurants').select('*').eq('slug', restaurant_slug).execute()
    
    if not result.data:
        print(f"❌ Restaurant with slug '{restaurant_slug}' not found!")
        return None
    
    restaurant = result.data[0]
    
    update_result = supabase.table('restaurants').update({
        'clerk_user_id': None
    }).eq('id', restaurant['id']).execute()
    
    if update_result.data:
        print(f"✅ Restaurant '{restaurant['name']}' unlinked from user")
        print(f"   Email: {restaurant['email']}")
        print(f"   Ready for new user to sign up and link")
        return update_result.data[0]
    else:
        print("❌ Failed to unlink restaurant")
        return None


if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description='Transfer restaurant ownership to a new user')
    parser.add_argument('--slug', required=True, help='Restaurant slug (e.g., "bracera")')
    parser.add_argument('--email', required=True, help='New manager email address')
    parser.add_argument('--clerk-user-id', help='Clerk user ID (if new user already signed up)')
    parser.add_argument('--unlink', action='store_true', help='Just unlink the restaurant from current user')
    
    args = parser.parse_args()
    
    if args.unlink:
        unlink_restaurant(args.slug)
    else:
        transfer_restaurant(
            restaurant_slug=args.slug,
            new_email=args.email,
            new_clerk_user_id=args.clerk_user_id
        )

