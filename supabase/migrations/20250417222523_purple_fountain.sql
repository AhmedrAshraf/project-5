/*
  # Update pre-order constraints

  1. Changes
    - Modify the valid_preorder_time constraint to only allow same-day pre-orders
    - Update the pre-order policy to enforce same-day restrictions

  2. Security
    - Maintains existing RLS policies
    - Updates constraints for tighter validation
*/

-- Drop existing constraint and policy
ALTER TABLE orders DROP CONSTRAINT IF EXISTS valid_preorder_time;
DROP POLICY IF EXISTS "Enable preorder creation for dinner" ON orders;

-- Add updated constraint for same-day pre-orders
ALTER TABLE orders
ADD CONSTRAINT valid_preorder_time 
  CHECK (
    (is_preorder = false AND scheduled_for IS NULL) OR
    (
      is_preorder = true AND 
      scheduled_for > CURRENT_TIMESTAMP AND
      scheduled_for::date = CURRENT_DATE AND
      EXTRACT(HOUR FROM scheduled_for) >= 18 AND 
      EXTRACT(HOUR FROM scheduled_for) < 23
    )
  );

-- Create updated policy for pre-orders
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
      (
        is_preorder = true AND 
        scheduled_for > CURRENT_TIMESTAMP AND
        scheduled_for::date = CURRENT_DATE AND
        EXTRACT(HOUR FROM scheduled_for) >= 18 AND 
        EXTRACT(HOUR FROM scheduled_for) < 23
      )
    )
  );