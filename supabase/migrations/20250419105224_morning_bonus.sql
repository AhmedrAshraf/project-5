/*
  # Update daily specials handling
  
  1. Changes
    - Add validation for special types
    - Add default phone number for spa services
    - Update time restrictions handling
    
  2. Security
    - Maintains existing RLS policies
*/

-- Add default phone number for spa services
ALTER TABLE daily_menu_items
ADD COLUMN contact_phone text DEFAULT '+491234567890';

-- Add comment explaining the column
COMMENT ON COLUMN daily_menu_items.contact_phone IS 'Contact phone number for spa services';

-- Update existing spa specials with default phone
UPDATE daily_menu_items
SET contact_phone = '+491234567890'
WHERE special_type = 'spa';

-- Create function to validate special type restrictions
CREATE OR REPLACE FUNCTION validate_special_type_restrictions()
RETURNS TRIGGER AS $$
BEGIN
  -- Ensure spa services have a contact phone
  IF NEW.special_type = 'spa' AND NEW.contact_phone IS NULL THEN
    NEW.contact_phone := '+491234567890';
  END IF;

  -- Ensure food and drinks have time restrictions
  IF (NEW.special_type IN ('food', 'drinks') AND NEW.time_restrictions IS NULL) THEN
    RAISE EXCEPTION 'Food and drink specials must have time restrictions';
  END IF;

  -- Spa services don't need time restrictions
  IF NEW.special_type = 'spa' THEN
    NEW.time_restrictions := NULL;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for special type validation
CREATE TRIGGER validate_special_type_trigger
  BEFORE INSERT OR UPDATE ON daily_menu_items
  FOR EACH ROW
  EXECUTE FUNCTION validate_special_type_restrictions();