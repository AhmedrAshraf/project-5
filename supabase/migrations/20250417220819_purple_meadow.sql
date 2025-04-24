/*
  # Fix order_items and menu_items relationship

  1. Changes
    - Clean up any invalid menu_item_id references in order_items
    - Add foreign key constraint to menu_items table
    
  2. Security
    - No changes to RLS policies
*/

-- First, remove any order_items that reference non-existent menu items
DELETE FROM order_items
WHERE menu_item_id NOT IN (
  SELECT id FROM menu_items
);

-- Drop the existing trigger if it exists
DROP TRIGGER IF EXISTS validate_menu_item_exists ON order_items;
DROP FUNCTION IF EXISTS check_menu_item_exists;

-- Add the foreign key constraint
ALTER TABLE order_items
ADD CONSTRAINT order_items_menu_item_id_fkey
FOREIGN KEY (menu_item_id)
REFERENCES menu_items(id)
ON DELETE RESTRICT;