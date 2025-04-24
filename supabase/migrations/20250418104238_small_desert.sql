/*
  # Verify and fix drinks category

  1. Changes
    - Update any incorrect drink categories to 'drinks'
    - Add logging to see affected rows
    - Ensure consistent casing
*/

DO $$ 
DECLARE
  category_record record;
  drink_item record;
  updated_count integer;
BEGIN
  -- First, let's check for any variations of 'drinks' or potential typos
  RAISE NOTICE 'Current unique category values:';
  FOR category_record IN 
    SELECT DISTINCT category 
    FROM menu_items 
    WHERE category ILIKE '%drink%'
  LOOP
    RAISE NOTICE '%', category_record.category;
  END LOOP;

  -- Update any variations to the correct 'drinks' value
  WITH updated AS (
    UPDATE menu_items 
    SET category = 'drinks'
    WHERE category ILIKE '%drink%' 
      AND category != 'drinks'
    RETURNING id, name, category
  )
  SELECT count(*) INTO updated_count FROM updated;
  
  RAISE NOTICE '% rows updated to correct drinks category', updated_count;

  -- Log current drinks items for verification
  RAISE NOTICE 'Current drinks menu items:';
  FOR drink_item IN 
    SELECT name, category, beverage_category
    FROM menu_items
    WHERE category = 'drinks'
    ORDER BY name
  LOOP
    RAISE NOTICE 'Name: %, Category: %, Beverage Type: %', 
      drink_item.name, drink_item.category, drink_item.beverage_category;
  END LOOP;
END $$;