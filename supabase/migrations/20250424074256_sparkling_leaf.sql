/*
  # Update admin user email address
  
  1. Changes
    - Update admin user email to lyja@eto-now.de
    - Ensure proper role and permissions are maintained
    
  2. Security
    - Maintains existing security settings
    - Updates both auth.users and tenant_users tables
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

  -- First, ensure the old user doesn't exist
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
    'lyja@eto-now.de',
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
  WHERE email IN ('admin@lyja-resort.com', 'lyja@eto-now.de')
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
    'lyja@eto-now.de',
    true,
    'Admin',
    'User'
  );

END $$;