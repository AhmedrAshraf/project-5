/*
  # Update time slots for drinks availability

  1. Changes
    - Add drinks time slot (06:00 - 23:59)
    - Update existing time slots to match menu times
    - Add is_drinks flag to identify slots available for drinks

  2. Security
    - Maintains existing RLS policies
*/

-- Update existing time slots
UPDATE time_slots
SET start_time = '06:30', end_time = '10:30'
WHERE label = 'Frühstück';

UPDATE time_slots
SET start_time = '11:30', end_time = '14:30'
WHERE label = 'Mittagessen';

UPDATE time_slots
SET start_time = '18:00', end_time = '22:00'
WHERE label = 'Abendessen';

-- Add is_drinks column
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'time_slots' AND column_name = 'is_drinks'
  ) THEN
    ALTER TABLE time_slots ADD COLUMN is_drinks boolean DEFAULT false;
  END IF;
END $$;

-- Add drinks time slot if it doesn't exist
INSERT INTO time_slots (label, start_time, end_time, is_drinks)
SELECT 'Getränke', '06:30', '22:00', true
WHERE NOT EXISTS (
  SELECT 1 FROM time_slots WHERE label = 'Getränke'
);