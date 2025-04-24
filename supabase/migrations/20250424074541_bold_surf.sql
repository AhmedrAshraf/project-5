/*
  # Fix authentication schema configuration

  1. Changes
    - Add auth schema configuration for tenant-based authentication
    - Add necessary indexes for auth queries
    - Add RLS policies for auth access

  2. Security
    - Enable RLS on auth tables
    - Add policies for secure authentication
*/

-- Create auth schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS auth;

-- Ensure auth.users table exists and has correct structure
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'auth' AND table_name = 'users'
  ) THEN
    CREATE TABLE auth.users (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      email text UNIQUE NOT NULL,
      encrypted_password text NOT NULL,
      created_at timestamptz DEFAULT now(),
      updated_at timestamptz DEFAULT now()
    );
  END IF;
END $$;

-- Add index for email lookups
CREATE INDEX IF NOT EXISTS idx_auth_users_email 
ON auth.users (email);

-- Enable RLS on auth.users
ALTER TABLE auth.users ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Users can read own data" ON auth.users;

-- Add policy for users to read their own data
CREATE POLICY "Users can read own data"
  ON auth.users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Ensure tenant_users has correct foreign key to auth.users
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'tenant_users_auth_user_id_fkey'
  ) THEN
    ALTER TABLE public.tenant_users
    ADD CONSTRAINT tenant_users_auth_user_id_fkey
    FOREIGN KEY (auth_user_id) REFERENCES auth.users(id);
  END IF;
END $$;

-- Add index for auth user lookups in tenant_users
CREATE INDEX IF NOT EXISTS idx_tenant_users_auth_user_lookup
ON public.tenant_users (auth_user_id, tenant_id);

-- Add function to get user's tenant
CREATE OR REPLACE FUNCTION public.get_user_tenant_id()
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT tenant_id 
  FROM public.tenant_users 
  WHERE auth_user_id = auth.uid() 
  LIMIT 1;
$$;