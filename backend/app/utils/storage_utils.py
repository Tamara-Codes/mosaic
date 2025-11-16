"""
Supabase Storage utilities for image uploads
"""
import os
import uuid
from typing import Optional
from app.core.supabase_client import get_supabase_client
from fastapi import UploadFile, HTTPException

BUCKET_NAME = "menu-images"

def get_supabase_storage():
    """Get Supabase storage client"""
    supabase = get_supabase_client()
    return supabase.storage

async def upload_image_to_storage(
    file: UploadFile,
    restaurant_id: str,
    menu_item_id: Optional[str] = None
) -> str:
    """
    Upload an image to Supabase Storage
    
    Args:
        file: The uploaded file
        restaurant_id: UUID of the restaurant (for organization)
        menu_item_id: Optional UUID of menu item (for organization)
    
    Returns:
        Public URL of the uploaded image
    """
    storage = get_supabase_storage()
    
    # Generate unique filename
    file_extension = os.path.splitext(file.filename)[1] if file.filename else ".jpg"
    unique_filename = f"{uuid.uuid4()}{file_extension}"
    
    # Organize by restaurant: restaurant_id/menu_item_id/filename
    if menu_item_id:
        file_path = f"{restaurant_id}/{menu_item_id}/{unique_filename}"
    else:
        file_path = f"{restaurant_id}/{unique_filename}"
    
    # Read file content
    file_content = await file.read()
    
    # Upload to Supabase Storage
    try:
        result = storage.from_(BUCKET_NAME).upload(
            path=file_path,
            file=file_content,
            file_options={"content-type": file.content_type or "image/jpeg", "upsert": "false"}
        )
        
        # Get public URL
        public_url = storage.from_(BUCKET_NAME).get_public_url(file_path)
        return public_url
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to upload image: {str(e)}"
        )

def delete_image_from_storage(image_path: str) -> bool:
    """
    Delete an image from Supabase Storage
    
    Args:
        image_path: The path or URL of the image to delete
    
    Returns:
        True if successful, False otherwise
    """
    try:
        storage = get_supabase_storage()
        
        # Extract path from URL if it's a full URL
        if image_path.startswith("http"):
            # Extract path from Supabase public URL
            # Format: https://[project].supabase.co/storage/v1/object/public/menu-images/path
            parts = image_path.split("/menu-images/")
            if len(parts) > 1:
                file_path = parts[1]
            else:
                return False
        else:
            file_path = image_path
        
        # Delete from storage
        storage.from_(BUCKET_NAME).remove([file_path])
        return True
        
    except Exception as e:
        print(f"Error deleting image: {str(e)}")
        return False

def get_image_url(image_path: Optional[str]) -> Optional[str]:
    """
    Get the public URL for an image path
    
    Args:
        image_path: The storage path or existing URL
    
    Returns:
        Public URL or None
    """
    if not image_path:
        return None
    
    # If it's already a full URL, return as is
    if image_path.startswith("http"):
        return image_path
    
    # Otherwise, construct public URL
    storage = get_supabase_storage()
    try:
        return storage.from_(BUCKET_NAME).get_public_url(image_path)
    except:
        return image_path

