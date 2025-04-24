/*
  # Fix drinks display and add sample drinks

  1. Changes
    - Add sample drinks with proper categorization
    - Ensure all drinks have proper beverage categories
    - Add time restrictions for drinks availability

  2. Security
    - Maintains existing RLS policies
*/

-- First, ensure all drinks have proper beverage categories
UPDATE menu_items
SET beverage_category = 'soft_drinks'
WHERE category = 'drinks' 
  AND beverage_category IS NULL;

-- Insert sample drinks if they don't exist
INSERT INTO menu_items (
  name,
  name_de,
  description,
  price,
  category,
  beverage_category,
  menu_category,
  available,
  time_restrictions
)
SELECT * FROM (
  VALUES
    (
      'Coca Cola',
      'Coca Cola',
      '0.33l',
      3.50,
      'drinks',
      'soft_drinks',
      'beverages',
      true,
      '{"getränke": true}'::jsonb
    ),
    (
      'Sprite',
      'Sprite',
      '0.33l',
      3.50,
      'drinks',
      'soft_drinks',
      'beverages',
      true,
      '{"getränke": true}'::jsonb
    ),
    (
      'Fanta',
      'Fanta',
      '0.33l',
      3.50,
      'drinks',
      'soft_drinks',
      'beverages',
      true,
      '{"getränke": true}'::jsonb
    ),
    (
      'Sparkling Water',
      'Mineralwasser',
      '0.75l',
      4.50,
      'drinks',
      'soft_drinks',
      'beverages',
      true,
      '{"getränke": true}'::jsonb
    )
) AS new_drinks (
  name,
  name_de,
  description,
  price,
  category,
  beverage_category,
  menu_category,
  available,
  time_restrictions
)
WHERE NOT EXISTS (
  SELECT 1 FROM menu_items 
  WHERE name = new_drinks.name 
    AND category = 'drinks'
);

-- Verify the changes
DO $$ 
BEGIN
  RAISE NOTICE 'Current drinks count: %', (
    SELECT count(*) FROM menu_items WHERE category = 'drinks'
  );
  
  RAISE NOTICE 'Drinks without beverage category: %', (
    SELECT count(*) FROM menu_items 
    WHERE category = 'drinks' AND beverage_category IS NULL
  );
END $$;