/*
  # Create time slots table
  
  1. New Tables
    - `time_slots`
      - `id` (uuid, primary key)
      - `label` (text) - Display name for the time slot
      - `start_time` (time) - Start time of the slot
      - `end_time` (time) - End time of the slot
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
  
  2. Security
    - Enable RLS on `time_slots` table
    - Add policies for authenticated users to manage time slots
    - Add policy for public to read time slots
*/

-- Create table if it doesn't exist
CREATE TABLE IF NOT EXISTS time_slots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  label text NOT NULL,
  start_time time NOT NULL,
  end_time time NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE time_slots ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow authenticated users to manage time slots" ON time_slots;
DROP POLICY IF EXISTS "Allow public to read time slots" ON time_slots;

-- Create policies
CREATE POLICY "Allow authenticated users to manage time slots"
  ON time_slots
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public to read time slots"
  ON time_slots
  FOR SELECT
  TO public
  USING (true);

-- Insert default time slots if they don't exist
INSERT INTO time_slots (label, start_time, end_time)
SELECT 'Frühstück', '06:30', '10:30'
WHERE NOT EXISTS (
  SELECT 1 FROM time_slots WHERE label = 'Frühstück'
);

INSERT INTO time_slots (label, start_time, end_time)
SELECT 'Mittagessen', '11:30', '14:30'
WHERE NOT EXISTS (
  SELECT 1 FROM time_slots WHERE label = 'Mittagessen'
);

INSERT INTO time_slots (label, start_time, end_time)
SELECT 'Abendessen', '18:00', '22:00'
WHERE NOT EXISTS (
  SELECT 1 FROM time_slots WHERE label = 'Abendessen'
);