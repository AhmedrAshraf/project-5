/*
  # Fix email verification flow
  
  1. Changes
    - Add proper email verification handling
    - Update verification URL format
    - Add proper redirect handling
    
  2. Security
    - Maintain existing RLS policies
    - Ensure secure token handling
*/

-- Drop existing functions if they exist
DROP FUNCTION IF EXISTS verify_user_email(text, text, text);
DROP FUNCTION IF EXISTS create_verification_url(uuid, uuid, text);

-- Add function to handle email verification
CREATE OR REPLACE FUNCTION process_email_verification(
  p_token text,
  p_redirect_to text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id uuid;
  v_tenant_id uuid;
  v_user_record tenant_users%ROWTYPE;
BEGIN
  -- Find user by verification token
  SELECT * INTO v_user_record
  FROM tenant_users
  WHERE verification_token = p_token::uuid
    AND verification_token_expires_at > now()
    AND NOT email_verified;

  IF v_user_record IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Invalid or expired verification token'
    );
  END IF;

  -- Update user verification status
  UPDATE tenant_users
  SET 
    email_verified = true,
    verification_token = NULL,
    verification_token_expires_at = NULL,
    updated_at = now()
  WHERE id = v_user_record.id;

  -- Update auth.users email confirmation
  UPDATE auth.users
  SET 
    email_confirmed_at = now(),
    updated_at = now()
  WHERE id = v_user_record.auth_user_id;

  -- Return success with redirect URL
  RETURN jsonb_build_object(
    'success', true,
    'redirect_to', COALESCE(
      p_redirect_to,
      'http://localhost:5173/signin?verified=true'
    )
  );
END;
$$;

-- Add function to generate verification URL
CREATE OR REPLACE FUNCTION generate_verify_url(
  p_user_id uuid,
  p_tenant_id uuid,
  p_redirect_to text DEFAULT NULL
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_token uuid;
  v_base_url text;
BEGIN
  -- Generate new verification token
  v_token := gen_random_uuid();
  
  -- Update user with new token
  UPDATE tenant_users
  SET 
    verification_token = v_token,
    verification_token_expires_at = now() + interval '24 hours',
    verification_attempts = 0,
    last_verification_attempt = NULL
  WHERE auth_user_id = p_user_id
    AND tenant_id = p_tenant_id;

  -- Get base URL from settings
  SELECT COALESCE(
    settings->>'base_url',
    'http://localhost:5173'
  ) INTO v_base_url
  FROM tenants
  WHERE id = p_tenant_id;

  -- Build verification URL
  RETURN format(
    '%s/verify-email?token=%s&redirect_to=%s',
    v_base_url,
    v_token,
    COALESCE(p_redirect_to, v_base_url || '/signin')
  );
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION process_email_verification TO authenticated, anon;
GRANT EXECUTE ON FUNCTION generate_verify_url TO authenticated, anon;

-- Add index for verification token lookups if it doesn't exist
DROP INDEX IF EXISTS idx_tenant_users_verification_token;
CREATE INDEX idx_tenant_users_verification_token
ON tenant_users(verification_token)
WHERE verification_token IS NOT NULL;

-- Update existing admin user
DO $$ 
DECLARE
  v_tenant_id uuid;
  v_user_id uuid;
BEGIN
  -- Get tenant ID
  SELECT id INTO v_tenant_id 
  FROM tenants 
  WHERE subdomain = 'lyja';

  -- Get user ID
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = 'lyja@eto-now.de';

  IF v_user_id IS NOT NULL THEN
    -- Update tenant user verification
    UPDATE tenant_users
    SET 
      email_verified = true,
      verification_token = NULL,
      verification_token_expires_at = NULL,
      updated_at = now()
    WHERE auth_user_id = v_user_id
      AND tenant_id = v_tenant_id;

    -- Update auth user confirmation
    UPDATE auth.users
    SET 
      email_confirmed_at = now(),
      updated_at = now()
    WHERE id = v_user_id;
  END IF;
END $$;