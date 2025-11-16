-- Supabase Schema for Multi-Tenant Restaurant Menu System
-- This schema supports Clerk authentication with one user = one restaurant

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Restaurants table (one per Clerk user)
CREATE TABLE IF NOT EXISTS restaurants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clerk_user_id TEXT UNIQUE, -- Links to Clerk user ID (NULL until user signs up)
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL, -- URL-friendly identifier (e.g., "bracera-inn")
    description TEXT,
    address TEXT,
    phone TEXT,
    email TEXT,
    theme_identifier TEXT NOT NULL DEFAULT 'default-theme', -- Theme identifier for public menu
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Menus table (one restaurant can have multiple menus)
CREATE TABLE IF NOT EXISTS menus (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    slug TEXT NOT NULL, -- URL-friendly identifier (e.g., "main-menu")
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(restaurant_id, slug) -- Ensure unique menu slugs per restaurant
);

-- Categories table
CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    name TEXT NOT NULL, -- Croatian name
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(restaurant_id, name) -- Ensure unique category names per restaurant
);

-- Menu Items table
CREATE TABLE IF NOT EXISTS menu_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    menu_id UUID REFERENCES menus(id) ON DELETE CASCADE,
    name_hr TEXT NOT NULL, -- Croatian name
    name_en TEXT NOT NULL, -- English name
    description_hr TEXT,
    description_en TEXT,
    price DECIMAL(10, 2) NOT NULL,
    image_path TEXT, -- Path in Supabase Storage
    category TEXT, -- Category name (for backward compatibility)
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    is_available BOOLEAN DEFAULT true,
    -- Allergen information
    is_vegetarian BOOLEAN DEFAULT false,
    is_vegan BOOLEAN DEFAULT false,
    contains_gluten BOOLEAN DEFAULT false,
    contains_dairy BOOLEAN DEFAULT false,
    contains_nuts BOOLEAN DEFAULT false,
    contains_fish BOOLEAN DEFAULT false,
    contains_shellfish BOOLEAN DEFAULT false,
    contains_eggs BOOLEAN DEFAULT false,
    is_spicy BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Translations table for menu items
CREATE TABLE IF NOT EXISTS translations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    menu_item_id UUID NOT NULL REFERENCES menu_items(id) ON DELETE CASCADE,
    language_code TEXT NOT NULL,
    language_name TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    is_ai_generated BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(menu_item_id, language_code) -- One translation per language per item
);

-- Category Translations table
CREATE TABLE IF NOT EXISTS category_translations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    language_code TEXT NOT NULL,
    language_name TEXT NOT NULL,
    name TEXT NOT NULL,
    is_ai_generated BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(category_id, language_code) -- One translation per language per category
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_restaurants_clerk_user_id ON restaurants(clerk_user_id);
CREATE INDEX IF NOT EXISTS idx_restaurants_slug ON restaurants(slug);
CREATE INDEX IF NOT EXISTS idx_menus_restaurant_id ON menus(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_menus_slug ON menus(slug);
CREATE INDEX IF NOT EXISTS idx_categories_restaurant_id ON categories(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_menu_items_restaurant_id ON menu_items(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_menu_items_menu_id ON menu_items(menu_id);
CREATE INDEX IF NOT EXISTS idx_menu_items_category_id ON menu_items(category_id);
CREATE INDEX IF NOT EXISTS idx_translations_menu_item_id ON translations(menu_item_id);
CREATE INDEX IF NOT EXISTS idx_translations_language_code ON translations(language_code);
CREATE INDEX IF NOT EXISTS idx_category_translations_category_id ON category_translations(category_id);

-- Row Level Security (RLS) Policies
-- Enable RLS on all tables
ALTER TABLE restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE menus ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE translations ENABLE ROW LEVEL SECURITY;
ALTER TABLE category_translations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for restaurants
-- Users can only see/update their own restaurant
CREATE POLICY "Users can view their own restaurant"
    ON restaurants FOR SELECT
    USING (auth.jwt() ->> 'sub' = clerk_user_id);

CREATE POLICY "Users can update their own restaurant"
    ON restaurants FOR UPDATE
    USING (auth.jwt() ->> 'sub' = clerk_user_id);

-- Public can view restaurants (for public menu pages)
CREATE POLICY "Public can view restaurants"
    ON restaurants FOR SELECT
    USING (true);

-- RLS Policies for menus
CREATE POLICY "Users can manage their own menus"
    ON menus FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM restaurants
            WHERE restaurants.id = menus.restaurant_id
            AND restaurants.clerk_user_id = (auth.jwt() ->> 'sub')
        )
    );

-- Public can view active menus
CREATE POLICY "Public can view active menus"
    ON menus FOR SELECT
    USING (is_active = true);

-- RLS Policies for categories
CREATE POLICY "Users can manage their own categories"
    ON categories FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM restaurants
            WHERE restaurants.id = categories.restaurant_id
            AND restaurants.clerk_user_id = (auth.jwt() ->> 'sub')
        )
    );

-- Public can view categories
CREATE POLICY "Public can view categories"
    ON categories FOR SELECT
    USING (true);

-- RLS Policies for menu_items
CREATE POLICY "Users can manage their own menu items"
    ON menu_items FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM restaurants
            WHERE restaurants.id = menu_items.restaurant_id
            AND restaurants.clerk_user_id = (auth.jwt() ->> 'sub')
        )
    );

-- Public can view available menu items
CREATE POLICY "Public can view available menu items"
    ON menu_items FOR SELECT
    USING (is_available = true);

-- RLS Policies for translations
CREATE POLICY "Users can manage translations for their items"
    ON translations FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM menu_items
            JOIN restaurants ON restaurants.id = menu_items.restaurant_id
            WHERE menu_items.id = translations.menu_item_id
            AND restaurants.clerk_user_id = (auth.jwt() ->> 'sub')
        )
    );

-- Public can view translations
CREATE POLICY "Public can view translations"
    ON translations FOR SELECT
    USING (true);

-- RLS Policies for category_translations
CREATE POLICY "Users can manage category translations"
    ON category_translations FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM categories
            JOIN restaurants ON restaurants.id = categories.restaurant_id
            WHERE categories.id = category_translations.category_id
            AND restaurants.clerk_user_id = (auth.jwt() ->> 'sub')
        )
    );

-- Public can view category translations
CREATE POLICY "Public can view category translations"
    ON category_translations FOR SELECT
    USING (true);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers to automatically update updated_at
CREATE TRIGGER update_restaurants_updated_at BEFORE UPDATE ON restaurants
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_menus_updated_at BEFORE UPDATE ON menus
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_menu_items_updated_at BEFORE UPDATE ON menu_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_translations_updated_at BEFORE UPDATE ON translations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_category_translations_updated_at BEFORE UPDATE ON category_translations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

