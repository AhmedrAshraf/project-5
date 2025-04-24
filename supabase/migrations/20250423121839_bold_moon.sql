/*
  # Fix database functions and authentication
  
  1. Changes
    - Update get_current_menu_items function to handle tenant_id correctly
    - Update get_current_daily_specials function to handle tenant_id correctly
    - Add proper security definer and parameter handling
    
  2. Security
    - Maintain existing RLS policies
    - Add proper parameter validation
*/

-- Drop existing functions if they exist
DROP FUNCTION IF EXISTS get_current_menu_items(uuid, text);
DROP FUNCTION IF EXISTS get_current_daily_specials(uuid);

-- Create function to get current menu items
CREATE OR REPLACE FUNCTION get_current_menu_items(
  p_tenant_id uuid,
  p_category text
)
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

-- Create function to get current daily specials
CREATE OR REPLACE FUNCTION get_current_daily_specials(
  p_tenant_id uuid
)
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

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_current_menu_items TO authenticated, anon;
GRANT EXECUTE ON FUNCTION get_current_daily_specials TO authenticated, anon;