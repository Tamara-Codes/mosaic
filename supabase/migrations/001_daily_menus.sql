-- Migration: Add daily menus support
-- This allows restaurants to create menus for specific dates

-- Daily Menus table
CREATE TABLE IF NOT EXISTS daily_menus (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    menu_date DATE NOT NULL, -- Date for which this menu is scheduled
    name TEXT NOT NULL, -- e.g., "Ponedjeljak 15.01.2025"
    description TEXT,
    is_active BOOLEAN DEFAULT false, -- Currently active menu (only one per restaurant)
    is_preview BOOLEAN DEFAULT false, -- Preview mode flag
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(restaurant_id, menu_date) -- One menu per restaurant per date
);

-- Daily Menu Items junction table (links items to daily menus)
CREATE TABLE IF NOT EXISTS daily_menu_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    daily_menu_id UUID NOT NULL REFERENCES daily_menus(id) ON DELETE CASCADE,
    menu_item_id UUID NOT NULL REFERENCES menu_items(id) ON DELETE CASCADE,
    order_index INTEGER DEFAULT 0, -- Display order within the menu
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(daily_menu_id, menu_item_id) -- Prevent duplicate items in same menu
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_daily_menus_restaurant_id ON daily_menus(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_daily_menus_menu_date ON daily_menus(menu_date);
CREATE INDEX IF NOT EXISTS idx_daily_menus_restaurant_date ON daily_menus(restaurant_id, menu_date);
CREATE INDEX IF NOT EXISTS idx_daily_menus_active ON daily_menus(restaurant_id, is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_daily_menu_items_daily_menu_id ON daily_menu_items(daily_menu_id);
CREATE INDEX IF NOT EXISTS idx_daily_menu_items_menu_item_id ON daily_menu_items(menu_item_id);

-- Row Level Security (RLS) Policies
ALTER TABLE daily_menus ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_menu_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies for daily_menus
-- Users can manage their own daily menus
CREATE POLICY "Users can manage their own daily menus"
    ON daily_menus FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM restaurants
            WHERE restaurants.id = daily_menus.restaurant_id
            AND restaurants.clerk_user_id = (auth.jwt() ->> 'sub')
        )
    );

-- Public can view active daily menus (for customer website)
CREATE POLICY "Public can view active daily menus"
    ON daily_menus FOR SELECT
    USING (is_active = true AND is_preview = false);

-- RLS Policies for daily_menu_items
-- Users can manage items in their daily menus
CREATE POLICY "Users can manage items in their daily menus"
    ON daily_menu_items FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM daily_menus
            JOIN restaurants ON restaurants.id = daily_menus.restaurant_id
            WHERE daily_menus.id = daily_menu_items.daily_menu_id
            AND restaurants.clerk_user_id = (auth.jwt() ->> 'sub')
        )
    );

-- Public can view items in active daily menus
CREATE POLICY "Public can view items in active daily menus"
    ON daily_menu_items FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM daily_menus
            WHERE daily_menus.id = daily_menu_items.daily_menu_id
            AND daily_menus.is_active = true
            AND daily_menus.is_preview = false
        )
    );

-- Trigger to update updated_at timestamp
CREATE TRIGGER update_daily_menus_updated_at BEFORE UPDATE ON daily_menus
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Comments
COMMENT ON TABLE daily_menus IS 'Daily menus scheduled for specific dates';
COMMENT ON COLUMN daily_menus.menu_date IS 'Date for which this menu is scheduled (YYYY-MM-DD)';
COMMENT ON COLUMN daily_menus.is_active IS 'Whether this menu is currently active (only one per restaurant)';
COMMENT ON COLUMN daily_menus.is_preview IS 'Preview mode - allows testing menu before it goes live';

