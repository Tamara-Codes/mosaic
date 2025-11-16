#!/usr/bin/env python3
"""Quick script to verify webhook configuration"""
import os
from dotenv import load_dotenv

load_dotenv()

print("=" * 50)
print("CLERK WEBHOOK CONFIGURATION CHECK")
print("=" * 50)

webhook_secret = os.getenv("CLERK_WEBHOOK_SECRET")
secret_key = os.getenv("CLERK_SECRET_KEY")

print(f"\n1. CLERK_WEBHOOK_SECRET:")
if webhook_secret:
    print(f"   ✅ SET")
    print(f"   Length: {len(webhook_secret)}")
    print(f"   Starts with: {webhook_secret[:6]}")
    print(f"   Expected: whsec_...")
    if webhook_secret.startswith("whsec_"):
        print(f"   ✅ Format looks correct!")
    else:
        print(f"   ❌ WRONG FORMAT! Should start with 'whsec_'")
else:
    print(f"   ❌ MISSING!")

print(f"\n2. CLERK_SECRET_KEY:")
if secret_key:
    print(f"   ✅ SET")
    print(f"   Length: {len(secret_key)}")
    print(f"   Starts with: {secret_key[:6]}")
    print(f"   Expected: sk_test_... or sk_live_...")
    if secret_key.startswith("sk_"):
        print(f"   ✅ Format looks correct!")
    else:
        print(f"   ❌ WRONG FORMAT! Should start with 'sk_'")
else:
    print(f"   ❌ MISSING!")

print(f"\n3. Next Steps:")
print(f"   • Go to Clerk Dashboard > Webhooks")
print(f"   • Click on your webhook endpoint")
print(f"   • Copy the 'Signing Secret' (whsec_...)")
print(f"   • Make sure it matches CLERK_WEBHOOK_SECRET exactly")
print(f"   • If testing locally, use ngrok: 'ngrok http 8000'")
print(f"   • Update webhook URL in Clerk to use ngrok URL")

print("\n" + "=" * 50)

