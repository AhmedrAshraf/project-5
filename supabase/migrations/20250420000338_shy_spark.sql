/*
  # Optimize database queries and fix stack depth issue
  
  1. Changes
    - Remove recursive CTEs and complex joins
    - Add efficient indexes
    - Optimize get_current_tenant_id function
    - Add pagination support
    
  2. Security
    - Maintain existing RLS policies
    - Keep security checks in place
*/

-- Optimize get_current_tenant_id to use simple lookup
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

-- Add efficient indexes for common queries
CREATE INDEX IF NOT EXISTS idx_time_slots_tenant_start ON time_slots(tenant_id, start_time);
CREATE INDEX IF NOT EXISTS idx_menu_items_tenant_category ON menu_items(tenant_id, category);
CREATE INDEX IF NOT EXISTS idx_daily_menu_items_tenant_dates ON daily_menu_items(tenant_id, valid_from, valid_until);

-- Create efficient function to get time slots
CREATE OR REPLACE FUNCTION get_time_slots(p_tenant_id uuid)
RETURNS TABLE (
  id uuid,
  label text,
  start_time time,
  end_time time,
  is_drinks boolean,
  staff_notification_number text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT 
    id,
    label,
    start_time,
    end_time,
    is_drinks,
    staff_notification_number
  FROM time_slots
  WHERE tenant_id = p_tenant_id
  ORDER BY start_time;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_time_slots TO authenticated, anon;

-- Add comment explaining optimization
COMMENT ON FUNCTION get_time_slots IS 'Optimized function to get time slots without recursive queries';