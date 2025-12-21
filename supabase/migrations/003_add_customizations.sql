-- Migration: Add customizations support to order_items
-- This allows storing burger customizations (bread type, ingredients) with orders

ALTER TABLE order_items 
ADD COLUMN IF NOT EXISTS customization JSONB;

-- Add index for JSONB queries (if needed in future)
CREATE INDEX IF NOT EXISTS idx_order_items_customization ON order_items USING GIN (customization);

-- Comment
COMMENT ON COLUMN order_items.customization IS 'JSON object storing item customizations (e.g., breadType, ingredients for burgers)';

