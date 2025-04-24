/*
  # Optimize database functions and reduce stack depth

  1. Changes
    - Optimize get_current_tenant_id function to reduce recursion
    - Add tenant_id index to improve query performance
    - Update RLS policies to use simpler conditions
    
  2. Security
    - Maintains existing RLS policies
    - Improves query performance
*/

-- Optimize get_current_tenant_id function
CREATE OR REPLACE FUNCTION get_current_tenant_id()
RETURNS uuid
LANGUAGE sql
STABLE
AS $$
  SELECT id 
  FROM tenants 
  WHERE subdomain = current_setting('request.headers', true)::jsonb->>'x-tenant-id'
  LIMIT 1;
$$;

-- Add indexes to improve join performance
CREATE INDEX IF NOT EXISTS idx_menu_items_tenant_category ON menu_items(tenant_id, category);
CREATE INDEX IF NOT EXISTS idx_daily_menu_items_tenant_dates ON daily_menu_items(tenant_id, valid_from, valid_until);
CREATE INDEX IF NOT EXISTS idx_time_slots_tenant_times ON time_slots(tenant_id, start_time, end_time);

-- Update RLS policies to use simpler conditions
DROP POLICY IF EXISTS "Allow authenticated users to manage menu items" ON menu_items;
CREATE POLICY "Allow authenticated users to manage menu items"
  ON menu_items
  FOR ALL
  TO authenticated
  USING (tenant_id = get_current_tenant_id())
  WITH CHECK (tenant_id = get_current_tenant_id());

DROP POLICY IF EXISTS "Allow public read access to menu_items" ON menu_items;
CREATE POLICY "Allow public read access to menu_items"
  ON menu_items
  FOR SELECT
  TO public
  USING (tenant_id = get_current_tenant_id());

DROP POLICY IF EXISTS "Allow authenticated users to manage daily menu items" ON daily_menu_items;
CREATE POLICY "Allow authenticated users to manage daily menu items"
  ON daily_menu_items
  FOR ALL
  TO authenticated
  USING (tenant_id = get_current_tenant_id())
  WITH CHECK (tenant_id = get_current_tenant_id());

DROP POLICY IF EXISTS "Allow public to read daily menu items" ON daily_menu_items;
CREATE POLICY "Allow public to read daily menu items"
  ON daily_menu_items
  FOR SELECT
  TO public
  USING (tenant_id = get_current_tenant_id());

DROP POLICY IF EXISTS "Allow authenticated users to manage time slots" ON time_slots;
CREATE POLICY "Allow authenticated users to manage time slots"
  ON time_slots
  FOR ALL
  TO authenticated
  USING (tenant_id = get_current_tenant_id())
  WITH CHECK (tenant_id = get_current_tenant_id());

DROP POLICY IF EXISTS "Allow public to read time slots" ON time_slots;
CREATE POLICY "Allow public to read time slots"
  ON time_slots
  FOR SELECT
  TO public
  USING (tenant_id = get_current_tenant_id());

-- Add comment explaining optimization
COMMENT ON FUNCTION get_current_tenant_id IS 'Optimized function to get current tenant ID from request headers';