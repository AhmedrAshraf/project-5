/*
  # Add guest phone number storage
  
  1. Changes
    - Add guest_phone_number column to orders table
    - Keep existing phone_number column for SMS notifications
    - Update trigger to handle both phone numbers
    
  2. Security
    - Maintains existing RLS policies
    - Updates order creation policies to require guest phone number
*/

-- Add guest_phone_number column to orders table
ALTER TABLE orders
ADD COLUMN guest_phone_number text;

-- Update existing orders to copy phone_number to guest_phone_number
UPDATE orders
SET guest_phone_number = phone_number
WHERE guest_phone_number IS NULL;

-- Make guest_phone_number required for new orders
ALTER TABLE orders
ALTER COLUMN guest_phone_number SET NOT NULL;

-- Update the ensure_default_phone_number trigger function
CREATE OR REPLACE FUNCTION ensure_default_phone_number()
RETURNS TRIGGER AS $$
BEGIN
  -- Store the guest's phone number as provided
  NEW.guest_phone_number := NEW.phone_number;
  -- Override the phone_number with the default for SMS
  NEW.phone_number := get_customer_notification_number();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Update policies to validate guest_phone_number
DROP POLICY IF EXISTS "Enable order creation for all users" ON orders;
DROP POLICY IF EXISTS "Enable preorder creation for dinner" ON orders;

CREATE POLICY "Enable order creation for all users" ON orders
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    room_number IS NOT NULL AND
    first_name IS NOT NULL AND
    first_name != '' AND
    last_name IS NOT NULL AND
    last_name != '' AND
    guest_phone_number IS NOT NULL AND
    guest_phone_number != '' AND
    phone_number IS NOT NULL AND
    phone_number != '' AND
    location = ANY (ARRAY['pool'::text, 'room'::text, 'bar'::text]) AND
    total >= 0 AND
    status = 'new'
  );

CREATE POLICY "Enable preorder creation for dinner" ON orders
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    room_number IS NOT NULL AND
    first_name IS NOT NULL AND
    first_name != '' AND
    last_name IS NOT NULL AND
    last_name != '' AND
    guest_phone_number IS NOT NULL AND
    guest_phone_number != '' AND
    phone_number IS NOT NULL AND
    phone_number != '' AND
    location = ANY (ARRAY['pool'::text, 'room'::text, 'bar'::text]) AND
    total >= 0 AND
    status = 'new' AND
    (
      (is_preorder = false) OR
      (
        is_preorder = true AND 
        scheduled_for > CURRENT_TIMESTAMP AND
        scheduled_for::date = CURRENT_DATE AND
        EXTRACT(HOUR FROM scheduled_for) >= 18 AND 
        EXTRACT(HOUR FROM scheduled_for) < 23
      )
    )
  );