/*
  # Add customer name fields to orders table
  
  1. Changes
    - Add first_name and last_name columns to orders table
    - Update existing records with placeholder values
    - Make columns NOT NULL after data migration
    - Update policies to include name validation
  
  2. Security
    - Maintains existing RLS policies
    - Updates policies to ensure names are provided
*/

-- Add name columns as nullable first
ALTER TABLE orders
ADD COLUMN first_name text,
ADD COLUMN last_name text;

-- Update existing records with placeholder values
UPDATE orders
SET 
  first_name = 'Guest',
  last_name = 'User'
WHERE first_name IS NULL OR last_name IS NULL;

-- Now make the columns NOT NULL
ALTER TABLE orders
ALTER COLUMN first_name SET NOT NULL,
ALTER COLUMN last_name SET NOT NULL;

-- Update existing policies to include name validation
DROP POLICY IF EXISTS "Enable order creation for all users" ON orders;
DROP POLICY IF EXISTS "Enable preorder creation for dinner" ON orders;

-- Create updated policies that include name validation
CREATE POLICY "Enable order creation for all users" ON orders
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    room_number IS NOT NULL AND
    first_name IS NOT NULL AND
    first_name != '' AND
    last_name IS NOT NULL AND
    last_name != '' AND
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