/*
  # Update menu items time restrictions

  1. Changes
    - Get IDs of current time slots
    - Update time_restrictions for all menu items to use correct slot IDs
    - Ensure each item is only available during its designated time slot
*/

-- First, get the time slot IDs
DO $$ 
DECLARE
  breakfast_id uuid;
  lunch_id uuid;
  dinner_id uuid;
  drinks_id uuid;
BEGIN
  -- Get the IDs
  SELECT id INTO breakfast_id FROM time_slots WHERE label = 'Frühstück';
  SELECT id INTO lunch_id FROM time_slots WHERE label = 'Lunchkarte';
  SELECT id INTO dinner_id FROM time_slots WHERE label = 'Abendessen';
  SELECT id INTO drinks_id FROM time_slots WHERE label = 'Getränke';

  -- Update breakfast items
  UPDATE menu_items
  SET time_restrictions = jsonb_build_object(breakfast_id, true)
  WHERE category = 'breakfast';

  -- Update lunch items
  UPDATE menu_items
  SET time_restrictions = jsonb_build_object(lunch_id, true)
  WHERE category = 'lunch';

  -- Update dinner items
  UPDATE menu_items
  SET time_restrictions = jsonb_build_object(dinner_id, true)
  WHERE category = 'dinner';

  -- Update drinks
  UPDATE menu_items
  SET time_restrictions = jsonb_build_object(drinks_id, true)
  WHERE category = 'drinks';

END $$;