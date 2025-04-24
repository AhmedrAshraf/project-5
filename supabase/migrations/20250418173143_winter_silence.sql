/*
  # Update SMS message format to include guest phone number
  
  1. Changes
    - Update the send-sms function to include guest phone number in the message
    - Maintain existing functionality
    - Ensure proper phone number display
*/

-- Update the send-sms edge function configuration
COMMENT ON FUNCTION check_twilio_config IS 'SMS message format: Order details + Guest phone number. Configure in Supabase Dashboard: Settings > Edge Functions > Environment Variables';

-- Add a helper function to format phone numbers
CREATE OR REPLACE FUNCTION format_phone_number(phone text)
RETURNS text
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT COALESCE(phone, 'Keine Nummer angegeben');
$$;