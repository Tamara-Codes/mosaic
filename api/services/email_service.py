"""
Email service for sending VIP form messages via Resend HTTP API.

Resend is used instead of SMTP because Vercel serverless functions
block outbound SMTP connections on ports 587/465.

Setup:
1. Sign up at https://resend.com
2. Add and verify your domain (ferros.menu) in the Resend dashboard
3. Set RESEND_API_KEY in your environment variables
"""
import os
import httpx
from typing import Optional, Tuple, Dict
import logging
import base64

logger = logging.getLogger(__name__)

RESEND_API_KEY = os.getenv("RESEND_API_KEY")
RESEND_API_URL = "https://api.resend.com/emails"
FROM_EMAIL = os.getenv("RESEND_FROM_EMAIL", "Ferros <info@ferros.menu>")
CONTACT_EMAIL = os.getenv("CONTACT_EMAIL", "info@ferros.menu")

if not RESEND_API_KEY:
    logger.warning("RESEND_API_KEY not set - email functionality will be disabled")


async def send_notification_email(
    to_email: str,
    subject: str,
    message: str
) -> bool:
    """
    Send a notification email to a specific address via Resend API

    Args:
        to_email: Recipient email address
        subject: Email subject
        message: Email message content

    Returns:
        bool: True if email was sent successfully, False otherwise
    """
    if not RESEND_API_KEY:
        logger.error("Cannot send email: RESEND_API_KEY not configured")
        return False

    try:
        html_content = f"""
        <html>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                    <div style="margin: 20px 0;">
                        {message.replace(chr(10), '<br>')}
                    </div>

                    <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #888; font-size: 12px;">
                        <p>Ferros - Vaš elektronski jelovnik</p>
                    </div>
                </div>
            </body>
        </html>
        """

        async with httpx.AsyncClient() as client:
            response = await client.post(
                RESEND_API_URL,
                headers={
                    "Authorization": f"Bearer {RESEND_API_KEY}",
                    "Content-Type": "application/json",
                },
                json={
                    "from": FROM_EMAIL,
                    "to": [to_email],
                    "subject": subject,
                    "html": html_content,
                },
                timeout=10.0,
            )

        if response.status_code == 200:
            logger.info(f"Notification email sent successfully to {to_email}")
            return True
        else:
            logger.error(f"Resend API error {response.status_code}: {response.text}")
            return False

    except Exception as e:
        logger.error(f"Failed to send notification email to {to_email}: {str(e)}")
        logger.error(f"Error type: {type(e).__name__}")
        return False


async def send_vip_form_email(
    restaurant_name: str,
    email: str,
    mobile: Optional[str] = None,
    menu_file: Optional[Dict] = None
) -> Tuple[bool, Optional[str]]:
    """
    Send VIP form submission to info@ferros.menu via Resend API with optional file attachment

    Args:
        restaurant_name: Name of the restaurant
        email: Email address
        mobile: Mobile phone number (optional)
        menu_file: Optional dict with 'filename', 'content', and 'content_type' for menu file

    Returns:
        Tuple[bool, Optional[str]]: (success, error_message)
        - success: True if email was sent successfully, False otherwise
        - error_message: Error description if failed, None if successful
    """
    if not RESEND_API_KEY:
        error_msg = "RESEND_API_KEY not configured"
        logger.error(f"Cannot send email: {error_msg}")
        return False, error_msg

    try:
        subject = f"Novi VIP zahtjev - {restaurant_name}"

        html_content = f"""
        <html>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                    <h2 style="color: #f97316; border-bottom: 2px solid #f97316; padding-bottom: 10px;">
                        Novi VIP zahtjev
                    </h2>

                    <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
                        <p><strong>Ime restorana:</strong> {restaurant_name}</p>
                        <p><strong>Email:</strong> <a href="mailto:{email}">{email}</a></p>
                        {f'<p><strong>Broj mobitela:</strong> <a href="tel:{mobile}">{mobile}</a></p>' if mobile else ''}
                        {f'<p><strong>Jelovnik:</strong> {menu_file["filename"]} (priloženo)</p>' if menu_file else '<p><strong>Jelovnik:</strong> Nije priložen</p>'}
                    </div>

                    <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #888; font-size: 12px;">
                        <p>Ovaj zahtjev je poslan sa Ferros VIP kontakt forme.</p>
                    </div>
                </div>
            </body>
        </html>
        """

        # Prepare email payload
        email_payload = {
            "from": FROM_EMAIL,
            "to": [CONTACT_EMAIL],
            "subject": subject,
            "html": html_content,
        }

        # Add attachment if menu file is provided
        if menu_file:
            # Encode file content to base64 for Resend API
            # Resend expects base64-encoded content without the data URI prefix
            file_content_base64 = base64.b64encode(menu_file["content"]).decode("utf-8")
            email_payload["attachments"] = [
                {
                    "filename": menu_file["filename"],
                    "content": file_content_base64
                }
            ]
            logger.info(f"Adding attachment: {menu_file['filename']} ({len(menu_file['content'])} bytes, type: {menu_file['content_type']})")

        async with httpx.AsyncClient() as client:
            response = await client.post(
                RESEND_API_URL,
                headers={
                    "Authorization": f"Bearer {RESEND_API_KEY}",
                    "Content-Type": "application/json",
                },
                json=email_payload,
                timeout=30.0,  # Longer timeout for file uploads
            )

        if response.status_code == 200:
            logger.info(f"VIP form email sent successfully to {CONTACT_EMAIL}")
            return True, None
        else:
            error_msg = f"Resend API error {response.status_code}: {response.text}"
            logger.error(error_msg)
            return False, error_msg

    except httpx.TimeoutException as e:
        error_msg = f"Request timeout: {str(e)}"
        logger.error(f"Failed to send VIP form email: {error_msg}")
        return False, error_msg
    except httpx.RequestError as e:
        error_msg = f"Request error: {str(e)}"
        logger.error(f"Failed to send VIP form email: {error_msg}")
        return False, error_msg
    except Exception as e:
        error_msg = f"Unexpected error: {str(e)}"
        logger.error(f"Failed to send VIP form email: {error_msg}")
        logger.error(f"Error type: {type(e).__name__}")
        import traceback
        logger.error(f"Traceback: {traceback.format_exc()}")
        return False, error_msg
