/*
  # Fix tenant fetching and ensure default tenant exists
  
  1. Changes
    - Create or update default 'lyja' tenant
    - Set proper configuration and settings
    - Add indexes for better query performance
    
  2. Security
    - Maintains existing RLS policies
*/

-- First, ensure the default tenant exists
INSERT INTO tenants (
  name,
  subdomain,
  settings,
  business_hours,
  contact_info,
  features,
  localization
) VALUES (
  'LYJA Resort',
  'lyja',
  jsonb_build_object(
    'theme', jsonb_build_object(
      'primary_color', '#b5a49b',
      'secondary_color', '#a39288',
      'font_family', 'Playfair Display',
      'logo_url', 'https://ik.imagekit.io/5v05edcvce/Logo_Trans_Lyja.png',
      'favicon_url', '/vite.svg'
    )
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
  settings = EXCLUDED.settings,
  business_hours = EXCLUDED.business_hours,
  contact_info = EXCLUDED.contact_info,
  features = EXCLUDED.features,
  localization = EXCLUDED.localization;

-- Add index for better tenant lookup performance
CREATE INDEX IF NOT EXISTS idx_tenants_subdomain_lookup
ON tenants(subdomain)
WHERE subdomain = 'lyja';

-- Add comment explaining the index
COMMENT ON INDEX idx_tenants_subdomain_lookup IS 'Optimizes lookups for default lyja tenant';