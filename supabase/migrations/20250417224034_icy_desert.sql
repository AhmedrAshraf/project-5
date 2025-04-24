/*
  # Add beverage categories

  1. Changes
    - Add beverage_category column to menu_items table
    - Add check constraint for valid beverage categories
    - Update existing drinks to have default category

  2. New Categories
    - soft_drinks: Softdrinks
    - hot_drinks: Heiße Getränke
    - cocktails: Cocktails
    - wine: Weine
    - beer: Biere
    - spirits: Spirituosen
*/

-- Add beverage_category column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'menu_items' 
    AND column_name = 'beverage_category'
  ) THEN
    ALTER TABLE menu_items
    ADD COLUMN beverage_category text;

    -- Add check constraint for valid beverage categories
    ALTER TABLE menu_items
    ADD CONSTRAINT valid_beverage_category
    CHECK (
      category != 'drinks' OR
      beverage_category = ANY (ARRAY[
        'soft_drinks',
        'hot_drinks',
        'cocktails',
        'wine',
        'beer',
        'spirits'
      ])
    );

    -- Set default category for existing drinks
    UPDATE menu_items
    SET beverage_category = 'soft_drinks'
    WHERE category = 'drinks' AND beverage_category IS NULL;
  END IF;
END $$;