-- Add ui_translations table for restaurant-specific UI translations
CREATE TABLE IF NOT EXISTS ui_translations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    language_code TEXT NOT NULL,
    language_name TEXT NOT NULL,
    translation_key TEXT NOT NULL, -- e.g., 'food', 'drink'
    translation_value TEXT NOT NULL,
    is_ai_generated BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(restaurant_id, language_code, translation_key) -- One translation per key per language per restaurant
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_ui_translations_restaurant_id
ON ui_translations(restaurant_id);

CREATE INDEX IF NOT EXISTS idx_ui_translations_language_code
ON ui_translations(language_code);

-- Insert default Croatian values for existing restaurants
INSERT INTO ui_translations (restaurant_id, language_code, language_name, translation_key, translation_value, is_ai_generated)
SELECT id, 'hr', 'Hrvatski', 'food', 'Hrana', false
FROM restaurants
ON CONFLICT DO NOTHING;

INSERT INTO ui_translations (restaurant_id, language_code, language_name, translation_key, translation_value, is_ai_generated)
SELECT id, 'hr', 'Hrvatski', 'drink', 'Pića', false
FROM restaurants
ON CONFLICT DO NOTHING;
