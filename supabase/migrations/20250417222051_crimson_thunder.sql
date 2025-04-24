/*
  # Add pre-order support
  
  1. Changes
    - Add scheduled_for column to orders table to track when pre-ordered meals should be prepared
    - Add is_preorder column to orders table to easily identify pre-orders
    - Add check constraint to ensure scheduled_for is only set for dinner orders
    - Add check constraint to ensure scheduled_for is in the future
*/

ALTER TABLE orders
ADD COLUMN scheduled_for timestamptz,
ADD COLUMN is_preorder boolean DEFAULT false;

-- Add check constraints
ALTER TABLE orders
ADD CONSTRAINT valid_preorder_time 
  CHECK (
    (is_preorder = false AND scheduled_for IS NULL) OR
    (is_preorder = true AND scheduled_for > CURRENT_TIMESTAMP)
  );

-- Update RLS policies
CREATE POLICY "Enable preorder creation for dinner"
  ON orders
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    (room_number IS NOT NULL) AND 
    (location = ANY (ARRAY['pool'::text, 'terrace'::text, 'room'::text, 'restaurant'::text, 'bar'::text])) AND
    (total >= (0)::numeric) AND
    (status = 'new'::text) AND
    (
      (is_preorder = false) OR
      (is_preorder = true AND scheduled_for > CURRENT_TIMESTAMP AND EXTRACT(HOUR FROM scheduled_for) >= 18 AND EXTRACT(HOUR FROM scheduled_for) < 23)
    )
  );