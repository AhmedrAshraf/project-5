/*
  # Add email verification and improve auth system
  
  1. Changes
    - Add email verification settings to tenants
    - Add email templates for verification
    - Add function to handle email verification
    - Add trigger to send verification emails
    
  2. Security
    - Maintains existing RLS policies
    - Adds secure email verification flow
*/

-- Add email verification settings to tenants
ALTER TABLE tenants
ADD COLUMN email_verification_required boolean DEFAULT false,
ADD COLUMN email_templates jsonb DEFAULT jsonb_build_object(
  'verification', jsonb_build_object(
    'subject', 'Verify your email for {tenant_name}',
    'content', 'Please click the link below to verify your email:\n\n{verification_link}\n\nThis link will expire in 24 hours.'
  ),
  'welcome', jsonb_build_object(
    'subject', 'Welcome to {tenant_name}',
    'content', 'Thank you for verifying your email. You can now sign in to your account.'
  )
);

-- Create function to handle email verification
CREATE OR REPLACE FUNCTION handle_email_verification()
RETURNS trigger AS $$
DECLARE
  tenant_record tenants%ROWTYPE;
BEGIN
  -- Get tenant settings
  SELECT * INTO tenant_record
  FROM tenants
  WHERE id = NEW.tenant_id;

  -- Check if email verification is required
  IF tenant_record.email_verification_required THEN
    -- Set user as unverified
    NEW.email_verified := false;
    
    -- Send verification email (handled by Edge Function)
    PERFORM net.http_post(
      url := current_setting('app.settings.base_url') || '/functions/v1/send-verification-email',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.settings.anon_key')
      ),
      body := jsonb_build_object(
        'email', NEW.email,
        'tenant_id', NEW.tenant_id
      )::text
    );
  ELSE
    -- Auto-verify if not required
    NEW.email_verified := true;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for email verification
CREATE TRIGGER verify_email_trigger
  BEFORE INSERT ON tenant_users
  FOR EACH ROW
  EXECUTE FUNCTION handle_email_verification();

-- Add email verification status to tenant_users
ALTER TABLE tenant_users
ADD COLUMN email_verified boolean DEFAULT false,
ADD COLUMN verification_token uuid,
ADD COLUMN verification_token_expires_at timestamptz;

-- Create function to verify email
CREATE OR REPLACE FUNCTION verify_email(
  p_token uuid,
  p_tenant_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_record tenant_users%ROWTYPE;
BEGIN
  -- Get user record
  SELECT * INTO user_record
  FROM tenant_users
  WHERE verification_token = p_token
  AND tenant_id = p_tenant_id
  AND verification_token_expires_at > now();

  -- Check if token is valid
  IF user_record IS NULL THEN
    RETURN false;
  END IF;

  -- Update user record
  UPDATE tenant_users
  SET 
    email_verified = true,
    verification_token = NULL,
    verification_token_expires_at = NULL,
    updated_at = now()
  WHERE id = user_record.id;

  RETURN true;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION verify_email TO authenticated, anon;

-- Add index for verification token lookups
CREATE INDEX idx_tenant_users_verification 
ON tenant_users(verification_token, tenant_id) 
WHERE verification_token IS NOT NULL;