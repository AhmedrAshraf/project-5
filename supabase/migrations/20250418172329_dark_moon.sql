/*
  # Fix guest phone number handling

  1. Changes
    - Update trigger function to properly store guest phone number
    - Add comment explaining the phone number fields
    - Ensure proper phone number handling in policies
*/

-- Add comments explaining the phone number fields
COMMENT ON COLUMN orders.phone_number IS 'Phone number used for SMS notifications (system-set)';
COMMENT ON COLUMN orders.guest_phone_number IS 'Actual guest phone number provided during order';

-- Update the trigger function to properly handle phone numbers
CREATE OR REPLACE FUNCTION ensure_default_phone_number()
RETURNS TRIGGER AS $$
BEGIN
  -- Store the guest's actual phone number separately
  IF NEW.guest_phone_number IS NULL THEN
    NEW.guest_phone_number := NEW.phone_number;
  END IF;
  
  -- Set the system notification number
  NEW.phone_number := get_customer_notification_number();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop and recreate the trigger to ensure it's using the latest version
DROP TRIGGER IF EXISTS set_default_phone_number ON orders;
CREATE TRIGGER set_default_phone_number
  BEFORE INSERT OR UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION ensure_default_phone_number();

-- Update policies to validate guest phone number
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
    phone_number IS NOT NULL AND
    phone_number != '' AND
    guest_phone_number IS NOT NULL AND
    guest_phone_number != '' AND
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
    guest_phone_number IS NOT NULL AND
    guest_phone_number != '' AND
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