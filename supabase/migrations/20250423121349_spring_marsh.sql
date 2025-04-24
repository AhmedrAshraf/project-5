/*
  # Add demo tenant with fixed auth user creation
  
  1. Changes
    - Create demo tenant with sample data
    - Set up subscription and users
    - Create auth user before tenant user
    
  2. Security
    - Maintains existing RLS policies
*/

-- Create demo tenant
INSERT INTO tenants (
  name,
  subdomain,
  settings,
  theme,
  business_hours,
  contact_info,
  features,
  localization
) VALUES (
  'Demo Hotel',
  'demo',
  jsonb_build_object(
    'theme', jsonb_build_object(
      'primary_color', '#4A5568',
      'secondary_color', '#718096',
      'font_family', 'Playfair Display',
      'logo_url', 'https://images.pexels.com/photos/261102/pexels-photo-261102.jpeg',
      'favicon_url', '/vite.svg'
    )
  ),
  jsonb_build_object(
    'primary_color', '#4A5568',
    'secondary_color', '#718096',
    'font_family', 'Playfair Display',
    'logo_url', 'https://images.pexels.com/photos/261102/pexels-photo-261102.jpeg',
    'favicon_url', '/vite.svg'
  ),
  jsonb_build_object(
    'monday_friday', jsonb_build_object('open', '08:00', 'close', '22:00'),
    'saturday', jsonb_build_object('open', '09:00', 'close', '22:00'),
    'sunday', jsonb_build_object('open', '09:00', 'close', '21:00')
  ),
  jsonb_build_object(
    'phone', '+49 123 456789',
    'email', 'info@demo-hotel.com',
    'address', 'Hotelstraße 1, 12345 Berlin',
    'social_media', jsonb_build_object(
      'facebook', 'https://facebook.com/demohotel',
      'instagram', 'https://instagram.com/demohotel',
      'twitter', 'https://twitter.com/demohotel'
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
ON CONFLICT (subdomain) DO NOTHING;

-- Create subscription for demo tenant
WITH demo_tenant AS (
  SELECT id FROM tenants WHERE subdomain = 'demo'
)
INSERT INTO subscriptions (
  tenant_id,
  tier,
  status,
  max_users,
  max_orders_per_month,
  custom_domain_enabled,
  white_label_enabled,
  api_access_enabled,
  billing_email,
  billing_name,
  billing_address
) 
SELECT
  id,
  'premium'::subscription_tier,
  'active',
  20,
  10000,
  true,
  true,
  true,
  'billing@demo-hotel.com',
  'Demo Hotel GmbH',
  jsonb_build_object(
    'street', 'Hotelstraße 1',
    'city', 'Berlin',
    'zip', '12345',
    'country', 'Germany'
  )
FROM demo_tenant
ON CONFLICT DO NOTHING;

-- Update tenant with subscription ID
WITH demo_subscription AS (
  SELECT s.id 
  FROM subscriptions s
  JOIN tenants t ON t.id = s.tenant_id
  WHERE t.subdomain = 'demo'
)
UPDATE tenants
SET subscription_id = (SELECT id FROM demo_subscription)
WHERE subdomain = 'demo';

-- Create demo admin user in auth.users
DO $$
DECLARE
  v_tenant_id uuid;
  v_user_id uuid := gen_random_uuid();
BEGIN
  -- Get tenant ID
  SELECT id INTO v_tenant_id FROM tenants WHERE subdomain = 'demo';

  -- Create auth user
  INSERT INTO auth.users (
    id,
    instance_id,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    aud,
    role,
    created_at,
    updated_at,
    confirmation_sent_at,
    is_super_admin,
    is_sso_user,
    deleted_at
  )
  VALUES (
    v_user_id,
    '00000000-0000-0000-0000-000000000000'::uuid,
    'admin@demo-hotel.com',
    crypt('demo123', gen_salt('bf')),
    now(),
    '{"provider": "email", "providers": ["email"]}',
    '{"name": "Demo Admin"}',
    'authenticated',
    'authenticated',
    now(),
    now(),
    now(),
    false,
    false,
    null
  );

  -- Create tenant user
  INSERT INTO tenant_users (
    tenant_id,
    auth_user_id,
    role,
    email,
    email_verified,
    first_name,
    last_name
  )
  VALUES (
    v_tenant_id,
    v_user_id,
    'admin',
    'admin@demo-hotel.com',
    true,
    'Demo',
    'Admin'
  );
END $$;