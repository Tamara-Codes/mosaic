"""
Pydantic schemas for VIP form validation
"""
from pydantic import BaseModel, Field, validator
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
    mobile: str = Field(
        ...,
        min_length=8,
        max_length=20,
        description="Mobile phone number",
        example="+385 91 123 4567"
    )
    location: str = Field(
        ...,
        min_length=2,
        max_length=100,
        description="Location (city)",
        example="Zagreb"
    )
    
    @validator('restaurantName')
    def validate_restaurant_name(cls, v):
        """Validate restaurant name"""
        return v.strip()
    
    @validator('mobile')
    def validate_mobile(cls, v):
        """Validate mobile number"""
        # Allow digits, spaces, +, -, (, )
        if not re.match(r'^[\d\s\+\-\(\)]+$', v):
            raise ValueError('Mobile number contains invalid characters')
        return v.strip()
    
    @validator('location')
    def validate_location(cls, v):
        """Validate location"""
        return v.strip()

