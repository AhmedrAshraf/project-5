/*
  # Add time restrictions to daily menu items

  1. Changes
    - Add time_restrictions column to daily_menu_items table to store time slot restrictions
    - Add comment explaining the column's purpose

  2. Notes
    - Uses JSONB type for flexible time slot storage
    - Maintains compatibility with existing time slot system
*/

-- Add time_restrictions column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'daily_menu_items' 
    AND column_name = 'time_restrictions'
  ) THEN
    ALTER TABLE daily_menu_items
    ADD COLUMN time_restrictions JSONB;

    COMMENT ON COLUMN daily_menu_items.time_restrictions IS 'JSON object containing time slot restrictions for daily menu items';
  END IF;
END $$;