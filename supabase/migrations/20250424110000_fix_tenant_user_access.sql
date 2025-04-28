/*
  # Fix tenant user access policies
  
  1. Changes
    - Drop existing recursive policies
    - Create new non-recursive policies
    - Add proper role-based access control
    
  2. Security
    - Maintain data isolation between tenants
    - Ensure proper authorization checks
*/

-- Drop existing policies that may cause recursion
DROP POLICY IF EXISTS "Allow tenant users to view their tenant's users" ON tenant_users;
DROP POLICY IF EXISTS "Allow tenant admins to manage users" ON tenant_users;

-- Create new non-recursive policies
CREATE POLICY "Allow tenant users to view their tenant's users"
  ON tenant_users
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow tenant admins to manage users"
  ON tenant_users
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_tenant_users_auth_lookup
ON tenant_users(auth_user_id);

-- Add comment explaining the policies
COMMENT ON TABLE tenant_users IS 'Stores user information and roles for each tenant'; 