/*
  # Add spa services support to daily menu items
  
  1. Changes
    - Add special_type, contact_phone, highlight_color, and image_url columns
    - Create spa_call_clicks table for tracking spa service interactions
    - Add appropriate indexes and policies
    
  2. Security
    - Enable RLS on spa_call_clicks table
    - Add policies for authenticated users to read data
    - Add policies for public to create records
*/

-- Add columns to daily_menu_items if they don't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'daily_menu_items' AND column_name = 'special_type'
  ) THEN
    ALTER TABLE daily_menu_items 
    ADD COLUMN special_type text DEFAULT 'food'::text NOT NULL,
    ADD COLUMN contact_phone text DEFAULT '+491234567890'::text,
    ADD COLUMN highlight_color text DEFAULT '#b5a49b'::text,
    ADD COLUMN image_url text;

    -- Add constraint only if it doesn't exist
    ALTER TABLE daily_menu_items
    ADD CONSTRAINT daily_menu_items_special_type_check
    CHECK (special_type = ANY (ARRAY['food'::text, 'drinks'::text, 'spa'::text]));
  END IF;
END $$;

-- Add comments
COMMENT ON COLUMN daily_menu_items.special_type IS 'Type of special: food, drinks, or spa service';
COMMENT ON COLUMN daily_menu_items.image_url IS 'Optional image URL for the special';
COMMENT ON COLUMN daily_menu_items.highlight_color IS 'Optional custom highlight color for the special';
COMMENT ON COLUMN daily_menu_items.contact_phone IS 'Contact phone number for spa services';

-- Create spa_call_clicks table if it doesn't exist
CREATE TABLE IF NOT EXISTS spa_call_clicks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  special_id uuid NOT NULL REFERENCES daily_menu_items(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS if not already enabled
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE tablename = 'spa_call_clicks' AND rowsecurity = true
  ) THEN
    ALTER TABLE spa_call_clicks ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow authenticated users to read spa call data" ON spa_call_clicks;
DROP POLICY IF EXISTS "Allow public to create spa call records" ON spa_call_clicks;

-- Create policies
CREATE POLICY "Allow authenticated users to read spa call data"
ON spa_call_clicks
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Allow public to create spa call records"
ON spa_call_clicks
FOR INSERT
TO public
WITH CHECK (true);

-- Create index for analytics if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_daily_menu_items_type_dates 
ON daily_menu_items(special_type, valid_from, valid_until);