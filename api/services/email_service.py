"""
Email service for sending contact form messages via SMTP
"""
import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Optional
import logging

logger = logging.getLogger(__name__)

# SMTP Configuration for Zoho
SMTP_HOST = os.getenv("SMTP_HOST", "smtp.zoho.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER = os.getenv("SMTP_USER")  # Your Zoho email (info@ferros.menu)
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD")  # Your Zoho email password
CONTACT_EMAIL = "info@ferros.menu"

if not SMTP_USER or not SMTP_PASSWORD:
    logger.warning("SMTP credentials not set - email functionality will be disabled")


async def send_contact_email(
    name: str,
    email: str,
    message: str,
    restaurant_name: Optional[str] = None
) -> bool:
    """
    Send contact form submission to info@ferros.menu via SMTP
    
    Args:
        name: Name of the person contacting
        email: Email address of the person contacting
        message: The message content
        restaurant_name: Optional restaurant name if from authenticated user
    
    Returns:
        bool: True if email was sent successfully, False otherwise
    """
    if not SMTP_USER or not SMTP_PASSWORD:
        logger.error("Cannot send email: SMTP credentials not configured")
        return False
    
    try:
        # Build email subject
        subject = f"Nova poruka sa kontakt forme - {name}"
        if restaurant_name:
            subject += f" ({restaurant_name})"
        
        # Build email HTML content
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
                            {message.replace('\n', '<br>')}
                        </div>
                    </div>
                    
                    <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #888; font-size: 12px;">
                        <p>Ova poruka je poslana sa Ferros kontakt forme.</p>
                    </div>
                </div>
            </body>
        </html>
        """
        
        # Build plain text version
        text_content = f"""
Nova poruka sa kontakt forme

Ime: {name}
Email: {email}
{'Restoran: ' + restaurant_name if restaurant_name else ''}

Poruka:
{message}

---
Ova poruka je poslana sa Ferros kontakt forme.
        """
        
        # Create message
        msg = MIMEMultipart('alternative')
        msg['Subject'] = subject
        msg['From'] = SMTP_USER
        msg['To'] = CONTACT_EMAIL
        msg['Reply-To'] = email
        
        # Attach both plain text and HTML versions
        part1 = MIMEText(text_content, 'plain', 'utf-8')
        part2 = MIMEText(html_content, 'html', 'utf-8')
        msg.attach(part1)
        msg.attach(part2)
        
        # Send email via SMTP
        with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
            server.starttls()
            server.login(SMTP_USER, SMTP_PASSWORD)
            server.send_message(msg)
        
        logger.info(f"Contact email sent successfully to {CONTACT_EMAIL}")
        return True
        
    except Exception as e:
        logger.error(f"Failed to send contact email: {str(e)}")
        return False


async def send_notification_email(
    to_email: str,
    subject: str,
    message: str
) -> bool:
    """
    Send a notification email to a specific address via SMTP
    
    Args:
        to_email: Recipient email address
        subject: Email subject
        message: Email message content
    
    Returns:
        bool: True if email was sent successfully, False otherwise
    """
    if not SMTP_USER or not SMTP_PASSWORD:
        logger.error("Cannot send email: SMTP credentials not configured")
        return False
    
    try:
        html_content = f"""
        <html>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                    <div style="margin: 20px 0;">
                        {message.replace('\n', '<br>')}
                    </div>
                    
                    <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #888; font-size: 12px;">
                        <p>Ferros - Vaš elektronski jelovnik</p>
                    </div>
                </div>
            </body>
        </html>
        """
        
        # Create message
        msg = MIMEMultipart('alternative')
        msg['Subject'] = subject
        msg['From'] = SMTP_USER
        msg['To'] = to_email
        
        # Attach both plain text and HTML versions
        part1 = MIMEText(message, 'plain', 'utf-8')
        part2 = MIMEText(html_content, 'html', 'utf-8')
        msg.attach(part1)
        msg.attach(part2)
        
        # Send email via SMTP
        with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
            server.starttls()
            server.login(SMTP_USER, SMTP_PASSWORD)
            server.send_message(msg)
        
        logger.info(f"Notification email sent successfully to {to_email}")
        return True
        
    except Exception as e:
        logger.error(f"Failed to send notification email to {to_email}: {str(e)}")
        return False

