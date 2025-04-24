/*
  # Update time slots and menu items availability

  1. Changes
    - Update time slots with correct times
    - Update menu items to be available only during specific time slots
    - Add proper time restrictions for all menu items
    
  2. Security
    - Maintains existing RLS policies
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

  -- Update all menu items with proper time restrictions
  UPDATE menu_items
  SET time_restrictions = CASE
    WHEN category = 'breakfast' THEN jsonb_build_object(breakfast_id, true)
    WHEN category = 'lunch' THEN jsonb_build_object(lunch_id, true)
    WHEN category = 'dinner' THEN jsonb_build_object(dinner_id, true)
    WHEN category = 'drinks' THEN jsonb_build_object(drinks_id, true)
    ELSE NULL
  END;

  -- Update any items without a menu_category
  UPDATE menu_items
  SET menu_category = CASE
    WHEN category IN ('breakfast', 'lunch', 'dinner') THEN 'mains'
    WHEN category = 'drinks' THEN 'beverages'
    ELSE menu_category
  END
  WHERE menu_category IS NULL;

  -- Update any drinks without a beverage_category
  UPDATE menu_items
  SET beverage_category = 'soft_drinks'
  WHERE category = 'drinks' AND beverage_category IS NULL;

  -- Log the changes
  RAISE NOTICE 'Updated menu items with time restrictions';
  RAISE NOTICE 'Breakfast items: %', (SELECT COUNT(*) FROM menu_items WHERE time_restrictions ? breakfast_id::text);
  RAISE NOTICE 'Lunch items: %', (SELECT COUNT(*) FROM menu_items WHERE time_restrictions ? lunch_id::text);
  RAISE NOTICE 'Dinner items: %', (SELECT COUNT(*) FROM menu_items WHERE time_restrictions ? dinner_id::text);
  RAISE NOTICE 'Drinks: %', (SELECT COUNT(*) FROM menu_items WHERE time_restrictions ? drinks_id::text);

END $$;