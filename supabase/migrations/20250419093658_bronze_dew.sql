/*
  # Update time slots for evening menu
  
  1. Changes
    - Update time slots to show correct evening menu times
    - Ensure consistent naming in German
    - Maintain existing time slot structure
    
  2. Security
    - Maintains existing RLS policies
*/

-- First, delete all existing time slots
DELETE FROM time_slots;

-- Insert the current time slots with correct times and labels
INSERT INTO time_slots (label, start_time, end_time, is_drinks)
VALUES 
  ('Frühstück', '08:30', '12:00', false),
  ('Lunchkarte', '14:00', '16:00', false),
  ('Abendkarte', '18:00', '20:00', false),
  ('Getränke', '10:00', '20:00', true);