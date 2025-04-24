/*
  # Add default LYJA Resort tenant
  
  1. Changes
    - Add default tenant for LYJA Resort
    - Set proper configuration and settings
    - Ensure tenant exists for local development
    
  2. Security
    - Maintains existing RLS policies
*/

-- First, check if the tenant already exists to avoid duplicates
DO $$ 
DECLARE
  tenant_exists boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM tenants WHERE subdomain = 'lyja'
  ) INTO tenant_exists;

  IF NOT tenant_exists THEN
    -- Insert the default tenant
    INSERT INTO tenants (
      name,
      subdomain,
      settings
    ) VALUES (
      'LYJA Resort',
      'lyja',
      jsonb_build_object(
        'theme', jsonb_build_object(
          'primary_color', '#b5a49b',
          'secondary_color', '#a39288'
        ),
        'contact', jsonb_build_object(
          'email', 'info@lyja-resort.com',
          'phone', '+491234567890'
        ),
        'branding', jsonb_build_object(
          'logo_url', 'https://ik.imagekit.io/5v05edcvce/Logo_Trans_Lyja.png',
          'favicon_url', '/vite.svg'
        )
      )
    );

    -- Get the tenant ID
    WITH tenant AS (
      SELECT id FROM tenants WHERE subdomain = 'lyja'
    )
    -- Update existing records to belong to this tenant
    UPDATE menu_items SET tenant_id = (SELECT id FROM tenant) WHERE tenant_id IS NULL;
    UPDATE orders SET tenant_id = (SELECT id FROM tenant) WHERE tenant_id IS NULL;
    UPDATE time_slots SET tenant_id = (SELECT id FROM tenant) WHERE tenant_id IS NULL;
    UPDATE daily_menu_items SET tenant_id = (SELECT id FROM tenant) WHERE tenant_id IS NULL;
    UPDATE spa_call_clicks SET tenant_id = (SELECT id FROM tenant) WHERE tenant_id IS NULL;
  END IF;
END $$;