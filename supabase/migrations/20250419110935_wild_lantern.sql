/*
  # Add spa call tracking

  1. New Tables
    - `spa_call_clicks`
      - `id` (uuid, primary key)
      - `special_id` (uuid, foreign key to daily_menu_items)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on spa_call_clicks table
    - Add policy for authenticated users to read spa call data
    - Add policy for public users to create spa call records
*/

-- Create spa_call_clicks table
CREATE TABLE IF NOT EXISTS spa_call_clicks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  special_id uuid NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Add foreign key constraint
ALTER TABLE spa_call_clicks
ADD CONSTRAINT spa_call_clicks_special_id_fkey
FOREIGN KEY (special_id) REFERENCES daily_menu_items(id)
ON DELETE CASCADE;

-- Enable RLS
ALTER TABLE spa_call_clicks ENABLE ROW LEVEL SECURITY;

-- Add policies
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