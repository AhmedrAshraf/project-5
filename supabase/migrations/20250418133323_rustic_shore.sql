/*
  # Add phone number to orders table
  
  1. Changes
    - Add phone_number column to orders table
    - Update policies to require phone number
    - Make phone_number required for new orders
    
  2. Security
    - Maintains existing RLS policies
    - Updates policies to include phone number validation
*/

-- Add phone_number column
ALTER TABLE orders
ADD COLUMN phone_number text;

-- Update existing records with a placeholder
UPDATE orders
SET phone_number = '+1234567890'
WHERE phone_number IS NULL;

-- Make phone_number required
ALTER TABLE orders
ALTER COLUMN phone_number SET NOT NULL;

-- Update policies to include phone number validation
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