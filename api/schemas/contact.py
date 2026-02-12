"""
Pydantic schemas for contact form validation
"""
from pydantic import BaseModel, Field, EmailStr, validator
import re


class ContactFormRequest(BaseModel):
    """Contact form submission with validation"""
    name: str = Field(
        ...,
        min_length=1,
        max_length=100,
        description="Contact name",
        example="John Doe"
    )
    email: EmailStr = Field(
        ...,
        max_length=255,
        description="Contact email address",
        example="john@example.com"
    )
    message: str = Field(
        ...,
        min_length=10,
        max_length=5000,
        description="Message content (10-5000 characters)",
        example="I would like to know more about your service."
    )
    
    @validator('name')
    def validate_name(cls, v):
        """Validate name contains only letters, spaces, and common characters"""
        if not re.match(r'^[a-zA-Z\s\-\.\']+$', v):
            raise ValueError('Name contains invalid characters')
        return v.strip()
    
    @validator('message')
    def validate_message(cls, v):
        """Validate message length and content"""
        v = v.strip()
        if len(v) < 10:
            raise ValueError('Message must be at least 10 characters long')
        if len(v) > 5000:
            raise ValueError('Message must be no more than 5000 characters')
        return v
    
    class Config:
        schema_extra = {
            "example": {
                "name": "John Doe",
                "email": "john@example.com",
                "message": "I would like to know more about your restaurant menu service."
            }
        }

