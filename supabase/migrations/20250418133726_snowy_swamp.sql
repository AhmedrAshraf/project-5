/*
  # Add Twilio configuration check function
  
  1. Changes
    - Add function to verify Twilio configuration
    - Add comment explaining configuration requirements
    
  2. Notes
    - This migration only adds a helper function
    - Actual configuration must be done through Supabase dashboard
*/

-- Create a function to check Twilio configuration
CREATE OR REPLACE FUNCTION check_twilio_config()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  account_sid text;
  auth_token text;
  phone_number text;
BEGIN
  -- These values are set in the Supabase dashboard
  -- Settings > Edge Functions > Environment Variables
  SELECT current_setting('app.settings.twilio_account_sid', true) INTO account_sid;
  SELECT current_setting('app.settings.twilio_auth_token', true) INTO auth_token;
  SELECT current_setting('app.settings.twilio_phone_number', true) INTO phone_number;
  
  RETURN account_sid IS NOT NULL 
    AND auth_token IS NOT NULL 
    AND phone_number IS NOT NULL;
END;
$$;

COMMENT ON FUNCTION check_twilio_config IS 'Checks if required Twilio configuration is present. Configure in Supabase Dashboard: Settings > Edge Functions > Environment Variables';