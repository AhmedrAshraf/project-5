/*
  # Add spa call tracking

  1. New Tables
    - `spa_call_clicks`
      - `id` (uuid, primary key)
      - `special_id` (uuid, foreign key to daily_menu_items)
      - `created_at` (timestamptz)
  
  2. Security
    - Enable RLS on `spa_call_clicks` table
    - Add policies for authenticated users to read clicks
    - Add policies for public to create clicks
*/

-- Create spa_call_clicks table
CREATE TABLE IF NOT EXISTS spa_call_clicks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  special_id uuid REFERENCES daily_menu_items(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE spa_call_clicks ENABLE ROW LEVEL SECURITY;

-- Add policies
CREATE POLICY "Allow authenticated users to read spa call clicks"
  ON spa_call_clicks
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow public to create spa call clicks"
  ON spa_call_clicks
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_spa_call_clicks_special_date
  ON spa_call_clicks(special_id, created_at);

-- Add comment explaining the table
COMMENT ON TABLE spa_call_clicks IS 'Tracks clicks on spa service call buttons';