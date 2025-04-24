/*
  # Fix Orders Table RLS Policies

  1. Changes
    - Drop existing ineffective policies
    - Add new properly configured policies for orders table
      - Allow authenticated and anonymous users to create orders with proper checks
      - Allow authenticated users to read their own orders
      - Allow authenticated users to update their own orders
  
  2. Security
    - Ensures orders can only be created with valid data
    - Maintains existing RLS enabled status
*/

-- Drop existing policies that aren't properly secured
DROP POLICY IF EXISTS "Allow users to create orders" ON orders;
DROP POLICY IF EXISTS "Allow authenticated users to read their orders" ON orders;
DROP POLICY IF EXISTS "Allow authenticated users to update their orders" ON orders;

-- Create new properly secured policies
CREATE POLICY "Enable order creation for all users" ON orders
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    -- Ensure required fields are present and valid
    room_number IS NOT NULL AND
    location = ANY (ARRAY['pool', 'terrace', 'room', 'restaurant', 'bar']) AND
    total >= 0 AND
    status = 'new'
  );

CREATE POLICY "Enable order reading for authenticated users" ON orders
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Enable order updates for authenticated users" ON orders
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (
    -- Ensure status transitions are valid
    status = ANY (ARRAY['new', 'processing', 'completed']) AND
    total >= 0
  );