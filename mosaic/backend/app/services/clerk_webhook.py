"""
Clerk webhook handlers for user management.
Handles user creation, updates, and deletion from Clerk events.
"""

import json
import logging
from datetime import datetime
from typing import Any
from typing import Dict

from fastapi import HTTPException
from fastapi import Request
from supabase import Client

logger = logging.getLogger(__name__)


class ClerkWebhookHandler:
    """
    Handles Clerk webhook events for user management.

    This class processes webhook events from Clerk and syncs user data
    with the Supabase database.
    """

    def __init__(self, supabase_client: Client, webhook_secret: str = None):
        """
        Initialize the Clerk webhook handler.

        Args:
            supabase_client: Supabase client instance
            webhook_secret: Clerk webhook secret for signature verification
        """
        self.supabase = supabase_client
        self.webhook_secret = webhook_secret
        self.logger = logging.getLogger(__name__)

    def verify_webhook_signature(self, payload: bytes, headers: dict) -> bool:
        """
        Verify Clerk webhook signature using Svix format.

        Args:
            payload: Raw webhook payload
            headers: Request headers containing signature

        Returns:
            True if signature is valid, False otherwise
        """
        if not self.webhook_secret:
            self.logger.warning("CLERK_WEBHOOK_SECRET not configured - skipping signature verification")
            return True  # Allow in development

        try:
            from svix.webhooks import Webhook

            wh = Webhook(self.webhook_secret)
            wh.verify(payload, headers)
            return True
        except Exception as e:
            self.logger.error(f"Error verifying Clerk webhook signature: {e}")
            return False

    async def handle_webhook(self, request: Request) -> Dict[str, Any]:
        """
        Handle Clerk webhook events for user creation/updates.

        Args:
            request: FastAPI request object

        Returns:
            Response message indicating success

        Raises:
            HTTPException: If webhook processing fails
        """
        try:
            # Get raw payload and headers
            payload = await request.body()
            headers = dict(request.headers)

            self.logger.info("Received Clerk webhook request")

            # Verify webhook signature
            if not self.verify_webhook_signature(payload, headers):
                self.logger.error("Webhook signature verification failed")
                raise HTTPException(status_code=401, detail="Invalid webhook signature")

            # Parse JSON payload
            try:
                event_data = json.loads(payload.decode())
                self.logger.info("Parsed webhook payload successfully")
            except json.JSONDecodeError as e:
                self.logger.error(f"Failed to parse JSON payload: {e}")
                raise HTTPException(status_code=400, detail="Invalid JSON payload")

            event_type = event_data.get("type")
            event_object = event_data.get("data", {})

            self.logger.info(f"Processing Clerk webhook: {event_type}")

            # Route to appropriate handler
            if event_type == "user.created":
                await self._handle_user_created(event_object)
            elif event_type == "user.updated":
                await self._handle_user_updated(event_object)
            elif event_type == "user.deleted":
                await self._handle_user_deleted(event_object)
            else:
                self.logger.warning(f"Unhandled Clerk webhook event: {event_type}")

            self.logger.info(f"Webhook processed successfully: {event_type}")
            return {"message": "Webhook processed successfully"}

        except HTTPException:
            raise
        except Exception as e:
            self.logger.error(f"Error processing Clerk webhook: {e}")
            raise HTTPException(status_code=500, detail="Failed to process webhook")

    async def _handle_user_created(self, event_data: dict) -> Dict[str, Any]:
        """
        Handle user.created webhook event.

        Args:
            event_data: User data from Clerk event

        Returns:
            Supabase response data
        """
        try:
            clerk_user_id = event_data.get("id")
            email_addresses = event_data.get("email_addresses", [])

            primary_email, email_verified = self._extract_primary_email(event_data, email_addresses)
            if not primary_email:
                self.logger.warning("No primary email found in Clerk user data")
                return {}

            user_info = self._extract_user_info(event_data, primary_email)

            # Prepare user data for upsert
            user_data = {
                "clerk_user_id": clerk_user_id,
                "email": primary_email,
                "name": user_info["full_name"],
                "first_name": user_info["first_name"],
                "last_name": user_info["last_name"],
                "avatar_url": user_info["avatar_url"],
                "email_verified": email_verified,
                "updated_at": datetime.now().isoformat(),
                "created_at": datetime.now().isoformat(),  # This will be ignored on update
            }

            result = self.supabase.table("users").upsert([user_data], on_conflict="email").execute()

            self.logger.info(
                f"Successfully created/updated user from Clerk webhook: {clerk_user_id} (email: {primary_email})"
            )
            return result.data

        except Exception as e:
            self.logger.error(f"Error handling user.created webhook: {e}")
            raise

    async def _handle_user_updated(self, event_data: dict) -> Dict[str, Any]:
        """
        Handle user.updated webhook event.

        Args:
            event_data: User data from Clerk event

        Returns:
            Supabase response data
        """
        try:
            clerk_user_id = event_data.get("id")
            email_addresses = event_data.get("email_addresses", [])

            # Get primary email
            primary_email, email_verified = self._extract_primary_email(event_data, email_addresses)
            if not primary_email:
                self.logger.warning("No primary email found in Clerk user data")
                return {}

            # Extract user information
            user_info = self._extract_user_info(event_data, primary_email)

            # Update user in Supabase
            user_data = {
                "clerk_user_id": clerk_user_id,
                "email": primary_email,
                "name": user_info["full_name"],
                "first_name": user_info["first_name"],
                "last_name": user_info["last_name"],
                "avatar_url": user_info["avatar_url"],
                "email_verified": email_verified,
                "updated_at": datetime.now().isoformat(),
            }

            result = self.supabase.table("users").upsert([user_data], on_conflict="clerk_user_id").execute()

            self.logger.info(f"Successfully updated user from Clerk webhook: {clerk_user_id}")
            return result.data

        except Exception as e:
            self.logger.error(f"Error handling user.updated webhook: {e}")
            raise

    async def _handle_user_deleted(self, event_data: dict) -> Dict[str, Any]:
        """
        Handle user.deleted webhook event.

        Args:
            event_data: User data from Clerk event

        Returns:
            Supabase response data
        """
        try:
            clerk_user_id = event_data.get("id")

            # Soft delete user in Supabase (set active=False)
            result = (
                self.supabase.table("users")
                .update({"active": False, "updated_at": datetime.now().isoformat()})
                .eq("clerk_user_id", clerk_user_id)
                .execute()
            )

            self.logger.info(f"Successfully deactivated user from Clerk webhook: {clerk_user_id}")
            return result.data

        except Exception as e:
            self.logger.error(f"Error handling user.deleted webhook: {e}")
            raise

    def _extract_primary_email(self, event_data: dict, email_addresses: list) -> tuple:
        """
        Extract primary email and verification status from Clerk event data.

        Args:
            event_data: User data from Clerk event
            email_addresses: List of email addresses

        Returns:
            Tuple of (primary_email, email_verified)
        """
        primary_email = None
        email_verified = False

        for email_obj in email_addresses:
            if email_obj.get("id") == event_data.get("primary_email_address_id"):
                primary_email = email_obj.get("email_address")
                email_verified = email_obj.get("verification", {}).get("status") == "verified"
                break

        return primary_email, email_verified

    def _extract_user_info(self, event_data: dict, primary_email: str) -> Dict[str, Any]:
        """
        Extract user information from Clerk event data.

        Args:
            event_data: User data from Clerk event
            primary_email: User's primary email address

        Returns:
            Dictionary containing user information
        """
        first_name = event_data.get("first_name", "")
        last_name = event_data.get("last_name", "")
        full_name = f"{first_name} {last_name}".strip()

        if not full_name:
            # Fallback to email username if no name provided
            full_name = primary_email.split("@")[0]

        avatar_url = event_data.get("image_url")

        return {
            "full_name": full_name,
            "first_name": first_name if first_name else None,
            "last_name": last_name if last_name else None,
            "avatar_url": avatar_url,
        }
