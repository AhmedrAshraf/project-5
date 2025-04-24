/*
  # Add daily specials feature

  1. New Tables
    - `daily_specials`
      - `id` (uuid, primary key)
      - `menu_item_id` (uuid, foreign key to menu_items)
      - `special_price` (numeric)
      - `valid_from` (timestamptz)
      - `valid_until` (timestamptz)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `daily_specials` table
    - Add policies for authenticated users to manage specials
    - Add policy for public to read specials
*/

CREATE TABLE IF NOT EXISTS daily_specials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  menu_item_id uuid REFERENCES menu_items(id) ON DELETE CASCADE,
  special_price numeric NOT NULL CHECK (special_price >= 0),
  valid_from timestamptz NOT NULL DEFAULT now(),
  valid_until timestamptz NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT valid_date_range CHECK (valid_until > valid_from)
);

ALTER TABLE daily_specials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated users to manage daily specials"
  ON daily_specials
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public to read daily specials"
  ON daily_specials
  FOR SELECT
  TO public
  USING (true);