/*
  # Clean up time slots
  
  1. Changes
    - Remove all existing time slots
    - Insert only the current time slots with correct times
    - Ensure consistent naming and times
  
  2. Security
    - Maintains existing RLS policies
*/

-- First, delete all existing time slots
DELETE FROM time_slots;

-- Insert the current time slots
INSERT INTO time_slots (label, start_time, end_time, is_drinks)
VALUES 
  ('Frühstück', '08:30', '12:00', false),
  ('Lunchkarte', '14:00', '16:00', false),
  ('Abendessen', '18:00', '20:00', false),
  ('Getränke', '10:00', '20:00', true);