/*
  # Create admin user for LYJA Resort
  
  1. Changes
    - Create admin user with proper password hashing
    - Add admin user to tenant_users table
    - Set proper role and permissions
    
  2. Security
    - Uses secure password hashing
    - Sets email as verified
    - Assigns admin role
*/

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

  -- Check if user exists
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = 'admin@lyja-resort.com'
  LIMIT 1;

  -- Create or update user
  IF v_user_id IS NULL THEN
    -- Create new user
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
      deleted_at
    )
    VALUES (
      gen_random_uuid(),
      '00000000-0000-0000-0000-000000000000'::uuid,
      'admin@lyja-resort.com',
      crypt('admin123', gen_salt('bf')),
      now(),
      '{"provider": "email", "providers": ["email"]}',
      '{"name": "Admin User"}',
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
  ELSE
    -- Update existing user
    UPDATE auth.users
    SET 
      encrypted_password = crypt('admin123', gen_salt('bf')),
      email_confirmed_at = now(),
      updated_at = now()
    WHERE id = v_user_id;
  END IF;

  -- Create or update tenant user
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
  ON CONFLICT (tenant_id, auth_user_id) DO UPDATE
  SET 
    role = 'admin',
    email_verified = true;

END $$;