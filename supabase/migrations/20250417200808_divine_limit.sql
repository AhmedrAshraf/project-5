/*
  # Enhance menu items management

  1. Changes
    - Add name_de column for German menu item names
    - Add time_restrictions column to specify when items are available
    - Add menu_category column for better organization
    - Add migration for existing data
    - Update RLS policies

  2. Security
    - Maintain existing RLS
    - Add policy for authenticated users to manage menu items
*/

-- Add new columns to menu_items table
ALTER TABLE menu_items 
ADD COLUMN IF NOT EXISTS name_de text,
ADD COLUMN IF NOT EXISTS time_restrictions jsonb DEFAULT NULL,
ADD COLUMN IF NOT EXISTS menu_category text;

-- Copy existing names to name_de column
UPDATE menu_items SET name_de = name WHERE name_de IS NULL;

-- Add constraint for menu_category
ALTER TABLE menu_items
ADD CONSTRAINT menu_items_menu_category_check
CHECK (menu_category = ANY (ARRAY['starters'::text, 'mains'::text, 'desserts'::text, 'snacks'::text, 'beverages'::text]));

-- Add policy for authenticated users to manage menu items
CREATE POLICY "Allow authenticated users to manage menu items"
ON menu_items
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_menu_items_category_available 
ON menu_items(category, available);

COMMENT ON COLUMN menu_items.time_restrictions IS 'JSON object containing custom time restrictions for menu items';
COMMENT ON COLUMN menu_items.menu_category IS 'Additional categorization for menu organization';