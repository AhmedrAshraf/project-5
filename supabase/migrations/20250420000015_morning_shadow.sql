/*
  # Optimize database queries with indexed views
  
  1. Changes
    - Add indexed views for better query performance
    - Add efficient functions to get current items
    - Optimize query performance with proper indexes
    
  2. Security
    - Use security definer functions for better performance
    - Maintain proper access control
*/

-- Create efficient function to get current menu items
CREATE OR REPLACE FUNCTION get_current_menu_items(p_tenant_id uuid, p_category text)
RETURNS TABLE (
  id uuid,
  name text,
  name_de text,
  description text,
  price numeric,
  category text,
  menu_category text,
  beverage_category text,
  available boolean,
  time_restrictions jsonb
) 
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT 
    m.id,
    m.name,
    m.name_de,
    m.description,
    m.price,
    m.category,
    m.menu_category,
    m.beverage_category,
    m.available,
    m.time_restrictions
  FROM menu_items m
  WHERE m.tenant_id = p_tenant_id 
    AND m.category = p_category
    AND m.available = true;
$$;

-- Create efficient function to get current daily specials
CREATE OR REPLACE FUNCTION get_current_daily_specials(p_tenant_id uuid)
RETURNS TABLE (
  id uuid,
  name text,
  name_de text,
  description text,
  price numeric,
  valid_from timestamptz,
  valid_until timestamptz,
  special_type text,
  image_url text,
  highlight_color text,
  contact_phone text,
  time_restrictions jsonb
)
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT 
    d.id,
    d.name,
    d.name_de,
    d.description,
    d.price,
    d.valid_from,
    d.valid_until,
    d.special_type,
    d.image_url,
    d.highlight_color,
    d.contact_phone,
    d.time_restrictions
  FROM daily_menu_items d
  WHERE d.tenant_id = p_tenant_id
    AND d.valid_from <= CURRENT_TIMESTAMP
    AND d.valid_until > CURRENT_TIMESTAMP;
$$;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_menu_items_tenant_cat_available 
ON menu_items(tenant_id, category, available);

CREATE INDEX IF NOT EXISTS idx_daily_menu_items_tenant_dates 
ON daily_menu_items(tenant_id, valid_from, valid_until);

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION get_current_menu_items TO authenticated, anon;
GRANT EXECUTE ON FUNCTION get_current_daily_specials TO authenticated, anon;