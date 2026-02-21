CREATE TABLE menu_views (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    language_code VARCHAR(10) NOT NULL DEFAULT 'hr',
    device_type VARCHAR(20) NOT NULL DEFAULT 'desktop',  -- mobile, tablet, desktop
    event_type VARCHAR(20) NOT NULL DEFAULT 'scan',       -- scan, language_switch
    referrer TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE menu_views ENABLE ROW LEVEL SECURITY;

-- Anyone can insert (public, anonymous)
CREATE POLICY "Public can insert menu views"
    ON menu_views FOR INSERT
    WITH CHECK (true);

-- Owner can read their restaurant's views
CREATE POLICY "Owner can read menu views"
    ON menu_views FOR SELECT
    USING (
        restaurant_id IN (
            SELECT id FROM restaurants WHERE clerk_user_id = auth.uid()::text
        )
    );

-- Grant table permissions to Supabase roles
GRANT INSERT ON menu_views TO anon;
GRANT SELECT ON menu_views TO authenticated;

-- Indexes for time-series and breakdown queries
CREATE INDEX idx_menu_views_restaurant_created ON menu_views(restaurant_id, created_at DESC);
CREATE INDEX idx_menu_views_language ON menu_views(restaurant_id, language_code);
CREATE INDEX idx_menu_views_device ON menu_views(restaurant_id, device_type);
CREATE INDEX idx_menu_views_event_type ON menu_views(restaurant_id, event_type);
