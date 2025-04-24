/*
  # Update menu items time restrictions
  
  1. Changes
    - Update time restrictions for existing menu items
    - Ensure items are available in correct time slots
    - Fix Wiener Schnitzel availability
    
  2. Notes
    - Uses time slot IDs to properly link availability
    - Maintains existing menu items
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
  SELECT id INTO dinner_id FROM time_slots WHERE label = 'Abendkarte';
  SELECT id INTO drinks_id FROM time_slots WHERE label = 'Getränke';

  -- Update Wiener Schnitzel to be available during dinner
  UPDATE menu_items
  SET 
    time_restrictions = jsonb_build_object(dinner_id, true),
    category = 'dinner',
    menu_category = 'mains'
  WHERE name_de = 'Wiener Schnitzel';

  -- Update all breakfast items
  UPDATE menu_items
  SET time_restrictions = jsonb_build_object(breakfast_id, true)
  WHERE category = 'breakfast';

  -- Update all lunch items
  UPDATE menu_items
  SET time_restrictions = jsonb_build_object(lunch_id, true)
  WHERE category = 'lunch';

  -- Update all dinner items
  UPDATE menu_items
  SET time_restrictions = jsonb_build_object(dinner_id, true)
  WHERE category = 'dinner';

  -- Update all drinks
  UPDATE menu_items
  SET time_restrictions = jsonb_build_object(drinks_id, true)
  WHERE category = 'drinks';

END $$;