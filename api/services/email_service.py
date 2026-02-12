"""
Email service for sending contact form messages via Resend HTTP API.

Resend is used instead of SMTP because Vercel serverless functions
block outbound SMTP connections on ports 587/465.

Setup:
1. Sign up at https://resend.com
2. Add and verify your domain (ferros.menu) in the Resend dashboard
3. Set RESEND_API_KEY in your environment variables
"""
import os
import httpx
from typing import Optional
import logging

logger = logging.getLogger(__name__)

RESEND_API_KEY = os.getenv("RESEND_API_KEY")
RESEND_API_URL = "https://api.resend.com/emails"
FROM_EMAIL = os.getenv("RESEND_FROM_EMAIL", "Ferros <info@ferros.menu>")
CONTACT_EMAIL = "info@ferros.menu"

if not RESEND_API_KEY:
    logger.warning("RESEND_API_KEY not set - email functionality will be disabled")


async def send_contact_email(
    name: str,
    email: str,
    message: str,
    restaurant_name: Optional[str] = None
) -> bool:
    """
    Send contact form submission to info@ferros.menu via Resend API

    Args:
        name: Name of the person contacting
        email: Email address of the person contacting
        message: The message content
        restaurant_name: Optional restaurant name if from authenticated user

    Returns:
        bool: True if email was sent successfully, False otherwise
    """
    if not RESEND_API_KEY:
        logger.error("Cannot send email: RESEND_API_KEY not configured")
        return False

    try:
        subject = f"Nova poruka sa kontakt forme - {name}"
        if restaurant_name:
            subject += f" ({restaurant_name})"

        html_content = f"""
        <html>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                    <h2 style="color: #f97316; border-bottom: 2px solid #f97316; padding-bottom: 10px;">
                        Nova poruka sa kontakt forme
                    </h2>

                    <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
                        <p><strong>Ime:</strong> {name}</p>
                        <p><strong>Email:</strong> <a href="mailto:{email}">{email}</a></p>
                        {f'<p><strong>Restoran:</strong> {restaurant_name}</p>' if restaurant_name else ''}
                    </div>

                    <div style="margin: 20px 0;">
                        <h3 style="color: #555;">Poruka:</h3>
                        <div style="background-color: #fff; padding: 15px; border-left: 4px solid #f97316; border-radius: 4px;">
                            {message.replace(chr(10), '<br>')}
                        </div>
                    </div>

                    <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #888; font-size: 12px;">
                        <p>Ova poruka je poslana sa Ferros kontakt forme.</p>
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
                    "to": [CONTACT_EMAIL],
                    "reply_to": email,
                    "subject": subject,
                    "html": html_content,
                },
                timeout=10.0,
            )

        if response.status_code == 200:
            logger.info(f"Contact email sent successfully to {CONTACT_EMAIL}")
            return True
        else:
            logger.error(f"Resend API error {response.status_code}: {response.text}")
            return False

    except Exception as e:
        logger.error(f"Failed to send contact email: {str(e)}")
        logger.error(f"Error type: {type(e).__name__}")
        return False


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
