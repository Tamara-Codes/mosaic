#!/usr/bin/env python3
"""
Admin tool to create pending restaurants for new customers.

USAGE:
  python create_restaurant.py <email> <restaurant_name>

EXAMPLE:
  python create_restaurant.py john@restaurant.com "John's Pizza"

WORKFLOW:
  1. Customer buys your product
  2. Run this script with their email and restaurant name
  3. Script creates restaurant AND sends Clerk invitation automatically
  4. When they sign up, webhook auto-links them to this restaurant
"""
import sys
import os
import re
import httpx
from supabase import create_client

# Load environment variables
from dotenv import load_dotenv
load_dotenv('api/.env')

SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_KEY = os.getenv('SUPABASE_KEY')
CLERK_SECRET_KEY = os.getenv('CLERK_SECRET_KEY')


def generate_slug(name):
    """Generate URL-friendly slug from restaurant name"""
    slug = name.lower()
    slug = re.sub(r'[^a-z0-9\s-]', '', slug)  # Remove special chars
    slug = re.sub(r'\s+', '-', slug)  # Replace spaces with hyphens
    slug = slug.strip('-')  # Remove leading/trailing hyphens
    return slug


def send_clerk_invitation(email, restaurant_name):
    """Send invitation via Clerk API"""
    if not CLERK_SECRET_KEY:
        print("⚠️  Warning: CLERK_SECRET_KEY not set, skipping invitation email")
        return False

    url = "https://api.clerk.com/v1/invitations"
    headers = {
        "Authorization": f"Bearer {CLERK_SECRET_KEY}",
        "Content-Type": "application/json"
    }
    data = {
        "email_address": email,
        "public_metadata": {
            "restaurant_name": restaurant_name
        },
        "redirect_url": os.getenv('MENU_URL', 'http://localhost:5173')
    }

    try:
        with httpx.Client() as client:
            response = client.post(url, json=data, headers=headers)
            if response.status_code == 200:
                return True
            else:
                print(f"⚠️  Clerk API error: {response.status_code}")
                print(f"   Response: {response.text}")
                return False
    except Exception as e:
        print(f"⚠️  Error sending invitation: {e}")
        return False


def main():
    if len(sys.argv) < 3:
        print("❌ Missing arguments!")
        print("\nUsage: python create_restaurant.py <email> <restaurant_name>")
        print('Example: python create_restaurant.py john@restaurant.com "John\'s Pizza"')
        print("\nThis creates a PENDING restaurant that will auto-link when user signs up.")
        sys.exit(1)

    email = sys.argv[1]
    restaurant_name = ' '.join(sys.argv[2:])  # Allow spaces in name

    # Validate email format
    if '@' not in email or '.' not in email:
        print(f"❌ Invalid email format: {email}")
        sys.exit(1)

    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

    # Check if restaurant already exists for this email
    existing = supabase.table('restaurants').select('*').eq('email', email).execute()
    if existing.data:
        restaurant = existing.data[0]
        print(f"⚠️  Restaurant already exists for email: {email}")
        print(f"   ID: {restaurant['id']}")
        print(f"   Name: {restaurant['name']}")
        print(f"   Status: {'Linked' if restaurant.get('clerk_user_id') else 'PENDING (not linked yet)'}")
        return

    # Generate slug
    slug = generate_slug(restaurant_name)

    # Check if slug is taken
    existing_slug = supabase.table('restaurants').select('*').eq('slug', slug).execute()
    if existing_slug.data:
        # Append number to make it unique
        counter = 2
        while True:
            new_slug = f"{slug}-{counter}"
            check = supabase.table('restaurants').select('*').eq('slug', new_slug).execute()
            if not check.data:
                slug = new_slug
                break
            counter += 1

    # Create pending restaurant (clerk_user_id is NULL until they sign up)
    restaurant_data = {
        'email': email,
        'name': restaurant_name,
        'slug': slug,
        'theme_identifier': 'default-theme'
        # clerk_user_id is NULL - will be set by webhook when user signs up
    }

    result = supabase.table('restaurants').insert(restaurant_data).execute()

    if result.data:
        restaurant = result.data[0]
        print(f"✅ Pending restaurant created successfully!")
        print(f"\n📋 Restaurant Details:")
        print(f"   ID: {restaurant['id']}")
        print(f"   Name: {restaurant['name']}")
        print(f"   Slug: {restaurant['slug']}")
        print(f"   Email: {restaurant['email']}")
        print(f"   Status: PENDING (waiting for user signup)")

        # Send Clerk invitation
        print(f"\n📧 Sending invitation via Clerk...")
        if send_clerk_invitation(email, restaurant_name):
            print(f"✅ Invitation sent to {email}!")
            print(f"\n🎉 Complete! Customer will receive:")
            print(f"   • Email invitation from Clerk")
            print(f"   • Link to sign up")
            print(f"   • Auto-linked to restaurant on signup")
            print(f"\n🌐 Public menu URL: http://localhost:5181/menu/{slug}")
        else:
            print(f"⚠️  Restaurant created but invitation failed to send")
            print(f"\n📧 Manual Next Steps:")
            print(f"   1. Send invite to: {email}")
            print(f"   2. Ask them to sign up with this exact email")
            print(f"   3. Webhook will auto-link when they sign up")
            print(f"   4. Public menu URL: http://localhost:5181/menu/{slug}")
    else:
        print("❌ Failed to create restaurant")
        print(result)

if __name__ == '__main__':
    main()
