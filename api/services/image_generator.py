"""
AI image generation service using OpenAI DALL-E 3
"""
import logging
from openai import OpenAI
from core.config import OPENAI_API_KEY

logger = logging.getLogger(__name__)

DEFAULT_STYLE = (
    "Professional food photography, appetizing presentation, "
    "soft natural lighting, shallow depth of field, clean plate, restaurant quality. Don't add any extra items "
    "to the dish that are not in the description, except for sauces and other condiments."
)


def build_prompt(
    dish_name: str,
    dish_description: str,
    custom_style: str = "",
    restaurant_style: str = "",
) -> str:
    """
    Assemble the DALL-E prompt from dish info and style preferences.
    """
    prompt = f"A professional food photograph of {dish_name}."
    if dish_description:
        prompt += f" {dish_description}."

    style = restaurant_style.strip() if restaurant_style and restaurant_style.strip() else DEFAULT_STYLE
    prompt += f" Style: {style}"

    if custom_style and custom_style.strip():
        prompt += f". {custom_style.strip()}"

    return prompt


def generate_food_image(
    dish_name: str,
    dish_description: str,
    custom_style: str = "",
    restaurant_style: str = "",
) -> str:
    """
    Generate a food image using DALL-E 3.

    Returns:
        Temporary URL of the generated image (expires after ~1 hour).
    """
    prompt = build_prompt(dish_name, dish_description, custom_style, restaurant_style)
    logger.info(f"Generating image with prompt: {prompt[:120]}...")

    try:
        client = OpenAI(api_key=OPENAI_API_KEY)
        response = client.images.generate(
            model="dall-e-3",
            prompt=prompt,
            size="1024x1024",
            quality="standard",
            n=1,
        )
        image_url = response.data[0].url
        logger.info("Image generated successfully")
        return image_url
    except Exception as e:
        logger.error(f"DALL-E image generation failed: {e}")
        raise
