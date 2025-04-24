/*
  # Fix email verification flow
  
  1. Changes
    - Add proper email verification handling with unique function names
    - Update verification token format
    - Add verification redirect URL
    
  2. Security
    - Maintain existing RLS policies
    - Ensure secure token handling
*/

-- Drop existing functions if they exist
DROP FUNCTION IF EXISTS handle_email_verification(text, text, text);
DROP FUNCTION IF EXISTS generate_verification_url(uuid, uuid, text);

-- Add function to handle email verification with unique name
CREATE OR REPLACE FUNCTION verify_user_email(
  p_token text,
  p_type text DEFAULT 'signup',
  p_redirect_to text DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id uuid;
  v_tenant_id uuid;
BEGIN
  -- Get tenant ID from current context
  v_tenant_id := get_current_tenant_id();
  
  -- Find user by verification token
  SELECT auth_user_id INTO v_user_id
  FROM tenant_users
  WHERE verification_token = p_token::uuid
    AND tenant_id = v_tenant_id
    AND verification_token_expires_at > now()
    AND NOT email_verified;

  IF v_user_id IS NULL THEN
    RETURN false;
  END IF;

  -- Update user verification status
  UPDATE tenant_users
  SET 
    email_verified = true,
    verification_token = NULL,
    verification_token_expires_at = NULL,
    updated_at = now()
  WHERE auth_user_id = v_user_id
    AND tenant_id = v_tenant_id;

  -- Update auth.users email confirmation
  UPDATE auth.users
  SET 
    email_confirmed_at = now(),
    updated_at = now()
  WHERE id = v_user_id;

  RETURN true;
END;
$$;

-- Add function to generate verification URL with unique name
CREATE OR REPLACE FUNCTION create_verification_url(
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
    verification_token_expires_at = now() + interval '24 hours'
  WHERE auth_user_id = p_user_id
    AND tenant_id = p_tenant_id;

  -- Get base URL from settings
  SELECT COALESCE(
    settings->>'base_url',
    'https://vioeizhgqrjixazxjros.supabase.co'
  ) INTO v_base_url
  FROM tenants
  WHERE id = p_tenant_id;

  -- Build verification URL
  RETURN format(
    '%s/auth/v1/verify?token=%s&type=signup&redirect_to=%s',
    v_base_url,
    v_token,
    COALESCE(p_redirect_to, 'http://localhost:5173')
  );
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION verify_user_email TO authenticated, anon;
GRANT EXECUTE ON FUNCTION create_verification_url TO authenticated, anon;

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