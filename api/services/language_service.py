"""
Language management service using Supabase.
Replaces the old file-based language management.
"""
from core.supabase_client import get_supabase_client


def get_all_languages():
    """Get all available languages from the languages table.
    Returns dict of {code: name}.
    """
    supabase = get_supabase_client()
    result = supabase.table('languages').select('code, name').order('name').execute()
    return {lang['code']: lang['name'] for lang in result.data}


def get_restaurant_languages(restaurant_id):
    """Get active languages for a specific restaurant.
    Returns list of {code, name} dicts.
    """
    supabase = get_supabase_client()
    result = (
        supabase.table('restaurant_languages')
        .select('language_code, languages(name)')
        .eq('restaurant_id', restaurant_id)
        .execute()
    )
    return [
        {
            'code': row['language_code'],
            'name': row['languages']['name']
        }
        for row in result.data
    ]


def add_restaurant_language(restaurant_id, language_code):
    """Add a language to a restaurant's active languages.
    Returns the inserted record or raises on duplicate.
    """
    supabase = get_supabase_client()
    result = (
        supabase.table('restaurant_languages')
        .insert({
            'restaurant_id': restaurant_id,
            'language_code': language_code
        })
        .execute()
    )
    return result.data[0] if result.data else None


def remove_restaurant_language(restaurant_id, language_code):
    """Remove a language from a restaurant's active languages."""
    supabase = get_supabase_client()
    supabase.table('restaurant_languages').delete().eq(
        'restaurant_id', restaurant_id
    ).eq('language_code', language_code).execute()
