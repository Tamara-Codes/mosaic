-- Add item_type field to menu_items to distinguish between food and drinks
ALTER TABLE menu_items
ADD COLUMN IF NOT EXISTS item_type TEXT DEFAULT 'food' CHECK (item_type IN ('food', 'drink'));

-- Update existing items to be 'food' by default
UPDATE menu_items SET item_type = 'food' WHERE item_type IS NULL;

-- Create index for faster filtering
CREATE INDEX IF NOT EXISTS idx_menu_items_item_type ON menu_items(item_type);
