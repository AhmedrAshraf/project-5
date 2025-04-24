/*
  # Update daily specials to support multiple types
  
  1. Changes
    - Add type column to daily_menu_items table
    - Add image_url column for special promotions
    - Add special_type to categorize items
    - Update constraints and policies
    
  2. Security
    - Maintain existing RLS policies
*/

-- Add new columns to daily_menu_items table
ALTER TABLE daily_menu_items
ADD COLUMN special_type text CHECK (special_type IN ('food', 'drinks', 'spa')) NOT NULL DEFAULT 'food',
ADD COLUMN image_url text,
ADD COLUMN highlight_color text DEFAULT '#b5a49b';

-- Add comment explaining the columns
COMMENT ON COLUMN daily_menu_items.special_type IS 'Type of special: food, drinks, or spa service';
COMMENT ON COLUMN daily_menu_items.image_url IS 'Optional image URL for the special';
COMMENT ON COLUMN daily_menu_items.highlight_color IS 'Optional custom highlight color for the special';

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_daily_menu_items_type_dates 
ON daily_menu_items(special_type, valid_from, valid_until);