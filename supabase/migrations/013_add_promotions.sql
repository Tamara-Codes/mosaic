-- Promotions table for daily specials / featured items
CREATE TABLE promotions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    title TEXT NOT NULL DEFAULT 'Dnevna ponuda',
    menu_item_id UUID REFERENCES menu_items(id) ON DELETE SET NULL,
    custom_name TEXT,
    custom_description TEXT,
    custom_price DECIMAL(10, 2),
    image_url TEXT,
    is_active BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Only one active promotion per restaurant
CREATE UNIQUE INDEX idx_promotions_one_active_per_restaurant
    ON promotions (restaurant_id) WHERE is_active = true;

-- Enable RLS
ALTER TABLE promotions ENABLE ROW LEVEL SECURITY;

-- Owner can manage their own promotions
CREATE POLICY "Restaurant owners can manage promotions"
    ON promotions
    FOR ALL
    USING (
        restaurant_id IN (
            SELECT id FROM restaurants WHERE clerk_user_id = auth.uid()::text
        )
    );

-- Public can read active promotions
CREATE POLICY "Public can read active promotions"
    ON promotions
    FOR SELECT
    USING (is_active = true);
