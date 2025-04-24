/*
  # Enable anonymous authentication

  This migration enables anonymous authentication for the Supabase project,
  which is required for guest users to submit orders.

  1. Security
    - Enable anonymous authentication
    - Add policy for anonymous users to create orders
*/

-- Update the orders policy to allow anonymous users
DROP POLICY IF EXISTS "Allow authenticated users to create orders" ON orders;

CREATE POLICY "Allow users to create orders"
  ON orders
  FOR INSERT
  TO authenticated, anon
  WITH CHECK (true);

-- Update the order items policy to allow anonymous users
DROP POLICY IF EXISTS "Allow authenticated users to manage order items" ON order_items;

CREATE POLICY "Allow users to manage order items"
  ON order_items
  FOR ALL
  TO authenticated, anon
  USING (true)
  WITH CHECK (true);