/*
  # Add time slots management
  
  1. New Tables
    - `time_slots`
      - `id` (uuid, primary key)
      - `label` (text) - Display name of the time slot
      - `start_time` (time) - Start time of the slot
      - `end_time` (time) - End time of the slot
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
  
  2. Security
    - Enable RLS on `time_slots` table
    - Add policies for authenticated users to manage time slots
*/

CREATE TABLE IF NOT EXISTS time_slots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  label text NOT NULL,
  start_time time NOT NULL,
  end_time time NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE time_slots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated users to manage time slots"
  ON time_slots
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public to read time slots"
  ON time_slots
  FOR SELECT
  TO public
  USING (true);