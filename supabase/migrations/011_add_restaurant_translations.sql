-- Add restaurant_translations table for translating restaurant descriptions
CREATE TABLE IF NOT EXISTS restaurant_translations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    language_code TEXT NOT NULL,
    language_name TEXT NOT NULL,
    description TEXT,
    is_ai_generated BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(restaurant_id, language_code) -- One translation per language per restaurant
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_restaurant_translations_restaurant_id
ON restaurant_translations(restaurant_id);

CREATE INDEX IF NOT EXISTS idx_restaurant_translations_language_code
ON restaurant_translations(language_code);
