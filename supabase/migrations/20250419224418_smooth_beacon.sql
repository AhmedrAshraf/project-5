/*
  # Add multi-tenancy support
  
  1. New Tables
    - `tenants`
      - `id` (uuid, primary key)
      - `name` (text)
      - `subdomain` (text, unique)
      - `created_at` (timestamptz)
      - `settings` (jsonb)
  
  2. Changes
    - Add tenant_id to all existing tables
    - Add RLS policies for tenant isolation
    - Create function to get current tenant
    - Migrate existing data to first tenant
*/

-- Create tenants table
CREATE TABLE tenants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  subdomain text NOT NULL UNIQUE CHECK (subdomain ~ '^[a-z0-9-]+$'),
  created_at timestamptz DEFAULT now(),
  settings jsonb DEFAULT '{}'::jsonb,
  CONSTRAINT valid_subdomain_length CHECK (length(subdomain) >= 3 AND length(subdomain) <= 63)
);

-- Enable RLS
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;

-- Add tenant_id to existing tables
ALTER TABLE menu_items ADD COLUMN tenant_id uuid REFERENCES tenants(id);
ALTER TABLE orders ADD COLUMN tenant_id uuid REFERENCES tenants(id);
ALTER TABLE time_slots ADD COLUMN tenant_id uuid REFERENCES tenants(id);
ALTER TABLE daily_menu_items ADD COLUMN tenant_id uuid REFERENCES tenants(id);
ALTER TABLE spa_call_clicks ADD COLUMN tenant_id uuid REFERENCES tenants(id);

-- Create indexes for performance
CREATE INDEX idx_menu_items_tenant ON menu_items(tenant_id);
CREATE INDEX idx_orders_tenant ON orders(tenant_id);
CREATE INDEX idx_time_slots_tenant ON time_slots(tenant_id);
CREATE INDEX idx_daily_menu_items_tenant ON daily_menu_items(tenant_id);

-- Create function to get current tenant
CREATE OR REPLACE FUNCTION get_current_tenant_id()
RETURNS uuid
LANGUAGE sql
STABLE
AS $$
  SELECT COALESCE(
    current_setting('app.current_tenant_id', true)::uuid,
    NULL
  );
$$;

-- Add RLS policies for tenants
CREATE POLICY "Tenants can view their own record"
  ON tenants
  FOR SELECT
  TO authenticated
  USING (id = get_current_tenant_id());

-- Drop existing policies
DROP POLICY IF EXISTS "Allow authenticated users to manage menu items" ON menu_items;
DROP POLICY IF EXISTS "Allow public read access to menu_items" ON menu_items;
DROP POLICY IF EXISTS "Enable order creation for all users" ON orders;
DROP POLICY IF EXISTS "Enable order reading for authenticated users" ON orders;
DROP POLICY IF EXISTS "Enable order updates for authenticated users" ON orders;
DROP POLICY IF EXISTS "Enable preorder creation for dinner" ON orders;
DROP POLICY IF EXISTS "Allow authenticated users to manage time slots" ON time_slots;
DROP POLICY IF EXISTS "Allow public to read time slots" ON time_slots;
DROP POLICY IF EXISTS "Allow authenticated users to manage daily menu items" ON daily_menu_items;
DROP POLICY IF EXISTS "Allow public to read daily menu items" ON daily_menu_items;

-- Create new tenant-aware policies
CREATE POLICY "Allow authenticated users to manage menu items"
  ON menu_items
  FOR ALL
  TO authenticated
  USING (tenant_id = get_current_tenant_id())
  WITH CHECK (tenant_id = get_current_tenant_id());

CREATE POLICY "Allow public read access to menu_items"
  ON menu_items
  FOR SELECT
  TO public
  USING (tenant_id = get_current_tenant_id());

CREATE POLICY "Enable order creation for all users"
  ON orders
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    tenant_id = get_current_tenant_id() AND
    room_number IS NOT NULL AND
    first_name IS NOT NULL AND
    first_name != '' AND
    last_name IS NOT NULL AND
    last_name != '' AND
    phone_number IS NOT NULL AND
    phone_number != '' AND
    guest_phone_number IS NOT NULL AND
    guest_phone_number != '' AND
    location = ANY (ARRAY['pool'::text, 'room'::text, 'bar'::text]) AND
    total >= 0 AND
    status = 'new'
  );

CREATE POLICY "Enable order reading for authenticated users"
  ON orders
  FOR SELECT
  TO authenticated
  USING (tenant_id = get_current_tenant_id());

CREATE POLICY "Enable order updates for authenticated users"
  ON orders
  FOR UPDATE
  TO authenticated
  USING (tenant_id = get_current_tenant_id())
  WITH CHECK (tenant_id = get_current_tenant_id());

CREATE POLICY "Enable preorder creation for dinner"
  ON orders
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    tenant_id = get_current_tenant_id() AND
    room_number IS NOT NULL AND
    first_name IS NOT NULL AND
    first_name != '' AND
    last_name IS NOT NULL AND
    last_name != '' AND
    phone_number IS NOT NULL AND
    phone_number != '' AND
    guest_phone_number IS NOT NULL AND
    guest_phone_number != '' AND
    location = ANY (ARRAY['pool'::text, 'room'::text, 'bar'::text]) AND
    total >= 0 AND
    status = 'new' AND
    (
      (is_preorder = false) OR
      (
        is_preorder = true AND 
        scheduled_for > CURRENT_TIMESTAMP AND
        scheduled_for::date = CURRENT_DATE AND
        EXTRACT(HOUR FROM scheduled_for) >= 18 AND 
        EXTRACT(HOUR FROM scheduled_for) < 23
      )
    )
  );

CREATE POLICY "Allow authenticated users to manage time slots"
  ON time_slots
  FOR ALL
  TO authenticated
  USING (tenant_id = get_current_tenant_id())
  WITH CHECK (tenant_id = get_current_tenant_id());

CREATE POLICY "Allow public to read time slots"
  ON time_slots
  FOR SELECT
  TO public
  USING (tenant_id = get_current_tenant_id());

CREATE POLICY "Allow authenticated users to manage daily menu items"
  ON daily_menu_items
  FOR ALL
  TO authenticated
  USING (tenant_id = get_current_tenant_id())
  WITH CHECK (tenant_id = get_current_tenant_id());

CREATE POLICY "Allow public to read daily menu items"
  ON daily_menu_items
  FOR SELECT
  TO public
  USING (tenant_id = get_current_tenant_id());

-- Insert your existing system as the first tenant
INSERT INTO tenants (name, subdomain)
VALUES ('LYJA Resort', 'lyja');

-- Update existing records to belong to LYJA Resort
DO $$
DECLARE
  lyja_id uuid;
BEGIN
  SELECT id INTO lyja_id FROM tenants WHERE subdomain = 'lyja';
  
  UPDATE menu_items SET tenant_id = lyja_id;
  UPDATE orders SET tenant_id = lyja_id;
  UPDATE time_slots SET tenant_id = lyja_id;
  UPDATE daily_menu_items SET tenant_id = lyja_id;
  UPDATE spa_call_clicks SET tenant_id = lyja_id;
END $$;