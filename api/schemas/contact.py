"""
Pydantic schemas for VIP form validation
"""
from typing import Optional
from pydantic import BaseModel, Field, validator, EmailStr
import re


class VIPFormRequest(BaseModel):
    """VIP form submission with validation"""
    restaurantName: str = Field(
        ...,
        min_length=2,
        max_length=200,
        description="Restaurant name",
        example="Restoran Primus"
    )
    email: EmailStr = Field(
        ...,
        description="Email address",
        example="restoran@primjer.hr"
    )
    mobile: Optional[str] = Field(
        None,
        max_length=20,
        description="Mobile phone number (optional)",
        example="+385 91 123 4567"
    )

    @validator('restaurantName')
    def validate_restaurant_name(cls, v):
        """Validate restaurant name"""
        return v.strip()

    @validator('mobile', pre=True)
    def validate_mobile(cls, v):
        """Validate mobile number if provided"""
        if not v:
            return None
        v = v.strip()
        if not re.match(r'^[\d\s\+\-\(\)]+$', v):
            raise ValueError('Mobile number contains invalid characters')
        return v

