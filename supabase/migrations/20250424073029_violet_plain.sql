/*
  # Fix admin authentication and tenant access
  
  1. Changes
    - Update tenant user lookup to properly check tenant context
    - Add index for faster tenant user lookups
    - Update admin user to ensure proper access
    
  2. Security
    - Maintains existing RLS policies
    - Ensures proper role-based access
*/

-- Add index for faster tenant user lookups
CREATE INDEX IF NOT EXISTS idx_tenant_users_tenant_auth
ON tenant_users(tenant_id, auth_user_id, role);

-- Create function to get tenant user role
CREATE OR REPLACE FUNCTION get_tenant_user_role(p_auth_user_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_role text;
BEGIN
  SELECT role INTO v_role
  FROM tenant_users
  WHERE auth_user_id = p_auth_user_id
  AND tenant_id = get_current_tenant_id()
  AND email_verified = true;
  
  RETURN v_role;
END;
$$;

-- Update existing admin user to ensure proper access
DO $$ 
DECLARE
  v_tenant_id uuid;
  v_user_id uuid;
BEGIN
  -- Get the tenant ID for LYJA Resort
  SELECT id INTO v_tenant_id
  FROM tenants
  WHERE subdomain = 'lyja'
  LIMIT 1;

  -- First, ensure the user doesn't exist
  DELETE FROM auth.users WHERE email = 'admin@lyja-resort.com';
  
  -- Create new user with proper password hashing
  v_user_id := gen_random_uuid();
  
  INSERT INTO auth.users (
    id,
    instance_id,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    aud,
    role,
    created_at,
    updated_at,
    confirmation_sent_at,
    is_super_admin,
    is_sso_user,
    deleted_at,
    last_sign_in_at
  )
  VALUES (
    v_user_id,
    '00000000-0000-0000-0000-000000000000'::uuid,
    'admin@lyja-resort.com',
    crypt('admin123', gen_salt('bf')),
    now(),
    jsonb_build_object(
      'provider', 'email',
      'providers', ARRAY['email'],
      'role', 'authenticated'
    ),
    jsonb_build_object(
      'name', 'Admin User',
      'role', 'admin'
    ),
    'authenticated',
    'authenticated',
    now(),
    now(),
    now(),
    false,
    false,
    null,
    now()
  );

  -- Delete any existing tenant user entries
  DELETE FROM tenant_users 
  WHERE email = 'admin@lyja-resort.com' 
  AND tenant_id = v_tenant_id;

  -- Create tenant user with admin role
  INSERT INTO tenant_users (
    tenant_id,
    auth_user_id,
    role,
    email,
    email_verified,
    first_name,
    last_name
  )
  VALUES (
    v_tenant_id,
    v_user_id,
    'admin',
    'admin@lyja-resort.com',
    true,
    'Admin',
    'User'
  );

END $$;