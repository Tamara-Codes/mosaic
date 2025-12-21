-- Migration: Add orders support
-- This allows customers to place orders through the website

-- Orders table
CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    order_number TEXT UNIQUE NOT NULL, -- e.g., "ORD-2025-001"
    customer_name TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    customer_email TEXT,
    delivery_address TEXT, -- Required if order_type is 'delivery'
    order_type TEXT NOT NULL CHECK (order_type IN ('delivery', 'pickup')),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'preparing', 'ready', 'completed', 'cancelled')),
    total_price DECIMAL(10, 2) NOT NULL,
    notes TEXT, -- Customer notes/special instructions
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Order Items table (items in each order)
CREATE TABLE IF NOT EXISTS order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    menu_item_id UUID NOT NULL REFERENCES menu_items(id) ON DELETE RESTRICT, -- Keep reference even if item deleted
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_price DECIMAL(10, 2) NOT NULL, -- Price at time of order (for historical accuracy)
    subtotal DECIMAL(10, 2) NOT NULL, -- quantity * unit_price
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_orders_restaurant_id ON orders(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON orders(order_number);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(restaurant_id, status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(restaurant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_menu_item_id ON order_items(menu_item_id);

-- Row Level Security (RLS) Policies
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies for orders
-- Users can manage orders for their restaurant
CREATE POLICY "Users can manage orders for their restaurant"
    ON orders FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM restaurants
            WHERE restaurants.id = orders.restaurant_id
            AND restaurants.clerk_user_id = (auth.jwt() ->> 'sub')
        )
    );

-- Public can create orders (for customer website)
CREATE POLICY "Public can create orders"
    ON orders FOR INSERT
    WITH CHECK (true);

-- Public can view their own orders (optional - for future order tracking)
-- For now, we'll keep this restricted to admin only

-- RLS Policies for order_items
-- Users can view order items for their restaurant's orders
CREATE POLICY "Users can view order items for their restaurant"
    ON order_items FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM orders
            JOIN restaurants ON restaurants.id = orders.restaurant_id
            WHERE orders.id = order_items.order_id
            AND restaurants.clerk_user_id = (auth.jwt() ->> 'sub')
        )
    );

-- Public can create order items (when creating an order)
CREATE POLICY "Public can create order items"
    ON order_items FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM orders
            WHERE orders.id = order_items.order_id
        )
    );

-- Trigger to update updated_at timestamp
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to generate order number
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TEXT AS $$
DECLARE
    new_number TEXT;
    year_part TEXT;
    seq_num INTEGER;
BEGIN
    year_part := TO_CHAR(NOW(), 'YYYY');
    
    -- Get the last sequence number for this year
    SELECT COALESCE(MAX(CAST(SUBSTRING(order_number FROM '[0-9]+$') AS INTEGER)), 0) + 1
    INTO seq_num
    FROM orders
    WHERE order_number LIKE 'ORD-' || year_part || '-%';
    
    new_number := 'ORD-' || year_part || '-' || LPAD(seq_num::TEXT, 3, '0');
    
    RETURN new_number;
END;
$$ LANGUAGE plpgsql;

-- Comments
COMMENT ON TABLE orders IS 'Customer orders placed through the website';
COMMENT ON COLUMN orders.order_number IS 'Unique order identifier (e.g., ORD-2025-001)';
COMMENT ON COLUMN orders.status IS 'Order status: pending -> confirmed -> preparing -> ready -> completed (or cancelled)';
COMMENT ON COLUMN orders.total_price IS 'Total order amount in local currency';
COMMENT ON TABLE order_items IS 'Items included in each order';
COMMENT ON COLUMN order_items.unit_price IS 'Price of item at time of order (for historical accuracy)';

