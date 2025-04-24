/*
  # Fix tenant user policies to prevent infinite recursion
  
  1. Changes
    - Drop existing recursive policies
    - Create new non-recursive policies
    - Add proper role-based access control
    
  2. Security
    - Maintain data isolation between tenants
    - Ensure proper authorization checks
*/

-- Drop existing policies that may cause recursion
DROP POLICY IF EXISTS "Tenant admins can manage their own tenant's users" ON tenant_users;
DROP POLICY IF EXISTS "Tenant users can view their own tenant's users" ON tenant_users;

-- Create new non-recursive policies
CREATE POLICY "Allow tenant users to view their tenant's users"
  ON tenant_users
  FOR SELECT
  TO authenticated
  USING (tenant_id = get_current_tenant_id());

CREATE POLICY "Allow tenant admins to manage users"
  ON tenant_users
  FOR ALL
  TO authenticated
  USING (
    tenant_id = get_current_tenant_id() AND
    auth_user_id = auth.uid() AND
    role IN ('owner', 'admin')
  )
  WITH CHECK (tenant_id = get_current_tenant_id());

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_tenant_users_tenant_role
  ON tenant_users(tenant_id, role);

-- Add comment explaining the policies
COMMENT ON TABLE tenant_users IS 'Stores user information and roles for each tenant';