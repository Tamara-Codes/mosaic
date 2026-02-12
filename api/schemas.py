from pydantic import BaseModel, Field, EmailStr, validator
from typing import Optional, List
import re

class RestaurantInfoBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=200, description="Restaurant name")
    description: Optional[str] = Field(None, max_length=2000, description="Restaurant description")
    address: Optional[str] = Field(None, max_length=500, description="Restaurant address")
    phone: Optional[str] = Field(None, max_length=50, description="Phone number")
    email: Optional[EmailStr] = Field(None, max_length=255, description="Email address")
    
    @validator('phone')
    def validate_phone(cls, v):
        if v and not re.match(r'^[\d\s\-\+\(\)]+$', v):
            raise ValueError('Invalid phone number format')
        return v

class RestaurantInfoCreate(RestaurantInfoBase):
    pass

class RestaurantInfoResponse(RestaurantInfoBase):
    id: int
    
    class Config:
        from_attributes = True

class CategoryBase(BaseModel):
    name: str
    order: int = 0

class CategoryCreate(CategoryBase):
    pass

class CategoryTranslationBase(BaseModel):
    language_code: str
    language_name: str
    name: str
    is_ai_generated: bool = True

class CategoryTranslationCreate(CategoryTranslationBase):
    category_id: int

class CategoryTranslationUpdate(BaseModel):
    name: Optional[str] = None

class CategoryTranslationResponse(CategoryTranslationBase):
    id: int
    category_id: int
    
    class Config:
        from_attributes = True

class CategoryResponse(CategoryBase):
    id: int
    
    class Config:
        from_attributes = True

class CategoryWithTranslationsResponse(CategoryResponse):
    translations: List['CategoryTranslationResponse'] = []
    
    class Config:
        from_attributes = True

class TranslationBase(BaseModel):
    language_code: str
    language_name: str
    name: str
    description: Optional[str] = None
    is_ai_generated: bool = True

class TranslationCreate(TranslationBase):
    menu_item_id: int

class TranslationUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None

class TranslationResponse(TranslationBase):
    id: int
    menu_item_id: int
    
    class Config:
        from_attributes = True

class MenuItemBase(BaseModel):
    name_hr: str = Field(..., min_length=1, max_length=200, description="Item name in Croatian")
    description_hr: Optional[str] = Field(None, max_length=2000, description="Item description")
    price: float = Field(..., ge=0, le=10000, description="Price (must be between 0 and 10000)")
    category: Optional[str] = Field(None, max_length=100, description="Category name")
    is_available: bool = True
    is_vegetarian: bool = False
    is_vegan: bool = False
    contains_gluten: bool = False
    contains_dairy: bool = False
    contains_nuts: bool = False
    contains_fish: bool = False
    contains_shellfish: bool = False
    contains_eggs: bool = False
    is_spicy: bool = False

class MenuItemCreate(MenuItemBase):
    pass

class MenuItemUpdate(BaseModel):
    name_hr: Optional[str] = None
    description_hr: Optional[str] = None
    price: Optional[float] = None
    category: Optional[str] = None
    is_available: Optional[bool] = None
    is_vegetarian: Optional[bool] = None
    is_vegan: Optional[bool] = None
    contains_gluten: Optional[bool] = None
    contains_dairy: Optional[bool] = None
    contains_nuts: Optional[bool] = None
    contains_fish: Optional[bool] = None
    contains_shellfish: Optional[bool] = None
    contains_eggs: Optional[bool] = None
    is_spicy: Optional[bool] = None

class MenuItemResponse(MenuItemBase):
    id: int
    image_path: Optional[str] = None
    
    class Config:
        from_attributes = True

class MenuItemWithTranslationsResponse(MenuItemResponse):
    translations: List[TranslationResponse] = []
    
    class Config:
        from_attributes = True

