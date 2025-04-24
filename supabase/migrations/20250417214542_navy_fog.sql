/*
  # Convert daily specials to daily menu items
  
  1. Changes
    - Rename table to daily_menu_items
    - Remove special_price column
    - Add name and description columns
    - Add price column
    
  2. Security
    - Enable RLS
    - Add policies for authenticated users to manage items
    - Add policies for public to read items
*/

-- Drop existing daily specials table
DROP TABLE IF EXISTS daily_specials;

-- Create new daily menu items table
CREATE TABLE IF NOT EXISTS daily_menu_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  name_de text NOT NULL,
  description text,
  price numeric NOT NULL CHECK (price >= 0),
  valid_from timestamptz NOT NULL DEFAULT now(),
  valid_until timestamptz NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT valid_date_range CHECK (valid_until > valid_from)
);

-- Enable RLS
ALTER TABLE daily_menu_items ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow authenticated users to manage daily menu items"
  ON daily_menu_items
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public to read daily menu items"
  ON daily_menu_items
  FOR SELECT
  TO public
  USING (true);