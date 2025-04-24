/*
  # Fix guest phone number handling and display
  
  1. Changes
    - Update trigger to preserve guest phone number
    - Ensure guest phone number is properly stored
    - Fix phone number handling in policies
  
  2. Security
    - Maintains existing RLS policies
*/

-- Update the trigger function to properly handle guest phone numbers
CREATE OR REPLACE FUNCTION ensure_default_phone_number()
RETURNS TRIGGER AS $$
BEGIN
  -- Store the guest's actual phone number
  NEW.guest_phone_number := NEW.phone_number;
  
  -- Set the notification phone number for SMS
  NEW.phone_number := get_customer_notification_number();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing policies
DROP POLICY IF EXISTS "Enable order creation for all users" ON orders;
DROP POLICY IF EXISTS "Enable preorder creation for dinner" ON orders;

-- Recreate policies with proper phone number validation
CREATE POLICY "Enable order creation for all users" ON orders
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    room_number IS NOT NULL AND
    first_name IS NOT NULL AND
    first_name != '' AND
    last_name IS NOT NULL AND
    last_name != '' AND
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