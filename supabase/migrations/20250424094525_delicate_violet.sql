/*
  # Fix email verification with unique function names
  
  1. Changes
    - Rename functions to avoid conflicts
    - Add hex token support
    - Fix verification URL generation
    
  2. Security
    - Maintain existing RLS policies
*/

-- Drop existing functions
DROP FUNCTION IF EXISTS verify_email(text, text);
DROP FUNCTION IF EXISTS create_verification_link(uuid, uuid, text);
DROP FUNCTION IF EXISTS process_email_verification(text, text);
DROP FUNCTION IF EXISTS verify_user_email(text, text, text);
DROP FUNCTION IF EXISTS generate_verify_url(uuid, uuid, text);
DROP FUNCTION IF EXISTS create_verification_url(uuid, uuid, text);

-- Create function to convert hex to UUID
CREATE OR REPLACE FUNCTION convert_hex_to_uuid(hex text) 
RETURNS uuid
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  -- Check if input is already a UUID
  IF hex ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
    RETURN hex::uuid;
  END IF;
  
  -- Convert hex string to UUID format
  RETURN CASE 
    WHEN hex ~ '^[0-9a-f]{32}$' THEN
      SUBSTRING(hex FROM 1 FOR 8) || '-' ||
      SUBSTRING(hex FROM 9 FOR 4) || '-' ||
      SUBSTRING(hex FROM 13 FOR 4) || '-' ||
      SUBSTRING(hex FROM 17 FOR 4) || '-' ||
      SUBSTRING(hex FROM 21 FOR 12)
    ELSE NULL
  END::uuid;
END;
$$;

-- Create function to handle email verification
CREATE OR REPLACE FUNCTION process_user_verification(
  token text,
  redirect_to text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_record tenant_users%ROWTYPE;
  v_token_uuid uuid;
  v_base_url text;
BEGIN
  -- Convert token to UUID
  v_token_uuid := convert_hex_to_uuid(token);
  
  IF v_token_uuid IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Invalid verification token format'
    );
  END IF;

  -- Find user by verification token
  SELECT * INTO v_user_record
  FROM tenant_users
  WHERE verification_token = v_token_uuid
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

  -- Get base URL from environment variable
  v_base_url := current_setting('app.settings.base_url', true);

  -- Return success with redirect URL
  RETURN jsonb_build_object(
    'success', true,
    'redirect_to', COALESCE(
      redirect_to,
      v_base_url || '/signin?verified=true'
    )
  );
END;
$$;

-- Create function to generate verification URL
CREATE OR REPLACE FUNCTION generate_verification_url(
  user_id uuid,
  tenant_id uuid,
  redirect_to text DEFAULT NULL
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_token uuid;
  v_base_url text;
  v_verification_url text;
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
  WHERE auth_user_id = user_id
    AND tenant_id = tenant_id;

  -- Get base URL from settings or use environment variable
  SELECT COALESCE(
    settings->>'base_url',
    current_setting('app.settings.base_url', true)
  ) INTO v_base_url
  FROM tenants
  WHERE id = tenant_id;

  -- Build verification URL using the tenant's base URL
  v_verification_url := format(
    '%s/verify-email?token=%s&tenant=%s',
    v_base_url,
    REPLACE(v_token::text, '-', ''),
    tenant_id
  );

  -- If redirect_to is provided, add it to the URL
  IF redirect_to IS NOT NULL THEN
    v_verification_url := v_verification_url || '&redirect_to=' || redirect_to;
  END IF;

  RETURN v_verification_url;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION process_user_verification TO authenticated, anon;
GRANT EXECUTE ON FUNCTION generate_verification_url TO authenticated, anon;
GRANT EXECUTE ON FUNCTION convert_hex_to_uuid TO authenticated, anon;

-- Add index for verification token lookups
DROP INDEX IF EXISTS idx_tenant_users_verification_token;
CREATE INDEX idx_tenant_users_verification_token
ON tenant_users(verification_token)
WHERE verification_token IS NOT NULL;