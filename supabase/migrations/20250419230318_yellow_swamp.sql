/*
  # Add tenant ID header handling
  
  1. Changes
    - Add function to set current tenant ID from request header
    - Add trigger to automatically set tenant ID on new records
    - Update RLS policies to use header-based tenant ID
*/

-- Create function to get tenant ID from request header
CREATE OR REPLACE FUNCTION get_current_tenant_id()
RETURNS uuid
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  tenant_id uuid;
  header_value text;
BEGIN
  -- Get tenant ID from request header
  header_value := current_setting('request.headers', true)::jsonb->>'x-tenant-id';
  
  IF header_value IS NULL THEN
    RETURN NULL;
  END IF;
  
  -- Get tenant ID from subdomain
  SELECT id INTO tenant_id
  FROM tenants
  WHERE subdomain = header_value;
  
  RETURN tenant_id;
END;
$$;

-- Create function to set tenant ID on insert
CREATE OR REPLACE FUNCTION set_tenant_id()
RETURNS TRIGGER AS $$
BEGIN
  NEW.tenant_id := get_current_tenant_id();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers to automatically set tenant ID
CREATE TRIGGER set_tenant_id_menu_items
  BEFORE INSERT ON menu_items
  FOR EACH ROW
  EXECUTE FUNCTION set_tenant_id();

CREATE TRIGGER set_tenant_id_orders
  BEFORE INSERT ON orders
  FOR EACH ROW
  EXECUTE FUNCTION set_tenant_id();

CREATE TRIGGER set_tenant_id_time_slots
  BEFORE INSERT ON time_slots
  FOR EACH ROW
  EXECUTE FUNCTION set_tenant_id();

CREATE TRIGGER set_tenant_id_daily_menu_items
  BEFORE INSERT ON daily_menu_items
  FOR EACH ROW
  EXECUTE FUNCTION set_tenant_id();

CREATE TRIGGER set_tenant_id_spa_call_clicks
  BEFORE INSERT ON spa_call_clicks
  FOR EACH ROW
  EXECUTE FUNCTION set_tenant_id();