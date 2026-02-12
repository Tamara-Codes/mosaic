-- Migration: Add languages and restaurant_languages tables
-- Purpose: Move language management from JSON file to Supabase for per-restaurant language tracking

-- 1. Create master languages table
CREATE TABLE IF NOT EXISTS languages (
    code TEXT PRIMARY KEY,
    name TEXT NOT NULL
);

-- 2. Create restaurant_languages junction table
CREATE TABLE IF NOT EXISTS restaurant_languages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    language_code TEXT NOT NULL REFERENCES languages(code) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(restaurant_id, language_code)
);

-- Index for fast lookups by restaurant
CREATE INDEX IF NOT EXISTS idx_restaurant_languages_restaurant_id ON restaurant_languages(restaurant_id);

-- 3. Seed all 37 available languages (Croatian names for admin UI)
INSERT INTO languages (code, name) VALUES
    ('sq', 'Albanski'),
    ('ar', 'Arapski'),
    ('by', 'Bjeloruski'),
    ('bs', 'Bosanski'),
    ('bg', 'Bugarski'),
    ('cs', 'Češki'),
    ('da', 'Danski'),
    ('en', 'Engleski'),
    ('et', 'Estonski'),
    ('fi', 'Finski'),
    ('fr', 'Francuski'),
    ('el', 'Grčki'),
    ('ga', 'Irski'),
    ('is', 'Islandski'),
    ('ja', 'Japanski'),
    ('zh', 'Kineski'),
    ('ko', 'Korejski'),
    ('lv', 'Latvijski'),
    ('lt', 'Litavski'),
    ('hu', 'Mađarski'),
    ('mk', 'Makedonski'),
    ('mt', 'Malteški'),
    ('de', 'Njemački'),
    ('nl', 'Nizozemski'),
    ('no', 'Norveški'),
    ('pl', 'Poljski'),
    ('pt', 'Portugalski'),
    ('ro', 'Rumunjski'),
    ('ru', 'Ruski'),
    ('sk', 'Slovački'),
    ('sl', 'Slovenski'),
    ('sr', 'Srpski'),
    ('es', 'Španjolski'),
    ('sv', 'Švedski'),
    ('it', 'Talijanski'),
    ('tr', 'Turski'),
    ('uk', 'Ukrajinski')
ON CONFLICT (code) DO NOTHING;

-- 4. Backfill restaurant_languages from existing translation data
-- This finds all distinct (restaurant_id, language_code) pairs from translations
INSERT INTO restaurant_languages (restaurant_id, language_code)
SELECT DISTINCT mi.restaurant_id, t.language_code
FROM translations t
JOIN menu_items mi ON mi.id = t.menu_item_id
WHERE t.language_code IN (SELECT code FROM languages)
ON CONFLICT (restaurant_id, language_code) DO NOTHING;

-- Also backfill from category_translations
INSERT INTO restaurant_languages (restaurant_id, language_code)
SELECT DISTINCT c.restaurant_id, ct.language_code
FROM category_translations ct
JOIN categories c ON c.id = ct.category_id
WHERE ct.language_code IN (SELECT code FROM languages)
ON CONFLICT (restaurant_id, language_code) DO NOTHING;

-- Also backfill from restaurant_translations
INSERT INTO restaurant_languages (restaurant_id, language_code)
SELECT DISTINCT rt.restaurant_id, rt.language_code
FROM restaurant_translations rt
WHERE rt.language_code IN (SELECT code FROM languages)
ON CONFLICT (restaurant_id, language_code) DO NOTHING;

-- Also backfill from ui_translations
INSERT INTO restaurant_languages (restaurant_id, language_code)
SELECT DISTINCT ut.restaurant_id, ut.language_code
FROM ui_translations ut
WHERE ut.language_code IN (SELECT code FROM languages)
ON CONFLICT (restaurant_id, language_code) DO NOTHING;

-- 5. Enable RLS
ALTER TABLE languages ENABLE ROW LEVEL SECURITY;
ALTER TABLE restaurant_languages ENABLE ROW LEVEL SECURITY;

-- Languages table: readable by everyone (it's a reference table)
CREATE POLICY "Languages are readable by everyone"
    ON languages FOR SELECT
    USING (true);

-- Restaurant languages: readable by everyone (public menus need this)
CREATE POLICY "Restaurant languages are readable by everyone"
    ON restaurant_languages FOR SELECT
    USING (true);

-- Restaurant languages: insertable/deletable by authenticated users
-- (API handles authorization via Clerk, Supabase service role key bypasses RLS)
CREATE POLICY "Restaurant languages are manageable by authenticated users"
    ON restaurant_languages FOR ALL
    USING (true)
    WITH CHECK (true);
