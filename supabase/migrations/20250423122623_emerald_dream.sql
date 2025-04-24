/*
  # Fix admin authentication
  
  1. Changes
    - Properly create admin user with correct password hashing
    - Set up proper tenant user role
    - Enable immediate access
    
  2. Security
    - Uses secure password hashing with bcrypt
    - Sets email as verified
    - Assigns admin role
*/

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
  INSERT INTO auth.users (
    instance_id,
    id,
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
    deleted_at
  )
  VALUES (
    '00000000-0000-0000-0000-000000000000'::uuid,
    gen_random_uuid(),
    'admin@lyja-resort.com',
    crypt('admin123', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"name":"Admin User"}',
    'authenticated',
    'authenticated',
    now(),
    now(),
    now(),
    false,
    false,
    null
  )
  RETURNING id INTO v_user_id;

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