/*
  # Fix auth setup and ensure proper user creation
  
  1. Changes
    - Ensure auth schema and users table exists
    - Update existing admin user if found
    - Create admin user only if not exists
    
  2. Security
    - Use proper password hashing
    - Set email as verified
    - Assign admin role
*/

-- Create auth schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS auth;

-- Ensure auth.users table exists with all required columns
CREATE TABLE IF NOT EXISTS auth.users (
  instance_id uuid,
  id uuid PRIMARY KEY,
  aud varchar(255),
  role varchar(255),
  email varchar(255) UNIQUE,
  encrypted_password varchar(255),
  email_confirmed_at timestamptz DEFAULT now(),
  invited_at timestamptz,
  confirmation_token varchar(255),
  confirmation_sent_at timestamptz,
  recovery_token varchar(255),
  recovery_sent_at timestamptz,
  email_change_token_new varchar(255),
  email_change varchar(255),
  email_change_sent_at timestamptz,
  last_sign_in_at timestamptz,
  raw_app_meta_data jsonb,
  raw_user_meta_data jsonb,
  is_super_admin boolean,
  created_at timestamptz,
  updated_at timestamptz,
  phone text DEFAULT NULL::character varying,
  phone_confirmed_at timestamptz,
  phone_change text DEFAULT ''::character varying,
  phone_change_token varchar(255) DEFAULT ''::character varying,
  phone_change_sent_at timestamptz,
  confirmed_at timestamptz GENERATED ALWAYS AS (
    LEAST(email_confirmed_at, phone_confirmed_at)
  ) STORED,
  email_change_token_current varchar(255) DEFAULT ''::character varying,
  email_change_confirm_status smallint DEFAULT 0,
  banned_until timestamptz,
  reauthentication_token varchar(255) DEFAULT ''::character varying,
  reauthentication_sent_at timestamptz,
  is_sso_user boolean DEFAULT false,
  deleted_at timestamptz
);

-- Create or update admin user
DO $$ 
DECLARE
  v_tenant_id uuid;
  v_user_id uuid;
  v_existing_user_id uuid;
BEGIN
  -- Get the tenant ID for LYJA Resort
  SELECT id INTO v_tenant_id
  FROM tenants
  WHERE subdomain = 'lyja'
  LIMIT 1;

  -- Check if user already exists
  SELECT id INTO v_existing_user_id
  FROM auth.users
  WHERE email = 'lyja@eto-now.de'
  LIMIT 1;

  IF v_existing_user_id IS NULL THEN
    -- Create new user if doesn't exist
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
        'providers', ARRAY['email']::text[],
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
  ELSE
    -- Update existing user
    v_user_id := v_existing_user_id;
    
    UPDATE auth.users
    SET
      encrypted_password = crypt('admin123', gen_salt('bf')),
      email_confirmed_at = now(),
      raw_app_meta_data = jsonb_build_object(
        'provider', 'email',
        'providers', ARRAY['email']::text[],
        'role', 'authenticated'
      ),
      raw_user_meta_data = jsonb_build_object(
        'name', 'Admin User',
        'role', 'admin'
      ),
      updated_at = now(),
      last_sign_in_at = now()
    WHERE id = v_existing_user_id;
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
    'lyja@eto-now.de',
    true,
    'Admin',
    'User'
  )
  ON CONFLICT (tenant_id, auth_user_id) 
  DO UPDATE SET
    role = 'admin',
    email_verified = true,
    updated_at = now();

END $$;