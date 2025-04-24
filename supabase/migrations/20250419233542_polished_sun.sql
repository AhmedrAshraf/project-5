/*
  # Add friendz.zone tenant configuration
  
  1. Changes
    - Create new tenant for friendz.zone
    - Copy all LYJA Resort data to new tenant
    - Set up proper branding and configuration
    
  2. Security
    - Maintains existing RLS policies
*/

-- Insert the friendz tenant with LYJA Resort configuration
INSERT INTO tenants (
  name,
  subdomain,
  theme,
  business_hours,
  contact_info,
  features,
  localization
) VALUES (
  'LYJA Resort',
  'friendz',
  jsonb_build_object(
    'primary_color', '#b5a49b',
    'secondary_color', '#a39288',
    'font_family', 'Playfair Display',
    'logo_url', 'https://ik.imagekit.io/5v05edcvce/Logo_Trans_Lyja.png',
    'favicon_url', '/vite.svg'
  ),
  jsonb_build_object(
    'monday_friday', jsonb_build_object('open', '08:00', 'close', '22:00'),
    'saturday', jsonb_build_object('open', '09:00', 'close', '22:00'),
    'sunday', jsonb_build_object('open', '09:00', 'close', '21:00')
  ),
  jsonb_build_object(
    'phone', '+491234567890',
    'email', 'info@lyja-resort.com',
    'address', NULL,
    'social_media', jsonb_build_object(
      'facebook', NULL,
      'instagram', NULL,
      'twitter', NULL
    )
  ),
  jsonb_build_object(
    'room_service', true,
    'pool_service', true,
    'bar_service', true,
    'spa_services', true,
    'preorders', true
  ),
  jsonb_build_object(
    'default_language', 'de',
    'supported_languages', ARRAY['de', 'en']
  )
)
ON CONFLICT (subdomain) 
DO UPDATE SET
  name = EXCLUDED.name,
  theme = EXCLUDED.theme,
  business_hours = EXCLUDED.business_hours,
  contact_info = EXCLUDED.contact_info,
  features = EXCLUDED.features,
  localization = EXCLUDED.localization;

-- Copy data from lyja tenant to friendz tenant
DO $$
DECLARE
  lyja_id uuid;
  friendz_id uuid;
BEGIN
  -- Get tenant IDs
  SELECT id INTO lyja_id FROM tenants WHERE subdomain = 'lyja';
  SELECT id INTO friendz_id FROM tenants WHERE subdomain = 'friendz';

  -- Copy menu items
  INSERT INTO menu_items (
    name, name_de, description, price, category, 
    menu_category, beverage_category, available, 
    time_restrictions, tenant_id
  )
  SELECT 
    name, name_de, description, price, category,
    menu_category, beverage_category, available,
    time_restrictions, friendz_id
  FROM menu_items
  WHERE tenant_id = lyja_id;

  -- Copy time slots
  INSERT INTO time_slots (
    label, start_time, end_time, is_drinks,
    staff_notification_number, tenant_id
  )
  SELECT 
    label, start_time, end_time, is_drinks,
    staff_notification_number, friendz_id
  FROM time_slots
  WHERE tenant_id = lyja_id;

  -- Copy daily menu items
  INSERT INTO daily_menu_items (
    name, name_de, description, price,
    valid_from, valid_until, special_type,
    image_url, highlight_color, contact_phone,
    time_restrictions, tenant_id
  )
  SELECT 
    name, name_de, description, price,
    valid_from, valid_until, special_type,
    image_url, highlight_color, contact_phone,
    time_restrictions, friendz_id
  FROM daily_menu_items
  WHERE tenant_id = lyja_id;
END $$;