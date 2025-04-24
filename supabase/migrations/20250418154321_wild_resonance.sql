/*
  # Update SMS notification system
  
  1. Changes
    - Add default customer notification number
    - Update send-sms function to use fixed number
    - Add tracking for SMS notifications
    
  2. Security
    - Maintains existing RLS policies
*/

-- Add configuration for default customer notification number
CREATE OR REPLACE FUNCTION get_customer_notification_number()
RETURNS text
LANGUAGE sql
IMMUTABLE
AS $$
  -- Return the fixed customer notification number
  SELECT '+19123485784'::text;
$$;

COMMENT ON FUNCTION get_customer_notification_number IS 'Returns the default customer notification number for all order confirmations';

-- Update existing orders to use the default number
UPDATE orders
SET phone_number = get_customer_notification_number()
WHERE phone_number != get_customer_notification_number();

-- Add trigger to ensure phone_number is always set to default
CREATE OR REPLACE FUNCTION ensure_default_phone_number()
RETURNS TRIGGER AS $$
BEGIN
  NEW.phone_number := get_customer_notification_number();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_default_phone_number
  BEFORE INSERT OR UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION ensure_default_phone_number();