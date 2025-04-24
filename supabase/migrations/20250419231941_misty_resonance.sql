/*
  # Add tenant customization options
  
  1. Changes
    - Add customization fields to tenants table
    - Add validation for theme colors
    - Add default values for new fields
    
  2. Security
    - Maintains existing RLS policies
*/

-- Add new columns for tenant customization
ALTER TABLE tenants
ADD COLUMN theme jsonb DEFAULT jsonb_build_object(
  'primary_color', '#b5a49b',
  'secondary_color', '#a39288',
  'font_family', 'Playfair Display',
  'logo_url', NULL,
  'favicon_url', NULL
),
ADD COLUMN business_hours jsonb DEFAULT jsonb_build_object(
  'monday_friday', jsonb_build_object(
    'open', '08:00',
    'close', '22:00'
  ),
  'saturday', jsonb_build_object(
    'open', '09:00',
    'close', '22:00'
  ),
  'sunday', jsonb_build_object(
    'open', '09:00',
    'close', '21:00'
  )
),
ADD COLUMN contact_info jsonb DEFAULT jsonb_build_object(
  'phone', NULL,
  'email', NULL,
  'address', NULL,
  'social_media', jsonb_build_object(
    'facebook', NULL,
    'instagram', NULL,
    'twitter', NULL
  )
),
ADD COLUMN features jsonb DEFAULT jsonb_build_object(
  'room_service', true,
  'pool_service', true,
  'bar_service', true,
  'spa_services', false,
  'preorders', true
),
ADD COLUMN localization jsonb DEFAULT jsonb_build_object(
  'default_language', 'de',
  'supported_languages', ARRAY['de', 'en']
);

-- Add check constraint for theme colors
ALTER TABLE tenants
ADD CONSTRAINT valid_theme_colors
CHECK (
  (theme->>'primary_color' IS NULL OR theme->>'primary_color' ~ '^#[0-9A-Fa-f]{6}$') AND
  (theme->>'secondary_color' IS NULL OR theme->>'secondary_color' ~ '^#[0-9A-Fa-f]{6}$')
);

-- Update existing tenants with default values
UPDATE tenants
SET 
  theme = COALESCE(theme, jsonb_build_object(
    'primary_color', '#b5a49b',
    'secondary_color', '#a39288',
    'font_family', 'Playfair Display'
  )),
  business_hours = COALESCE(business_hours, jsonb_build_object(
    'monday_friday', jsonb_build_object('open', '08:00', 'close', '22:00'),
    'saturday', jsonb_build_object('open', '09:00', 'close', '22:00'),
    'sunday', jsonb_build_object('open', '09:00', 'close', '21:00')
  )),
  contact_info = COALESCE(contact_info, jsonb_build_object(
    'phone', NULL,
    'email', NULL,
    'address', NULL,
    'social_media', jsonb_build_object(
      'facebook', NULL,
      'instagram', NULL,
      'twitter', NULL
    )
  )),
  features = COALESCE(features, jsonb_build_object(
    'room_service', true,
    'pool_service', true,
    'bar_service', true,
    'spa_services', false,
    'preorders', true
  )),
  localization = COALESCE(localization, jsonb_build_object(
    'default_language', 'de',
    'supported_languages', ARRAY['de', 'en']
  ));