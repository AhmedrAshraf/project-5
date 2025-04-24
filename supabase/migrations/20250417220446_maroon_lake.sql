/*
  # Update order items foreign key constraints

  1. Changes
    - Drop existing foreign key constraint on order_items.menu_item_id
    - Add new check constraint to ensure menu_item_id exists in either menu_items or daily_menu_items
    - Add trigger to validate menu item existence before insert/update

  2. Security
    - Maintains existing RLS policies
    - Adds validation through database trigger
*/

-- Drop the existing foreign key constraint
ALTER TABLE order_items
DROP CONSTRAINT IF EXISTS order_items_menu_item_id_fkey;

-- Create a function to validate menu item existence
CREATE OR REPLACE FUNCTION check_menu_item_exists()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if the menu_item_id exists in either menu_items or daily_menu_items
  IF EXISTS (
    SELECT 1 FROM menu_items WHERE id = NEW.menu_item_id
    UNION
    SELECT 1 FROM daily_menu_items WHERE id = NEW.menu_item_id
  ) THEN
    RETURN NEW;
  ELSE
    RAISE EXCEPTION 'Menu item with ID % does not exist in either menu_items or daily_menu_items', NEW.menu_item_id;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to validate menu item existence
DROP TRIGGER IF EXISTS validate_menu_item_exists ON order_items;
CREATE TRIGGER validate_menu_item_exists
  BEFORE INSERT OR UPDATE ON order_items
  FOR EACH ROW
  EXECUTE FUNCTION check_menu_item_exists();