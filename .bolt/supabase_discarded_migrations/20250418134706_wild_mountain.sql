/*
  # Add staff notification phone number configuration
  
  1. Changes
    - Add configuration for staff notification phone number
    - Update Twilio config check function
    
  2. Security
    - Maintains existing RLS policies
*/

-- Add staff notification phone number to configuration check
CREATE OR REPLACE FUNCTION check_twilio_config()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  account_sid text;
  auth_token text;
  phone_number text;
  staff_phone text;
BEGIN
  -- These values are set in the Supabase dashboard
  -- Settings > Edge Functions > Environment Variables
  SELECT current_setting('app.settings.twilio_account_sid', true) INTO account_sid;
  SELECT current_setting('app.settings.twilio_auth_token', true) INTO auth_token;
  SELECT current_setting('app.settings.twilio_phone_number', true) INTO phone_number;
  SELECT current_setting('app.settings.staff_notification_phone', true) INTO staff_phone;
  
  RETURN account_sid IS NOT NULL 
    AND auth_token IS NOT NULL 
    AND phone_number IS NOT NULL
    AND staff_phone IS NOT NULL;
END;
$$;

COMMENT ON FUNCTION check_twilio_config IS 'Checks if required Twilio configuration is present. Configure in Supabase Dashboard: Settings > Edge Functions > Environment Variables';