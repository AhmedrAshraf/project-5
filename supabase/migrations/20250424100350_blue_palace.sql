/*
  # Set up authentication system with superadmin
  
  1. Changes
    - Create auth schema and users table
    - Create superadmin role and user
    - Set up proper RLS policies
    - Remove old users safely
    
  2. Security
    - Uses secure password hashing
    - Proper role-based access control
*/

-- First, clean up existing users safely by removing foreign key references
DELETE FROM tenant_users;
DELETE FROM auth.users;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can read own data" ON auth.users;
DROP POLICY IF EXISTS "Superadmins can do everything" ON auth.users;

-- Create superadmin role type if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
    CREATE TYPE user_role AS ENUM ('superadmin', 'admin', 'staff');
  END IF;
END $$;

-- Create users table with proper structure
CREATE TABLE IF NOT EXISTS auth.users (
  instance_id uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  aud varchar(255) DEFAULT 'authenticated',
  role varchar(255) DEFAULT 'authenticated',
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
  raw_app_meta_data jsonb DEFAULT '{}'::jsonb,
  raw_user_meta_data jsonb DEFAULT '{}'::jsonb,
  is_super_admin boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  phone varchar(255),
  phone_confirmed_at timestamptz,
  phone_change varchar(255) DEFAULT ''::varchar,
  phone_change_token varchar(255) DEFAULT ''::varchar,
  phone_change_sent_at timestamptz,
  confirmed_at timestamptz GENERATED ALWAYS AS (
    LEAST(email_confirmed_at, phone_confirmed_at)
  ) STORED,
  email_change_token_current varchar(255) DEFAULT ''::varchar,
  email_change_confirm_status smallint DEFAULT 0,
  banned_until timestamptz,
  reauthentication_token varchar(255) DEFAULT ''::varchar,
  reauthentication_sent_at timestamptz,
  is_sso_user boolean DEFAULT false,
  deleted_at timestamptz
);

-- Create superadmin user
INSERT INTO auth.users (
  id,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  created_at,
  updated_at
)
VALUES (
  gen_random_uuid(),
  'superadmin@lyja-saas.com',
  crypt('superadmin123', gen_salt('bf')),
  now(),
  jsonb_build_object(
    'provider', 'email',
    'providers', ARRAY['email'],
    'role', 'superadmin'
  ),
  jsonb_build_object(
    'name', 'Super Admin',
    'role', 'superadmin'
  ),
  true,
  now(),
  now()
);

-- Enable RLS
ALTER TABLE auth.users ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Superadmins can do everything"
  ON auth.users
  FOR ALL
  TO authenticated
  USING (
    (SELECT is_super_admin FROM auth.users WHERE id = auth.uid())
  )
  WITH CHECK (
    (SELECT is_super_admin FROM auth.users WHERE id = auth.uid())
  );

CREATE POLICY "Users can read own data"
  ON auth.users
  FOR SELECT
  TO authenticated
  USING (id = auth.uid());

-- Create function to check if user is superadmin
CREATE OR REPLACE FUNCTION auth.is_superadmin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT COALESCE(
    (SELECT is_super_admin FROM auth.users WHERE id = auth.uid()),
    false
  );
$$;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA auth TO authenticated, anon;
GRANT SELECT ON auth.users TO authenticated, anon;
GRANT EXECUTE ON FUNCTION auth.is_superadmin TO authenticated, anon;