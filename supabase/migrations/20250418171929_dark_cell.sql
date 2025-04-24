/*
  # Fix guest phone number display
  
  1. Changes
    - Add NOT NULL constraint to guest_phone_number
    - Update trigger to properly handle both phone numbers
    - Ensure existing orders have guest phone numbers
  
  2. Security
    - Maintains existing RLS policies
*/

-- First, ensure all existing orders have a guest_phone_number
UPDATE orders
SET guest_phone_number = phone_number
WHERE guest_phone_number IS NULL;

-- Make sure guest_phone_number is required
ALTER TABLE orders
ALTER COLUMN guest_phone_number SET NOT NULL;

-- Update the trigger function to handle both phone numbers correctly
CREATE OR REPLACE FUNCTION ensure_default_phone_number()
RETURNS TRIGGER AS $$
BEGIN
  -- Keep the provided guest phone number
  IF NEW.guest_phone_number IS NULL THEN
    NEW.guest_phone_number := NEW.phone_number;
  END IF;
  
  -- Set the SMS notification number
  NEW.phone_number := get_customer_notification_number();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;