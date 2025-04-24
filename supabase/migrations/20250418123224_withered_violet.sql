/*
  # Add meal time slots

  1. Changes
    - Add default time slots for breakfast, lunch, dinner and drinks
    - Update existing time slots with correct times
    - Ensure consistent naming in German

  2. Security
    - Maintains existing RLS policies
*/

-- Update or insert breakfast time slot
INSERT INTO time_slots (label, start_time, end_time, is_drinks)
VALUES ('Frühstück', '08:30', '12:00', false)
ON CONFLICT (id) WHERE label = 'Frühstück'
DO UPDATE SET 
  start_time = '08:30',
  end_time = '12:00';

-- Update or insert lunch time slot
INSERT INTO time_slots (label, start_time, end_time, is_drinks)
VALUES ('Lunchkarte', '14:00', '16:00', false)
ON CONFLICT (id) WHERE label = 'Mittagessen'
DO UPDATE SET 
  label = 'Lunchkarte',
  start_time = '14:00',
  end_time = '16:00';

-- Update or insert dinner time slot
INSERT INTO time_slots (label, start_time, end_time, is_drinks)
VALUES ('Abendessen', '18:00', '20:00', false)
ON CONFLICT (id) WHERE label = 'Abendessen'
DO UPDATE SET 
  start_time = '18:00',
  end_time = '20:00';

-- Update or insert drinks time slot
INSERT INTO time_slots (label, start_time, end_time, is_drinks)
VALUES ('Getränke', '10:00', '20:00', true)
ON CONFLICT (id) WHERE label = 'Getränke'
DO UPDATE SET 
  start_time = '10:00',
  end_time = '20:00';