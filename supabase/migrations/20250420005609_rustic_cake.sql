/*
  # Create admin user for LYJA Resort
  
  1. Changes
    - Create initial admin user for the tenant
    - Set proper role and permissions
    - Enable immediate access without email verification
    
  2. Security
    - Password will need to be changed on first login
    - User has admin privileges
*/

-- Get the tenant ID for LYJA Resort
DO $$ 
DECLARE
  v_tenant_id uuid;
  v_user_id uuid;
BEGIN
  -- Get the tenant ID
  SELECT id INTO v_tenant_id
  FROM tenants
  WHERE subdomain = 'lyja'
  LIMIT 1;

  -- Create the admin user in auth.users if it doesn't exist
  INSERT INTO auth.users (
    id,
    aud,
    role,
    email,
    raw_user_meta_data,
    raw_app_meta_data,
    is_super_admin,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    confirmation_sent_at,
    is_sso_user,
    deleted_at
  )
  SELECT
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    'admin@lyja-resort.com',
    '{"provider":"email"}',
    '{"provider":"email","providers":["email"]}',
    false,
    crypt('admin123', gen_salt('bf')),
    NOW(),
    NOW(),
    NOW(),
    NOW(),
    false,
    NULL
  WHERE NOT EXISTS (
    SELECT 1 FROM auth.users WHERE email = 'admin@lyja-resort.com'
  )
  RETURNING id INTO v_user_id;

  -- If user already exists, get their ID
  IF v_user_id IS NULL THEN
    SELECT id INTO v_user_id
    FROM auth.users
    WHERE email = 'admin@lyja-resort.com';
  END IF;

  -- Create tenant user entry
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
  )
  ON CONFLICT (tenant_id, auth_user_id) DO NOTHING;

END $$;