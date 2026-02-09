-- Add category_type field to categories to distinguish between food and drink categories
ALTER TABLE categories
ADD COLUMN IF NOT EXISTS category_type TEXT DEFAULT 'food' CHECK (category_type IN ('food', 'drink'));

-- Update existing categories to be 'food' by default
UPDATE categories SET category_type = 'food' WHERE category_type IS NULL;

-- Create index for faster filtering
CREATE INDEX IF NOT EXISTS idx_categories_category_type ON categories(category_type);
