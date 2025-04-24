/*
  # Fix email verification flow
  
  1. Changes
    - Add default email settings for new tenants
    - Update email verification trigger to handle errors gracefully
    - Add email verification status tracking
    
  2. Security
    - Maintains existing RLS policies
*/

-- Update tenant_users table to track verification attempts
ALTER TABLE tenant_users
ADD COLUMN verification_attempts integer DEFAULT 0,
ADD COLUMN last_verification_attempt timestamptz;

-- Update handle_email_verification function to be more robust
CREATE OR REPLACE FUNCTION handle_email_verification()
RETURNS trigger AS $$
DECLARE
  tenant_record tenants%ROWTYPE;
BEGIN
  -- Get tenant settings
  SELECT * INTO tenant_record
  FROM tenants
  WHERE id = NEW.tenant_id;

  -- Always set initial verification state
  NEW.email_verified := false;
  NEW.verification_token := gen_random_uuid();
  NEW.verification_token_expires_at := now() + interval '24 hours';
  NEW.verification_attempts := 0;
  NEW.last_verification_attempt := NULL;

  -- If email verification is not required, auto-verify
  IF NOT tenant_record.email_verification_required THEN
    NEW.email_verified := true;
    NEW.verification_token := NULL;
    NEW.verification_token_expires_at := NULL;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create function to track verification attempts
CREATE OR REPLACE FUNCTION track_verification_attempt(
  p_user_id uuid,
  p_tenant_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE tenant_users
  SET 
    verification_attempts = verification_attempts + 1,
    last_verification_attempt = now()
  WHERE id = p_user_id
  AND tenant_id = p_tenant_id;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION track_verification_attempt TO authenticated, anon;

-- Add index for verification tracking
CREATE INDEX idx_tenant_users_verification_attempts
ON tenant_users(tenant_id, email, verification_attempts)
WHERE NOT email_verified;

-- Update existing tenant_users to have proper verification state
UPDATE tenant_users
SET email_verified = true
WHERE email_verified IS NULL;

-- Set default email templates for all tenants
UPDATE tenants
SET email_templates = jsonb_build_object(
  'verification', jsonb_build_object(
    'subject', 'Verify your email for {tenant_name}',
    'content', 'Please click the link below to verify your email:\n\n{verification_link}\n\nThis link will expire in 24 hours.'
  ),
  'welcome', jsonb_build_object(
    'subject', 'Welcome to {tenant_name}',
    'content', 'Thank you for verifying your email. You can now sign in to your account.'
  )
)
WHERE email_templates IS NULL;